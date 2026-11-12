import { getDb } from "../lib/db";
import { insertGeneratedKeys } from "../lib/license-key";
import bcrypt from "bcrypt";

function seed() {
  console.log("🌱 Inicializando base de datos SQLite con datos de prueba...");
  const db = getDb();

  // Clear existing data for fresh test run
  db.exec(`
    DELETE FROM license_keys;
    DELETE FROM sale_items;
    DELETE FROM sales;
    DELETE FROM digital_licenses;
    DELETE FROM employees;
  `);

  const passwordHash = bcrypt.hashSync("Admin123*", 10);
  const employeeHash = bcrypt.hashSync("User123*", 10);

  // Insert test employees
  const insertEmp = db.prepare(`
    INSERT INTO employees (first_name, last_name, email, password_hash, role, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertEmp.run("Carlos", "Hernandez", "admin@empresa.com", passwordHash, "administrator", 1);
  insertEmp.run("Sofia", "Gomez", "sofia.gomez@empresa.com", employeeHash, "employee", 1);

  // Insert test licenses
  const licenses = [
    {
      name: "JetBrains All Products Pack",
      provider: "JetBrains s.r.o.",
      license_key: "JB-98321-47291-ZX",
      license_type: "1_year",
      image: "https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.png",
      price: 289.0,
      status: "active",
      notes: "Licencia de desarrollo corporativa anual",
    },
    {
      name: "Microsoft 365 Business Standard",
      provider: "Microsoft Corporation",
      license_key: "MSFT-O365-8831-ABCD",
      license_type: "1_year",
      image: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Microsoft_Office_logo_%282019%E2%80%93present%29.svg",
      price: 150.0,
      status: "active",
      notes: "Paquete ofimática asignado a equipo de administración",
    },
    {
      name: "Adobe Creative Cloud Pro",
      provider: "Adobe Inc.",
      license_key: "ADOBE-CC-9921-PQRS",
      license_type: "1_year",
      image: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Creative_Cloud.svg",
      price: 599.88,
      status: "active",
      notes: "Licencia de diseño gráfico y multimedios",
    },
    {
      name: "WinRAR Enterprise Perpetual",
      provider: "win.rar GmbH",
      license_key: "RAR-PERPETUAL-5521",
      license_type: "indefinite",
      image: null,
      price: 49.99,
      status: "active",
      notes: "Licencia permanente sin fecha de vencimiento",
    },
    {
      name: "Tableau Desktop Trial/Temporary",
      provider: "Salesforce / Tableau",
      license_key: null,
      license_type: "6_months",
      image: null,
      price: 0.0,
      status: "expired",
      notes: "Licencia de evaluación temporal vencida",
    },
  ];

  const insertLic = db.prepare(`
    INSERT INTO digital_licenses (name, provider, license_type, image, price, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertKey = db.prepare("INSERT INTO license_keys (license_id, license_key) VALUES (?, ?)");

  // Cada licencia activa queda con 3 unidades: su clave de ejemplo y 2 generadas
  for (const lic of licenses) {
    const { lastInsertRowid } = insertLic.run(
      lic.name,
      lic.provider,
      lic.license_type,
      lic.image,
      lic.price,
      lic.status,
      lic.notes
    );
    const licenseId = Number(lastInsertRowid);

    if (lic.license_key) {
      insertKey.run(licenseId, lic.license_key);
    }
    if (lic.status === "active") {
      insertGeneratedKeys(db, licenseId, lic.license_key ? 2 : 3);
    }
  }

  console.log("✅ Base de datos inicializada y poblada con éxito.");
}

seed();
