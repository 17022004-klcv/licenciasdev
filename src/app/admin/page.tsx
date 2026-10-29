export default function AdminPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#17201D]">
          Panel de Administración
        </h1>
        <p className="text-[#68716D] mt-1">
          Bienvenida al sistema de gestión de licencias digitales.
        </p>
      </div>

      {/* Tarjeta de bienvenida de ejemplo */}
      <div className="p-6 rounded-2xl bg-[#FBFCF8] border border-[#DFE3DD] shadow-sm">
        <h2 className="text-xl font-semibold text-[#17201D] mb-2">
          Resumen General
        </h2>
        <p className="text-[#68716D]">
          Utiliza el menú lateral para navegar entre el Catálogo de licencias y
          el POS.
        </p>
      </div>
    </div>
  );
}
