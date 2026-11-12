import { NextRequest, NextResponse } from "next/server";
import { licenseService } from "@/service/license.service";
import { requireAuth } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

async function parseId(params: Params["params"]) {
  const licenseId = Number((await params).id);
  return Number.isInteger(licenseId) ? licenseId : null;
}

// Inventario de claves de una licencia (disponibles y vendidas). Solo administradores.
export async function GET(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req, ["administrator"]);
  if (!auth.ok) return auth.response;

  try {
    const licenseId = await parseId(params);
    if (licenseId === null) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
    }
    if (!licenseService.getById(licenseId)) {
      return NextResponse.json({ success: false, error: "Licencia no encontrada" }, { status: 404 });
    }

    const keys = licenseService.getKeys(licenseId);
    return NextResponse.json({ success: true, count: keys.length, data: keys });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener las claves";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// Agrega unidades (genera claves nuevas). Body: { quantity: number }
export async function POST(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req, ["administrator"]);
  if (!auth.ok) return auth.response;

  try {
    const licenseId = await parseId(params);
    if (licenseId === null) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const license = licenseService.addKeys(licenseId, body?.quantity);

    return NextResponse.json(
      {
        success: true,
        message: `Se agregaron ${body.quantity} ${body.quantity === 1 ? "unidad" : "unidades"}`,
        data: license,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al agregar unidades";
    const status = message.includes("no encontrada") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
