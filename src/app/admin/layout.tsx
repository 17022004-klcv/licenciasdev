import Sidebar from "@/src/components/sidebar";
import SessionProvider from "@/src/components/session";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex h-dvh overflow-hidden bg-[#F5F5F0]">
        {/* Sidebar fijo a la izquierda */}
        <Sidebar />

        {/* Contenido principal de las páginas del admin */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </SessionProvider>
  );
}
