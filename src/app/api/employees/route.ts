import { NextRequest, NextResponse } from "next/server";
import { employeeService } from "@/service/auth.service";

export async function GET() {
  try {
    const employees = employeeService.getAll();
    return NextResponse.json({
      success: true,
      data: employees,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener empleados";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const created = await employeeService.create(body);

    return NextResponse.json(
      {
        success: true,
        message: "Empleado registrado exitosamente",
        data: created,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al registrar empleado";
    const status = message.includes("Ya existe") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
