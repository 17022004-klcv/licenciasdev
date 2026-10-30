import { randomInt } from "crypto";
import { getDb } from "@/lib/db";
import {
  DigitalLicense,
  CreateLicenseDTO,
  UpdateLicenseDTO,
  LicenseFilterParams,
  PublicLicense,
} from "@/src/type";

const MAX_PRICE = 1_000_000;

function formatLicense(license: DigitalLicense): DigitalLicense {
  return {
    ...license,
    price: Number(license.price),
  };
}

function generateUniqueLicenseKey(db: ReturnType<typeof getDb>): string {
  for (let attempt = 0; attempt < 100; attempt++) {
    const groups = Array.from({ length: 4 }, () =>
      randomInt(0, 10000).toString().padStart(4, "0"),
    );
    const key = groups.join("-");

    const existing = db
      .prepare("SELECT 1 FROM digital_licenses WHERE license_key = ?")
      .get(key);

    if (!existing) {
      return key;
    }
  }

  throw new Error("No se pudo generar una clave de licencia única");
}

export const licenseService = {
  getAll(filters?: LicenseFilterParams): DigitalLicense[] {
    const db = getDb();

    if (!filters || Object.keys(filters).length === 0) {
      const rows = db.prepare("SELECT * FROM digital_licenses ORDER BY id DESC").all() as unknown as DigitalLicense[];
      return rows.map(formatLicense);
    }

    const whereClauses: string[] = [];
    const params: unknown[] = [];

    // General search across name, provider, or notes
    if (filters.search) {
      whereClauses.push("(name LIKE ? OR provider LIKE ? OR notes LIKE ?)");
      const term = `%${filters.search.trim()}%`;
      params.push(term, term, term);
    }

    // Specific filters: name, provider, license_type, status
    if (filters.name) {
      whereClauses.push("name LIKE ?");
      params.push(`%${filters.name.trim()}%`);
    }

    if (filters.provider) {
      whereClauses.push("provider LIKE ?");
      params.push(`%${filters.provider.trim()}%`);
    }

    if (filters.license_type) {
      whereClauses.push("license_type = ?");
      params.push(filters.license_type);
    }

    if (filters.status) {
      whereClauses.push("status = ?");
      params.push(filters.status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const sql = `SELECT * FROM digital_licenses ${whereSql} ORDER BY id DESC`;

    const stmt = db.prepare(sql);
    // @ts-expect-error dynamic params for DatabaseSync all
    const rows = stmt.all(...params) as unknown as DigitalLicense[];

    return rows.map(formatLicense);
  },

  // Catálogo para clientes: solo licencias activas y sin datos sensibles
  getPublic(): PublicLicense[] {
    return this.getAll({ status: "active" }).map((license) => ({
      id: license.id,
      name: license.name,
      provider: license.provider,
      license_type: license.license_type,
      image: license.image,
      price: license.price,
      expiration_date: license.expiration_date,
      notes: license.notes,
    }));
  },

  getById(id: number): DigitalLicense | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM digital_licenses WHERE id = ?").get(id) as DigitalLicense | undefined;
    return row ? formatLicense(row) : null;
  },

  create(data: CreateLicenseDTO): DigitalLicense {
    const {
      name,
      provider,
      license_type,
      purchase_date = null,
      image = null,
      price,
      expiration_date = null,
      status = "active",
      notes = null,
    } = data;

    if (!name || !provider || !license_type || price === undefined || price === null) {
      throw new Error("name, provider, license_type y price son campos obligatorios");
    }

    if (price < 0) {
      throw new Error("El precio no puede ser negativo");
    }

    if (price > MAX_PRICE) {
      throw new Error("El precio no puede ser mayor a 1,000,000");
    }

    if (purchase_date && expiration_date) {
      if (new Date(expiration_date) < new Date(purchase_date)) {
        throw new Error("La fecha de expiración no puede ser anterior a la de compra");
      }
    }

    const db = getDb();
    const licenseKey = generateUniqueLicenseKey(db);
    const insert = db.prepare(`
      INSERT INTO digital_licenses (
        name, provider, license_key, license_type, purchase_date,
        image, price, expiration_date, status, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      name.trim(),
      provider.trim(),
      licenseKey,
      license_type,
      purchase_date || null,
      image ? image.trim() : null,
      price,
      expiration_date || null,
      status,
      notes ? notes.trim() : null
    );

    const newId = Number(result.lastInsertRowid);
    const created = this.getById(newId);
    if (!created) {
      throw new Error("No se pudo obtener la licencia creada");
    }

    return created;
  },

  update(id: number, data: UpdateLicenseDTO): DigitalLicense {
    const current = this.getById(id);
    if (!current) {
      throw new Error("Licencia digital no encontrada");
    }

    const purchaseDate = data.purchase_date !== undefined ? data.purchase_date : current.purchase_date;
    const expirationDate = data.expiration_date !== undefined ? data.expiration_date : current.expiration_date;

    if (purchaseDate && expirationDate) {
      if (new Date(expirationDate) < new Date(purchaseDate)) {
        throw new Error("La fecha de expiración no puede ser anterior a la de compra");
      }
    }

    if (data.price !== undefined && data.price < 0) {
      throw new Error("El precio no puede ser negativo");
    }

    if (data.price !== undefined && data.price > MAX_PRICE) {
      throw new Error("El precio no puede ser mayor a 1,000,000");
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      params.push(data.name.trim());
    }
    if (data.provider !== undefined) {
      updates.push("provider = ?");
      params.push(data.provider.trim());
    }
    if (data.license_type !== undefined) {
      updates.push("license_type = ?");
      params.push(data.license_type);
    }
    if (data.purchase_date !== undefined) {
      updates.push("purchase_date = ?");
      params.push(data.purchase_date || null);
    }
    if (data.image !== undefined) {
      updates.push("image = ?");
      params.push(data.image ? data.image.trim() : null);
    }
    if (data.price !== undefined) {
      updates.push("price = ?");
      params.push(data.price);
    }
    if (data.expiration_date !== undefined) {
      updates.push("expiration_date = ?");
      params.push(data.expiration_date || null);
    }
    if (data.status !== undefined) {
      updates.push("status = ?");
      params.push(data.status);
    }
    if (data.notes !== undefined) {
      updates.push("notes = ?");
      params.push(data.notes ? data.notes.trim() : null);
    }

    if (updates.length === 0) {
      return current;
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);

    const db = getDb();
    const updateStmt = db.prepare(`
      UPDATE digital_licenses
      SET ${updates.join(", ")}
      WHERE id = ?
    `);

    // @ts-expect-error dynamic params for DatabaseSync run
    updateStmt.run(...params);

    const updated = this.getById(id);
    if (!updated) {
      throw new Error("Error al consultar la licencia tras actualización");
    }

    return updated;
  },

  delete(id: number): boolean {
    const db = getDb();
    const result = db.prepare("DELETE FROM digital_licenses WHERE id = ?").run(id);
    return Number(result.changes) > 0;
  },
};
