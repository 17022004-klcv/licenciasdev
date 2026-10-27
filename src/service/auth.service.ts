import { getDb } from "@/lib/db";
import {
  Employee,
  SafeEmployee,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  AuthResponse,
  JWTPayload,
} from "@/src/type";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "licencias_jwt_super_secret_key_2026";
const JWT_EXPIRES_IN = "24h";

function sanitizeEmployee(emp: Employee): SafeEmployee {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safe } = emp;
  return {
    ...safe,
    is_active: Boolean(safe.is_active),
  };
}

export const authService = {
  async authenticate(email: string, password: string):Promise<AuthResponse> {
    if (!email || !password) {
      throw new Error("El correo y la contraseña son obligatorios");
    }

    const db = getDb();
    const query = db.prepare("SELECT * FROM employees WHERE email = ? COLLATE NOCASE");
    const employee = query.get(email.trim()) as Employee | undefined;

    if (!employee) {
      throw new Error("Credenciales inválidas");
    }

    if (!employee.is_active) {
      throw new Error("La cuenta del empleado se encuentra inactiva");
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password_hash);
    if (!isPasswordValid) {
      throw new Error("Credenciales inválidas");
    }

    const payload: JWTPayload = {
      id: employee.id,
      email: employee.email,
      role: employee.role,
      first_name: employee.first_name,
      last_name: employee.last_name,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return {
      token,
      employee: sanitizeEmployee(employee),
    };
  },

  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      throw new Error("Token no válido o expirado");
    }
  },
};

export const employeeService = {
  getAll(): SafeEmployee[] {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM employees ORDER BY id DESC").all() as unknown as Employee[];
    return rows.map(sanitizeEmployee);
  },

  getById(id: number): SafeEmployee | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM employees WHERE id = ?").get(id) as Employee | undefined;
    return row ? sanitizeEmployee(row) : null;
  },

  getByEmail(email: string): Employee | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM employees WHERE email = ? COLLATE NOCASE").get(email.trim()) as Employee | undefined;
    return row || null;
  },

  async create(data: CreateEmployeeDTO): Promise<SafeEmployee> {
    const { first_name, last_name, email, password, role = "employee", is_active = true } = data;

    if (!first_name || !last_name || !email || !password) {
      throw new Error("Todos los campos obligatorios deben ser completados");
    }

    const existing = this.getByEmail(email);
    if (existing) {
      throw new Error("Ya existe un empleado registrado con este correo electrónico");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const db = getDb();

    const insert = db.prepare(`
      INSERT INTO employees (first_name, last_name, email, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      first_name.trim(),
      last_name.trim(),
      email.trim().toLowerCase(),
      passwordHash,
      role,
      is_active ? 1 : 0
    );

    const newId = Number(result.lastInsertRowid);
    const created = this.getById(newId);
    if (!created) {
      throw new Error("No se pudo obtener el empleado recién creado");
    }

    return created;
  },

  async update(id: number, data: UpdateEmployeeDTO): Promise<SafeEmployee> {
    const current = this.getById(id);
    if (!current) {
      throw new Error("Empleado no encontrado");
    }

    const db = getDb();

    if (data.email && data.email.toLowerCase() !== current.email.toLowerCase()) {
      const existing = this.getByEmail(data.email);
      if (existing) {
        throw new Error("El correo electrónico ya está en uso por otro empleado");
      }
    }

    let passwordHash: string | undefined;
    if (data.password) {
      passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (data.first_name !== undefined) {
      updates.push("first_name = ?");
      params.push(data.first_name.trim());
    }
    if (data.last_name !== undefined) {
      updates.push("last_name = ?");
      params.push(data.last_name.trim());
    }
    if (data.email !== undefined) {
      updates.push("email = ?");
      params.push(data.email.trim().toLowerCase());
    }
    if (passwordHash !== undefined) {
      updates.push("password_hash = ?");
      params.push(passwordHash);
    }
    if (data.role !== undefined) {
      updates.push("role = ?");
      params.push(data.role);
    }
    if (data.is_active !== undefined) {
      updates.push("is_active = ?");
      params.push(data.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return current;
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);

    const updateStmt = db.prepare(`
      UPDATE employees
      SET ${updates.join(", ")}
      WHERE id = ?
    `);

    // @ts-expect-error dynamic params for DatabaseSync run
    updateStmt.run(...params);

    const updated = this.getById(id);
    if (!updated) {
      throw new Error("Error al obtener empleado tras actualización");
    }

    return updated;
  },

  delete(id: number): boolean {
    const db = getDb();
    const result = db.prepare("DELETE FROM employees WHERE id = ?").run(id);
    return Number(result.changes) > 0;
  },
};
