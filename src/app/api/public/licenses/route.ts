import { NextResponse } from "next/server";
import { licenseService } from "@/service/license.service";

// Endpoint público (sin sesión) para la landing de clientes.
// Nunca devuelve license_key ni licencias inactivas.
export async function GET() {
  try {
    const licenses = licenseService.getPublic();

    return NextResponse.json({
      success: true,
      count: licenses.length,
      data: licenses,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener licencias";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
