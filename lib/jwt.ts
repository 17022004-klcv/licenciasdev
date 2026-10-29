import jwt from "jsonwebtoken";
import { JWTPayload } from "@/src/type";

export const AUTH_COOKIE = "token";
export const JWT_EXPIRES_IN_SECONDS = 60 * 60 * 24; // 24h

// Se lee de forma diferida para no romper el build si la variable no está definida,
// pero nunca se usa un valor por defecto: sin JWT_SECRET no se firman ni verifican tokens.
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("La variable de entorno JWT_SECRET no está configurada");
  }
  return secret;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN_SECONDS });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload;
  } catch {
    return null;
  }
}
