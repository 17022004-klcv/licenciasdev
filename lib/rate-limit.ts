import type { NextRequest } from "next/server";

/**
 * Limitador simple en memoria por clave (p. ej. IP). Basta para frenar abusos básicos en
 * los endpoints públicos; al ser por proceso, se reinicia con el servidor y no se comparte
 * entre varias instancias.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  return function isAllowed(key: string): boolean {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);

    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }

    recent.push(now);
    hits.set(key, recent);

    // Limpieza ocasional para que el mapa no crezca sin límite
    if (hits.size > 10_000) {
      for (const [entry, times] of hits) {
        if (times.every((time) => now - time >= windowMs)) hits.delete(entry);
      }
    }
    return true;
  };
}

// Detrás de un proxy (Render) la IP real llega en x-forwarded-for
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
