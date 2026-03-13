// Serviço de Produtos

import { api } from './api';
import { Product, CreateProductRequest, ProductDocument, MaintenanceLog, MaintenanceRecord, CreateMaintenanceRecordRequest } from '@/types/product';
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

  async uploadDocument(
    productId: string,
    file: File,
    name: string,
    docType: string,
    description?: string,
  ): Promise<ProductDocument> {
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    form.append('doc_type', docType);
    if (description) form.append('description', description);
    return api.upload(`/products/${productId}/documents`, form);
  },

  async getDocumentDownloadUrl(documentId: string): Promise<{ url: string; name: string; file_type: string }> {
    return api.get(`/products/documents/${documentId}/download`);
  },

  async removeDocument(documentId: string): Promise<{ message: string }> {
    return api.delete(`/products/documents/${documentId}`);
  },

  // Manutenção — registros detalhados
  async getMaintenanceRecords(productId: string): Promise<MaintenanceRecord[]> {
    return api.get(`/products/${productId}/maintenance-records`);
  },

  async createMaintenanceRecord(productId: string, data: CreateMaintenanceRecordRequest): Promise<MaintenanceRecord> {
    return api.post(`/products/${productId}/maintenance-records`, data);
  },

  async updateMaintenanceRecord(recordId: string, data: Partial<CreateMaintenanceRecordRequest> & { resolved?: boolean; resolution_date?: string; resolution_description?: string }): Promise<MaintenanceRecord> {
    return api.put(`/products/maintenance-records/${recordId}`, data);
  },

  async deleteMaintenanceRecord(recordId: string): Promise<{ message: string }> {
    return api.delete(`/products/maintenance-records/${recordId}`);
  },

  // Manutenção
  async getMaintenanceLogs(productId: string): Promise<MaintenanceLog[]> {
    return api.get(`/products/${productId}/maintenance`);
  },

  async addMaintenanceLog(productId: string, data: { type: string; date?: string; description?: string; technician?: string }): Promise<MaintenanceLog> {
    return api.post(`/products/${productId}/maintenance`, data);
  },
};
