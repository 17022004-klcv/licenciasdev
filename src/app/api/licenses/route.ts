import { NextRequest, NextResponse } from "next/server";
import { licenseService } from "@/service/license.service";
import { LicenseFilterParams, LicenseStatus, LicenseType } from "@/src/type";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);

    const filters: LicenseFilterParams = {};

    const search = searchParams.get("search");
    if (search) filters.search = search;

    const name = searchParams.get("name");
    if (name) filters.name = name;

    const provider = searchParams.get("provider");
    if (provider) filters.provider = provider;

    const license_type = searchParams.get("license_type") as LicenseType | null;
    if (license_type) filters.license_type = license_type;

    const status = searchParams.get("status") as LicenseStatus | null;
    if (status) filters.status = status;

    const software = searchParams.get("software");
    if (software) {
      filters.search = filters.search ? `${filters.search} ${software}` : software;
    }

    const licenses = licenseService.getAll(filters);

    return NextResponse.json({
      success: true,
      count: licenses.length,
      data: licenses,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener licencias";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ["administrator"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const created = licenseService.create(body);

    return NextResponse.json(
      {
        success: true,
        message: "Licencia digital creada exitosamente",
        data: created,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear la licencia";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
