import { NextRequest, NextResponse } from "next/server";
import { licenseService } from "@/service/license.service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const licenseId = Number(id);

    if (isNaN(licenseId)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
    }

    const license = licenseService.getById(licenseId);
    if (!license) {
      return NextResponse.json({ success: false, error: "Licencia no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: license,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener licencia";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const licenseId = Number(id);

    if (isNaN(licenseId)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const updated = licenseService.update(licenseId, body);

    return NextResponse.json({
      success: true,
      message: "Licencia actualizada exitosamente",
      data: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar licencia";
    const status = message.includes("no encontrada") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const licenseId = Number(id);

    if (isNaN(licenseId)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
    }

    const deleted = licenseService.delete(licenseId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Licencia no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Licencia eliminada exitosamente",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar licencia";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
