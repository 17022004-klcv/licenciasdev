import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/service/auth.service";
import { AUTH_COOKIE, JWT_EXPIRES_IN_SECONDS } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const result = await authService.authenticate(email, password);

    const response = NextResponse.json({
      success: true,
      message: "Autenticación exitosa",
      data: result,
    });

    response.cookies.set(AUTH_COOKIE, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: JWT_EXPIRES_IN_SECONDS,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    const status = message.includes("inválidas") || message.includes("inactiva") ? 401 : 400;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status }
    );
  }
}
