import type { DatabaseSync } from "node:sqlite";

/**
 * Esquema original (versión 0). Solo se ejecuta en bases sin migrar: crea las tablas en
 * instalaciones nuevas y no cambia nada en bases que ya las tienen. Las migraciones de
 * abajo llevan cualquier base, nueva o existente, al esquema actual.
 */
const BASE_SCHEMA = `
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

  CREATE UNIQUE INDEX IF NOT EXISTS idx_digital_licenses_license_key
    ON digital_licenses(license_key)
    WHERE license_key IS NOT NULL;
`;

type Migration = (db: DatabaseSync) => void;

/** Recrea digital_licenses conservando su secuencia AUTOINCREMENT (no reutiliza ids borrados). */
function rebuildLicensesTable(db: DatabaseSync, createSql: string, copySql: string, after = "") {
  const sequence = db
    .prepare("SELECT seq FROM sqlite_sequence WHERE name = 'digital_licenses'")
    .get() as { seq: number } | undefined;

  db.exec(`
    ${createSql}
    ${copySql}
    DROP TABLE digital_licenses;
    ALTER TABLE digital_licenses_new RENAME TO digital_licenses;
    ${after}
  `);

  if (sequence) {
    db.prepare("UPDATE sqlite_sequence SET seq = MAX(seq, ?) WHERE name = 'digital_licenses'").run(
      sequence.seq,
    );
  }
}

// Cada posición del arreglo es una versión: MIGRATIONS[0] lleva la base de la v0 a la v1, etc.
// Nunca se modifica una migración ya publicada; los cambios nuevos van en una migración nueva.
const MIGRATIONS: Migration[] = [
  // v1: los tipos pasan a ser duraciones y se quitan las fechas de compra/expiración del
  // producto (la expiración se calcula al vender). El tipo nuevo se deduce de las fechas
  // que tenía cada licencia; si faltan, del tipo anterior.
  (db) =>
    rebuildLicensesTable(
      db,
      `CREATE TABLE digital_licenses_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        provider TEXT NOT NULL,
        license_key TEXT,
        license_type TEXT NOT NULL CHECK (license_type IN ('6_months', '1_year', 'indefinite')),
        image TEXT,
        price REAL NOT NULL CHECK (price >= 0),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'revoked')),
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `INSERT INTO digital_licenses_new
        (id, name, provider, license_key, license_type, image, price, status, notes, created_at, updated_at)
      SELECT
        id, name, provider, license_key,
        CASE
          WHEN license_type = 'perpetual' OR expiration_date IS NULL THEN 'indefinite'
          WHEN purchase_date IS NULL THEN
            CASE license_type WHEN 'temporary' THEN '6_months' ELSE '1_year' END
          WHEN julianday(expiration_date) - julianday(purchase_date) <= 186 THEN '6_months'
          ELSE '1_year'
        END,
        image, price, status, notes, created_at, updated_at
      FROM digital_licenses;`,
      `CREATE UNIQUE INDEX idx_digital_licenses_license_key
        ON digital_licenses(license_key)
        WHERE license_key IS NOT NULL;`,
    ),
];

export const SCHEMA_VERSION = MIGRATIONS.length;

const getVersion = (db: DatabaseSync) =>
  (db.prepare("PRAGMA user_version").get() as { user_version: number }).user_version;

export function runMigrations(db: DatabaseSync) {
  if (getVersion(db) === 0) {
    db.exec(BASE_SCHEMA);
  }

  while (getVersion(db) < MIGRATIONS.length) {
    // Las reconstrucciones de tablas requieren desactivar las FK (no se puede dentro de
    // una transacción). BEGIN IMMEDIATE bloquea la base para que si dos procesos arrancan
    // a la vez, solo uno migre; el otro vuelve a leer la versión al obtener el bloqueo.
    db.exec("PRAGMA foreign_keys = OFF;");
    db.exec("BEGIN IMMEDIATE");
    try {
      const version = getVersion(db);
      if (version < MIGRATIONS.length) {
        console.log(`🛠️ Migrando base de datos a la versión ${version + 1}...`);
        MIGRATIONS[version](db);

        const violations = db.prepare("PRAGMA foreign_key_check").all();
        if (violations.length > 0) {
          throw new Error(`La migración ${version + 1} rompe claves foráneas: ${JSON.stringify(violations)}`);
        }
        db.exec(`PRAGMA user_version = ${version + 1}`);
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    } finally {
      db.exec("PRAGMA foreign_keys = ON;");
    }
  }
}
