import { NextRequest, NextResponse } from "next/server";
import { saleService } from "@/service/sale.service";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

// Como no hay pago real ni sesión, se limita por IP para que nadie agote el stock
// con un script: 5 compras cada 10 minutos
const isAllowed = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

// Compra pública desde la landing. Body: { license_id, customer_name, customer_email }
// Devuelve la clave asignada; la venta queda en el historial como venta web.
export async function POST(req: NextRequest) {
  if (!isAllowed(getClientIp(req))) {
    return NextResponse.json(
      { success: false, error: "Demasiadas compras seguidas. Intenta de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Solicitud inválida" }, { status: 400 });
  }

  try {
    const purchase = saleService.createWebPurchase(body as Parameters<typeof saleService.createWebPurchase>[0]);

    return NextResponse.json(
      { success: true, message: "Compra realizada exitosamente", data: purchase },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al procesar la compra";
    const status = message.includes("no encontrada")
      ? 404
      : message.includes("agotada") || message.includes("Stock insuficiente")
        ? 409
        : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
