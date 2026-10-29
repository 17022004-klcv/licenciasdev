export type LicenseType = "perpetual" | "subscription" | "temporary";
export type LicenseStatus = "active" | "expired" | "suspended" | "revoked";

export interface DigitalLicense {
  id: number;
  name: string;
  provider: string;
  license_key: string | null;
  license_type: LicenseType;
  purchase_date: string | null;
  image: string | null;
  price: number;
  expiration_date: string | null;
  status: LicenseStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Datos de una licencia que se pueden mostrar a clientes sin sesión (sin license_key)
export type PublicLicense = Pick<
  DigitalLicense,
  "id" | "name" | "provider" | "license_type" | "image" | "price" | "expiration_date" | "notes"
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
  license_key?: string | null;
  license_type: LicenseType;
  purchase_date?: string | null;
  image?: string | null;
  price: number;
  expiration_date?: string | null;
  status?: LicenseStatus;
  notes?: string | null;
}

export interface UpdateLicenseDTO {
  name?: string;
  provider?: string;
  license_key?: string | null;
  license_type?: LicenseType;
  purchase_date?: string | null;
  image?: string | null;
  price?: number;
  expiration_date?: string | null;
  status?: LicenseStatus;
  notes?: string | null;
}
