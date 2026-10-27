export type EmployeeRole = "administrator" | "employee";

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role: EmployeeRole;
  is_active: number | boolean;
  created_at: string;
  updated_at: string;
}

export type SafeEmployee = Omit<Employee, "password_hash">;

export interface CreateEmployeeDTO {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role?: EmployeeRole;
  is_active?: boolean;
}

export interface UpdateEmployeeDTO {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  role?: EmployeeRole;
  is_active?: boolean;
}
