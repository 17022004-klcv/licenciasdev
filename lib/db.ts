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

    CREATE UNIQUE INDEX IF NOT EXISTS idx_digital_licenses_license_key
      ON digital_licenses(license_key)
      WHERE license_key IS NOT NULL;
  `);

  return dbInstance;
}
