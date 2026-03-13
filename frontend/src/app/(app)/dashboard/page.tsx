'use client';

import { useEffect, useState } from 'react';
import {
  Package, Truck, Users, Wrench, CheckCircle,
  RotateCcw, HelpCircle, TrendingUp, DollarSign, CalendarDays,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { reportsService } from '@/services/reportsService';
import { DashboardData, ChartData } from '@/types/reports';
import { showToast } from '@/components/Toast';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashData, chartData] = await Promise.all([
        reportsService.getDashboard(),
        reportsService.getChartData(),
      ]);
      setDashboard(dashData);
      setCharts(chartData);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Erro ao carregar dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-800/50 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-80 bg-slate-800/50 rounded-2xl" />
          <div className="h-80 bg-slate-800/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total de Produtos',
      value: dashboard?.totalProducts || 0,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/20',
    },
    {
      label: 'Fornecedores Ativos',
      value: dashboard?.totalSuppliers || 0,
      icon: Truck,
      color: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-500/20',
    },
    {
      label: 'Usuários Ativos',
      value: dashboard?.totalUsers || 0,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-500/20',
    },
    {
      label: 'Em Manutenção',
      value: dashboard?.productsInMaintenance || 0,
      icon: Wrench,
      color: 'from-red-500 to-red-600',
      shadow: 'shadow-red-500/20',
    },
  ];

  const subStats = [
    { label: 'Ativos', value: dashboard?.activeProducts || 0, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Devolvidos', value: dashboard?.returnedProducts || 0, icon: RotateCcw, color: 'text-amber-400' },
    { label: 'Tickets Abertos', value: dashboard?.openTickets || 0, icon: HelpCircle, color: 'text-blue-400' },
  ];

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const financeStats = [
    {
      label: 'Valor Total do Patrimônio',
      value: formatCurrency(dashboard?.totalValue || 0),
      icon: DollarSign,
      color: 'from-amber-500 to-amber-600',
      shadow: 'shadow-amber-500/20',
    },
    {
      label: 'Custo Mensal Total',
      value: formatCurrency(dashboard?.totalMonthlyCost || 0),
      icon: CalendarDays,
      color: 'from-teal-500 to-teal-600',
      shadow: 'shadow-teal-500/20',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp size={24} className="text-blue-500" />
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">Visão geral do sistema</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="glass rounded-2xl p-5 animate-fadeIn"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center ${stat.shadow} shadow-lg`}>
                  <Icon size={18} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {subStats.map((sub) => {
          const Icon = sub.icon;
          return (
            <div key={sub.label} className="glass rounded-xl p-4 flex items-center gap-3">
              <Icon size={18} className={sub.color} />
              <div>
                <p className="text-xs text-slate-500">{sub.label}</p>
                <p className="text-lg font-semibold text-white">{sub.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Finance stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {financeStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="glass rounded-2xl p-5 animate-fadeIn"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center ${stat.shadow} shadow-lg`}>
                  <Icon size={18} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Produtos por Status</h3>
          {charts?.pieChart && charts.pieChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={charts.pieChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {charts.pieChart.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-65 flex items-center justify-center text-slate-600 text-sm">
              Sem dados para exibir
            </div>
          )}
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-2 justify-center">
            {charts?.pieChart?.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs text-slate-400">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Produtos por Fornecedor</h3>
          {charts?.barChart && charts.barChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={charts.barChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="quantidade" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-70 flex items-center justify-center text-slate-600 text-sm">
              Sem dados para exibir
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
