import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Search, Edit2, Trash2, Download, X, ChevronLeft, ChevronRight, Box, Package } from 'lucide-react';
import { ActionMenu } from '../Shared/common/ActionMenu';

interface Product {
  id: string;
  name: string;
  description: string;
  unit_weight: string;
  created_at: string;
}

export function Products() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit_weight: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    try {
      const data = await genericApi.list('products');

      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProduct) {
        await genericApi.update('products', editingId, formData);

        
      } else {
        await genericApi.create('products', formData);

        
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      unit_weight: product.unit_weight || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.deleteConfirm'))) return;

    try {
      await genericApi.delete('products', id);

      
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      unit_weight: ''
    });
  };

  const totalPages = Math.ceil(filteredProducts.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F3C66] text-white shadow-lg shadow-[#0F3C66]/20">
            <Box size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {t('products.title')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('products.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setEditingProduct(null);
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0F3C66] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0F3C66]/20 transition hover:bg-[#152a44]"
          >
            <Plus size={20} />
            {t('products.addButton')}
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50">
            <Download size={20} className="text-gray-400" />
            {t('products.export')}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-200/50">
        <div className="border-b border-gray-100 bg-slate-50/50 p-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{t('common.show')}</span>
              <select
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 font-medium text-gray-900 focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20"
              >
                {[5, 10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span>{t('common.entries')}</span>
            </div>

            <div className="relative min-w-[280px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('products.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto text-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4">{t('products.colId')}</th>
                <th className="px-6 py-4">{t('products.colName')}</th>
                <th className="px-6 py-4">{t('products.colDescription')}</th>
                <th className="px-6 py-4">{t('products.colWeight')}</th>
                <th className="px-6 py-4 text-center">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Package size={40} className="text-gray-200" />
                      <span>{t('products.empty')}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentProducts.map((product, index) => (
                  <tr key={product.id} className="transition hover:bg-[#0F3C66]/[0.02]">
                    <td className="px-6 py-4 font-medium text-gray-400">
                      #{startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {product.description || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {product.unit_weight ? (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {product.unit_weight}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <ActionMenu
                          actions={[
                            {
                              label: t('common.edit'),
                              icon: <Edit2 size={16} />,
                              onClick: () => handleEdit(product),
                            },
                            {
                              label: t('common.delete'),
                              icon: <Trash2 size={16} />,
                              onClick: () => handleDelete(product.id),
                              variant: 'danger',
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 bg-white px-6 py-4 text-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-gray-600">
              {t('common.showing')} {startIndex + 1} {t('common.to')} {Math.min(endIndex, filteredProducts.length)} {t('common.of')} {filteredProducts.length} {t('common.entries')}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white transition hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n)}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition ${
                      currentPage === n
                        ? 'bg-[#0F3C66] text-white shadow-sm'
                        : 'bg-white text-gray-700 hover:bg-gray-50 ring-1 ring-inset ring-gray-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white transition hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-gray-100 bg-slate-50/50 p-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? t('products.modalEditTitle') : t('products.modalAddTitle')}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('products.fieldName')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/15"
                    placeholder={t('products.placeholderName')}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('products.fieldDescription')}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/15"
                    placeholder={t('products.placeholderDescription')}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('products.fieldWeight')}
                  </label>
                  <input
                    type="text"
                    value={formData.unit_weight}
                    onChange={(e) => setFormData({ ...formData, unit_weight: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/15"
                    placeholder={t('products.placeholderWeight')}
                  />
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingProduct(null);
                      resetForm();
                    }}
                    className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-200"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-[#0F3C66] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0F3C66]/20 transition hover:bg-[#152a44]"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



