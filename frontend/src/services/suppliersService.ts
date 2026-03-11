// Serviço de Fornecedores

import { api } from './api';
import { Supplier, CreateSupplierRequest } from '@/types/supplier';
import { Product } from '@/types/product';
import { PaginatedResponse } from '@/types/reports';

/** Payload de atualização — inclui is_active para ativar/desativar. */
export type UpdateSupplierPayload = Partial<CreateSupplierRequest> & {
  is_active?: boolean;
};

export const suppliersService = {
  async list(page = 1, limit = 10, search?: string): Promise<PaginatedResponse<Supplier>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    return api.get(`/suppliers?${params}`);
  },

  async getById(id: string): Promise<Supplier> {
    return api.get(`/suppliers/${id}`);
  },

  async create(data: CreateSupplierRequest): Promise<Supplier> {
    return api.post('/suppliers', data);
  },

  async update(id: string, data: UpdateSupplierPayload): Promise<Supplier> {
    return api.put(`/suppliers/${id}`, data);
  },

  async deactivate(id: string): Promise<{ message: string }> {
    return api.delete(`/suppliers/${id}`);
  },

  async hardDelete(id: string): Promise<{ message: string }> {
    return api.delete(`/suppliers/${id}/hard`);
  },

  async getProducts(id: string): Promise<Product[]> {
    return api.get(`/suppliers/${id}/products`);
  },
};
