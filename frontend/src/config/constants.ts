// Configurações globais da aplicação

export const APP_CONFIG = {
  name: 'SysWebPat',
  fullName: 'Sistema Web de Patrimônio',
  description: 'Sistema de Gerenciamento de Patrimônio Hospitalar',
  version: '2.0.0',
} as const;

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
} as const;

export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cjeqlwyjsuqshieluaag.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
} as const;

export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  TECHNICIAN: 'TECHNICIAN',
  VIEWER: 'VIEWER',
} as const;

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  TECHNICIAN: 'Técnico',
  VIEWER: 'Visualizador',
};

export const STATUS_LABELS: Record<string, string> = {
  ATIVO: 'Ativo',
  DEVOLVIDO: 'Devolvido',
  MANUTENCAO: 'Em Manutenção',
  INATIVO: 'Inativo',
};

export const STATUS_COLORS: Record<string, string> = {
  ATIVO: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  DEVOLVIDO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  MANUTENCAO: 'bg-red-500/20 text-red-400 border-red-500/30',
  INATIVO: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export const TICKET_STATUS_LABELS: Record<string, string> = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em Andamento',
  FECHADO: 'Fechado',
};

export const TICKET_PRIORITY_LABELS: Record<string, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export const TICKET_STATUS_COLORS: Record<string, string> = {
  ABERTO: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  EM_ANDAMENTO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  FECHADO: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export const PRIORITY_COLORS: Record<string, string> = {
  BAIXA: 'bg-gray-500/20 text-gray-400',
  MEDIA: 'bg-blue-500/20 text-blue-400',
  ALTA: 'bg-amber-500/20 text-amber-400',
  URGENTE: 'bg-red-500/20 text-red-400',
};
