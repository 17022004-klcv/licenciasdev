import { randomInt } from "crypto";
import type { DatabaseSync } from "node:sqlite";
import type { LicenseType } from "@/src/type";

// Sin 0/O, 1/I/L para que las claves se puedan leer y dictar sin confusiones
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const GROUPS = 4;
const GROUP_LENGTH = 5;

/** Genera una clave con formato XXXXX-XXXXX-XXXXX-XXXXX (no garantiza unicidad). */
export function generateLicenseKey(): string {
  return Array.from({ length: GROUPS }, () =>
    Array.from({ length: GROUP_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join(""),
  ).join("-");
}

/**
 * Inserta `count` claves nuevas y disponibles para una licencia. La unicidad la garantiza
 * el índice UNIQUE de license_keys: si una clave choca (muy improbable) se genera otra.
 * Debe llamarse dentro de una transacción para que el alta sea todo o nada.
 */
export function insertGeneratedKeys(db: DatabaseSync, licenseId: number, count: number) {
  const insert = db.prepare("INSERT INTO license_keys (license_id, license_key) VALUES (?, ?)");

  for (let created = 0; created < count; created++) {
    for (let attempt = 0; ; attempt++) {
      try {
        insert.run(licenseId, generateLicenseKey());
        break;
      } catch (error) {
        const isDuplicate = error instanceof Error && error.message.includes("UNIQUE");
        if (!isDuplicate || attempt >= 20) {
          throw isDuplicate ? new Error("No se pudo generar una clave de licencia única") : error;
        }
      }
    }
  }
}

// Modificadores de fecha de SQLite; null = la licencia no vence
const EXPIRATION_MODIFIERS: Record<LicenseType, string | null> = {
  "6_months": "+6 months",
  "1_year": "+1 year",
  indefinite: null,
};

export const expirationModifier = (type: LicenseType) => EXPIRATION_MODIFIERS[type];
