'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users as UsersIcon, Plus, Search, Edit, Trash2, EyeOff,
  RotateCcw,
} from 'lucide-react';
import { usersService, CreateUserPayload, UpdateUserPayload } from '@/services/usersService';
import { authService } from '@/services/authService';
import { UserRecord } from '@/types/auth';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import { ROLE_LABELS } from '@/config/constants';

const roleOptions = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'MANAGER', label: 'Gerente' },
  { value: 'TECHNICIAN', label: 'Técnico' },
  { value: 'VIEWER', label: 'Visualizador' },
];

export default function UsuariosPage() {
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [form, setForm] = useState({
    name: '', username: '', email: '', password: '', cpf: '',
    birth_date: '', role: 'VIEWER', department: '', phone: '',
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersService.list(page, 10, search || undefined);
      setUsers(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { loadUsers(); }, [page, search, loadUsers]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', username: '', email: '', password: '', cpf: '', birth_date: '', role: 'VIEWER', department: '', phone: '' });
    setModal(true);
  };

  const openEdit = (u: UserRecord) => {
    setEditing(u);
    setForm({
      name: u.name, username: u.username, email: u.email || '',
      password: '', cpf: u.cpf || '',
      birth_date: u.birth_date?.split('T')[0] || '',
      role: u.role, department: u.department || '', phone: u.phone || '',
    });
    setModal(true);
  };

  const save = async () => {
    try {
      if (editing) {
        const data: UpdateUserPayload = {
          name: form.name || undefined,
          username: form.username || undefined,
          email: form.email || undefined,
          cpf: form.cpf || undefined,
          birth_date: form.birth_date || undefined,
          role: form.role as UserRecord['role'],
          department: form.department || undefined,
          phone: form.phone || undefined,
          ...(form.password ? { password: form.password } : {}),
        };
        await usersService.update(editing.id, data);
        showToast('Usuário atualizado!', 'success');
      } else {
        if (!form.password) {
          showToast('Senha é obrigatória', 'warning');
          return;
        }
        const data: CreateUserPayload = {
          name: form.name,
          username: form.username,
          email: form.email || undefined,
          password: form.password,
          cpf: form.cpf || undefined,
          birth_date: form.birth_date || undefined,
          role: form.role as UserRecord['role'],
          department: form.department || undefined,
          phone: form.phone || undefined,
        };
        await usersService.create(data);
        showToast('Usuário criado!', 'success');
      }
      setModal(false);
      loadUsers();
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  const deactivate = async (u: UserRecord) => {
    if (!confirm(`Desativar "${u.name}"?`)) return;
    try {
      await usersService.deactivate(u.id);
      showToast('Usuário desativado!', 'success');
      loadUsers();
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  const hardDelete = async (u: UserRecord) => {
    if (!confirm(`Remover permanentemente "${u.name}"? Essa ação não pode ser desfeita!`)) return;
    try {
      await usersService.hardDelete(u.id);
      showToast('Usuário removido!', 'success');
      loadUsers();
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  const resetPassword = async (u: UserRecord) => {
    if (!confirm(`Resetar senha de "${u.name}" para a senha padrão?`)) return;
    try {
      await authService.resetUsers([u.id]);
      showToast('Senha resetada com sucesso!', 'success');
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'MANAGER': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'TECHNICIAN': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UsersIcon size={24} className="text-purple-500" />
            Usuários
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gerenciar usuários do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-48"
            />
          </div>
          {isAdmin && (
            <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-purple-400 transition-all">
              <Plus size={16} />
              <span className="hidden sm:inline">Novo Usuário</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Nome</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Usuário</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Função</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {users.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-600 text-sm">Nenhum usuário encontrado</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-white font-medium">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email || u.department || ''}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{u.username}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-lg border ${roleColor(u.role)}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-lg border ${u.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                        {u.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isAdmin && (
                          <>
                            <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10" title="Editar">
                              <Edit size={14} />
                            </button>
                            <button onClick={() => resetPassword(u)} className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10" title="Resetar senha">
                              <RotateCcw size={14} />
                            </button>
                            <button onClick={() => deactivate(u)} className="p-1.5 rounded-lg text-slate-500 hover:text-purple-400 hover:bg-purple-500/10" title="Desativar">
                              <EyeOff size={14} />
                            </button>
                            <button onClick={() => hardDelete(u)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10" title="Remover">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* User Form Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar Usuário' : 'Novo Usuário'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'name', label: 'Nome *' },
            { key: 'username', label: 'Usuário *' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'password', label: editing ? 'Nova Senha (opcional)' : 'Senha *', type: 'password' },
            { key: 'cpf', label: 'CPF' },
            { key: 'birth_date', label: 'Data Nascimento', type: 'date' },
            { key: 'department', label: 'Departamento' },
            { key: 'phone', label: 'Telefone' },
          ].map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-sm text-slate-300">{field.label}</label>
              <input
                type={field.type || 'text'}
                value={(form as Record<string, string>)[field.key]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300">Função</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none"
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-800">{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancelar</button>
          <button onClick={save} className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl">
            {editing ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
