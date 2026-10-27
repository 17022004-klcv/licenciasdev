"use client";

import { useEffect, useState } from "react";
import { DigitalLicense, LicenseFilterParams } from "@/src/type";
import { FileText, Search, Filter, Eye, X } from "lucide-react";
import Swal from "sweetalert2";

export default function CatalogoLicenciasPage() {
  const [licenses, setLicenses] = useState<DigitalLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LicenseFilterParams & { hasImage?: string; software?: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLicense, setSelectedLicense] = useState<DigitalLicense | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [categoria, setCategoria] = useState("");
  const [hasImage, setHasImage] = useState("");
  const [software, setSoftware] = useState("");

  const fetchLicenses = async (filterParams: LicenseFilterParams & { hasImage?: string; software?: string } = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filterParams.search) queryParams.append("search", filterParams.search);
      if (filterParams.name) queryParams.append("name", filterParams.name);
      if (filterParams.provider) queryParams.append("provider", filterParams.provider);
      if (filterParams.license_type) queryParams.append("license_type", filterParams.license_type);
      if (filterParams.status) queryParams.append("status", filterParams.status);
      if (filterParams.software) queryParams.append("software", filterParams.software);

      const url = `/api/licenses${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newFilters: any = { ...filters, search: searchTerm };
    if (categoria) newFilters.license_type = categoria as any;
    if (software) newFilters.software = software;
    if (hasImage) {
      // Filter client-side for image
    }
    setFilters(newFilters);
    fetchLicenses(newFilters);
  };

  const openModal = (license: DigitalLicense) => {
    setSelectedLicense(license);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLicense(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "expired":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "suspended":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "revoked":
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
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
                <FileText className="h-8 w-8 text-white" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Catálogo de Licencias</h1>
                  <p className="text-sm text-white/70">Gestión de licencias digitales</p>
                </div>
              </div>
              <div className="text-sm text-white/70">
                {licenses.length} {licenses.length === 1 ? "licencia" : "licencias"}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl ring-1 ring-white/20 p-6 mb-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre, proveedor o notas..."
                    className="w-full pl-10 pr-4 py-3 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent backdrop-blur-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg hover:from-gray-600 hover:to-gray-800 transition-all flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Buscar
                </button>
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
                  className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Limpiar
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="px-4 py-2 border border-white/20 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 backdrop-blur-sm"
                >
                  <option value="" className="bg-gray-900">Todas las categorías</option>
                  <option value="perpetual" className="bg-gray-900">Permanente</option>
                  <option value="subscription" className="bg-gray-900">Suscripción</option>
                  <option value="temporary" className="bg-gray-900">Temporal</option>
                </select>
                <select
                  value={hasImage}
                  onChange={(e) => setHasImage(e.target.value)}
                  className="px-4 py-2 border border-white/20 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 backdrop-blur-sm"
                >
                  <option value="" className="bg-gray-900">Todas las imágenes</option>
                  <option value="yes" className="bg-gray-900">Con imagen</option>
                  <option value="no" className="bg-gray-900">Sin imagen</option>
                </select>
                <input
                  type="text"
                  value={software}
                  onChange={(e) => setSoftware(e.target.value)}
                  placeholder="Filtrar por software..."
                  className="px-4 py-2 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 backdrop-blur-sm"
                />
              </div>
            </form>
          </div>

          <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl ring-1 ring-white/20 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            ) : licenses.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="h-16 w-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No hay licencias</h3>
                <p className="text-white/70">No se encontraron licencias con los filtros aplicados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Imagen
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Proveedor
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Expiración
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {(hasImage === "yes" ? licenses.filter(l => l.image) : hasImage === "no" ? licenses.filter(l => !l.image) : licenses).map((license) => (
                      <tr key={license.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {license.image ? (
                            <img src={license.image} alt={license.name} className="h-10 w-10 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="h-10 w-10 rounded bg-white/10 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-white/50" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{license.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white/90">{license.provider}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(license.license_type)}`}>
                            {license.license_type === "perpetual" ? "Permanente" : license.license_type === "subscription" ? "Suscripción" : "Temporal"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(license.status)}`}>
                            {license.status === "active" ? "Activo" : license.status === "expired" ? "Expirado" : license.status === "suspended" ? "Suspendido" : "Revocado"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{formatPrice(license.price)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white/90">{formatDate(license.expiration_date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => openModal(license)}
                            className="text-white/70 hover:text-white transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            Ver detalles
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

      {showModal && selectedLicense && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={closeModal}></div>

            <div className="inline-block align-bottom bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full ring-1 ring-white/20 relative z-10">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Detalles de la Licencia</h3>
                <button
                  onClick={closeModal}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-4">
                {selectedLicense.image && (
                  <div className="w-full h-48 bg-white/5 rounded-lg overflow-hidden">
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
                    <label className="text-xs text-white/50 uppercase tracking-wider">Nombre</label>
                    <p className="text-white mt-1">{selectedLicense.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Proveedor</label>
                    <p className="text-white mt-1">{selectedLicense.provider}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Tipo de Licencia</label>
                    <div className="mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(selectedLicense.license_type)}`}>
                        {selectedLicense.license_type === "perpetual" ? "Permanente" : selectedLicense.license_type === "subscription" ? "Suscripción" : "Temporal"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Estado</label>
                    <div className="mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedLicense.status)}`}>
                        {selectedLicense.status === "active" ? "Activo" : selectedLicense.status === "expired" ? "Expirado" : selectedLicense.status === "suspended" ? "Suspendido" : "Revocado"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Precio</label>
                    <p className="text-white mt-1 font-medium">{formatPrice(selectedLicense.price)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Fecha de Compra</label>
                    <p className="text-white mt-1">{formatDate(selectedLicense.purchase_date)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Fecha de Expiración</label>
                    <p className="text-white mt-1">{formatDate(selectedLicense.expiration_date)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Clave de Licencia</label>
                    <p className="text-white/90 mt-1 font-mono text-sm bg-white/5 px-2 py-1 rounded break-all">
                      {selectedLicense.license_key || "N/A"}
                    </p>
                  </div>
                </div>

                {selectedLicense.notes && (
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Notas</label>
                    <p className="text-white/90 mt-1 bg-white/5 p-3 rounded-lg text-sm">{selectedLicense.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Creado</label>
                    <p className="text-white/70 mt-1 text-sm">{formatDate(selectedLicense.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Actualizado</label>
                    <p className="text-white/70 mt-1 text-sm">{formatDate(selectedLicense.updated_at)}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={closeModal}
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
