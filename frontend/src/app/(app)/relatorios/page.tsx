'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3, Download, Eye, FileText, Filter, Package, Truck, Wrench, Users, Calendar,
} from 'lucide-react';
import { reportsService } from '@/services/reportsService';
import { suppliersService } from '@/services/suppliersService';
import { showToast } from '@/components/Toast';
import { APP_CONFIG, STATUS_LABELS, STATUS_COLORS, ROLE_LABELS } from '@/config/constants';
import { Supplier } from '@/types/supplier';

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
  const [supplierFilter, setSupplierFilter] = useState('');
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    suppliersService.list(1, 200).then(res => setAllSuppliers(res.data)).catch(() => {});
  }, []);

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
      if (supplierFilter) filters.supplier_id = supplierFilter;

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

  const buildPDF = async () => {
    if (!data || data.length === 0) {
      showToast('Sem dados para exportar', 'warning');
      return null;
    }

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const TAB_LABELS: Record<string, string> = {
      products: 'Produtos', suppliers: 'Fornecedores', maintenance: 'Manutenção', users: 'Usuários',
    };

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const supplierName = supplierFilter
      ? allSuppliers.find(s => s.id === supplierFilter)?.name || ''
      : '';

    // ── Cabeçalho ──────────────────────────────────────────────
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, supplierName ? 26 : 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(APP_CONFIG.fullName, 14, 9);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Relatório de ${TAB_LABELS[tab]}`, 14, 15);
    if (supplierName) {
      doc.setFontSize(8);
      doc.setTextColor(99, 179, 237);
      doc.text(`Fornecedor: ${supplierName}`, 14, 21);
    }
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Emitido em ${dateStr} às ${timeStr}`, pageW - 14, 15, { align: 'right' });

    let cursorY = supplierName ? 32 : 28;

    // ── Cards de Resumo ────────────────────────────────────────
    const statEntries = Object.entries(stats).filter(([, v]) => typeof v !== 'object');
    if (statEntries.length > 0) {
      const statLabelMap: Record<string, string> = {
        total: 'Total', active: 'Ativos', inactive: 'Inativos',
        maintenance: 'Em Manutenção', returned: 'Devolvidos',
        totalValue: 'Valor Total', totalMonthlyCost: 'Custo Mensal Total', activeMonthlyCost: 'Custo Mensal (Ativos)',
      };
      const cardW = (pageW - 28 - (statEntries.length - 1) * 4) / statEntries.length;
      statEntries.forEach(([key, val], idx) => {
        const x = 14 + idx * (cardW + 4);
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(x, cursorY, cardW, 14, 2, 2, 'F');
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(statLabelMap[key] ?? key, x + 3, cursorY + 5);
        const isCurrency = key === 'totalValue' || key === 'totalMonthlyCost' || key === 'activeMonthlyCost';
        const displayVal = isCurrency
          ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : String(val);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(displayVal, x + 3, cursorY + 11);
      });
      cursorY += 20;
    }

    // ── Tabela por aba ─────────────────────────────────────────
    const rows = data as Record<string, unknown>[];
    if (tab === 'products') {
      const totalValorUnit = rows.reduce((acc, r) => acc + (r.unit_value ? Number(r.unit_value) : 0), 0);
      const totalMensal = rows.reduce((acc, r) => acc + (r.monthly_cost ? Number(r.monthly_cost) : 0), 0);
      const fmt = (v: number) => v > 0 ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';

      autoTable(doc, {
        startY: cursorY,
        head: [['Nome', 'Marca', 'Modelo', 'Nº Série', 'Cód. Patrimônio', 'Fornecedor', 'Status', 'Valor Unit.', 'Custo Mensal']],
        body: rows.map(r => [
          String(r.name || ''), String(r.brand || '—'), String(r.model || '—'),
          String(r.serial_number || '—'), String(r.patrimony_code || '—'),
          (r.suppliers as Record<string, unknown>)?.name as string || '—',
          STATUS_LABELS[String(r.status)] || String(r.status || ''),
          r.unit_value ? `R$ ${Number(r.unit_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—',
          r.monthly_cost ? `R$ ${Number(r.monthly_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—',
        ]),
        foot: [[
          { content: `Total: ${rows.length} produto${rows.length !== 1 ? 's' : ''}`, colSpan: 7, styles: { halign: 'left', fontStyle: 'bold', fillColor: [15, 23, 42], textColor: [148, 163, 184], fontSize: 7 } },
          { content: fmt(totalValorUnit), styles: { halign: 'right', fontStyle: 'bold', fillColor: [15, 23, 42], textColor: [251, 191, 36], fontSize: 8 } },
          { content: fmt(totalMensal), styles: { halign: 'right', fontStyle: 'bold', fillColor: [15, 23, 42], textColor: [52, 211, 153], fontSize: 8 } },
        ]],
        showFoot: 'lastPage',
        styles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59] },
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 7, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        columnStyles: { 7: { halign: 'right' }, 8: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      });
    } else if (tab === 'suppliers') {
      autoTable(doc, {
        startY: cursorY,
        head: [['Nome', 'CNPJ', 'Email', 'Telefone', 'Qtd. Produtos', 'Status']],
        body: rows.map(r => [
          String(r.name || ''), String(r.cnpj || '—'),
          String(r.email || '—'), String(r.phone || '—'), String(r.product_count ?? 0),
          r.is_active ? 'Ativo' : 'Inativo',
        ]),
        styles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59] },
        headStyles: { fillColor: [6, 95, 70], textColor: 255, fontSize: 7, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: 14, right: 14 },
      });
    } else if (tab === 'maintenance') {
      autoTable(doc, {
        startY: cursorY,
        head: [['Produto', 'Descrição do Problema', 'Dt. Problema', 'Ação Tomada', 'Resolvido', 'Dt. Resolução']],
        body: rows.map(r => [
          (r.products as Record<string, unknown>)?.name as string || '—',
          String(r.problem_description || '—'),
          r.problem_date ? new Date(String(r.problem_date)).toLocaleDateString('pt-BR') : '—',
          String(r.action_taken || '—'),
          r.resolved ? 'Sim' : 'Não',
          r.resolution_date ? new Date(String(r.resolution_date)).toLocaleDateString('pt-BR') : '—',
        ]),
        styles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59] },
        headStyles: { fillColor: [153, 27, 27], textColor: 255, fontSize: 7, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: 14, right: 14 },
      });
    } else if (tab === 'users') {
      autoTable(doc, {
        startY: cursorY,
        head: [['Nome', 'Usuário', 'Email', 'Função', 'Status']],
        body: rows.map(r => [
          String(r.name || ''), String(r.username || ''), String(r.email || '—'),
          ROLE_LABELS[String(r.role)] || String(r.role || ''),
          r.is_active ? 'Ativo' : 'Inativo',
        ]),
        styles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59] },
        headStyles: { fillColor: [88, 28, 135], textColor: 255, fontSize: 7, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: 14, right: 14 },
      });
    }

    // ── Rodapé em todas as páginas ─────────────────────────────
    const totalPgs = (doc as typeof doc & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
    for (let p = 1; p <= totalPgs; p++) {
      doc.setPage(p);
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, pageH - 8, pageW, 8, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(APP_CONFIG.name, 14, pageH - 2.5);
      doc.text(`Página ${p} de ${totalPgs}`, pageW - 14, pageH - 2.5, { align: 'right' });
    }

    return { doc, filename: `relatorio_${tab}_${now.toISOString().split('T')[0]}.pdf` };
  };

  const exportPDF = async () => {
    const result = await buildPDF();
    if (!result) return;
    result.doc.save(result.filename);
    showToast('PDF baixado com sucesso!', 'success');
  };

  const previewPDF = async () => {
    const result = await buildPDF();
    if (!result) return;
    const blob = result.doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    showToast('PDF aberto para visualização!', 'success');
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
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={previewPDF}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 border border-slate-600 text-white text-sm font-medium rounded-xl hover:bg-slate-600 transition-all"
          >
            <Eye size={16} />
            Visualizar PDF
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 border border-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-all"
          >
            <FileText size={16} />
            Baixar PDF
          </button>
        </div>
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

        {/* Data Início */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Calendar size={11} className="text-blue-400" />
            Data Início
          </label>
          <div className="relative group">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none z-10" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-8 pr-3 py-2 bg-slate-900/70 border border-slate-700 hover:border-blue-500/60 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200 cursor-pointer [color-scheme:dark] w-40"
            />
          </div>
        </div>

        {/* Separador */}
        <span className="text-slate-600 text-sm self-end pb-2">→</span>

        {/* Data Fim */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Calendar size={11} className="text-blue-400" />
            Data Fim
          </label>
          <div className="relative group">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none z-10" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-8 pr-3 py-2 bg-slate-900/70 border border-slate-700 hover:border-blue-500/60 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200 cursor-pointer [color-scheme:dark] w-40"
            />
          </div>
        </div>
        {tab === 'products' && (
          <>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                <option value="" className="bg-slate-800">Todos os status</option>
                <option value="ATIVO" className="bg-slate-800">Ativo</option>
                <option value="DEVOLVIDO" className="bg-slate-800">Devolvido</option>
                <option value="MANUTENCAO" className="bg-slate-800">Em Manutenção</option>
                <option value="INATIVO" className="bg-slate-800">Inativo</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Fornecedor</label>
              <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 max-w-[200px]">
                <option value="" className="bg-slate-800">Todos os fornecedores</option>
                {allSuppliers.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-800">{s.name}</option>
                ))}
              </select>
            </div>
          </>
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
            const label =
              key === 'total' ? 'Total' :
              key === 'active' ? 'Ativos' :
              key === 'inactive' ? 'Inativos' :
              key === 'maintenance' ? 'Em Manutenção' :
              key === 'returned' ? 'Devolvidos' :
              key === 'totalValue' ? 'Valor Total' :
              key === 'totalMonthlyCost' ? 'Custo Mensal Total' :
              key === 'activeMonthlyCost' ? 'Custo Mensal (Ativos)' : key;
            const isCurrency = key === 'totalValue' || key === 'totalMonthlyCost' || key === 'activeMonthlyCost';
            const displayVal = isCurrency
              ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : String(val);
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
                      <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Custo Mensal</th>
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
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Descrição do Problema</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Dt. Problema</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Ação Tomada</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Resolvido</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Dt. Resolução</th>
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
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-600 text-sm">Sem dados</td></tr>
                ) : (
                  (data as Record<string, unknown>[]).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      {tab === 'products' && (
                        <>
                          <td className="px-4 py-3 text-sm text-white">{String(row.name || '')}</td>
                          <td className="px-4 py-3 text-sm text-slate-400">{String(row.brand || '—')}</td>
                          <td className="px-4 py-3 text-sm text-slate-400">{(row.suppliers as Record<string, unknown>)?.name as string || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-lg border whitespace-nowrap ${STATUS_COLORS[String(row.status)] || ''}`}>
                              {STATUS_LABELS[String(row.status)] || row.status as string}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-slate-400">
                            {row.total_value ? `R$ ${Number(row.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-emerald-400">
                            {row.monthly_cost ? `R$ ${Number(row.monthly_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
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
                          <td className="px-4 py-3 text-sm text-slate-400 max-w-xs truncate">{String(row.problem_description || '—')}</td>
                          <td className="px-4 py-3 text-sm text-slate-400">{row.problem_date ? new Date(String(row.problem_date)).toLocaleDateString('pt-BR') : '—'}</td>
                          <td className="px-4 py-3 text-sm text-slate-400 max-w-xs truncate">{String(row.action_taken || '—')}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-lg border whitespace-nowrap ${row.resolved ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                              {row.resolved ? 'Sim' : 'Não'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-400">{row.resolution_date ? new Date(String(row.resolution_date)).toLocaleDateString('pt-BR') : '—'}</td>
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
