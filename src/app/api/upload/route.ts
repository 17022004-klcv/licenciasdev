import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No se ha proporcionado ningún archivo con el campo 'file'" },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Formato no soportado. Formatos válidos: JPEG, PNG, WEBP, GIF, SVG" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "El archivo supera el tamaño máximo permitido de 5 MB" },
        { status: 400 }
      );
    }

    const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = path.extname(file.name) || `.${file.type.split("/")[1] || "png"}`;
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);

    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;

    return NextResponse.json(
      {
        success: true,
        message: "Imagen subida exitosamente",
        data: {
          filename: uniqueName,
          url: publicUrl,
          size: file.size,
          mimetype: file.type,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al procesar la subida del archivo";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
