'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronLeft,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { APP_CONFIG, ROLE_LABELS } from '@/config/constants';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'TECHNICIAN', 'VIEWER'] },
  { href: '/patrimonio', label: 'Patrimônio', icon: Package, roles: ['ADMIN', 'MANAGER', 'TECHNICIAN', 'VIEWER'] },
  { href: '/usuarios', label: 'Usuários', icon: Users, roles: ['ADMIN', 'MANAGER'] },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  { href: '/suporte', label: 'Suporte', icon: HelpCircle, roles: ['ADMIN', 'MANAGER', 'TECHNICIAN', 'VIEWER'] },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthStore();

  const handleLogout = () => {
    authService.logout();
  };

  const filteredItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Shield size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white tracking-wide">{APP_CONFIG.name}</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Patrimônio</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 group
                ${isActive
                  ? 'bg-blue-600/20 text-blue-400 shadow-inner'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }
              `}
            >
              <Icon size={18} className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div className="border-t border-slate-700/50 p-4">
        {!collapsed && user && (
          <div className="mb-3 px-1">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-[11px] text-slate-500">{ROLE_LABELS[user.role] || user.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`
        lg:hidden fixed top-0 left-0 z-50 h-full w-64
        bg-slate-900/95 backdrop-blur-md border-r border-slate-700/50
        transform transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
        >
          <X size={18} />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`
        hidden lg:flex flex-col
        ${collapsed ? 'w-18' : 'w-64'}
        bg-slate-900/80 backdrop-blur-md border-r border-slate-700/50
        transition-all duration-300 relative shrink-0
      `}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-7 z-10 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
        >
          <ChevronLeft size={12} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
        <SidebarContent />
      </aside>
    </>
  );
}
