'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Package, Plus, Search, Edit, Trash2, Eye, EyeOff,
  Truck, FileText, Wrench, ChevronDown, X,
  Upload, Download, File as FileIcon, CheckCircle,
  AlertTriangle, Phone, MessageSquare, ClipboardList, CheckSquare,
} from 'lucide-react';
import { suppliersService } from '@/services/suppliersService';
import { productsService } from '@/services/productsService';
import { Supplier } from '@/types/supplier';
import { Product, ProductDocument, MaintenanceLog, MaintenanceRecord, DOC_TYPE_LABELS, ACTION_TAKEN_LABELS, CONTACT_METHOD_LABELS } from '@/types/product';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import { STATUS_LABELS, STATUS_COLORS } from '@/config/constants';

type Tab = 'suppliers' | 'products';

export default function PatrimonioPage() {
  const { user } = useAuthStore();
  const canEdit = user && ['ADMIN', 'MANAGER'].includes(user.role);

  const [tab, setTab] = useState<Tab>('suppliers');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [supplierFilter, setSupplierFilter] = useState<string>('');

  // Modals
  const [supplierModal, setSupplierModal] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [productsListModal, setProductsListModal] = useState(false);
  const [docsModal, setDocsModal] = useState(false);
  const [maintenanceModal, setMaintenanceModal] = useState(false);

  // Edit state
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  const [productDocs, setProductDocs] = useState<ProductDocument[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProductName, setSelectedProductName] = useState<string>('');

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDocType, setUploadDocType] = useState('NOTA_FISCAL');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  // Maintenance form
  const emptyMaintForm = {
    problem_date: '', problem_description: '',
    contact_date: '', contact_method: 'TELEFONE', contact_description: '',
    supplier_response: '', action_taken: 'AGUARDANDO',
    resolution_date: '', resolution_description: '', resolved: false,
  };
  const [maintForm, setMaintForm] = useState(emptyMaintForm);
  const [maintFormOpen, setMaintFormOpen] = useState(false);
  const [savingMaint, setSavingMaint] = useState(false);

  // Forms
  const [supplierForm, setSupplierForm] = useState({
    name: '', cnpj: '', cpf: '', contact_name: '', email: '',
    phone: '', address: '', city: '', state: '', zip_code: '', notes: '',
  });
  const [productForm, setProductForm] = useState({
    supplier_id: '', name: '', brand: '', model: '', serial_number: '',
    patrimony_code: '', category: '', unit_value: '', monthly_cost: '', quantity: '1',
    invoice_number: '', request_date: '', acquisition_date: '', warranty_expiry: '',
    return_date: '', notes: '',
  });

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await suppliersService.list(page, 10, search || undefined);
      setSuppliers(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsService.list(page, 10, search || undefined, supplierFilter || undefined);
      setProducts(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, supplierFilter]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, supplierFilter]);

  useEffect(() => {
    if (tab === 'suppliers') loadSuppliers();
    else loadProducts();
  }, [tab, page, search, supplierFilter, loadSuppliers, loadProducts]);

  // Carrega todos os fornecedores para o dropdown de filtro
  useEffect(() => {
    suppliersService.list(1, 200).then(res => setAllSuppliers(res.data)).catch(() => {});
  }, []);

  // --- Supplier CRUD ---
  const openNewSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({ name: '', cnpj: '', cpf: '', contact_name: '', email: '', phone: '', address: '', city: '', state: '', zip_code: '', notes: '' });
    setSupplierModal(true);
  };

  const openEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierForm({
      name: s.name, cnpj: s.cnpj || '', cpf: s.cpf || '',
      contact_name: s.contact_name || '', email: s.email || '',
      phone: s.phone || '', address: s.address || '', city: s.city || '',
      state: s.state || '', zip_code: s.zip_code || '', notes: s.notes || '',
    });
    setSupplierModal(true);
  };

  const saveSupplier = async () => {
    try {
      if (editingSupplier) {
        await suppliersService.update(editingSupplier.id, supplierForm);
        showToast('Fornecedor atualizado!', 'success');
      } else {
        await suppliersService.create(supplierForm);
        showToast('Fornecedor criado!', 'success');
      }
      setSupplierModal(false);
      loadSuppliers();
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  const deleteSupplier = async (s: Supplier) => {
    if (!confirm(`Deseja remover permanentemente "${s.name}"?`)) return;
    try {
      await suppliersService.hardDelete(s.id);
      showToast('Fornecedor removido!', 'success');
      loadSuppliers();
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  const toggleSupplierActive = async (s: Supplier) => {
    try {
      await suppliersService.update(s.id, { is_active: !s.is_active });
      showToast(s.is_active ? 'Fornecedor desativado' : 'Fornecedor ativado', 'success');
      loadSuppliers();
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  const viewSupplierProducts = async (s: Supplier) => {
    setSelectedSupplier(s);
    try {
      const prods = await suppliersService.getProducts(s.id);
      setSupplierProducts(prods);
      setProductsListModal(true);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  // --- Product CRUD ---
  const openNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      supplier_id: '', name: '', brand: '', model: '', serial_number: '',
      patrimony_code: '', category: '', unit_value: '', monthly_cost: '', quantity: '1',
      invoice_number: '', request_date: '', acquisition_date: '', warranty_expiry: '',
      return_date: '', notes: '',
    });
    setProductModal(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      supplier_id: p.supplier_id, name: p.name,
      brand: p.brand || '', model: p.model || '',
      serial_number: p.serial_number || '', patrimony_code: p.patrimony_code || '',
      category: p.category || '', unit_value: String(p.unit_value || ''),
      monthly_cost: String(p.monthly_cost || ''),
      quantity: String(p.quantity || 1), invoice_number: p.invoice_number || '',
      request_date: (p as unknown as Record<string, string>).request_date?.split('T')[0] || '',
      acquisition_date: p.acquisition_date?.split('T')[0] || '',
      warranty_expiry: p.warranty_expiry?.split('T')[0] || '',
      return_date: p.return_date?.split('T')[0] || '', notes: p.notes || '',
    });
    setProductModal(true);
  };

  const saveProduct = async () => {
    try {
      const data: import('@/types/product').CreateProductRequest = {
        supplier_id: productForm.supplier_id,
        name: productForm.name,
        brand: productForm.brand || undefined,
        model: productForm.model || undefined,
        serial_number: productForm.serial_number || undefined,
        patrimony_code: productForm.patrimony_code || undefined,
        category: productForm.category || undefined,
        unit_value: productForm.unit_value ? parseFloat(productForm.unit_value) : undefined,
        quantity: parseInt(productForm.quantity) || 1,
        invoice_number: productForm.invoice_number || undefined,
        request_date: productForm.request_date || undefined,
        acquisition_date: productForm.acquisition_date || undefined,
        warranty_expiry: productForm.warranty_expiry || undefined,
        return_date: productForm.return_date || undefined,
        notes: productForm.notes || undefined,
        monthly_cost: productForm.monthly_cost ? parseFloat(productForm.monthly_cost) : undefined,
      };
      if (editingProduct) {
        await productsService.update(editingProduct.id, data);
        showToast('Produto atualizado!', 'success');
      } else {
        await productsService.create(data);
        showToast('Produto criado!', 'success');
      }
      setProductModal(false);
      loadProducts();
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  const deleteProduct = async (p: Product) => {
    if (!confirm(`Remover permanentemente "${p.name}"?`)) return;
    try {
      await productsService.remove(p.id);
      showToast('Produto removido!', 'success');
      loadProducts();
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  // --- Docs ---
  const viewDocs = async (productId: string) => {
    setSelectedProductId(productId);
    setUploadFile(null);
    setUploadName('');
    setUploadDocType('NOTA_FISCAL');
    setUploadDescription('');
    try {
      const docs = await productsService.getDocuments(productId);
      setProductDocs(docs);
      setDocsModal(true);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleUploadDoc = async () => {
    if (!uploadFile || !uploadName.trim()) {
      showToast('Selecione um arquivo e informe o nome', 'error');
      return;
    }
    setUploading(true);
    try {
      const doc = await productsService.uploadDocument(
        selectedProductId,
        uploadFile,
        uploadName.trim(),
        uploadDocType,
        uploadDescription || undefined,
      );
      setProductDocs((prev) => [doc, ...prev]);
      setUploadFile(null);
      setUploadName('');
      setUploadDescription('');
      setUploadDocType('NOTA_FISCAL');
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast('Documento enviado com sucesso!', 'success');
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDoc = async (doc: ProductDocument) => {
    try {
      const { url } = await productsService.getDocumentDownloadUrl(doc.id);
      window.open(url, '_blank');
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  // --- Maintenance ---
  const viewMaintenance = async (product: Product) => {
    setSelectedProductId(product.id);
    setSelectedProductName(product.name);
    setMaintFormOpen(false);
    setEditingRecord(null);
    setMaintForm(emptyMaintForm);
    try {
      const records = await productsService.getMaintenanceRecords(product.id);
      setMaintenanceRecords(records);
      setMaintenanceModal(true);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  const openEditRecord = (rec: MaintenanceRecord) => {
    setEditingRecord(rec);
    setMaintForm({
      problem_date: rec.problem_date?.split('T')[0] || '',
      problem_description: rec.problem_description || '',
      contact_date: rec.contact_date?.split('T')[0] || '',
      contact_method: rec.contact_method || 'TELEFONE',
      contact_description: rec.contact_description || '',
      supplier_response: rec.supplier_response || '',
      action_taken: rec.action_taken || 'AGUARDANDO',
      resolution_date: rec.resolution_date?.split('T')[0] || '',
      resolution_description: rec.resolution_description || '',
      resolved: rec.resolved || false,
    });
    setMaintFormOpen(true);
  };

  const saveMaintRecord = async () => {
    if (!maintForm.problem_date || !maintForm.problem_description.trim()) {
      showToast('Informe a data e descrição do problema', 'error');
      return;
    }

    // Confirmação extra para substituição encerrada
    if (maintForm.action_taken === 'SUBSTITUICAO' && maintForm.resolved) {
      const ok = confirm(
        `⚠️ ATENÇÃO: Substituição encerrada!\n\n` +
        `O equipamento "${selectedProductName}" será marcado como INATIVO.\n` +
        `Isso indica que ele foi substituído e não deve ser mais utilizado.\n\n` +
        `Deseja confirmar?`
      );
      if (!ok) return;
    }
    setSavingMaint(true);
    try {
      const payload = {
        problem_date: maintForm.problem_date,
        problem_description: maintForm.problem_description,
        contact_date: maintForm.contact_date || undefined,
        contact_method: maintForm.contact_method || undefined,
        contact_description: maintForm.contact_description || undefined,
        supplier_response: maintForm.supplier_response || undefined,
        action_taken: maintForm.action_taken || undefined,
        resolution_date: maintForm.resolution_date || undefined,
        resolution_description: maintForm.resolution_description || undefined,
        resolved: maintForm.resolved,
      };
      if (editingRecord) {
        const updated = await productsService.updateMaintenanceRecord(editingRecord.id, payload);
        setMaintenanceRecords((prev) => prev.map((r) => r.id === updated.id ? updated : r));
        showToast('Registro atualizado!', 'success');
      } else {
        const created = await productsService.createMaintenanceRecord(selectedProductId, payload);
        setMaintenanceRecords((prev) => [created, ...prev]);
        showToast('Ocorrência registrada!', 'success');
      }
      setMaintForm(emptyMaintForm);
      setEditingRecord(null);
      setMaintFormOpen(false);
      loadProducts();
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setSavingMaint(false);
    }
  };

  const deleteMaintRecord = async (id: string) => {
    if (!confirm('Remover este registro de manutenção?')) return;
    try {
      await productsService.deleteMaintenanceRecord(id);
      setMaintenanceRecords((prev) => prev.filter((r) => r.id !== id));
      showToast('Registro removido', 'success');
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package size={24} className="text-emerald-500" />
            Patrimônio
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gerenciar fornecedores e produtos</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filtro fornecedor (apenas aba produtos) */}
          {tab === 'products' && (
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 max-w-[180px]"
            >
              <option value="" className="bg-slate-800">Todos os fornecedores</option>
              {allSuppliers.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-800">{s.name}</option>
              ))}
            </select>
          )}

          {/* Search */}
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

          {canEdit && (
            <button
              onClick={tab === 'suppliers' ? openNewSupplier : openNewProduct}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-blue-400 transition-all"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">
                {tab === 'suppliers' ? 'Fornecedor' : 'Produto'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl w-fit">
        <button
          onClick={() => setTab('suppliers')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'suppliers'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Truck size={14} className="inline mr-1.5 -mt-0.5" />
          Fornecedores
        </button>
        <button
          onClick={() => setTab('products')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'products'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package size={14} className="inline mr-1.5 -mt-0.5" />
          Produtos
        </button>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : tab === 'suppliers' ? (
          /* SUPPLIERS TABLE */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Nome</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">CNPJ/CPF</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Contato</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {suppliers.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-600 text-sm">Nenhum fornecedor encontrado</td></tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-white font-medium">{s.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{s.cnpj || s.cpf || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{s.email || s.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-lg border ${s.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                          {s.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => viewSupplierProducts(s)} className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10" title="Ver produtos">
                            <Package size={14} />
                          </button>
                          {canEdit && (
                            <>
                              <button onClick={() => openEditSupplier(s)} className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10" title="Editar">
                                <Edit size={14} />
                              </button>
                              <button onClick={() => toggleSupplierActive(s)} className="p-1.5 rounded-lg text-slate-500 hover:text-purple-400 hover:bg-purple-500/10" title={s.is_active ? 'Desativar' : 'Ativar'}>
                                {s.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              <button onClick={() => deleteSupplier(s)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10" title="Remover">
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* PRODUCTS TABLE */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Produto</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Marca/Modelo</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Fornecedor</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-36">Status</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {products.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-600 text-sm">Nenhum produto encontrado</td></tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-white font-medium">{p.name}</p>
                          {p.patrimony_code && <p className="text-xs text-slate-500">Cód: {p.patrimony_code}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {[p.brand, p.model].filter(Boolean).join(' / ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {(p.suppliers as unknown as { name: string })?.name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-lg border whitespace-nowrap ${STATUS_COLORS[p.status] || ''}`}>
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => viewDocs(p.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10" title="Documentos">
                            <FileText size={14} />
                          </button>
                          <button onClick={() => viewMaintenance(p)} className="p-1.5 rounded-lg text-slate-500 hover:text-purple-400 hover:bg-purple-500/10" title="Manutenção">
                            <Wrench size={14} />
                          </button>
                          {canEdit && (
                            <>
                              <button onClick={() => openEditProduct(p)} className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10" title="Editar">
                                <Edit size={14} />
                              </button>
                              {user?.role === 'ADMIN' && (
                                <button onClick={() => deleteProduct(p)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10" title="Remover">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* ===== MODALS ===== */}

      {/* Supplier Form Modal */}
      <Modal
        isOpen={supplierModal}
        onClose={() => setSupplierModal(false)}
        title={editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        size="lg"
      >
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'name', label: 'Nome *', type: 'text', span: 2 },
            { key: 'cnpj', label: 'CNPJ', type: 'text', span: 1 },
            { key: 'email', label: 'Email', type: 'email', span: 2 },
            { key: 'phone', label: 'Telefone', type: 'text', span: 1 },
            { key: 'address', label: 'Endereço', type: 'text', span: 2 },
            { key: 'city', label: 'Cidade', type: 'text', span: 1 },
            { key: 'state', label: 'Estado', type: 'text', span: 1 },
            { key: 'zip_code', label: 'CEP', type: 'text', span: 1 },
          ].map((field) => (
            <div key={field.key} className={`space-y-0.5 col-span-${field.span}`}>
              <label className="text-xs text-slate-400">{field.label}</label>
              <input
                type={field.type}
                value={(supplierForm as Record<string, string>)[field.key]}
                onChange={(e) => setSupplierForm({ ...supplierForm, [field.key]: e.target.value })}
                className="w-full px-2.5 py-1 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/40"
              />
            </div>
          ))}
          <div className="col-span-3 space-y-0.5">
            <label className="text-xs text-slate-400">Observações</label>
            <textarea
              value={supplierForm.notes}
              onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
              rows={2}
              className="w-full px-2.5 py-1 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/40"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-3">
          <button onClick={() => setSupplierModal(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button onClick={saveSupplier} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors">
            {editingSupplier ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </Modal>

      {/* Product Form Modal */}
      <Modal
        isOpen={productModal}
        onClose={() => setProductModal(false)}
        title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
        size="xl"
      >
        <div className="grid grid-cols-4 gap-2">
          <div className="col-span-4 space-y-0.5">
            <label className="text-xs text-slate-400">Fornecedor *</label>
            <select
              value={productForm.supplier_id}
              onChange={(e) => setProductForm({ ...productForm, supplier_id: e.target.value })}
              className="w-full px-2.5 py-1 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/40 appearance-none"
            >
              <option value="" className="bg-slate-800">Selecione...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-800">{s.name}</option>
              ))}
            </select>
          </div>
          {[
            { key: 'name',             label: 'Nome *',          type: 'text',   span: 2 },
            { key: 'brand',            label: 'Marca',           type: 'text',   span: 1 },
            { key: 'model',            label: 'Modelo',          type: 'text',   span: 1 },
            { key: 'serial_number',    label: 'Nº Série',        type: 'text',   span: 1 },
            { key: 'patrimony_code',   label: 'Cód. Patrimônio', type: 'text',   span: 1 },
            { key: 'invoice_number',   label: 'Nº Nota Fiscal',  type: 'text',   span: 2 },
            { key: 'monthly_cost',     label: 'Custo Mensal (R$)', type: 'number', span: 1 },
            { key: 'request_date',     label: 'Dt. Solicitação', type: 'date',   span: 1 },
            { key: 'acquisition_date', label: 'Dt. Aquisição',   type: 'date',   span: 1 },
            { key: 'return_date',      label: 'Dt. Devolução',   type: 'date',   span: 1 },
          ].map((field) => (
            <div key={field.key} className={`space-y-0.5 col-span-${field.span}`}>
              <label className="text-xs text-slate-400">{field.label}</label>
              <input
                type={field.type}
                value={(productForm as Record<string, string>)[field.key]}
                onChange={(e) => setProductForm({ ...productForm, [field.key]: e.target.value })}
                className="w-full px-2.5 py-1 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/40"
              />
            </div>
          ))}
          <div className="col-span-4 space-y-0.5">
            <label className="text-xs text-slate-400">Observações</label>
            <textarea
              value={productForm.notes}
              onChange={(e) => setProductForm({ ...productForm, notes: e.target.value })}
              rows={2}
              className="w-full px-2.5 py-1 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/40"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-3">
          <button onClick={() => setProductModal(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">
            Cancelar
          </button>
          <button onClick={saveProduct} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg">
            {editingProduct ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </Modal>

      {/* Supplier Products Modal */}
      <Modal
        isOpen={productsListModal}
        onClose={() => setProductsListModal(false)}
        title={`Produtos - ${selectedSupplier?.name || ''}`}
        size="lg"
      >
        {supplierProducts.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">Nenhum produto vinculado</p>
        ) : (
          <div className="space-y-1.5">
            {supplierProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl">
                <div>
                  <p className="text-xs text-white font-medium">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.brand} {p.model}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-lg border whitespace-nowrap ${STATUS_COLORS[p.status] || ''}`}>
                  {STATUS_LABELS[p.status] || p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Documents Modal */}
      <Modal isOpen={docsModal} onClose={() => setDocsModal(false)} title="Documentos do Produto" size="lg">
        <div className="space-y-4">
          {/* Upload area */}
          {canEdit && (
            <div className="border border-dashed border-slate-600 rounded-xl p-3 space-y-2 bg-slate-900/40">
              <p className="text-xs font-medium text-slate-400 mb-1">Enviar novo documento</p>

              {/* File drop / click */}
              <div
                className="relative flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl bg-slate-800/60 border border-slate-700 cursor-pointer hover:border-blue-500/50 hover:bg-slate-800 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadFile ? (
                  <>
                    <CheckCircle size={20} className="text-emerald-400" />
                    <span className="text-xs text-white font-medium">{uploadFile.name}</span>
                    <span className="text-xs text-slate-500">{(uploadFile.size / 1024).toFixed(1)} KB</span>
                  </>
                ) : (
                  <>
                    <Upload size={20} className="text-slate-500" />
                    <span className="text-xs text-slate-400">Clique para selecionar o arquivo</span>
                    <span className="text-xs text-slate-600">PDF, imagem, Word, Excel — máx. 50 MB</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setUploadFile(f);
                    if (f && !uploadName) setUploadName(f.name.replace(/\.[^/.]+$/, ''));
                  }}
                />
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5 col-span-2">
                  <label className="text-xs text-slate-400">Nome do documento *</label>
                  <input
                    type="text"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="Ex: Nota Fiscal 001"
                    className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-xs text-slate-400">Tipo</label>
                  <select
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                  >
                    {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k} className="bg-slate-800">{v}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-xs text-slate-400">Descrição (opcional)</label>
                  <input
                    type="text"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Observação rápida..."
                    className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <button
                onClick={handleUploadDoc}
                disabled={uploading || !uploadFile}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <span className="animate-pulse">Enviando...</span>
                ) : (
                  <><Upload size={13} /> Enviar Documento</>
                )}
              </button>
            </div>
          )}

          {/* Document list */}
          {productDocs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Nenhum documento cadastrado</p>
          ) : (
            <div className="space-y-1.5">
              {productDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-2.5 bg-slate-900/60 rounded-xl group">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <FileIcon size={14} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-400">
                        {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
                      </span>
                      {doc.file_size && (
                        <span className="text-xs text-slate-600">{(doc.file_size / 1024).toFixed(1)} KB</span>
                      )}
                      {doc.description && (
                        <span className="text-xs text-slate-500 truncate">{doc.description}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleDownloadDoc(doc)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                      title="Baixar"
                    >
                      <Download size={13} />
                    </button>
                    {canEdit && (
                      <button
                        onClick={async () => {
                          if (!confirm('Remover este documento?')) return;
                          await productsService.removeDocument(doc.id);
                          setProductDocs((prev) => prev.filter((d) => d.id !== doc.id));
                          showToast('Documento removido', 'success');
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Maintenance Modal */}
      <Modal
        isOpen={maintenanceModal}
        onClose={() => { setMaintenanceModal(false); setMaintFormOpen(false); setEditingRecord(null); }}
        title={`Manutenção — ${selectedProductName}`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Botão abrir formulário */}
          {(canEdit || user?.role === 'TECHNICIAN') && !maintFormOpen && (
            <button
              onClick={() => { setEditingRecord(null); setMaintForm(emptyMaintForm); setMaintFormOpen(true); }}
              className="w-full py-2 border border-dashed border-purple-500/40 rounded-xl text-xs text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/60 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Registrar Nova Ocorrência
            </button>
          )}

          {/* Formulário de ocorrência */}
          {maintFormOpen && (
            <div className="border border-slate-700 rounded-xl p-4 space-y-4 bg-slate-900/40">
              <p className="text-xs font-semibold text-white flex items-center gap-2">
                <ClipboardList size={14} className="text-purple-400" />
                {editingRecord ? 'Editar Ocorrência' : 'Nova Ocorrência de Manutenção'}
              </p>

              {/* Seção 1 — Problema */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> Problema Detectado
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-xs text-slate-400">Data do Problema *</label>
                    <input type="date" value={maintForm.problem_date}
                      onChange={(e) => setMaintForm({ ...maintForm, problem_date: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/40" />
                  </div>
                  <div className="col-span-2 space-y-0.5">
                    <label className="text-xs text-slate-400">Descrição do Problema *</label>
                    <input type="text" value={maintForm.problem_description}
                      onChange={(e) => setMaintForm({ ...maintForm, problem_description: e.target.value })}
                      placeholder="Descreva o problema apresentado pelo equipamento..."
                      className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/40" />
                  </div>
                </div>
              </div>

              {/* Seção 2 — Contato com fornecedor */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-blue-400 flex items-center gap-1.5">
                  <Phone size={12} /> Contato com Fornecedor
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-xs text-slate-400">Data do Contato</label>
                    <input type="date" value={maintForm.contact_date}
                      onChange={(e) => setMaintForm({ ...maintForm, contact_date: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/40" />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-xs text-slate-400">Forma de Contato</label>
                    <select value={maintForm.contact_method}
                      onChange={(e) => setMaintForm({ ...maintForm, contact_method: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/40">
                      {Object.entries(CONTACT_METHOD_LABELS).map(([k, v]) => (
                        <option key={k} value={k} className="bg-slate-800">{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-xs text-slate-400">O que foi informado</label>
                    <input type="text" value={maintForm.contact_description}
                      onChange={(e) => setMaintForm({ ...maintForm, contact_description: e.target.value })}
                      placeholder="Resumo do contato com o fornecedor..."
                      className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/40" />
                  </div>
                </div>
              </div>

              {/* Seção 3 — Devolutiva do fornecedor */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                  <MessageSquare size={12} /> Devolutiva do Fornecedor
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-xs text-slate-400">Medida Tomada</label>
                    <select value={maintForm.action_taken}
                      onChange={(e) => setMaintForm({ ...maintForm, action_taken: e.target.value })}
                      className={`w-full px-2.5 py-1.5 bg-slate-900/60 border rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/40 ${
                        maintForm.action_taken === 'SUBSTITUICAO'
                          ? 'border-red-500/60'
                          : 'border-slate-700'
                      }`}>
                      {Object.entries(ACTION_TAKEN_LABELS).map(([k, v]) => (
                        <option key={k} value={k} className="bg-slate-800">{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-xs text-slate-400">Resposta do Fornecedor</label>
                    <input type="text" value={maintForm.supplier_response}
                      onChange={(e) => setMaintForm({ ...maintForm, supplier_response: e.target.value })}
                      placeholder="O que o fornecedor informou..."
                      className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/40" />
                  </div>
                </div>

                {/* Aviso de substituição */}
                {maintForm.action_taken === 'SUBSTITUICAO' && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                    <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-300 leading-relaxed">
                      <span className="font-semibold">Substituição selecionada.</span> Ao encerrar esta ocorrência, o status do equipamento será alterado para{' '}
                      <span className="font-semibold text-red-400">INATIVO</span>, pois será substituído por um novo cadastro.
                    </p>
                  </div>
                )}
              </div>

              {/* Seção 4 — Resolução */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <CheckSquare size={12} className="text-slate-400" /> Resolução
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-xs text-slate-400">Data da Resolução</label>
                    <input type="date" value={maintForm.resolution_date}
                      onChange={(e) => setMaintForm({ ...maintForm, resolution_date: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-slate-500/40" />
                  </div>
                  <div className="col-span-2 space-y-0.5">
                    <label className="text-xs text-slate-400">Descrição da Resolução</label>
                    <input type="text" value={maintForm.resolution_description}
                      onChange={(e) => setMaintForm({ ...maintForm, resolution_description: e.target.value })}
                      placeholder="Como foi resolvido..."
                      className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-slate-500/40" />
                  </div>
                </div>
                <label className={`flex items-center gap-2 cursor-pointer select-none w-fit ${maintForm.action_taken === 'SUBSTITUICAO' ? 'opacity-60' : ''}`}>
                  <input type="checkbox" checked={maintForm.resolved}
                    onChange={(e) => setMaintForm({ ...maintForm, resolved: e.target.checked })}
                    className="w-3.5 h-3.5 rounded accent-emerald-500" />
                  <span className={`text-xs ${maintForm.action_taken === 'SUBSTITUICAO' ? 'text-red-300' : 'text-slate-300'}`}>
                    {maintForm.action_taken === 'SUBSTITUICAO'
                      ? 'Encerrar ocorrência e marcar equipamento como INATIVO'
                      : 'Ocorrência resolvida / encerrada'}
                  </span>
                </label>
              </div>

              {/* Ações do formulário */}
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => { setMaintFormOpen(false); setEditingRecord(null); setMaintForm(emptyMaintForm); }}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button onClick={saveMaintRecord} disabled={savingMaint}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors">
                  {savingMaint ? 'Salvando...' : editingRecord ? 'Salvar Alterações' : 'Registrar Ocorrência'}
                </button>
              </div>
            </div>
          )}

          {/* Lista de ocorrências */}
          {maintenanceRecords.length === 0 && !maintFormOpen ? (
            <p className="text-xs text-slate-500 text-center py-6">Nenhuma ocorrência registrada</p>
          ) : (
            <div className="space-y-2">
              {maintenanceRecords.map((rec) => (
                <div key={rec.id} className={`rounded-xl border p-3 space-y-2 ${rec.resolved ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-slate-700 bg-slate-900/40'}`}>
                  {/* Cabeçalho do card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${rec.resolved ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                        {rec.resolved ? '✓ Resolvido' : '⏳ Em andamento'}
                      </span>
                      {rec.action_taken && (
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-700/80 text-slate-300 border border-slate-600">
                          {ACTION_TAKEN_LABELS[rec.action_taken] || rec.action_taken}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(canEdit || user?.role === 'TECHNICIAN') && (
                        <button onClick={() => openEditRecord(rec)}
                          className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors" title="Editar">
                          <Edit size={12} />
                        </button>
                      )}
                      {canEdit && (
                        <button onClick={() => deleteMaintRecord(rec.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Remover">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Problema */}
                  <div className="flex gap-2">
                    <AlertTriangle size={11} className="text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">
                        <span className="text-slate-500">Problema em </span>
                        <span className="text-white">{new Date(rec.problem_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      </p>
                      <p className="text-xs text-slate-300 mt-0.5">{rec.problem_description}</p>
                    </div>
                  </div>

                  {/* Contato */}
                  {rec.contact_date && (
                    <div className="flex gap-2">
                      <Phone size={11} className="text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">
                          <span className="text-slate-500">Contato via </span>
                          <span className="text-white">{CONTACT_METHOD_LABELS[rec.contact_method || ''] || rec.contact_method}</span>
                          <span className="text-slate-500"> em </span>
                          <span className="text-white">{new Date(rec.contact_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        </p>
                        {rec.contact_description && <p className="text-xs text-slate-400 mt-0.5">{rec.contact_description}</p>}
                      </div>
                    </div>
                  )}

                  {/* Devolutiva */}
                  {rec.supplier_response && (
                    <div className="flex gap-2">
                      <MessageSquare size={11} className="text-emerald-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-300">{rec.supplier_response}</p>
                    </div>
                  )}

                  {/* Resolução */}
                  {rec.resolution_description && (
                    <div className="flex gap-2">
                      <CheckSquare size={11} className="text-slate-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-400">
                        {rec.resolution_date && (
                          <span className="text-slate-500">{new Date(rec.resolution_date + 'T12:00:00').toLocaleDateString('pt-BR')} — </span>
                        )}
                        {rec.resolution_description}
                      </p>
                    </div>
                  )}

                  {/* Rodapé */}
                  <p className="text-xs text-slate-600 text-right">
                    Registrado por {rec.registered_by || 'sistema'} · {new Date(rec.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
