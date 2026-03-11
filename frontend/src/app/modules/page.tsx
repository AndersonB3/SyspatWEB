'use client';

import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  HelpCircle,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { APP_CONFIG, ROLE_LABELS } from '@/config/constants';

const modules = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    description: 'Visão geral do sistema com estatísticas e gráficos',
    icon: LayoutDashboard,
    color: 'from-blue-500 to-blue-600',
    shadow: 'shadow-blue-500/20',
    roles: ['ADMIN', 'MANAGER', 'TECHNICIAN', 'VIEWER'],
  },
  {
    href: '/patrimonio',
    label: 'Patrimônio',
    description: 'Gerenciar fornecedores, produtos e manutenções',
    icon: Package,
    color: 'from-emerald-500 to-emerald-600',
    shadow: 'shadow-emerald-500/20',
    roles: ['ADMIN', 'MANAGER', 'TECHNICIAN', 'VIEWER'],
  },
  {
    href: '/usuarios',
    label: 'Usuários',
    description: 'Gerenciar usuários e permissões do sistema',
    icon: Users,
    color: 'from-purple-500 to-purple-600',
    shadow: 'shadow-purple-500/20',
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    href: '/relatorios',
    label: 'Relatórios',
    description: 'Gerar relatórios detalhados e exportar dados',
    icon: BarChart3,
    color: 'from-amber-500 to-amber-600',
    shadow: 'shadow-amber-500/20',
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    href: '/suporte',
    label: 'Suporte',
    description: 'FAQs, tickets de suporte e ajuda',
    icon: HelpCircle,
    color: 'from-pink-500 to-pink-600',
    shadow: 'shadow-pink-500/20',
    roles: ['ADMIN', 'MANAGER', 'TECHNICIAN', 'VIEWER'],
  },
];

export default function ModulesPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    logout();
    await authService.logout();
  };

  const filteredModules = modules.filter(
    (m) => user && m.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{APP_CONFIG.name}</h1>
              <p className="text-xs text-slate-500">{APP_CONFIG.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="text-center py-10">
          <h2 className="text-3xl font-bold text-white mb-2">Módulos do Sistema</h2>
          <p className="text-slate-400">Selecione o módulo que deseja acessar</p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((mod, index) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.href}
                onClick={() => router.push(mod.href)}
                className="group glass rounded-2xl p-6 text-left hover:border-slate-600 transition-all duration-300 animate-fadeIn"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${mod.color} flex items-center justify-center shadow-lg ${mod.shadow} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                  {mod.label}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {mod.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
