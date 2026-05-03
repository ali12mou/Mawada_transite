import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Edit2, Trash2, Download, X, ClipboardList, Package, Warehouse as WarehouseIcon, Search } from 'lucide-react';
import { ActionMenu } from '../Shared/common/ActionMenu';

interface Product {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
}

interface Inventory {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  last_updated: string;
  products?: Product;
  warehouses?: Warehouse;
}

export function Inventories() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);

  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [inventoriesRes, productsRes, warehousesRes] = await Promise.all([
        genericApi.list('inventories'),
        genericApi.list('products'),
        genericApi.list('warehouses')
      ]);

      setInventories(inventoriesRes || []);
      setProducts(productsRes || []);
      setWarehouses(warehousesRes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingInventory) {
        const idToUpdate = (editingInventory as any)._id || editingInventory.id;
        await genericApi.update('inventories', idToUpdate, formData);
      } else {
        await genericApi.create('inventories', formData);
      }

      setShowModal(false);
      setEditingInventory(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving inventory:', error);
      alert(t('inventories.errorUnique'));
    }
  };

  const handleEdit = (inventory: Inventory) => {
    setEditingInventory(inventory);
    setFormData({
      product_id: inventory.product_id || '',
      warehouse_id: inventory.warehouse_id || '',
      quantity: inventory.quantity || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (inventory: any) => {
    if (!confirm(t('common.deleteConfirm'))) return;
    const idToDelete = inventory._id || inventory.id;

    try {
      if (!idToDelete) throw new Error('ID missing');
      await genericApi.delete('inventories', idToDelete);
      fetchData();
    } catch (error) {
      console.error('Error deleting inventory:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      warehouse_id: '',
      quantity: 0
    });
  };

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
            <ClipboardList size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {t('inventories.title')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('inventories.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setEditingInventory(null);
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0F3C66] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0F3C66]/20 transition hover:bg-[#152a44]"
          >
            <Plus size={20} />
            {t('inventories.addButton')}
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{t('common.show')}</span>
                <select className="rounded-lg border border-gray-200 bg-white px-2 py-1 font-medium text-gray-900 focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20">
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <span>{t('common.entries')}</span>
              </div>
            </div>

            <div className="relative min-w-[280px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('inventories.searchPlaceholder')}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto text-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">{t('inventories.colProduct')}</th>
                <th className="px-6 py-4">{t('inventories.colWarehouse')}</th>
                <th className="px-6 py-4">{t('inventories.colQuantity')}</th>
                <th className="px-6 py-4">{t('inventories.colLastUpdate')}</th>
                <th className="px-6 py-4 text-center">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Package size={40} className="text-gray-200" />
                      <span>{t('inventories.empty')}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                inventories.map((inventory, index) => {
                  const pId = (inventory as any)._id || inventory.id;
                  const productName = products.find(p => (p as any)._id === inventory.product_id || p.id === inventory.product_id)?.name || inventory.products?.name || t('inventories.unknownProduct');
                  const warehouseName = warehouses.find(w => (w as any)._id === inventory.warehouse_id || w.id === inventory.warehouse_id)?.name || inventory.warehouses?.name || '—';

                  return (
                    <tr key={pId} className="transition hover:bg-[#0F3C66]/[0.02]">
                      <td className="px-6 py-4 font-medium text-gray-400">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-gray-400" />
                          {productName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-medium text-[#0F3C66]">
                          <WarehouseIcon size={16} className="text-gray-400" />
                          {warehouseName}
                        </div>
                      </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {inventory.quantity}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {inventory.last_updated
                        ? new Date(inventory.last_updated).toLocaleDateString(language === 'fr' ? 'fr-FR' : (language === 'ar' ? 'ar-SA' : 'en-US'), {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <ActionMenu
                          actions={[
                            {
                              label: t('common.edit'),
                              icon: <Edit2 size={16} />,
                              onClick: () => handleEdit(inventory),
                            },
                            {
                              label: t('common.delete'),
                              icon: <Trash2 size={16} />,
                              onClick: () => handleDelete(inventory),
                              variant: 'danger',
                            },
                          ]}
                        />
                      </div>
                    </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 bg-white px-6 py-4 text-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-gray-600">
              {t('common.showing')} 1 {t('common.to')} {inventories.length} {t('common.of')} {inventories.length} {t('common.entries')}
            </p>

            <div className="flex items-center gap-2 text-blue-600 hover:underline cursor-pointer font-medium">
              {t('inventories.showMore')}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-gray-100 bg-slate-50/50 p-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingInventory ? t('inventories.modalEditTitle') : t('inventories.modalAddTitle')}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingInventory(null);
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
                    {t('inventories.fieldProduct')}
                  </label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/15"
                    required
                  >
                    <option value="">{t('inventories.selectProduct')}</option>
                    {products?.map((product) => {
                      const pId = (product as any)._id || product.id;
                      return (
                        <option key={pId} value={pId}>
                          {product.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('inventories.fieldWarehouse')}
                  </label>
                  <select
                    value={formData.warehouse_id}
                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/15 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]"
                    required
                  >
                    <option value="">{t('inventories.selectWarehouse')}</option>
                    {warehouses?.map((warehouse) => {
                      const wId = (warehouse as any)._id || warehouse.id;
                      return (
                        <option key={wId} value={wId}>
                          {warehouse.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('inventories.fieldQuantity')}
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/15"
                    required
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingInventory(null);
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



