"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, ShoppingCart, Receipt, LogOut } from "lucide-react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { useSession } from "@/src/components/session";

const ROLE_LABELS: Record<string, string> = {
  administrator: "Administrador",
  employee: "Empleado",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSession();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: "¿Estás seguro de que deseas salir del sistema?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#91A91C",
      cancelButtonColor: "#68716D",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        // Borra la cookie httpOnly de sesión; localStorage solo guarda datos de UI
        await fetch("/api/auth/logout", { method: "POST" });
      } finally {
        localStorage.removeItem("employee");
        router.push("/");
      }
    }
  };

  const navItems = [
    { name: "Inicio", href: "/admin", icon: Home },
    { name: "Catálogo", href: "/admin/catalogo", icon: FileText },
    { name: "POS", href: "/admin/pos", icon: ShoppingCart },
    { name: "Historial de Ventas", href: "/admin/ventas", icon: Receipt },
  ];

  return (
    <aside className="flex flex-col w-64 h-full bg-[#17201D] border-r border-[#DFE3DD]/10 text-[#F5F5F0] p-6 shadow-xl">
      {/* Encabezado / Logo */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="h-10 w-10 rounded-xl bg-[#D7ED4B] flex items-center justify-center text-[#17201D] font-bold shadow-md">
          SL
        </div>
        <div>
          <h2 className="font-bold text-lg leading-tight text-[#F5F5F0]">
            Sistema
          </h2>
          <p className="text-xs text-[#859087]">Licencias Digitales</p>
        </div>
      </div>

      {/* Enlaces de navegación */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                isActive
                  ? "bg-[#D7ED4B] text-[#17201D] shadow-sm font-semibold"
                  : "text-[#859087] hover:bg-[#1D2925] hover:text-[#F5F5F0]"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? "text-[#17201D]" : "text-[#859087]"}`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Botón de cerrar sesión inferior */}
      <div className="pt-4 border-t border-[#DFE3DD]/10 space-y-2">
        <div className="px-4 py-2">
          <p className="text-sm font-semibold text-[#F5F5F0] truncate">
            {user ? `${user.first_name} ${user.last_name}` : "Cargando..."}
          </p>
          <p className="text-xs text-[#859087]">{user ? ROLE_LABELS[user.role] ?? user.role : ""}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-[#859087] hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
