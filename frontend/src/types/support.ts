// Tipos de Suporte

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
  messages?: TicketMessage[];
}

export type TicketStatus = 'ABERTO' | 'EM_ANDAMENTO' | 'FECHADO';
export type TicketPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_support_reply: boolean;
  created_at: string;
  users?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}
