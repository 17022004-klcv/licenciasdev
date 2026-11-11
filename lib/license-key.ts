import { randomInt } from "crypto";

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
