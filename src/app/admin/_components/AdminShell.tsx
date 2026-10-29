"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { JWTPayload } from "@/src/type";
import { FileText, KeyRound, LogOut, Menu, Receipt, ShoppingCart, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/catalogo", label: "Catálogo", icon: FileText },
  { href: "/admin/pos", label: "Punto de Venta", icon: ShoppingCart },
  { href: "/admin/ventas", label: "Historial de Ventas", icon: Receipt },
];

const ROLE_LABELS: Record<string, string> = {
  administrator: "Administrador",
  employee: "Empleado",
};

const SessionContext = createContext<JWTPayload | null>(null);

// Usuario en sesión (null mientras carga)
export const useSession = () => useContext(SessionContext);

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<JWTPayload | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        const data = await response.json();
        if (data.success) setUser(data.data);
      } catch {
        // Si falla la red, las páginas muestran su propio error al cargar datos
      }
    };

    loadSession();
  }, [router]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("employee");
      router.push("/login");
    }
  };

  const initials = user ? `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase() : "";

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="h-10 w-10 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center">
          <KeyRound className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold text-white leading-tight">LicenciasDev</p>
          <p className="text-xs text-white/60">Gestión de licencias</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? "bg-white/15 text-white font-medium ring-1 ring-white/20"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 ring-1 ring-white/20 flex items-center justify-center text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user ? `${user.first_name} ${user.last_name}` : "Cargando..."}
            </p>
            <p className="text-xs text-white/60 truncate">{user ? ROLE_LABELS[user.role] ?? user.role : ""}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <SessionContext.Provider value={user}>
      <div className="flex min-h-screen bg-gray-900">
        {/* Escritorio */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 border-r border-white/10">
          {sidebarContent}
        </aside>

        {/* Móvil */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}></div>
            <aside className="relative h-full w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 border-r border-white/10 shadow-2xl">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebarContent}
            </aside>
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-white/10">
            <button
              onClick={() => setMobileOpen(true)}
              className="text-white/80 hover:text-white"
              aria-label="Abrir menú"
            >
              <Menu className="h-6 w-6" />
            </button>
            <KeyRound className="h-5 w-5 text-white" />
            <span className="font-semibold text-white">LicenciasDev</span>
          </div>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SessionContext.Provider>
  );
}
