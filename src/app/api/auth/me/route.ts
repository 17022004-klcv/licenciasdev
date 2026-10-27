import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/service/auth.service";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Token de autorización no provisto o con formato inválido" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);

    return NextResponse.json({
      success: true,
      data: payload,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al verificar el token";
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    );
  }
}
