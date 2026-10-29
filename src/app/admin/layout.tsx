import Sidebar from "@/src/components/sidebar"; // Ajusta la ruta de importación según dónde tengas guaradado tu componente Sidebar

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh overflow-hidden bg-[#F5F5F0]">
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />

      {/* Contenido principal de las páginas del admin */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
