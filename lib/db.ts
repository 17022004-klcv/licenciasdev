import { DatabaseSync } from "node:sqlite";
import path from "path";

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = path.resolve(process.cwd(), "licencias.db");
  dbInstance = new DatabaseSync(dbPath);

  // Enable foreign keys and WAL mode
  dbInstance.exec("PRAGMA foreign_keys = ON;");
  dbInstance.exec("PRAGMA journal_mode = WAL;");

  // Create tables according to database.md specifications
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('administrator', 'employee')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS digital_licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      license_key TEXT,
      license_type TEXT NOT NULL CHECK (license_type IN ('perpetual', 'subscription', 'temporary')),
      purchase_date DATE,
      image TEXT,
      price REAL NOT NULL CHECK (price >= 0),
      expiration_date DATE,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'revoked')),
      notes TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      total REAL NOT NULL CHECK (total >= 0),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- license_name y unit_price se copian al momento de la venta para que el historial
    -- no cambie si la licencia se edita o se elimina después
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      license_id INTEGER REFERENCES digital_licenses(id) ON DELETE SET NULL,
      license_name TEXT NOT NULL,
      unit_price REAL NOT NULL CHECK (unit_price >= 0),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      subtotal REAL NOT NULL CHECK (subtotal >= 0)
    );

    CREATE INDEX IF NOT EXISTS idx_sales_employee_id ON sales(employee_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
  `);

  return dbInstance;
}
