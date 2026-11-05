import { getDb } from "@/lib/db";
import { CreateSaleDTO, DigitalLicense, Sale, SaleItem } from "@/src/type";

const MAX_QUANTITY = 1000;

const roundMoney = (value: number) => Math.round(value * 100) / 100;

type SaleRow = Omit<Sale, "items">;

const SALE_SELECT = `
  SELECT s.id, s.employee_id, s.total, s.created_at,
         CASE WHEN e.id IS NULL THEN NULL ELSE e.first_name || ' ' || e.last_name END AS employee_name
  FROM sales s
  LEFT JOIN employees e ON e.id = s.employee_id
`;

function attachItems(rows: SaleRow[]): Sale[] {
  if (rows.length === 0) return [];

  const db = getDb();
  const placeholders = rows.map(() => "?").join(", ");
  const items = db
    .prepare(`SELECT * FROM sale_items WHERE sale_id IN (${placeholders}) ORDER BY id`)
    .all(...rows.map((row) => row.id)) as unknown as SaleItem[];

  return rows.map((row) => ({
    ...row,
    total: Number(row.total),
    items: items.filter((item) => item.sale_id === row.id),
  }));
}

export const saleService = {
  getAll(employeeId?: number): Sale[] {
    const db = getDb();
    const rows = (
      employeeId === undefined
        ? db.prepare(`${SALE_SELECT} ORDER BY s.id DESC`).all()
        : db.prepare(`${SALE_SELECT} WHERE s.employee_id = ? ORDER BY s.id DESC`).all(employeeId)
    ) as unknown as SaleRow[];

    return attachItems(rows);
  },

  getById(id: number): Sale | null {
    const db = getDb();
    const row = db.prepare(`${SALE_SELECT} WHERE s.id = ?`).get(id) as SaleRow | undefined;
    return row ? attachItems([row])[0] : null;
  },

  create(employeeId: number, data: CreateSaleDTO): Sale {
    if (!data || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("La venta debe incluir al menos una licencia");
    }

    // Agrupa líneas repetidas de la misma licencia
    const quantities = new Map<number, number>();
    for (const item of data.items) {
      if (!Number.isInteger(item?.license_id) || !Number.isInteger(item?.quantity) || item.quantity <= 0) {
        throw new Error("Cada línea debe tener un license_id y una cantidad entera mayor que 0");
      }
      quantities.set(item.license_id, (quantities.get(item.license_id) ?? 0) + item.quantity);
    }

    const db = getDb();
    const findLicense = db.prepare("SELECT * FROM digital_licenses WHERE id = ?");

    const lines = [...quantities].map(([licenseId, quantity]) => {
      if (quantity > MAX_QUANTITY) {
        throw new Error(`La cantidad máxima por licencia es ${MAX_QUANTITY}`);
      }

      const license = findLicense.get(licenseId) as DigitalLicense | undefined;
      if (!license) {
        throw new Error(`Licencia ${licenseId} no encontrada`);
      }
      if (license.status !== "active") {
        throw new Error(`La licencia "${license.name}" no está activa y no se puede vender`);
      }

      const unitPrice = Number(license.price);
      return {
        license_id: license.id,
        license_name: license.name,
        unit_price: unitPrice,
        quantity,
        subtotal: roundMoney(unitPrice * quantity),
      };
    });

    const total = roundMoney(lines.reduce((sum, line) => sum + line.subtotal, 0));

    const insertSale = db.prepare("INSERT INTO sales (employee_id, total) VALUES (?, ?)");
    const insertItem = db.prepare(`
      INSERT INTO sale_items (sale_id, license_id, license_name, unit_price, quantity, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    let saleId: number;
    db.exec("BEGIN");
    try {
      saleId = Number(insertSale.run(employeeId, total).lastInsertRowid);
      for (const line of lines) {
        insertItem.run(saleId, line.license_id, line.license_name, line.unit_price, line.quantity, line.subtotal);
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    const created = this.getById(saleId);
    if (!created) {
      throw new Error("No se pudo obtener la venta registrada");
    }

    return created;
  },
};
