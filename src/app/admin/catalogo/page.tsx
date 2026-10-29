"use client";

import { useEffect, useState } from "react";
import { DigitalLicense, LicenseFilterParams } from "@/src/type";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import Swal from "sweetalert2";

export default function CatalogoLicenciasPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<DigitalLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<
    LicenseFilterParams & { hasImage?: string; software?: string }
  >({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLicense, setSelectedLicense] = useState<DigitalLicense | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);
  const [categoria, setCategoria] = useState("");
  const [hasImage, setHasImage] = useState("");
  const [software, setSoftware] = useState("");

  const fetchLicenses = async (
    filterParams: LicenseFilterParams & {
      hasImage?: string;
      software?: string;
    } = {},
  ) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filterParams.search)
        queryParams.append("search", filterParams.search);
      if (filterParams.name) queryParams.append("name", filterParams.name);
      if (filterParams.provider)
        queryParams.append("provider", filterParams.provider);
      if (filterParams.license_type)
        queryParams.append("license_type", filterParams.license_type);
      if (filterParams.status)
        queryParams.append("status", filterParams.status);
      if (filterParams.software)
        queryParams.append("software", filterParams.software);

      const url = `/api/licenses${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url);
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
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al conectar con el servidor",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses(filters);
  }, []);

  // Búsqueda automática al cambiar términos o filtros
  useEffect(() => {
    const newFilters: any = { ...filters, search: searchTerm };
    if (categoria) newFilters.license_type = categoria as any;
    else delete newFilters.license_type;

    if (software) newFilters.software = software;
    else delete newFilters.software;

    setFilters(newFilters);
    fetchLicenses(newFilters);
  }, [searchTerm, categoria, software, hasImage]);

  const openModal = (license: DigitalLicense) => {
    setSelectedLicense(license);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLicense(null);
  };

  const handleEdit = (license: DigitalLicense) => {
    // Lógica o redirección de edición
    console.log("Editar licencia:", license.id);
  };

  const handleDelete = async (license: DigitalLicense) => {
    const result = await Swal.fire({
      title: "¿Eliminar licencia?",
      text: `¿Estás seguro de eliminar "${license.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#91A91C",
      cancelButtonColor: "#68716D",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      // Lógica de eliminación conservando tu estructura
      console.log("Eliminar licencia:", license.id);
    }
  };

  const handleAdd = () => {
    // Lógica o redirección para agregar nueva licencia
    console.log("Agregar nueva licencia");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-[#D7ED4B]/20 text-[#17201D] border-[#91A91C]/30";
      case "expired":
        return "bg-red-500/20 text-red-700 border-red-500/30";
      case "suspended":
        return "bg-yellow-500/20 text-yellow-800 border-yellow-500/30";
      case "revoked":
        return "bg-[#68716D]/20 text-[#68716D] border-[#DFE3DD]";
      default:
        return "bg-[#68716D]/20 text-[#68716D] border-[#DFE3DD]";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "perpetual":
        return "bg-[#E7EDE2] text-[#17201D] border-[#DFE3DD]";
      case "subscription":
        return "bg-[#D7ED4B]/30 text-[#17201D] border-[#91A91C]/40";
      case "temporary":
        return "bg-[#91A91C]/20 text-[#17201D] border-[#91A91C]/30";
      default:
        return "bg-[#68716D]/20 text-[#68716D] border-[#DFE3DD]";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-ES");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#F5F5F0] p-6 md:p-8">
      {/* Cabecera y botón de Agregar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-[#17201D]">
            Catálogo de Licencias
          </h1>
          <p className="text-[#68716D] mt-1">
            Gestión y control de licencias digitales
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[#68716D]">
            {licenses.length} {licenses.length === 1 ? "licencia" : "licencias"}
          </span>
          <button
            onClick={handleAdd}
            className="px-4 py-2.5 bg-[#D7ED4B] text-[#17201D] font-semibold rounded-xl hover:bg-[#91A91C] hover:text-[#F5F5F0] transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Nueva Licencia
          </button>
        </div>
      </div>

      {/* Filtros y Búsqueda Automática */}
      <div className="bg-[#FBFCF8] rounded-2xl shadow-sm border border-[#DFE3DD] p-5 mb-6 shrink-0">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#859087]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, proveedor o notas..."
                className="w-full pl-11 pr-4 py-2.5 border border-[#DFE3DD] bg-[#FBFCF8] text-[#17201D] placeholder-[#859087] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#91A91C] transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setFilters({});
                setCategoria("");
                setHasImage("");
                setSoftware("");
                fetchLicenses({});
              }}
              className="px-5 py-2.5 border border-[#DFE3DD] text-[#68716D] bg-[#FBFCF8] rounded-xl hover:bg-[#E7EDE2] hover:text-[#17201D] transition-all flex items-center gap-2 font-medium"
            >
              <Filter className="h-4 w-4" />
              Limpiar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="px-4 py-2.5 border border-[#DFE3DD] bg-[#FBFCF8] text-[#17201D] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#91A91C]"
            >
              <option value="">Todas las categorías</option>
              <option value="perpetual">Permanente</option>
              <option value="subscription">Suscripción</option>
              <option value="temporary">Temporal</option>
            </select>
            <select
              value={hasImage}
              onChange={(e) => setHasImage(e.target.value)}
              className="px-4 py-2.5 border border-[#DFE3DD] bg-[#FBFCF8] text-[#17201D] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#91A91C]"
            >
              <option value="">Todas las imágenes</option>
              <option value="yes">Con imagen</option>
              <option value="no">Sin imagen</option>
            </select>
            <input
              type="text"
              value={software}
              onChange={(e) => setSoftware(e.target.value)}
              placeholder="Filtrar por software..."
              className="px-4 py-2.5 border border-[#DFE3DD] bg-[#FBFCF8] text-[#17201D] placeholder-[#859087] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#91A91C]"
            />
          </div>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="flex min-h-0 flex-1 flex-col bg-[#FBFCF8] rounded-2xl shadow-sm border border-[#DFE3DD] overflow-hidden">
        {loading ? (
          <div className="flex flex-1 justify-center items-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#91A91C]"></div>
          </div>
        ) : licenses.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="h-16 w-16 text-[#859087] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#17201D] mb-1">
              No hay licencias
            </h3>
            <p className="text-[#68716D]">
              No se encontraron licencias con los filtros aplicados
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 z-10 border-b border-[#DFE3DD] bg-[#EEF2E9] text-xs font-semibold text-[#68716D] uppercase tracking-wider">
                  <th className="px-6 py-4">Imagen</th>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Proveedor</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Precio</th>
                  <th className="px-6 py-4">Expiración</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE3DD] text-sm">
                {(hasImage === "yes"
                  ? licenses.filter((l) => l.image)
                  : hasImage === "no"
                    ? licenses.filter((l) => !l.image)
                    : licenses
                ).map((license) => (
                  <tr
                    key={license.id}
                    className="hover:bg-[#E7EDE2]/20 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {license.image ? (
                        <img
                          src={license.image}
                          alt={license.name}
                          className="h-10 w-10 rounded-lg object-cover border border-[#DFE3DD]"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-[#E7EDE2] flex items-center justify-center border border-[#DFE3DD]">
                          <FileText className="h-5 w-5 text-[#859087]" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-[#17201D]">
                      {license.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#68716D]">
                      {license.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getTypeColor(license.license_type)}`}
                      >
                        {license.license_type === "perpetual"
                          ? "Permanente"
                          : license.license_type === "subscription"
                            ? "Suscripción"
                            : "Temporal"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(license.status)}`}
                      >
                        {license.status === "active"
                          ? "Activo"
                          : license.status === "expired"
                            ? "Expirado"
                            : license.status === "suspended"
                              ? "Suspendido"
                              : "Revocado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-[#17201D]">
                      {formatPrice(license.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#68716D]">
                      {formatDate(license.expiration_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openModal(license)}
                          title="Ver detalles"
                          className="p-2 rounded-lg bg-[#E7EDE2] text-[#17201D] hover:bg-[#D7ED4B] transition-all"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(license)}
                          title="Editar"
                          className="p-2 rounded-lg bg-[#E7EDE2] text-[#17201D] hover:bg-[#91A91C] hover:text-[#F5F5F0] transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(license)}
                          title="Eliminar"
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {showModal && selectedLicense && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-[#17201D]/50 backdrop-blur-sm"
              onClick={closeModal}
            ></div>

            <div className="inline-block align-bottom bg-[#FBFCF8] rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-[#DFE3DD] relative z-10">
              <div className="px-6 py-4 border-b border-[#DFE3DD] flex items-center justify-between bg-[#E7EDE2]/50">
                <h3 className="text-lg font-semibold text-[#17201D]">
                  Detalles de la Licencia
                </h3>
                <button
                  onClick={closeModal}
                  className="text-[#68716D] hover:text-[#17201D] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {selectedLicense.image && (
                  <div className="w-full h-48 bg-[#F5F5F0] rounded-xl overflow-hidden border border-[#DFE3DD]">
                    <img
                      src={selectedLicense.image}
                      alt={selectedLicense.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#859087] uppercase tracking-wider font-semibold">
                      Nombre
                    </label>
                    <p className="text-[#17201D] mt-1 font-medium">
                      {selectedLicense.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-[#859087] uppercase tracking-wider font-semibold">
                      Proveedor
                    </label>
                    <p className="text-[#17201D] mt-1 font-medium">
                      {selectedLicense.provider}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#859087] uppercase tracking-wider font-semibold">
                      Tipo de Licencia
                    </label>
                    <div className="mt-1">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getTypeColor(selectedLicense.license_type)}`}
                      >
                        {selectedLicense.license_type === "perpetual"
                          ? "Permanente"
                          : selectedLicense.license_type === "subscription"
                            ? "Suscripción"
                            : "Temporal"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#859087] uppercase tracking-wider font-semibold">
                      Estado
                    </label>
                    <div className="mt-1">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedLicense.status)}`}
                      >
                        {selectedLicense.status === "active"
                          ? "Activo"
                          : selectedLicense.status === "expired"
                            ? "Expirado"
                            : selectedLicense.status === "suspended"
                              ? "Suspendido"
                              : "Revocado"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#859087] uppercase tracking-wider font-semibold">
                      Precio
                    </label>
                    <p className="text-[#17201D] mt-1 font-medium">
                      {formatPrice(selectedLicense.price)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-[#859087] uppercase tracking-wider font-semibold">
                      Fecha de Compra
                    </label>
                    <p className="text-[#68716D] mt-1">
                      {formatDate(selectedLicense.purchase_date)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#859087] uppercase tracking-wider font-semibold">
                      Fecha de Expiración
                    </label>
                    <p className="text-[#68716D] mt-1">
                      {formatDate(selectedLicense.expiration_date)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-[#859087] uppercase tracking-wider font-semibold">
                      Clave de Licencia
                    </label>
                    <p className="text-[#17201D] mt-1 font-mono text-sm bg-[#F5F5F0] border border-[#DFE3DD] px-3 py-1.5 rounded-lg break-all">
                      {selectedLicense.license_key || "N/A"}
                    </p>
                  </div>
                </div>

                {selectedLicense.notes && (
                  <div>
                    <label className="text-xs text-[#859087] uppercase tracking-wider font-semibold">
                      Notas
                    </label>
                    <p className="text-[#68716D] mt-1 bg-[#F5F5F0] border border-[#DFE3DD] p-3 rounded-lg text-sm">
                      {selectedLicense.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-[#DFE3DD] flex justify-end bg-[#E7EDE2]/50">
                <button
                  onClick={closeModal}
                  className="px-5 py-2 bg-[#17201D] text-[#F5F5F0] rounded-xl hover:bg-[#91A91C] transition-colors font-medium text-sm"
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
