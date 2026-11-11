// El tipo indica la duración de la licencia; la expiración se calcula al venderla
export type LicenseType = "6_months" | "1_year" | "indefinite";
export type LicenseStatus = "active" | "expired" | "suspended" | "revoked";

export const LICENSE_TYPES: readonly LicenseType[] = ["6_months", "1_year", "indefinite"];

export const LICENSE_TYPE_LABELS: Record<LicenseType, string> = {
  "6_months": "6 meses",
  "1_year": "1 año",
  indefinite: "Indefinida",
};

export interface DigitalLicense {
  id: number;
  name: string;
  provider: string;
  license_type: LicenseType;
  image: string | null;
  price: number;
  status: LicenseStatus;
  notes: string | null;
  // Unidades disponibles para vender (claves con status "available")
  stock: number;
  created_at: string;
  updated_at: string;
}

// Datos de una licencia que se pueden mostrar a clientes sin sesión (nunca incluye claves)
export type PublicLicense = Pick<
  DigitalLicense,
  "id" | "name" | "provider" | "license_type" | "image" | "price" | "notes" | "stock"
>;

export type LicenseKeyStatus = "available" | "sold";

// Una unidad de inventario: cada clave se vende una sola vez
export interface LicenseKey {
  id: number;
  license_id: number | null;
  license_key: string;
  status: LicenseKeyStatus;
  sale_id: number | null;
  sold_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface LicenseFilterParams {
  name?: string;
  provider?: string;
  license_type?: LicenseType;
  status?: LicenseStatus;
  search?: string;
}

export interface CreateLicenseDTO {
  name: string;
  provider: string;
  license_type: LicenseType;
  image?: string | null;
  price: number;
  status?: LicenseStatus;
  notes?: string | null;
  // Unidades (claves) que se generan al crear la licencia
  initial_stock?: number;
}

export interface UpdateLicenseDTO {
  name?: string;
  provider?: string;
  license_type?: LicenseType;
  image?: string | null;
  price?: number;
  status?: LicenseStatus;
  notes?: string | null;
}
