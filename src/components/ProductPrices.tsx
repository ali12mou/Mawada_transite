import { useState, useEffect } from 'react';
import { Pencil, Trash2, X, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

interface Product {
  id: string;
  name: string;
}

interface ProductPrice {
  id: string;
  product_id: string;
  price: number;
  effective_date: string;
  created_at: string;
  products?: {
    name: string;
  };
}

export function ProductPrices() {
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    product_id: '',
    price: 0,
    effective_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchPrices();
    fetchProducts();
  }, []);

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('product_prices')
        .select(`
          *,
          products (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrices(data || []);
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('product_prices')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_prices')
          .insert([formData]);

        if (error) throw error;
      }

      resetForm();
      fetchPrices();
    } catch (error) {
      console.error('Error saving price:', error);
    }
  };

  const handleEdit = (price: ProductPrice) => {
    setFormData({
      product_id: price.product_id,
      price: price.price,
      effective_date: price.effective_date,
    });
    setEditingId(price.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('products.deletePriceConfirm'))) {
      try {
        const { error } = await supabase
          .from('product_prices')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchPrices();
      } catch (error) {
        console.error('Error deleting price:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      price: 0,
      effective_date: new Date().toISOString().split('T')[0],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredPrices = prices.filter(price =>
    price.products?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredPrices.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const pagedPrices = filteredPrices.slice(startIndex, startIndex + entriesPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800">{t('products.pricesTitle')}</h2>
          <Tag size={24} className="text-gray-600" />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-[#EE964C]">{t('common.version')}</div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#0F3C66] text-white rounded hover:bg-[#154b8a] transition shadow-sm"
          >
            {t('common.add')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{t('common.show')}</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>{t('common.entries')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('common.search')}:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('products.colProductName')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('products.colPrice')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('products.colEffectiveDate')}</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {pagedPrices?.map((price) => (
                <tr key={price.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-900 font-medium">{price.products?.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-900">{formatAmount(price.price)}</td>
                  <td className="px-4 py-3 text-gray-900">
                    {new Date(price.effective_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(price)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(price.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pagedPrices.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">
                    {t('products.emptyPrices')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
          <div>
            {t('common.showing')} {startIndex + 1} {t('common.to')} {Math.min(startIndex + entriesPerPage, filteredPrices.length)} {t('common.of')} {filteredPrices.length} {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {t('common.previous')}
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded transition ${currentPage === page
                      ? 'bg-[#0F3C66] text-white shadow-sm'
                      : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F3C66] text-white">
              <h3 className="text-lg font-bold">
                {editingId ? t('products.modalPriceTitleUpdate') : t('products.modalPriceTitleAdd')}
              </h3>
              <button onClick={resetForm} className="text-white/80 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t('products.colProductName')} <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent outline-none transition"
                >
                  <option value="">{t('products.selectProduct')}</option>
                  {products?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t('products.colPrice')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t('products.colEffectiveDate')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.effective_date}
                  onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-medium bg-[#0F3C66] text-white rounded hover:bg-[#154b8a] transition shadow-sm"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


