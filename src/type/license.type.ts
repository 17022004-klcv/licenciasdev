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
  license_key: string | null;
  license_type: LicenseType;
  image: string | null;
  price: number;
  status: LicenseStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Datos de una licencia que se pueden mostrar a clientes sin sesión (sin license_key)
export type PublicLicense = Pick<
  DigitalLicense,
  "id" | "name" | "provider" | "license_type" | "image" | "price" | "notes"
>;

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
