import { NextRequest, NextResponse } from "next/server";
import { employeeService } from "@/service/auth.service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const employeeId = Number(id);

    if (isNaN(employeeId)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
    }

    const employee = employeeService.getById(employeeId);
    if (!employee) {
      return NextResponse.json({ success: false, error: "Empleado no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: employee,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener empleado";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const employeeId = Number(id);

    if (isNaN(employeeId)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const updated = await employeeService.update(employeeId, body);

    return NextResponse.json({
      success: true,
      message: "Empleado actualizado exitosamente",
      data: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar empleado";
    const status = message.includes("no encontrado") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const employeeId = Number(id);

    if (isNaN(employeeId)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
    }

    const deleted = employeeService.delete(employeeId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Empleado no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Empleado eliminado exitosamente",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar empleado";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
