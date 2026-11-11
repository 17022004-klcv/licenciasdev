import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import { runMigrations } from "./migrations";

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  // En producción (Render) se debe montar un disco persistente y apuntar
  // DATABASE_PATH a una ruta dentro de ese disco, porque el filesystem
  // del contenedor es efímero y se borra en cada despliegue.
  const configuredPath = process.env.DATABASE_PATH;
  const dbPath = configuredPath
    ? path.resolve(configuredPath)
    : path.resolve(process.cwd(), "licencias.db");

  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = new DatabaseSync(dbPath);

  // Enable foreign keys and WAL mode. busy_timeout evita errores "database is locked"
  // cuando dos procesos del servidor arrancan a la vez y uno está migrando.
  dbInstance.exec("PRAGMA busy_timeout = 5000;");
  dbInstance.exec("PRAGMA foreign_keys = ON;");
  dbInstance.exec("PRAGMA journal_mode = WAL;");

  runMigrations(dbInstance);

  // --- AUTO-SEED: Verificar e insertar datos iniciales si está vacía ---
  // Se usan los mismos usuarios que prisma/seed.ts, con hashes bcrypt reales
  // para que el login funcione en instalaciones nuevas (p. ej. Render).
  try {
    const row = dbInstance.prepare("SELECT COUNT(*) as count FROM employees").get() as { count: number };

    if (row.count === 0) {
      console.log("⚠️ Base de datos vacía detectada. Insertando usuarios iniciales...");

      const adminPasswordHash = bcrypt.hashSync("Admin123*", 10);
      const employeePasswordHash = bcrypt.hashSync("User123*", 10);

      const insertEmployee = dbInstance.prepare(`
        INSERT INTO employees (first_name, last_name, email, password_hash, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      insertEmployee.run("Carlos", "Hernandez", "admin@empresa.com", adminPasswordHash, "administrator", 1);
      insertEmployee.run("Sofia", "Gomez", "sofia.gomez@empresa.com", employeePasswordHash, "employee", 1);

      console.log("✅ Usuarios iniciales creados exitosamente.");
    }
  } catch (error) {
    console.error("Error al ejecutar el auto-seed en la base de datos:", error);
  }

  return dbInstance;
}
