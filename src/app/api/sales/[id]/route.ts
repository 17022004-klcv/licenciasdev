import { NextRequest, NextResponse } from "next/server";
import { saleService } from "@/service/sale.service";
import { requireAuth } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const saleId = Number(id);

    if (isNaN(saleId)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
    }

    const sale = saleService.getById(saleId);
    // Un empleado no puede consultar ventas ajenas; se responde 404 para no revelar que existen
    if (!sale || (auth.user.role !== "administrator" && sale.employee_id !== auth.user.id)) {
      return NextResponse.json({ success: false, error: "Venta no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: sale,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener venta";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
