import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/jwt";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Sesión cerrada",
  });
  response.cookies.delete(AUTH_COOKIE);
  return response;
}
