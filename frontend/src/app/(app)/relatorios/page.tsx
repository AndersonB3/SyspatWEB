'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3, Download, Filter, Package, Truck, Wrench, Users,
} from 'lucide-react';
import { reportsService } from '@/services/reportsService';
import { showToast } from '@/components/Toast';
import { STATUS_LABELS, STATUS_COLORS, ROLE_LABELS } from '@/config/constants';

type ReportTab = 'products' | 'suppliers' | 'maintenance' | 'users';

export default function RelatoriosPage() {
  const [tab, setTab] = useState<ReportTab>('products');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<unknown[]>([]);
  const [stats, setStats] = useState<Record<string, unknown>>({});

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    loadReport();
  }, [tab]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;
      if (statusFilter) filters.status = statusFilter;
      if (searchFilter) filters.search = searchFilter;

      let result: { data?: unknown[]; stats?: Record<string, unknown> } = {};
      switch (tab) {
        case 'products':
          result = await reportsService.getProductsReport(filters) as typeof result;
          break;
        case 'suppliers':
          result = await reportsService.getSuppliersReport(filters) as typeof result;
          break;
        case 'maintenance':
          result = await reportsService.getMaintenanceReport(filters) as typeof result;
          break;
        case 'users':
          result = await reportsService.getUsersReport(filters) as typeof result;
          break;
      }
      setData((result.data || []) as unknown[]);
      setStats((result.stats || {}) as Record<string, unknown>);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!data || data.length === 0) {
      showToast('Sem dados para exportar', 'warning');
      return;
    }
    const headers = Object.keys(data[0] as Record<string, unknown>).filter(k => typeof (data[0] as Record<string, unknown>)[k] !== 'object');
    const rows = (data as Record<string, unknown>[]).map(row =>
      headers.map(h => {
        const val = row[h];
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : String(val ?? '');
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${tab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Relatório exportado!', 'success');
  };

  const tabs = [
    { key: 'products' as ReportTab, label: 'Produtos', icon: Package, color: 'from-blue-500 to-blue-600' },
    { key: 'suppliers' as ReportTab, label: 'Fornecedores', icon: Truck, color: 'from-emerald-500 to-emerald-600' },
    { key: 'maintenance' as ReportTab, label: 'Manutenção', icon: Wrench, color: 'from-red-500 to-red-600' },
    { key: 'users' as ReportTab, label: 'Usuários', icon: Users, color: 'from-purple-500 to-purple-600' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 size={24} className="text-amber-500" />
            Relatórios
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gerar relatórios detalhados</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-all"
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl w-fit flex-wrap">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setStatusFilter(''); setSearchFilter(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                tab === t.key
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 flex flex-wrap items-end gap-3">
        <Filter size={16} className="text-slate-500" />
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Data Início</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Data Fim</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
        </div>
        {tab === 'products' && (
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/40">
              <option value="" className="bg-slate-800">Todos</option>
              <option value="ATIVO" className="bg-slate-800">Ativo</option>
              <option value="DEVOLVIDO" className="bg-slate-800">Devolvido</option>
              <option value="MANUTENCAO" className="bg-slate-800">Em Manutenção</option>
            </select>
          </div>
        )}
        <button onClick={loadReport} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
          Filtrar
        </button>
      </div>

      {/* Stats */}
      {Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(stats).map(([key, val]) => {
            if (typeof val === 'object') return null;
            const label = key === 'total' ? 'Total' : key === 'active' ? 'Ativos' : key === 'inactive' ? 'Inativos' : key === 'totalValue' ? 'Valor Total' : key;
            const displayVal = key === 'totalValue' ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : String(val);
            return (
              <div key={key} className="glass rounded-xl p-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-lg font-bold text-white">{displayVal}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Data Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {tab === 'products' && (
                    <>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Nome</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Marca</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Fornecedor</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Status</th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Valor</th>
                    </>
                  )}
                  {tab === 'suppliers' && (
                    <>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Nome</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">CNPJ</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Produtos</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Status</th>
                    </>
                  )}
                  {tab === 'maintenance' && (
                    <>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Produto</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Tipo</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Data</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Descrição</th>
                    </>
                  )}
                  {tab === 'users' && (
                    <>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Nome</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Usuário</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Função</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {data.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-600 text-sm">Sem dados</td></tr>
                ) : (
                  (data as Record<string, unknown>[]).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      {tab === 'products' && (
                        <>
                          <td className="px-4 py-3 text-sm text-white">{String(row.name || '')}</td>
                          <td className="px-4 py-3 text-sm text-slate-400">{String(row.brand || '—')}</td>
                          <td className="px-4 py-3 text-sm text-slate-400">{(row.suppliers as Record<string, unknown>)?.name as string || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-lg border ${STATUS_COLORS[String(row.status)] || ''}`}>
                              {STATUS_LABELS[String(row.status)] || row.status as string}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-slate-400">
                            {row.total_value ? `R$ ${Number(row.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                          </td>
                        </>
                      )}
                      {tab === 'suppliers' && (
                        <>
                          <td className="px-4 py-3 text-sm text-white">{String(row.name || '')}</td>
                          <td className="px-4 py-3 text-sm text-slate-400">{String(row.cnpj || '—')}</td>
                          <td className="px-4 py-3 text-sm text-slate-400">{String(row.product_count ?? 0)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-lg border ${row.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                              {row.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                        </>
                      )}
                      {tab === 'maintenance' && (
                        <>
                          <td className="px-4 py-3 text-sm text-white">{(row.products as Record<string, unknown>)?.name as string || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-lg border ${row.type === 'SAIDA' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                              {row.type === 'SAIDA' ? 'Saída' : 'Retorno'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-400">{row.date ? new Date(String(row.date)).toLocaleDateString('pt-BR') : '—'}</td>
                          <td className="px-4 py-3 text-sm text-slate-400 max-w-xs truncate">{String(row.description || '—')}</td>
                        </>
                      )}
                      {tab === 'users' && (
                        <>
                          <td className="px-4 py-3 text-sm text-white">{String(row.name || '')}</td>
                          <td className="px-4 py-3 text-sm text-slate-400">{String(row.username || '')}</td>
                          <td className="px-4 py-3 text-sm text-slate-400">{ROLE_LABELS[String(row.role)] || row.role as string}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-lg border ${row.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                              {row.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
