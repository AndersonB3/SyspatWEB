'use client';

import { useEffect, useState } from 'react';
import {
  HelpCircle, Plus, MessageSquare, Send, ChevronDown,
  Tag, Clock,
} from 'lucide-react';
import { supportService } from '@/services/supportService';
import { FAQ, SupportTicket, TicketMessage } from '@/types/support';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import {
  TICKET_STATUS_LABELS, TICKET_STATUS_COLORS,
  TICKET_PRIORITY_LABELS, PRIORITY_COLORS,
} from '@/config/constants';

type Tab = 'faq' | 'tickets';

export default function SuportePage() {
  const { user } = useAuthStore();
  const isSupport = user && ['ADMIN', 'MANAGER'].includes(user.role);

  const [tab, setTab] = useState<Tab>('faq');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // FAQ
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Ticket detail
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketModal, setTicketModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  // New ticket modal
  const [newTicketModal, setNewTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', priority: 'MEDIA' });

  useEffect(() => {
    if (tab === 'faq') loadFaqs();
    else loadTickets();
  }, [tab, page]);

  const loadFaqs = async () => {
    setLoading(true);
    try {
      const data = await supportService.getFaqs();
      setFaqs(data);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await supportService.listTickets(page, 10);
      setTickets(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openTicketDetail = async (ticket: SupportTicket) => {
    try {
      const detail = await supportService.getTicket(ticket.id);
      setSelectedTicket(detail);
      setTicketModal(true);
      setNewMessage('');
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    try {
      await supportService.addMessage(selectedTicket.id, { message: newMessage });
      const updated = await supportService.getTicket(selectedTicket.id);
      setSelectedTicket(updated);
      setNewMessage('');
      showToast('Mensagem enviada!', 'success');
      loadTickets();
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  const createTicket = async () => {
    if (!ticketForm.subject || !ticketForm.description) {
      showToast('Preencha todos os campos', 'warning');
      return;
    }
    try {
      await supportService.createTicket(ticketForm);
      showToast('Ticket criado!', 'success');
      setNewTicketModal(false);
      setTicketForm({ subject: '', description: '', priority: 'MEDIA' });
      loadTickets();
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  const closeTicket = async () => {
    if (!selectedTicket) return;
    try {
      await supportService.updateTicketStatus(selectedTicket.id, 'FECHADO');
      showToast('Ticket fechado!', 'success');
      setTicketModal(false);
      loadTickets();
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <HelpCircle size={24} className="text-pink-500" />
            Suporte
          </h1>
          <p className="text-sm text-slate-500 mt-1">FAQs e tickets de suporte</p>
        </div>
        {tab === 'tickets' && (
          <button
            onClick={() => setNewTicketModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-pink-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-pink-500/20 hover:from-pink-500 hover:to-pink-400 transition-all"
          >
            <Plus size={16} />
            Novo Ticket
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl w-fit">
        <button
          onClick={() => setTab('faq')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'faq' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <HelpCircle size={14} className="inline mr-1.5 -mt-0.5" />
          FAQs
        </button>
        <button
          onClick={() => setTab('tickets')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'tickets' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare size={14} className="inline mr-1.5 -mt-0.5" />
          Tickets
        </button>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-8 text-center text-slate-500">Carregando...</div>
      ) : tab === 'faq' ? (
        /* FAQs */
        <div className="space-y-3">
          {faqs.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-slate-600 text-sm">
              Nenhuma FAQ disponível
            </div>
          ) : (
            faqs.map((faq) => (
              <div key={faq.id} className="glass rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle size={16} className="text-blue-400 shrink-0" />
                    <span className="text-sm font-medium text-white">{faq.question}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-slate-500 shrink-0 transition-transform duration-300 ${
                      expandedFaq === faq.id ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    expandedFaq === faq.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden min-h-0">
                    <div className="px-4 pb-4 pt-1 pl-11">
                      <div className="text-sm text-slate-400 leading-relaxed space-y-1">
                        {faq.answer
                          .split(/(?=\d+\.\s)/)
                          .filter(Boolean)
                          .map((step, i) => (
                            <p key={i}>{step.trim()}</p>
                          ))}
                      </div>
                      {faq.category && (
                        <div className="mt-2 flex items-center gap-1">
                          <Tag size={12} className="text-slate-600" />
                          <span className="text-xs text-slate-600">{faq.category}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Tickets */
        <>
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-slate-600 text-sm">
                Nenhum ticket encontrado
              </div>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => openTicketDetail(ticket)}
                  className="w-full glass rounded-xl p-4 text-left hover:border-slate-600 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-white">{ticket.subject}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{ticket.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-lg border ${TICKET_STATUS_COLORS[ticket.status] || ''}`}>
                          {TICKET_STATUS_LABELS[ticket.status] || ticket.status}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-lg ${PRIORITY_COLORS[ticket.priority] || ''}`}>
                          {TICKET_PRIORITY_LABELS[ticket.priority] || ticket.priority}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock size={12} />
                        {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      {ticket.users && (
                        <p className="text-xs text-slate-600 mt-1">{ticket.users.name}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* New Ticket Modal */}
      <Modal isOpen={newTicketModal} onClose={() => setNewTicketModal(false)} title="Novo Ticket" size="md">
        <div className="space-y-2">
          <div className="space-y-0.5">
            <label className="text-xs text-slate-400">Assunto *</label>
            <input
              value={ticketForm.subject}
              onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
              placeholder="Descreva brevemente o problema"
              className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/40"
            />
          </div>
          <div className="space-y-0.5">
            <label className="text-xs text-slate-400">Descrição *</label>
            <textarea
              value={ticketForm.description}
              onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
              rows={3}
              placeholder="Descreva detalhadamente o problema..."
              className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/40"
            />
          </div>
          <div className="space-y-0.5">
            <label className="text-xs text-slate-400">Prioridade</label>
            <select
              value={ticketForm.priority}
              onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500/40"
            >
              <option value="BAIXA" className="bg-slate-800">Baixa</option>
              <option value="MEDIA" className="bg-slate-800">Média</option>
              <option value="ALTA" className="bg-slate-800">Alta</option>
              <option value="URGENTE" className="bg-slate-800">Urgente</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-3">
          <button onClick={() => setNewTicketModal(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">Cancelar</button>
          <button onClick={createTicket} className="px-4 py-1.5 bg-pink-600 hover:bg-pink-500 text-white text-xs font-medium rounded-lg">Criar Ticket</button>
        </div>
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal isOpen={ticketModal} onClose={() => setTicketModal(false)} title={selectedTicket?.subject || 'Ticket'} size="lg">
        {selectedTicket && (
          <div className="space-y-3">
            {/* Info */}
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-lg border ${TICKET_STATUS_COLORS[selectedTicket.status] || ''}`}>
                {TICKET_STATUS_LABELS[selectedTicket.status]}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-lg ${PRIORITY_COLORS[selectedTicket.priority] || ''}`}>
                {TICKET_PRIORITY_LABELS[selectedTicket.priority]}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={11} />
                {new Date(selectedTicket.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <p className="text-xs text-slate-400">{selectedTicket.description}</p>

            {/* Messages */}
            <div className="border-t border-slate-700/50 pt-3">
              <h4 className="text-xs font-medium text-white mb-2">Mensagens</h4>
              <div className="space-y-2">
                {(!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
                  <p className="text-xs text-slate-600 text-center py-3">Nenhuma mensagem</p>
                ) : (
                  selectedTicket.messages.map((msg: TicketMessage) => (
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded-xl text-xs ${
                        msg.is_support_reply
                          ? 'bg-blue-500/10 border border-blue-500/20 ml-4'
                          : 'bg-slate-800/50 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-300">
                          {msg.users?.name || 'Usuário'}
                          {msg.is_support_reply && (
                            <span className="ml-1 text-blue-400">(Suporte)</span>
                          )}
                        </span>
                        <span className="text-xs text-slate-600">
                          {new Date(msg.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-slate-400">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Send message */}
            {selectedTicket.status !== 'FECHADO' && (
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-2.5 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
                <button
                  onClick={sendMessage}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            )}

            {/* Actions */}
            {isSupport && selectedTicket.status !== 'FECHADO' && (
              <div className="flex justify-end">
                <button
                  onClick={closeTicket}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors"
                >
                  Fechar Ticket
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
