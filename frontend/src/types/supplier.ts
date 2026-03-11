// Tipos de Fornecedor

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  cpf?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export interface CreateSupplierRequest {
  name: string;
  cnpj?: string;
  cpf?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
}
