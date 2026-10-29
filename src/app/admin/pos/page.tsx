"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DigitalLicense, LicenseType, Sale } from "@/src/type";
import { CreditCard, FileText, Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import Swal from "sweetalert2";

interface CartItem {
  license: DigitalLicense;
  quantity: number;
}

const TYPE_LABELS: Record<LicenseType, string> = {
  perpetual: "Permanente",
  subscription: "Suscripción",
  temporary: "Temporal",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  expired: "Expirado",
  suspended: "Suspendido",
  revoked: "Revocado",
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "perpetual":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "subscription":
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    case "temporary":
      return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border-gray-500/30";
  }
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

// Los nombres vienen de la BD y se insertan en el HTML del modal de SweetAlert
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export default function PosPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<DigitalLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<LicenseType | "">("");
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const loadLicenses = async () => {
      try {
        const response = await fetch("/api/licenses");
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        const data = await response.json();

        if (data.success) {
          setLicenses(data.data);
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: data.error || "Error al cargar licencias",
          });
        }
      } catch {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al conectar con el servidor",
        });
      } finally {
        setLoading(false);
      }
    };

    loadLicenses();
  }, [router]);

  const visibleLicenses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return licenses.filter((license) => {
      if (typeFilter && license.license_type !== typeFilter) return false;
      if (!term) return true;
      return (
        license.name.toLowerCase().includes(term) ||
        license.provider.toLowerCase().includes(term)
      );
    });
  }, [licenses, searchTerm, typeFilter]);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.license.price * item.quantity, 0);

  const addToCart = (license: DigitalLicense) => {
    setCart((current) => {
      const existing = current.find((item) => item.license.id === license.id);
      if (existing) {
        return current.map((item) =>
          item.license.id === license.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { license, quantity: 1 }];
    });
  };

  const changeQuantity = (licenseId: number, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.license.id === licenseId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (licenseId: number) => {
    setCart((current) => current.filter((item) => item.license.id !== licenseId));
  };

  const clearCart = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Vaciar el carrito?",
      showCancelButton: true,
      confirmButtonText: "Vaciar",
      cancelButtonText: "Cancelar",
    });
    if (result.isConfirmed) setCart([]);
  };

  const checkout = async () => {
    const rows = cart
      .map(
        (item) =>
          `<tr>
            <td style="text-align:left;padding:4px 0">${item.quantity} × ${escapeHtml(item.license.name)}</td>
            <td style="text-align:right;padding:4px 0">${formatPrice(item.license.price * item.quantity)}</td>
          </tr>`
      )
      .join("");

    const result = await Swal.fire({
      title: "Confirmar venta",
      html: `
        <table style="width:100%;font-size:14px">${rows}</table>
        <hr style="margin:12px 0" />
        <div style="display:flex;justify-content:space-between;font-weight:600;font-size:16px">
          <span>Total</span><span>${formatPrice(total)}</span>
        </div>`,
      showCancelButton: true,
      confirmButtonText: "Cobrar",
      cancelButtonText: "Cancelar",
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        try {
          const response = await fetch("/api/sales", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: cart.map((item) => ({ license_id: item.license.id, quantity: item.quantity })),
            }),
          });
          if (response.status === 401) {
            router.push("/login");
            return false;
          }
          const data = await response.json();
          if (!data.success) {
            Swal.showValidationMessage(data.error || "No se pudo registrar la venta");
            return false;
          }
          return data.data as Sale;
        } catch {
          Swal.showValidationMessage("Error al conectar con el servidor");
          return false;
        }
      },
    });

    if (!result.isConfirmed || !result.value) return;

    const sale = result.value;
    await Swal.fire({
      icon: "success",
      title: `Venta #${sale.id} registrada`,
      text: `${itemCount} ${itemCount === 1 ? "licencia" : "licencias"} por ${formatPrice(sale.total)}`,
      timer: 2500,
      showConfirmButton: false,
    });
    setCart([]);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-gray-700 opacity-40 blur-3xl animate-pulse"></div>
        <div className="absolute top-20 right-20 h-96 w-96 rounded-full bg-gray-600 opacity-30 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-60 left-1/4 h-72 w-72 rounded-full bg-gray-700 opacity-35 blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 min-h-screen">
        <div className="backdrop-blur-xl bg-white/5 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="h-8 w-8 text-white" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Punto de Venta</h1>
                  <p className="text-sm text-white/70">Venta de licencias digitales</p>
                </div>
              </div>
              <div className="text-sm text-white/70">
                {licenses.length} {licenses.length === 1 ? "licencia" : "licencias"}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl ring-1 ring-white/20 p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o proveedor..."
                  className="w-full pl-10 pr-4 py-3 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent backdrop-blur-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(["", "perpetual", "subscription", "temporary"] as const).map((type) => (
                  <button
                    key={type || "all"}
                    onClick={() => setTypeFilter(type)}
                    className={`px-4 py-1.5 text-sm rounded-full border transition-all ${
                      typeFilter === type
                        ? "bg-white text-gray-900 border-white"
                        : "border-white/20 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {type ? TYPE_LABELS[type] : "Todas"}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            ) : visibleLicenses.length === 0 ? (
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl ring-1 ring-white/20 p-12 text-center">
                <FileText className="h-16 w-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No hay licencias</h3>
                <p className="text-white/70">No se encontraron licencias con los filtros aplicados</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibleLicenses.map((license) => {
                  const available = license.status === "active";
                  const inCart = cart.find((item) => item.license.id === license.id)?.quantity ?? 0;

                  return (
                    <div
                      key={license.id}
                      className={`backdrop-blur-xl bg-white/10 rounded-2xl ring-1 ring-white/20 p-4 flex flex-col ${
                        available ? "" : "opacity-50"
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {license.image ? (
                          <img
                            src={license.image}
                            alt={license.name}
                            className="h-12 w-12 rounded object-contain bg-white/5 p-1 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-white/10 flex items-center justify-center shrink-0">
                            <FileText className="h-6 w-6 text-white/50" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-white leading-snug">{license.name}</h3>
                          <p className="text-xs text-white/60 truncate">{license.provider}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getTypeColor(license.license_type)}`}>
                          {TYPE_LABELS[license.license_type]}
                        </span>
                        {!available && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-red-500/20 text-red-300 border-red-500/30">
                            {STATUS_LABELS[license.status] ?? license.status}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-lg font-bold text-white">{formatPrice(license.price)}</span>
                        <button
                          onClick={() => addToCart(license)}
                          disabled={!available}
                          className="px-3 py-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white text-sm rounded-lg hover:from-gray-600 hover:to-gray-800 transition-all inline-flex items-center gap-1 disabled:cursor-not-allowed disabled:hover:from-gray-700 disabled:hover:to-gray-900"
                        >
                          <Plus className="h-4 w-4" />
                          {inCart > 0 ? `Agregar (${inCart})` : "Agregar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-6 self-start backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl ring-1 ring-white/20 flex flex-col max-h-[calc(100vh-3rem)]">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrito
              </h2>
              <span className="text-sm text-white/70">
                {itemCount} {itemCount === 1 ? "artículo" : "artículos"}
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="px-5 py-12 text-center text-white/60 text-sm">
                Agrega licencias para iniciar una venta
              </div>
            ) : (
              <ul className="flex-1 overflow-y-auto divide-y divide-white/10">
                {cart.map((item) => (
                  <li key={item.license.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white leading-snug">{item.license.name}</p>
                        <p className="text-xs text-white/60">{formatPrice(item.license.price)} c/u</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.license.id)}
                        className="text-white/50 hover:text-red-300 transition-colors"
                        aria-label={`Quitar ${item.license.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-lg border border-white/20">
                        <button
                          onClick={() => changeQuantity(item.license.id, -1)}
                          className="p-1.5 text-white/80 hover:bg-white/10 rounded-l-lg"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm text-white">{item.quantity}</span>
                        <button
                          onClick={() => changeQuantity(item.license.id, 1)}
                          className="p-1.5 text-white/80 hover:bg-white/10 rounded-r-lg"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {formatPrice(item.license.price * item.quantity)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="px-5 py-4 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Total</span>
                <span className="text-2xl font-bold text-white">{formatPrice(total)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="px-4 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Vaciar
                </button>
                <button
                  onClick={checkout}
                  disabled={cart.length === 0}
                  className="flex-1 px-4 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CreditCard className="h-5 w-5" />
                  Cobrar
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
