import { getDb } from "../lib/db";
import bcrypt from "bcrypt";

function seed() {
  console.log("🌱 Inicializando base de datos SQLite con datos de prueba...");
  const db = getDb();

  // Clear existing data for fresh test run
  db.exec(`
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
      license_type: "subscription",
      purchase_date: "2026-01-15",
      image: "https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.png",
      price: 289.0,
      expiration_date: "2027-01-15",
      status: "active",
      notes: "Licencia de desarrollo corporativa anual",
    },
    {
      name: "Microsoft 365 Business Standard",
      provider: "Microsoft Corporation",
      license_key: "MSFT-O365-8831-ABCD",
      license_type: "subscription",
      purchase_date: "2025-11-01",
      image: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Microsoft_Office_logo_%282019%E2%80%93present%29.svg",
      price: 150.0,
      expiration_date: "2026-11-01",
      status: "active",
      notes: "Paquete ofimática asignado a equipo de administración",
    },
    {
      name: "Adobe Creative Cloud Pro",
      provider: "Adobe Inc.",
      license_key: "ADOBE-CC-9921-PQRS",
      license_type: "subscription",
      purchase_date: "2025-05-10",
      image: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Creative_Cloud.svg",
      price: 599.88,
      expiration_date: "2026-05-10",
      status: "active",
      notes: "Licencia de diseño gráfico y multimedios",
    },
    {
      name: "WinRAR Enterprise Perpetual",
      provider: "win.rar GmbH",
      license_key: "RAR-PERPETUAL-5521",
      license_type: "perpetual",
      purchase_date: "2024-03-20",
      image: null,
      price: 49.99,
      expiration_date: null,
      status: "active",
      notes: "Licencia permanente sin fecha de vencimiento",
    },
    {
      name: "Tableau Desktop Trial/Temporary",
      provider: "Salesforce / Tableau",
      license_key: null,
      license_type: "temporary",
      purchase_date: "2026-02-01",
      image: null,
      price: 0.0,
      expiration_date: "2026-03-01",
      status: "expired",
      notes: "Licencia de evaluación temporal vencida",
    },
  ];

  const insertLic = db.prepare(`
    INSERT INTO digital_licenses (name, provider, license_key, license_type, purchase_date, image, price, expiration_date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const lic of licenses) {
    insertLic.run(
      lic.name,
      lic.provider,
      lic.license_key,
      lic.license_type,
      lic.purchase_date,
      lic.image,
      lic.price,
      lic.expiration_date,
      lic.status,
      lic.notes
    );
  }

  console.log("✅ Base de datos inicializada y poblada con éxito.");
}

seed();
