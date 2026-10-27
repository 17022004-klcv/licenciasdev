import { EmployeeRole, SafeEmployee } from "./employee.type";

export interface JWTPayload {
  id: number;
  email: string;
  role: EmployeeRole;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  token: string;
  employee: SafeEmployee;
}
