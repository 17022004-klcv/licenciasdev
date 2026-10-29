import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { AUTH_COOKIE, verifyToken } from "@/lib/jwt";
import { Employee, EmployeeRole, JWTPayload } from "@/src/type";

type AuthResult =
  | { ok: true; user: JWTPayload }
  | { ok: false; response: NextResponse };

function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return req.cookies.get(AUTH_COOKIE)?.value ?? null;
}

function unauthorized(error: string, status = 401): AuthResult {
  return { ok: false, response: NextResponse.json({ success: false, error }, { status }) };
}

/**
 * Valida el token (header Bearer o cookie) y comprueba contra la base de datos que el
 * empleado siga existiendo y activo. El rol se toma de la BD, no del token, para que
 * los cambios de rol o desactivaciones tengan efecto inmediato.
 */
export function requireAuth(req: NextRequest, roles?: EmployeeRole[]): AuthResult {
  const token = getTokenFromRequest(req);
  if (!token) {
    return unauthorized("No autenticado");
  }

  const payload = verifyToken(token);
  if (!payload) {
    return unauthorized("Token no válido o expirado");
  }

  const employee = getDb()
    .prepare("SELECT id, email, role, first_name, last_name, is_active FROM employees WHERE id = ?")
    .get(payload.id) as Pick<Employee, "id" | "email" | "role" | "first_name" | "last_name" | "is_active"> | undefined;

  if (!employee || !employee.is_active) {
    return unauthorized("La cuenta no existe o se encuentra inactiva");
  }

  if (roles && !roles.includes(employee.role)) {
    return unauthorized("No tienes permisos para realizar esta acción", 403);
  }

  return {
    ok: true,
    user: {
      id: employee.id,
      email: employee.email,
      role: employee.role,
      first_name: employee.first_name,
      last_name: employee.last_name,
    },
  };
}
