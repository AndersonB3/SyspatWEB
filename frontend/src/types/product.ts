// Tipos de Produto / Patrimônio

import type { Supplier } from './supplier';

export interface Product {
  id: string;
  supplier_id: string;
  name: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  patrimony_code?: string;
  category?: string;
  unit_value?: number;
  quantity: number;
  total_value?: number;
  invoice_number?: string;
  acquisition_date?: string;
  warranty_expiry?: string;
  return_date?: string;
  notes?: string;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  suppliers?: Supplier;
}

export type ProductStatus = 'ATIVO' | 'DEVOLVIDO' | 'MANUTENCAO' | 'INATIVO';

export interface CreateProductRequest {
  supplier_id: string;
  name: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  patrimony_code?: string;
  category?: string;
  unit_value?: number;
  quantity?: number;
  total_value?: number;
  invoice_number?: string;
  acquisition_date?: string;
  warranty_expiry?: string;
  return_date?: string;
  notes?: string;
  status?: ProductStatus;
}

export interface ProductDocument {
  id: string;
  product_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  created_at: string;
}

export interface MaintenanceLog {
  id: string;
  product_id: string;
  type: 'SAIDA' | 'RETORNO';
  date: string;
  description?: string;
  technician?: string;
  created_at: string;
}
