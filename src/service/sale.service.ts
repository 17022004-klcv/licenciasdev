import { getDb, withTransaction } from "@/lib/db";
import { expirationModifier } from "@/lib/license-key";
import {
  CreateSaleDTO,
  DigitalLicense,
  Sale,
  SaleItem,
  SaleOrigin,
  SoldKey,
  WebPurchaseDTO,
  WebPurchaseResult,
} from "@/src/type";

const MAX_QUANTITY = 1000;

const roundMoney = (value: number) => Math.round(value * 100) / 100;

// Nombre de usuario: 3-30 caracteres, letras (con acentos), números, punto, guion y guion bajo
const USERNAME_PATTERN = /^[\p{L}\p{N}._-]{3,30}$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

type SaleRow = Omit<Sale, "items">;
type SaleItemRow = Omit<SaleItem, "keys">;

const SALE_SELECT = `
  SELECT s.id, s.channel, s.employee_id, s.customer_name, s.customer_email, s.total, s.created_at,
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
    .all(...rows.map((row) => row.id)) as unknown as SaleItemRow[];

  const keys =
    items.length === 0
      ? []
      : (db
          .prepare(`
            SELECT sale_item_id, license_key, expires_at FROM license_keys
            WHERE sale_item_id IN (${items.map(() => "?").join(", ")})
            ORDER BY id
          `)
          .all(...items.map((item) => item.id)) as unknown as (SoldKey & { sale_item_id: number })[]);

  return rows.map((row) => ({
    ...row,
    total: Number(row.total),
    items: items
      .filter((item) => item.sale_id === row.id)
      .map((item) => ({
        ...item,
        keys: keys
          .filter((key) => key.sale_item_id === item.id)
          .map(({ license_key, expires_at }) => ({ license_key, expires_at })),
      })),
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

  create(data: CreateSaleDTO, origin: SaleOrigin): Sale {
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

    // Todo ocurre en una transacción con bloqueo de escritura: el stock que se comprueba
    // es el mismo que se descuenta, aunque haya otra venta en curso
    const saleId = withTransaction((db) => {
      const findLicense = db.prepare("SELECT * FROM digital_licenses WHERE id = ?");
      const takeKeys = db.prepare(`
        SELECT id FROM license_keys
        WHERE license_id = ? AND status = 'available'
        ORDER BY id
        LIMIT ?
      `);

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

        const keyIds = (takeKeys.all(licenseId, quantity) as { id: number }[]).map((key) => key.id);
        if (keyIds.length < quantity) {
          throw new Error(
            keyIds.length === 0
              ? `La licencia "${license.name}" está agotada`
              : `Stock insuficiente para "${license.name}": quedan ${keyIds.length}`
          );
        }

        const unitPrice = Number(license.price);
        return {
          license_id: license.id,
          license_name: license.name,
          license_type: license.license_type,
          unit_price: unitPrice,
          quantity,
          subtotal: roundMoney(unitPrice * quantity),
          keyIds,
        };
      });

      const total = roundMoney(lines.reduce((sum, line) => sum + line.subtotal, 0));

      const insertItem = db.prepare(`
        INSERT INTO sale_items (sale_id, license_id, license_name, unit_price, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      // La vigencia empieza el día de la venta; date(..., NULL) devuelve NULL (no vence)
      const sellKey = db.prepare(`
        UPDATE license_keys
        SET status = 'sold', sale_item_id = ?, sold_at = CURRENT_TIMESTAMP,
            expires_at = date('now', ?)
        WHERE id = ? AND status = 'available'
      `);

      const insertSale = db.prepare(`
        INSERT INTO sales (channel, employee_id, customer_name, customer_email, total)
        VALUES (?, ?, ?, ?, ?)
      `);
      const id = Number(
        (origin.channel === "pos"
          ? insertSale.run("pos", origin.employeeId, null, null, total)
          : insertSale.run("web", null, origin.customerName, origin.customerEmail, total)
        ).lastInsertRowid
      );

      for (const line of lines) {
        const itemId = Number(
          insertItem.run(id, line.license_id, line.license_name, line.unit_price, line.quantity, line.subtotal)
            .lastInsertRowid
        );
        const modifier = expirationModifier(line.license_type);
        for (const keyId of line.keyIds) {
          sellKey.run(itemId, modifier, keyId);
        }
      }

      return id;
    });

    const created = this.getById(saleId);
    if (!created) {
      throw new Error("No se pudo obtener la venta registrada");
    }

    return created;
  },

  /**
   * Compra de un cliente desde la tienda web: una unidad, sin empleado. Valida los datos
   * del comprador y reutiliza create() para el stock, el precio y la asignación de clave.
   */
  createWebPurchase(input: Partial<WebPurchaseDTO> | null): WebPurchaseResult {
    const customerName = typeof input?.customer_name === "string" ? input.customer_name.trim() : "";
    const customerEmail =
      typeof input?.customer_email === "string" ? input.customer_email.trim().toLowerCase() : "";

    if (!USERNAME_PATTERN.test(customerName)) {
      throw new Error(
        "El nombre de usuario debe tener entre 3 y 30 caracteres: letras, números, punto, guion o guion bajo"
      );
    }
    if (customerEmail.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(customerEmail)) {
      throw new Error("Ingresa un correo electrónico válido");
    }

    const licenseId = Number(input?.license_id);
    const sale = this.create(
      { items: [{ license_id: licenseId, quantity: 1 }] },
      { channel: "web", customerName, customerEmail }
    );
    const [item] = sale.items;

    return {
      sale_id: sale.id,
      license_name: item.license_name,
      total: sale.total,
      customer_name: customerName,
      customer_email: customerEmail,
      keys: item.keys,
    };
  },
};
