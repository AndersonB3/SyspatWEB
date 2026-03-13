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
  monthly_cost?: number;
  quantity: number;
  total_value?: number;
  invoice_number?: string;
  request_date?: string;
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
  monthly_cost?: number;
  quantity?: number;
  total_value?: number;
  invoice_number?: string;
  request_date?: string;
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
  description?: string;
  doc_type: string;
  file_path: string;
  file_url?: string;
  file_type?: string;
  file_size?: number;
  created_by?: string;
  created_at: string;
}

export type DocType = 'NOTA_FISCAL' | 'CONTRATO' | 'PROTOCOLO_ENTREGA' | 'MANUAL' | 'GARANTIA' | 'OUTRO';

export const DOC_TYPE_LABELS: Record<string, string> = {
  NOTA_FISCAL:       'Nota Fiscal',
  CONTRATO:          'Contrato',
  PROTOCOLO_ENTREGA: 'Protocolo de Entrega',
  MANUAL:            'Manual',
  GARANTIA:          'Garantia',
  OUTRO:             'Outro',
};

export interface MaintenanceLog {
  id: string;
  product_id: string;
  type: 'SAIDA' | 'RETORNO';
  date: string;
  description?: string;
  technician?: string;
  created_at: string;
}

export type MaintenanceActionTaken =
  | 'MANUTENCAO_INTERNA'
  | 'RECOLHIMENTO'
  | 'SUBSTITUICAO'
  | 'AGUARDANDO';

export type MaintenanceContactMethod =
  | 'TELEFONE'
  | 'EMAIL'
  | 'PRESENCIAL'
  | 'OUTRO';

export const ACTION_TAKEN_LABELS: Record<string, string> = {
  MANUTENCAO_INTERNA: 'Manutenção na Unidade',
  RECOLHIMENTO:       'Recolhimento para Laboratório',
  SUBSTITUICAO:       'Substituição do Equipamento',
  AGUARDANDO:         'Aguardando Resposta',
};

export const CONTACT_METHOD_LABELS: Record<string, string> = {
  TELEFONE:   'Telefone',
  EMAIL:      'E-mail',
  PRESENCIAL: 'Presencial',
  OUTRO:      'Outro',
};

export interface MaintenanceRecord {
  id: string;
  product_id: string;
  // Problema
  problem_date: string;
  problem_description: string;
  // Contato
  contact_date?: string;
  contact_method?: string;
  contact_description?: string;
  // Devolutiva
  supplier_response?: string;
  action_taken?: string;
  // Resolução
  resolution_date?: string;
  resolution_description?: string;
  resolved: boolean;
  // Meta
  registered_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMaintenanceRecordRequest {
  problem_date: string;
  problem_description: string;
  contact_date?: string;
  contact_method?: string;
  contact_description?: string;
  supplier_response?: string;
  action_taken?: string;
  resolution_date?: string;
  resolution_description?: string;
  resolved?: boolean;
}
