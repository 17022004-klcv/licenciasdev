import { NextResponse } from "next/server";
import { connection } from "next/server";
import { licenseService } from "@/service/license.service";

// Endpoint público (sin sesión) para la landing de clientes.
// Nunca devuelve license_key ni licencias inactivas.
export async function GET() {
  try {
    // node:sqlite es un driver síncrono y Next.js (cacheComponents) no detecta
    // la consulta como dato dinámico, así que prerenderiza este handler en el
    // build y la landing se queda con el catálogo de ese momento. connection()
    // obliga a resolverlo en cada request para mostrar las licencias actuales.
    await connection();

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
