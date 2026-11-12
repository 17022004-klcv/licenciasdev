export interface SaleItem {
  id: number;
  sale_id: number;
  license_id: number | null;
  license_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  // Una clave por unidad vendida; expires_at null = no vence
  keys: SoldKey[];
}

export interface SoldKey {
  license_key: string;
  expires_at: string | null;
}

// pos: venta en mostrador hecha por un empleado; web: compra de un cliente en la landing
export type SaleChannel = "pos" | "web";

export interface Sale {
  id: number;
  channel: SaleChannel;
  employee_id: number | null;
  employee_name: string | null;
  // Solo en ventas web
  customer_name: string | null;
  customer_email: string | null;
  total: number;
  created_at: string;
  items: SaleItem[];
}

export interface CreateSaleItemDTO {
  license_id: number;
  quantity: number;
}

// El precio no se recibe del cliente: se toma de la base de datos al registrar la venta
export interface CreateSaleDTO {
  items: CreateSaleItemDTO[];
}

// Quién hace la venta: un empleado desde el POS o un cliente desde la tienda web
export type SaleOrigin =
  | { channel: "pos"; employeeId: number }
  | { channel: "web"; customerName: string; customerEmail: string };

// Compra pública desde la landing: una unidad de una licencia
export interface WebPurchaseDTO {
  license_id: number;
  customer_name: string;
  customer_email: string;
}

export interface WebPurchaseResult {
  sale_id: number;
  license_name: string;
  total: number;
  customer_name: string;
  customer_email: string;
  keys: SoldKey[];
}
