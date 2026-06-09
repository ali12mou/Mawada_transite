import { useState, useEffect, useMemo } from 'react';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { Download, Pencil, Trash2, X } from 'lucide-react';

interface Product {
  id: string;
  _id?: string;
  name: string;
  description: string;
  unit_weight: string;
  created_at: string;
}

type SortKey = 'id' | 'name' | 'description' | 'unit_weight';
type SortDir = 'asc' | 'desc';

function productId(product: Product): string {
  return product._id || product.id;
}

function SortIcon() {
  return (
    <span className="ml-1 inline-flex flex-col text-[8px] leading-none text-gray-400">
      <span>▲</span>
      <span>▼</span>
    </span>
  );
}

export function Products() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit_weight: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          productId(p).toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let av = '';
      let bv = '';
      if (sortKey === 'id') {
        av = productId(a);
        bv = productId(b);
      } else {
        av = String(a[sortKey] ?? '').toLowerCase();
        bv = String(b[sortKey] ?? '').toLowerCase();
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [products, searchTerm, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / entriesPerPage));
  const startIndex = filteredProducts.length === 0 ? 0 : (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, filteredProducts.length);
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await genericApi.update('products', productId(editingProduct), formData);
      } else {
        await genericApi.create('products', formData);
      }
      closeModal();
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
      unit_weight: product.unit_weight || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(t('common.deleteConfirm'))) return;
    try {
      await genericApi.delete('products', productId(product));
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', unit_weight: '' });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    resetForm();
  };

  const openAddModal = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  const thClass =
    'cursor-pointer select-none px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">{t('products.title')}</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openAddModal}
            className="rounded bg-[#0F3C66] px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#154b8a]"
          >
            {t('common.add')}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded bg-[#0F3C66] px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#154b8a]"
          >
            <Download size={16} />
            {t('products.export')}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>{t('common.show')}</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border border-gray-300 px-2 py-1 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>{t('common.entries')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{t('common.searchLabel')}</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded border border-gray-300 px-3 py-1 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className={thClass} onClick={() => toggleSort('id')}>
                  {t('products.colId')}
                  <SortIcon />
                </th>
                <th className={thClass} onClick={() => toggleSort('name')}>
                  {t('products.colName')}
                  <SortIcon />
                </th>
                <th className={thClass} onClick={() => toggleSort('description')}>
                  {t('products.colDescription')}
                  <SortIcon />
                </th>
                <th className={thClass} onClick={() => toggleSort('unit_weight')}>
                  {t('products.colWeight')}
                  <SortIcon />
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  {t('common.action')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                currentProducts.map((product) => (
                  <tr key={productId(product)} className="transition hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{productId(product)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 text-gray-700">{product.description || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{product.unit_weight || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="rounded p-1.5 text-green-600 transition hover:bg-green-50"
                          title={t('common.edit')}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          className="rounded p-1.5 text-red-600 transition hover:bg-red-50"
                          title={t('common.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
          <div>
            {t('common.showing')}{' '}
            {filteredProducts.length === 0 ? 0 : startIndex + 1} {t('common.to')}{' '}
            {endIndex} {t('common.of')} {filteredProducts.length} {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || filteredProducts.length === 0}
              className="rounded border border-gray-300 px-3 py-1 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.previous')}
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || filteredProducts.length === 0}
              className="rounded border border-gray-300 px-3 py-1 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingProduct ? t('products.modalEditTitle') : t('products.modalAddTitle')}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 transition hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-800">
                    {t('products.fieldName')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-800">
                    {t('products.fieldDescription')}
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-800">
                    {t('products.fieldWeight')}
                  </label>
                  <input
                    type="text"
                    value={formData.unit_weight}
                    onChange={(e) => setFormData({ ...formData, unit_weight: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-6 w-full rounded bg-[#0F3C66] py-2.5 text-sm font-medium text-white transition hover:bg-[#154b8a]"
              >
                {t('products.saveButton')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
