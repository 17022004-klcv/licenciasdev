export interface SaleItem {
  id: number;
  sale_id: number;
  license_id: number | null;
  license_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  employee_id: number | null;
  employee_name: string | null;
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
