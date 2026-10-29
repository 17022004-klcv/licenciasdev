"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DigitalLicense,
  LicenseFilterParams,
  LicenseStatus,
  LicenseType,
} from "@/src/type";
import {
  FileText,
  Search,
  Filter,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Plus,
  X,
  Upload,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";

type CatalogFilters = LicenseFilterParams & { software?: string };

interface LicenseFormState {
  name: string;
  provider: string;
  license_type: LicenseType;
  purchase_date: string;
  image: string;
  price: string;
  expiration_date: string;
  status: LicenseStatus;
  notes: string;
}

const EMPTY_FORM: LicenseFormState = {
  name: "",
  provider: "",
  license_type: "subscription",
  purchase_date: "",
  image: "",
  price: "",
  expiration_date: "",
  status: "active",
  notes: "",
};

const inputClass =
  "w-full px-4 py-2.5 border border-[#DFE3DD] bg-[#FBFCF8] text-[#17201D] placeholder-[#859087] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#91A91C] transition-all";
const labelClass =
  "block text-xs text-[#859087] uppercase tracking-wider font-semibold mb-1";

export default function CatalogoLicenciasPage() {
  const [licenses, setLicenses] = useState<DigitalLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLicense, setSelectedLicense] = useState<DigitalLicense | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);
  const [showLicenseKey, setShowLicenseKey] = useState(false);
  const [categoria, setCategoria] = useState("");
  const [hasImage, setHasImage] = useState("");
  const [software, setSoftware] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingLicense, setEditingLicense] = useState<DigitalLicense | null>(
    null,
  );
  const [form, setForm] = useState<LicenseFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchLicenses = useCallback(
    async (filterParams: CatalogFilters = {}) => {
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
    },
    [],
  );

  const getCurrentFilters = useCallback((): CatalogFilters => {
    const currentFilters: CatalogFilters = {};
    if (searchTerm.trim()) currentFilters.search = searchTerm.trim();
    if (categoria) currentFilters.license_type = categoria as LicenseType;
    if (software.trim()) currentFilters.software = software.trim();
    return currentFilters;
  }, [searchTerm, categoria, software]);

  const refresh = useCallback(
    () => fetchLicenses(getCurrentFilters()),
    [fetchLicenses, getCurrentFilters],
  );

  // Búsqueda automática (con debounce) al cambiar términos o filtros
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchLicenses(getCurrentFilters());
    }, 300);

    return () => clearTimeout(timeout);
  }, [fetchLicenses, getCurrentFilters]);

  const openModal = (license: DigitalLicense) => {
    setSelectedLicense(license);
    setShowLicenseKey(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowLicenseKey(false);
    setSelectedLicense(null);
  };

  const handleAdd = () => {
    setEditingLicense(null);
    setForm(EMPTY_FORM);
    setShowFormModal(true);
  };

  const handleEdit = (license: DigitalLicense) => {
    setEditingLicense(license);
    setForm({
      name: license.name,
      provider: license.provider,
      license_type: license.license_type,
      purchase_date: license.purchase_date ?? "",
      image: license.image ?? "",
      price: String(license.price),
      expiration_date: license.expiration_date ?? "",
      status: license.status,
      notes: license.notes ?? "",
    });
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingLicense(null);
    setForm(EMPTY_FORM);
  };

  const handleFieldChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }) as LicenseFormState);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Error al subir la imagen");
      }

      setForm((prev) => ({ ...prev, image: data.data.url }));
      await Swal.fire({
        icon: "success",
        title: "Imagen subida",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Error al subir la imagen",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.name.trim() || !form.provider.trim() || !form.price) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Nombre, proveedor y precio son obligatorios",
      });
      return;
    }

    const price = Number(form.price);
    if (Number.isNaN(price) || price < 0) {
      Swal.fire({
        icon: "warning",
        title: "Precio inválido",
        text: "El precio debe ser un número mayor o igual a cero",
      });
      return;
    }

    if (price > 1_000_000) {
      Swal.fire({
        icon: "warning",
        title: "Precio inválido",
        text: "El precio no puede ser mayor a 1,000,000",
      });
      return;
    }

    if (
      form.purchase_date &&
      form.expiration_date &&
      new Date(form.expiration_date) < new Date(form.purchase_date)
    ) {
      Swal.fire({
        icon: "warning",
        title: "Fechas inválidas",
        text: "La fecha de expiración no puede ser anterior a la de compra",
      });
      return;
    }

    const payload = {
      name: form.name.trim(),
      provider: form.provider.trim(),
      license_type: form.license_type,
      purchase_date: form.purchase_date || null,
      image: form.image.trim() || null,
      price,
      expiration_date: form.expiration_date || null,
      status: form.status,
      notes: form.notes.trim() || null,
    };

    setSaving(true);
    try {
      const response = await fetch(
        editingLicense
          ? `/api/licenses/${editingLicense.id}`
          : "/api/licenses",
        {
          method: editingLicense ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Error al guardar la licencia");
      }

      closeFormModal();
      await refresh();
      await Swal.fire({
        icon: "success",
        title: editingLicense ? "Licencia actualizada" : "Licencia creada",
        text: editingLicense
          ? data.message
          : `${data.message}. Clave generada: ${data.data.license_key}`,
        timer: editingLicense ? 1500 : 4000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Error al guardar la licencia",
      });
    } finally {
      setSaving(false);
    }
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

    if (!result.isConfirmed) return;

    setDeletingId(license.id);
    try {
      const response = await fetch(`/api/licenses/${license.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Error al eliminar la licencia");
      }

      await refresh();
      await Swal.fire({
        icon: "success",
        title: "Licencia eliminada",
        text: data.message,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Error al eliminar la licencia",
      });
    } finally {
      setDeletingId(null);
    }
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
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <table className="w-full table-fixed text-left border-collapse">
              <colgroup>
                <col className="w-[7%]" />
                <col className="w-[21%]" />
                <col className="w-[15%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[15%]" />
              </colgroup>
              <thead>
                <tr className="sticky top-0 z-10 border-b border-[#DFE3DD] bg-[#EEF2E9] text-xs font-semibold text-[#68716D] uppercase tracking-wider">
                  <th className="px-3 py-4">Imagen</th>
                  <th className="px-3 py-4">Nombre</th>
                  <th className="px-3 py-4">Proveedor</th>
                  <th className="px-3 py-4">Tipo</th>
                  <th className="px-3 py-4">Estado</th>
                  <th className="px-3 py-4">Precio</th>
                  <th className="px-3 py-4">Expiración</th>
                  <th className="px-3 py-4 text-center">Acciones</th>
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
                    <td className="px-3 py-4">
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
                    <td
                      className="truncate px-3 py-4 font-medium text-[#17201D]"
                      title={license.name}
                    >
                      {license.name}
                    </td>
                    <td
                      className="truncate px-3 py-4 text-[#68716D]"
                      title={license.provider}
                    >
                      {license.provider}
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-block max-w-full truncate px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(license.license_type)}`}
                      >
                        {license.license_type === "perpetual"
                          ? "Permanente"
                          : license.license_type === "subscription"
                            ? "Suscripción"
                            : "Temporal"}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-block max-w-full truncate px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(license.status)}`}
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
                    <td
                      className="truncate px-3 py-4 font-medium text-[#17201D]"
                      title={formatPrice(license.price)}
                    >
                      {formatPrice(license.price)}
                    </td>
                    <td
                      className="truncate px-3 py-4 text-[#68716D]"
                      title={formatDate(license.expiration_date)}
                    >
                      {formatDate(license.expiration_date)}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openModal(license)}
                          title="Ver detalles"
                          className="p-1.5 rounded-lg bg-[#E7EDE2] text-[#17201D] hover:bg-[#D7ED4B] transition-all"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(license)}
                          title="Editar"
                          className="p-1.5 rounded-lg bg-[#E7EDE2] text-[#17201D] hover:bg-[#91A91C] hover:text-[#F5F5F0] transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(license)}
                          title="Eliminar"
                          disabled={deletingId === license.id}
                          className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === license.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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

      {/* Modal de Crear / Editar */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-[#17201D]/50 backdrop-blur-sm"
              onClick={() => {
                if (!saving) closeFormModal();
              }}
            ></div>

            <div className="inline-block align-bottom bg-[#FBFCF8] rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full border border-[#DFE3DD] relative z-10">
              <div className="px-6 py-4 border-b border-[#DFE3DD] flex items-center justify-between bg-[#E7EDE2]/50">
                <h3 className="text-lg font-semibold text-[#17201D]">
                  {editingLicense ? "Editar Licencia" : "Nueva Licencia"}
                </h3>
                <button
                  type="button"
                  onClick={closeFormModal}
                  disabled={saving}
                  className="text-[#68716D] hover:text-[#17201D] transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="px-6 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className={labelClass}>
                        Nombre *
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleFieldChange}
                        placeholder="Ej. JetBrains All Products Pack"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="provider" className={labelClass}>
                        Proveedor *
                      </label>
                      <input
                        id="provider"
                        name="provider"
                        type="text"
                        required
                        value={form.provider}
                        onChange={handleFieldChange}
                        placeholder="Ej. JetBrains s.r.o."
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="license_type" className={labelClass}>
                        Tipo de licencia *
                      </label>
                      <select
                        id="license_type"
                        name="license_type"
                        value={form.license_type}
                        onChange={handleFieldChange}
                        className={inputClass}
                      >
                        <option value="perpetual">Permanente</option>
                        <option value="subscription">Suscripción</option>
                        <option value="temporary">Temporal</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="status" className={labelClass}>
                        Estado
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={form.status}
                        onChange={handleFieldChange}
                        className={inputClass}
                      >
                        <option value="active">Activo</option>
                        <option value="expired">Expirado</option>
                        <option value="suspended">Suspendido</option>
                        <option value="revoked">Revocado</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="price" className={labelClass}>
                        Precio (USD) *
                      </label>
                      <input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        max="1000000"
                        step="0.01"
                        required
                        value={form.price}
                        onChange={handleFieldChange}
                        placeholder="0.00"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-center rounded-xl border border-[#DFE3DD] bg-[#E7EDE2]/50 px-4 py-2.5 text-sm text-[#68716D]">
                      La clave de licencia se genera automáticamente y es
                      única.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="purchase_date" className={labelClass}>
                        Fecha de compra
                      </label>
                      <input
                        id="purchase_date"
                        name="purchase_date"
                        type="date"
                        value={form.purchase_date}
                        onChange={handleFieldChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="expiration_date" className={labelClass}>
                        Fecha de expiración
                      </label>
                      <input
                        id="expiration_date"
                        name="expiration_date"
                        type="date"
                        value={form.expiration_date}
                        onChange={handleFieldChange}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="image" className={labelClass}>
                      Imagen
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        id="image"
                        name="image"
                        type="url"
                        value={form.image}
                        onChange={handleFieldChange}
                        placeholder="https://... o sube un archivo"
                        className={inputClass}
                      />
                      <label
                        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap cursor-pointer transition-all ${
                          uploading
                            ? "bg-[#E7EDE2] text-[#859087] cursor-not-allowed"
                            : "bg-[#E7EDE2] text-[#17201D] hover:bg-[#D7ED4B]"
                        }`}
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {uploading ? "Subiendo..." : "Subir imagen"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {form.image && (
                      <div className="mt-3 h-32 w-full bg-[#F5F5F0] rounded-xl overflow-hidden border border-[#DFE3DD]">
                        <img
                          src={form.image}
                          alt="Vista previa"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="notes" className={labelClass}>
                      Notas
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={form.notes}
                      onChange={handleFieldChange}
                      placeholder="Información adicional sobre la licencia..."
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-[#DFE3DD] flex justify-end gap-3 bg-[#E7EDE2]/50">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    disabled={saving}
                    className="px-5 py-2.5 bg-transparent border border-[#DFE3DD] text-[#17201D] rounded-xl hover:bg-[#E7EDE2] transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="px-5 py-2.5 bg-[#D7ED4B] text-[#17201D] rounded-xl hover:bg-[#91A91C] hover:text-[#F5F5F0] transition-colors font-semibold text-sm disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {saving
                      ? "Guardando..."
                      : editingLicense
                        ? "Guardar cambios"
                        : "Crear licencia"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
                    <div className="flex items-center gap-2 mt-1">
                      <p className="flex-1 text-[#17201D] font-mono text-sm bg-[#F5F5F0] border border-[#DFE3DD] px-3 py-1.5 rounded-lg break-all">
                        {selectedLicense.license_key
                          ? showLicenseKey
                            ? selectedLicense.license_key
                            : "•••• •••• •••• ••••"
                          : "N/A"}
                      </p>
                      {selectedLicense.license_key && (
                        <button
                          type="button"
                          onClick={() => setShowLicenseKey((prev) => !prev)}
                          title={
                            showLicenseKey
                              ? "Ocultar clave de licencia"
                              : "Mostrar clave de licencia"
                          }
                          aria-label={
                            showLicenseKey
                              ? "Ocultar clave de licencia"
                              : "Mostrar clave de licencia"
                          }
                          className="p-2 rounded-lg bg-[#E7EDE2] text-[#17201D] hover:bg-[#D7ED4B] transition-all shrink-0"
                        >
                          {showLicenseKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
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
