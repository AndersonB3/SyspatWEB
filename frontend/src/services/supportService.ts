// Serviço de Suporte

import { api } from './api';
import { SupportTicket, TicketMessage, FAQ } from '@/types/support';
import { PaginatedResponse } from '@/types/reports';

export const supportService = {
  // FAQs
  async getFaqs(): Promise<FAQ[]> {
    return api.get('/support/faqs');
  },

  async createFaq(data: { question: string; answer: string; category?: string }): Promise<FAQ> {
    return api.post('/support/faqs', data);
  },

  async updateFaq(id: string, data: Partial<FAQ>): Promise<FAQ> {
    return api.put(`/support/faqs/${id}`, data);
  },

  async deleteFaq(id: string): Promise<{ message: string }> {
    return api.delete(`/support/faqs/${id}`);
  },

  // Tickets
  async listTickets(page = 1, limit = 10, status?: string): Promise<PaginatedResponse<SupportTicket>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    return api.get(`/support/tickets?${params}`);
  },

  async getTicket(id: string): Promise<SupportTicket> {
    return api.get(`/support/tickets/${id}`);
  },

  async createTicket(data: { subject: string; description: string; priority?: string }): Promise<SupportTicket> {
    return api.post('/support/tickets', data);
  },

  async addMessage(ticketId: string, data: { message: string }): Promise<TicketMessage> {
    return api.post(`/support/tickets/${ticketId}/messages`, data);
  },

  async updateTicketStatus(ticketId: string, status: string): Promise<SupportTicket> {
    return api.patch(`/support/tickets/${ticketId}/status`, { status });
  },
};
