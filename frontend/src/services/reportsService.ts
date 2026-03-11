// Serviço de Relatórios

import { api } from './api';
import { DashboardData, ChartData } from '@/types/reports';

export const reportsService = {
  async getDashboard(): Promise<DashboardData> {
    return api.get('/reports/dashboard');
  },

  async getProductsReport(filters?: Record<string, string>): Promise<unknown> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    }
    return api.get(`/reports/products?${params}`);
  },

  async getSuppliersReport(filters?: Record<string, string>): Promise<unknown> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    }
    return api.get(`/reports/suppliers?${params}`);
  },

  async getMaintenanceReport(filters?: Record<string, string>): Promise<unknown> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    }
    return api.get(`/reports/maintenance?${params}`);
  },

  async getUsersReport(filters?: Record<string, string>): Promise<unknown> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    }
    return api.get(`/reports/users?${params}`);
  },

  async getChartData(): Promise<ChartData> {
    return api.get('/reports/charts');
  },
};
