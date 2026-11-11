import { getDb, withTransaction } from "@/lib/db";
import { insertGeneratedKeys } from "@/lib/license-key";
import {
  DigitalLicense,
  LicenseKey,
  CreateLicenseDTO,
  UpdateLicenseDTO,
  LicenseFilterParams,
  PublicLicense,
  LICENSE_TYPES,
  LicenseType,
} from "@/src/type";

const MAX_PRICE = 1_000_000;
// Máximo de claves que se pueden generar en una sola operación
export const MAX_KEYS_PER_REQUEST = 500;

// El stock se calcula a partir de las claves disponibles en vez de guardarse en una
// columna, así nunca se desincroniza del inventario real
const LICENSE_SELECT = `
  SELECT l.*,
         (SELECT COUNT(*) FROM license_keys k
           WHERE k.license_id = l.id AND k.status = 'available') AS stock
  FROM digital_licenses l
`;

function assertValidKeyCount(count: unknown, allowZero: boolean): asserts count is number {
  const min = allowZero ? 0 : 1;
  if (!Number.isInteger(count) || (count as number) < min || (count as number) > MAX_KEYS_PER_REQUEST) {
    throw new Error(`La cantidad de unidades debe ser un entero entre ${min} y ${MAX_KEYS_PER_REQUEST}`);
  }
}

function assertValidType(type: unknown): asserts type is LicenseType {
  if (!LICENSE_TYPES.includes(type as LicenseType)) {
    throw new Error(`Tipo de licencia inválido. Valores permitidos: ${LICENSE_TYPES.join(", ")}`);
  }
}

function formatLicense(license: DigitalLicense): DigitalLicense {
  return {
    ...license,
    price: Number(license.price),
    stock: Number(license.stock),
  };
}

export const licenseService = {
  getAll(filters?: LicenseFilterParams): DigitalLicense[] {
    const db = getDb();

    if (!filters || Object.keys(filters).length === 0) {
      const rows = db.prepare(`${LICENSE_SELECT} ORDER BY l.id DESC`).all() as unknown as DigitalLicense[];
      return rows.map(formatLicense);
    }

    const whereClauses: string[] = [];
    const params: unknown[] = [];

    // General search across name, provider, or notes
    if (filters.search) {
      whereClauses.push("(l.name LIKE ? OR l.provider LIKE ? OR l.notes LIKE ?)");
      const term = `%${filters.search.trim()}%`;
      params.push(term, term, term);
    }

    // Specific filters: name, provider, license_type, status
    if (filters.name) {
      whereClauses.push("l.name LIKE ?");
      params.push(`%${filters.name.trim()}%`);
    }

    if (filters.provider) {
      whereClauses.push("l.provider LIKE ?");
      params.push(`%${filters.provider.trim()}%`);
    }

    if (filters.license_type) {
      whereClauses.push("l.license_type = ?");
      params.push(filters.license_type);
    }

    if (filters.status) {
      whereClauses.push("l.status = ?");
      params.push(filters.status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const sql = `${LICENSE_SELECT} ${whereSql} ORDER BY l.id DESC`;

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
      notes: license.notes,
      stock: license.stock,
    }));
  },

  getById(id: number): DigitalLicense | null {
    const db = getDb();
    const row = db.prepare(`${LICENSE_SELECT} WHERE l.id = ?`).get(id) as DigitalLicense | undefined;
    return row ? formatLicense(row) : null;
  },

  create(data: CreateLicenseDTO): DigitalLicense {
    const {
      name,
      provider,
      license_type,
      image = null,
      price,
      status = "active",
      notes = null,
      initial_stock = 1,
    } = data;

    if (!name || !provider || !license_type || price === undefined || price === null) {
      throw new Error("name, provider, license_type y price son campos obligatorios");
    }

    assertValidType(license_type);

    if (price < 0) {
      throw new Error("El precio no puede ser negativo");
    }

    if (price > MAX_PRICE) {
      throw new Error("El precio no puede ser mayor a 1,000,000");
    }

    assertValidKeyCount(initial_stock, true);

    // El producto y sus claves se crean juntos o no se crea nada
    const newId = withTransaction((db) => {
      const result = db
        .prepare(`
          INSERT INTO digital_licenses (name, provider, license_type, image, price, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          name.trim(),
          provider.trim(),
          license_type,
          image ? image.trim() : null,
          price,
          status,
          notes ? notes.trim() : null
        );

      const id = Number(result.lastInsertRowid);
      insertGeneratedKeys(db, id, initial_stock);
      return id;
    });

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

    if (data.license_type !== undefined) {
      assertValidType(data.license_type);
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
    if (data.image !== undefined) {
      updates.push("image = ?");
      params.push(data.image ? data.image.trim() : null);
    }
    if (data.price !== undefined) {
      updates.push("price = ?");
      params.push(data.price);
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

  // Las claves sin vender se eliminan con el producto; las vendidas se conservan (su
  // license_id queda en NULL) porque pertenecen al historial de ventas
  delete(id: number): boolean {
    return withTransaction((db) => {
      db.prepare("DELETE FROM license_keys WHERE license_id = ? AND status = 'available'").run(id);
      const result = db.prepare("DELETE FROM digital_licenses WHERE id = ?").run(id);
      return Number(result.changes) > 0;
    });
  },

  getKeys(licenseId: number): LicenseKey[] {
    return getDb()
      .prepare(`
        SELECT k.id, k.license_id, k.license_key, k.status, si.sale_id,
               k.sold_at, k.expires_at, k.created_at
        FROM license_keys k
        LEFT JOIN sale_items si ON si.id = k.sale_item_id
        WHERE k.license_id = ?
        ORDER BY k.status = 'sold', k.id DESC
      `)
      .all(licenseId) as unknown as LicenseKey[];
  },

  addKeys(licenseId: number, quantity: unknown): DigitalLicense {
    assertValidKeyCount(quantity, false);

    withTransaction((db) => {
      if (!db.prepare("SELECT 1 FROM digital_licenses WHERE id = ?").get(licenseId)) {
        throw new Error("Licencia digital no encontrada");
      }
      insertGeneratedKeys(db, licenseId, quantity);
    });

    return this.getById(licenseId)!;
  },
};
