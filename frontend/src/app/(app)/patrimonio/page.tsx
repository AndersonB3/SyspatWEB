'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Package, Plus, Search, Edit, Trash2, Eye, EyeOff,
  Truck, FileText, Wrench, ChevronDown, X,
} from 'lucide-react';
import { suppliersService } from '@/services/suppliersService';
import { productsService } from '@/services/productsService';
import { Supplier } from '@/types/supplier';
import { Product, ProductDocument, MaintenanceLog } from '@/types/product';
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Forms
  const [supplierForm, setSupplierForm] = useState({
    name: '', cnpj: '', cpf: '', contact_name: '', email: '',
    phone: '', address: '', city: '', state: '', zip_code: '', notes: '',
  });
  const [productForm, setProductForm] = useState({
    supplier_id: '', name: '', brand: '', model: '', serial_number: '',
    patrimony_code: '', category: '', unit_value: '', quantity: '1',
    invoice_number: '', acquisition_date: '', warranty_expiry: '',
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
      const res = await productsService.list(page, 10, search || undefined);
      setProducts(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    setPage(1);
  }, [tab, search]);

  useEffect(() => {
    if (tab === 'suppliers') loadSuppliers();
    else loadProducts();
  }, [tab, page, search, loadSuppliers, loadProducts]);

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
      patrimony_code: '', category: '', unit_value: '', quantity: '1',
      invoice_number: '', acquisition_date: '', warranty_expiry: '',
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
      quantity: String(p.quantity || 1), invoice_number: p.invoice_number || '',
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
        acquisition_date: productForm.acquisition_date || undefined,
        warranty_expiry: productForm.warranty_expiry || undefined,
        return_date: productForm.return_date || undefined,
        notes: productForm.notes || undefined,
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
    try {
      const docs = await productsService.getDocuments(productId);
      setProductDocs(docs);
      setDocsModal(true);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  // --- Maintenance ---
  const viewMaintenance = async (productId: string) => {
    setSelectedProductId(productId);
    try {
      const logs = await productsService.getMaintenanceLogs(productId);
      setMaintenanceLogs(logs);
      setMaintenanceModal(true);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  const addMaintenanceLog = async (type: 'SAIDA' | 'RETORNO') => {
    const desc = prompt(type === 'SAIDA' ? 'Descrição da saída para manutenção:' : 'Descrição do retorno:');
    if (desc === null) return;
    try {
      await productsService.addMaintenanceLog(selectedProductId, {
        type,
        description: desc,
        technician: user?.name,
      });
      showToast(`${type === 'SAIDA' ? 'Saída' : 'Retorno'} registrado!`, 'success');
      const logs = await productsService.getMaintenanceLogs(selectedProductId);
      setMaintenanceLogs(logs);
      loadProducts();
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

        <div className="flex items-center gap-3">
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
              className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-blue-400 transition-all"
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
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
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
                        <span className={`text-xs px-2 py-1 rounded-lg border ${STATUS_COLORS[p.status] || ''}`}>
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => viewDocs(p.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10" title="Documentos">
                            <FileText size={14} />
                          </button>
                          <button onClick={() => viewMaintenance(p.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-purple-400 hover:bg-purple-500/10" title="Manutenção">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'name', label: 'Nome *', type: 'text' },
            { key: 'cnpj', label: 'CNPJ', type: 'text' },
            { key: 'cpf', label: 'CPF', type: 'text' },
            { key: 'contact_name', label: 'Contato', type: 'text' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'phone', label: 'Telefone', type: 'text' },
            { key: 'address', label: 'Endereço', type: 'text' },
            { key: 'city', label: 'Cidade', type: 'text' },
            { key: 'state', label: 'Estado', type: 'text' },
            { key: 'zip_code', label: 'CEP', type: 'text' },
          ].map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-sm text-slate-300">{field.label}</label>
              <input
                type={field.type}
                value={(supplierForm as Record<string, string>)[field.key]}
                onChange={(e) => setSupplierForm({ ...supplierForm, [field.key]: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          ))}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-sm text-slate-300">Observações</label>
            <textarea
              value={supplierForm.notes}
              onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setSupplierModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button onClick={saveSupplier} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
            <label className="text-sm text-slate-300">Fornecedor *</label>
            <select
              value={productForm.supplier_id}
              onChange={(e) => setProductForm({ ...productForm, supplier_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none"
            >
              <option value="" className="bg-slate-800">Selecione...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-800">{s.name}</option>
              ))}
            </select>
          </div>
          {[
            { key: 'name', label: 'Nome *' },
            { key: 'brand', label: 'Marca' },
            { key: 'model', label: 'Modelo' },
            { key: 'serial_number', label: 'Nº Série' },
            { key: 'patrimony_code', label: 'Cód. Patrimônio' },
            { key: 'category', label: 'Categoria' },
            { key: 'unit_value', label: 'Valor Unitário', type: 'number' },
            { key: 'quantity', label: 'Quantidade', type: 'number' },
            { key: 'invoice_number', label: 'Nº Nota Fiscal' },
            { key: 'acquisition_date', label: 'Data Aquisição', type: 'date' },
            { key: 'warranty_expiry', label: 'Fim Garantia', type: 'date' },
            { key: 'return_date', label: 'Data Devolução', type: 'date' },
          ].map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-sm text-slate-300">{field.label}</label>
              <input
                type={field.type || 'text'}
                value={(productForm as Record<string, string>)[field.key]}
                onChange={(e) => setProductForm({ ...productForm, [field.key]: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          ))}
          <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
            <label className="text-sm text-slate-300">Observações</label>
            <textarea
              value={productForm.notes}
              onChange={(e) => setProductForm({ ...productForm, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setProductModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">
            Cancelar
          </button>
          <button onClick={saveProduct} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl">
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
          <p className="text-sm text-slate-500 text-center py-8">Nenhum produto vinculado</p>
        ) : (
          <div className="space-y-2">
            {supplierProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                <div>
                  <p className="text-sm text-white font-medium">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.brand} {p.model}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg border ${STATUS_COLORS[p.status] || ''}`}>
                  {STATUS_LABELS[p.status] || p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Documents Modal */}
      <Modal isOpen={docsModal} onClose={() => setDocsModal(false)} title="Documentos do Produto" size="md">
        {productDocs.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">Nenhum documento</p>
        ) : (
          <div className="space-y-2">
            {productDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-blue-400" />
                  <div>
                    <p className="text-sm text-white">{doc.name}</p>
                    <p className="text-xs text-slate-500">{doc.file_type}</p>
                  </div>
                </div>
                {canEdit && (
                  <button
                    onClick={async () => {
                      await productsService.removeDocument(doc.id);
                      setProductDocs(productDocs.filter((d) => d.id !== doc.id));
                      showToast('Documento removido', 'success');
                    }}
                    className="p-1 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Maintenance Modal */}
      <Modal isOpen={maintenanceModal} onClose={() => setMaintenanceModal(false)} title="Logs de Manutenção" size="lg">
        {canEdit && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => addMaintenanceLog('SAIDA')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 border border-red-500/30"
            >
              Registrar Saída
            </button>
            <button
              onClick={() => addMaintenanceLog('RETORNO')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-500/30 border border-emerald-500/30"
            >
              Registrar Retorno
            </button>
          </div>
        )}
        {maintenanceLogs.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">Nenhum registro</p>
        ) : (
          <div className="space-y-2">
            {maintenanceLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-800/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-lg border ${
                    log.type === 'SAIDA'
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {log.type === 'SAIDA' ? 'Saída' : 'Retorno'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(log.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {log.description && <p className="text-sm text-slate-400 mt-2">{log.description}</p>}
                {log.technician && <p className="text-xs text-slate-500 mt-1">Técnico: {log.technician}</p>}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
