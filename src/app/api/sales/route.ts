import { NextRequest, NextResponse } from "next/server";
import { saleService } from "@/service/sale.service";
import { requireAuth } from "@/lib/auth";

// Los administradores ven todas las ventas; los empleados solo las suyas
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const sales = saleService.getAll(auth.user.role === "administrator" ? undefined : auth.user.id);

    return NextResponse.json({
      success: true,
      count: sales.length,
      data: sales,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener ventas";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const created = saleService.create(auth.user.id, body);

    return NextResponse.json(
      {
        success: true,
        message: "Venta registrada exitosamente",
        data: created,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al registrar la venta";
    const status = message.includes("no encontrada") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
