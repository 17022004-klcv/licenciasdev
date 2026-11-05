"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { JWTPayload } from "@/src/type";

const SessionContext = createContext<JWTPayload | null>(null);

// Usuario en sesión (null mientras carga)
export const useSession = () => useContext(SessionContext);

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<JWTPayload | null>(null);

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

  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}
