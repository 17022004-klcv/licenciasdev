"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sale } from "@/src/type";
import { DollarSign, Eye, Filter, Package, Receipt, Search, TrendingUp, X } from "lucide-react";
import Swal from "sweetalert2";
import { useSession } from "../_components/AdminShell";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

// SQLite guarda CURRENT_TIMESTAMP en UTC con formato "YYYY-MM-DD HH:MM:SS"
const parseSqliteDate = (value: string) => new Date(`${value.replace(" ", "T")}Z`);

const formatDateTime = (value: string) =>
  parseSqliteDate(value).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Fecha local en formato YYYY-MM-DD, comparable con el valor de <input type="date">
const toLocalDateKey = (value: string) => {
  const date = parseSqliteDate(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const countUnits = (sale: Sale) => sale.items.reduce((sum, item) => sum + item.quantity, 0);

export default function HistorialVentasPage() {
  const router = useRouter();
  const user = useSession();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const isAdmin = user?.role === "administrator";

  useEffect(() => {
    const loadSales = async () => {
      try {
        const response = await fetch("/api/sales");
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        const data = await response.json();

        if (data.success) {
          setSales(data.data);
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: data.error || "Error al cargar ventas",
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

    loadSales();
  }, [router]);

  const visibleSales = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return sales.filter((sale) => {
      const dateKey = toLocalDateKey(sale.created_at);
      if (dateFrom && dateKey < dateFrom) return false;
      if (dateTo && dateKey > dateTo) return false;
      if (!term) return true;
      return (
        String(sale.id) === term.replace("#", "") ||
        (sale.employee_name ?? "").toLowerCase().includes(term) ||
        sale.items.some((item) => item.license_name.toLowerCase().includes(term))
      );
    });
  }, [sales, searchTerm, dateFrom, dateTo]);

  const revenue = visibleSales.reduce((sum, sale) => sum + sale.total, 0);
  const unitsSold = visibleSales.reduce((sum, sale) => sum + countUnits(sale), 0);
  const averageTicket = visibleSales.length > 0 ? revenue / visibleSales.length : 0;

  const stats = [
    { label: "Ventas", value: String(visibleSales.length), icon: Receipt },
    { label: "Ingresos", value: formatPrice(revenue), icon: DollarSign },
    { label: "Licencias vendidas", value: String(unitsSold), icon: Package },
    { label: "Ticket promedio", value: formatPrice(averageTicket), icon: TrendingUp },
  ];

  const clearFilters = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
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
                <Receipt className="h-8 w-8 text-white" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Historial de Ventas</h1>
                  <p className="text-sm text-white/70">
                    {user && !isAdmin ? "Ventas registradas por ti" : "Todas las ventas registradas"}
                  </p>
                </div>
              </div>
              <div className="text-sm text-white/70">
                {sales.length} {sales.length === 1 ? "venta" : "ventas"}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl ring-1 ring-white/20 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/60 uppercase tracking-wider">{label}</span>
                  <Icon className="h-5 w-5 text-white/50" />
                </div>
                <p className="text-2xl font-bold text-white truncate">{value}</p>
              </div>
            ))}
          </div>

          <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl ring-1 ring-white/20 p-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-4 items-end">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isAdmin ? "Buscar por nº de venta, vendedor o licencia..." : "Buscar por nº de venta o licencia..."}
                  className="w-full pl-10 pr-4 py-3 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent backdrop-blur-sm"
                />
              </div>
              <label className="block">
                <span className="text-xs text-white/50 uppercase tracking-wider">Desde</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1 w-full px-4 py-2.5 border border-white/20 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 backdrop-blur-sm [color-scheme:dark]"
                />
              </label>
              <label className="block">
                <span className="text-xs text-white/50 uppercase tracking-wider">Hasta</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1 w-full px-4 py-2.5 border border-white/20 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 backdrop-blur-sm [color-scheme:dark]"
                />
              </label>
              <button
                type="button"
                onClick={clearFilters}
                className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Limpiar
              </button>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl ring-1 ring-white/20 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            ) : visibleSales.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="h-16 w-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No hay ventas</h3>
                <p className="text-white/70">
                  {sales.length === 0
                    ? "Aún no se ha registrado ninguna venta"
                    : "No se encontraron ventas con los filtros aplicados"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Venta</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Fecha</th>
                      {isAdmin && (
                        <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Vendedor</th>
                      )}
                      <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Licencias</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-white/70 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-white/70 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {visibleSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-medium text-white">#{sale.id}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white/90">{formatDateTime(sale.created_at)}</div>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white/90">{sale.employee_name ?? "Empleado eliminado"}</div>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="text-sm text-white/90 max-w-xs truncate">
                            {sale.items.map((item) => item.license_name).join(", ")}
                          </div>
                          <div className="text-xs text-white/50">
                            {countUnits(sale)} {countUnits(sale) === 1 ? "unidad" : "unidades"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-white">{formatPrice(sale.total)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="text-white/70 hover:text-white transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedSale && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black/40 transition-opacity" onClick={() => setSelectedSale(null)}></div>

            <div className="inline-block align-bottom bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full ring-1 ring-white/20 relative z-10">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Venta #{selectedSale.id}</h3>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Fecha</label>
                    <p className="text-white mt-1">{formatDateTime(selectedSale.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Vendedor</label>
                    <p className="text-white mt-1">{selectedSale.employee_name ?? "Empleado eliminado"}</p>
                  </div>
                </div>

                <div className="rounded-lg ring-1 ring-white/10 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Licencia</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-white/60 uppercase tracking-wider">Precio</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-white/60 uppercase tracking-wider">Cant.</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-white/60 uppercase tracking-wider">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {selectedSale.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-white">{item.license_name}</td>
                          <td className="px-4 py-3 text-right text-white/80">{formatPrice(item.unit_price)}</td>
                          <td className="px-4 py-3 text-right text-white/80">{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-medium text-white">{formatPrice(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-white/70">Total</span>
                  <span className="text-2xl font-bold text-white">{formatPrice(selectedSale.total)}</span>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setSelectedSale(null)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
