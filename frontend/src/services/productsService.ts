// Serviço de Produtos

import { api } from './api';
import { Product, CreateProductRequest, ProductDocument, MaintenanceLog } from '@/types/product';
import { PaginatedResponse } from '@/types/reports';

export const productsService = {
  async list(
    page = 1, limit = 10, search?: string,
    supplierId?: string, status?: string
  ): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (supplierId) params.set('supplier_id', supplierId);
    if (status) params.set('status', status);
    return api.get(`/products?${params}`);
  },

  async getById(id: string): Promise<Product> {
    return api.get(`/products/${id}`);
  },

  async create(data: CreateProductRequest): Promise<Product> {
    return api.post('/products', data);
  },

  async update(id: string, data: Partial<CreateProductRequest>): Promise<Product> {
    return api.put(`/products/${id}`, data);
  },

  async remove(id: string): Promise<{ message: string }> {
    return api.delete(`/products/${id}`);
  },

  // Documentos
  async getDocuments(productId: string): Promise<ProductDocument[]> {
    return api.get(`/products/${productId}/documents`);
  },

  async addDocument(productId: string, data: { name: string; file_url: string; file_type?: string; file_size?: number }): Promise<ProductDocument> {
    return api.post(`/products/${productId}/documents`, data);
  },

  async removeDocument(documentId: string): Promise<{ message: string }> {
    return api.delete(`/products/documents/${documentId}`);
  },

  // Manutenção
  async getMaintenanceLogs(productId: string): Promise<MaintenanceLog[]> {
    return api.get(`/products/${productId}/maintenance`);
  },

  async addMaintenanceLog(productId: string, data: { type: string; date?: string; description?: string; technician?: string }): Promise<MaintenanceLog> {
    return api.post(`/products/${productId}/maintenance`, data);
  },
};
