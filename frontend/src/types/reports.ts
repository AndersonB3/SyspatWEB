// Tipos de Relatórios

export interface DashboardData {
  totalProducts: number;
  totalSuppliers: number;
  totalUsers: number;
  productsInMaintenance: number;
  activeProducts: number;
  returnedProducts: number;
  openTickets: number;
  totalValue: number;
  totalMonthlyCost: number;
}

export interface ChartData {
  pieChart: { name: string; value: number }[];
  barChart: { name: string; quantidade: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
