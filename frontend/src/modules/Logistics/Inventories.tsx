import { useState, useEffect, useMemo } from 'react';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { Download, Pencil, Trash2, X } from 'lucide-react';

interface Product {
  id: string;
  _id?: string;
  name: string;
}

interface Warehouse {
  id: string;
  _id?: string;
  name: string;
}

interface Inventory {
  id: string;
  _id?: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  last_updated: string;
  products?: Product;
  warehouses?: Warehouse;
}

type SortKey = 'id' | 'product' | 'warehouse' | 'quantity' | 'last_updated';
type SortDir = 'asc' | 'desc';

function rowId(row: { _id?: string; id: string }): string {
  return row._id || row.id;
}

function SortIcon() {
  return (
    <span className="ml-1 inline-flex flex-col text-[8px] leading-none text-gray-400">
      <span>▲</span>
      <span>▼</span>
    </span>
  );
}

export function Inventories() {
  const { t, language } = useLanguage();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('product');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const productName = (inventory: Inventory): string => {
    const fromJoin = inventory.products?.name;
    if (fromJoin) return fromJoin;
    const p = products.find((x) => rowId(x) === inventory.product_id);
    return p?.name || t('inventories.unknownProduct');
  };

  const warehouseName = (inventory: Inventory): string => {
    const fromJoin = inventory.warehouses?.name;
    if (fromJoin) return fromJoin;
    const w = warehouses.find((x) => rowId(x) === inventory.warehouse_id);
    return w?.name || '—';
  };

  const fetchData = async () => {
    try {
      const [inventoriesRes, productsRes, warehousesRes] = await Promise.all([
        genericApi.list('inventories'),
        genericApi.list('products'),
        genericApi.list('warehouses'),
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

  const filteredInventories = useMemo(() => {
    let list = [...inventories];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((inv) => {
        const pn = productName(inv).toLowerCase();
        const wn = warehouseName(inv).toLowerCase();
        return (
          rowId(inv).toLowerCase().includes(q) ||
          pn.includes(q) ||
          wn.includes(q) ||
          String(inv.quantity).includes(q)
        );
      });
    }
    list.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      switch (sortKey) {
        case 'id':
          av = rowId(a);
          bv = rowId(b);
          break;
        case 'product':
          av = productName(a).toLowerCase();
          bv = productName(b).toLowerCase();
          break;
        case 'warehouse':
          av = warehouseName(a).toLowerCase();
          bv = warehouseName(b).toLowerCase();
          break;
        case 'quantity':
          av = Number(a.quantity) || 0;
          bv = Number(b.quantity) || 0;
          break;
        case 'last_updated':
          av = a.last_updated || '';
          bv = b.last_updated || '';
          break;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [inventories, products, warehouses, searchTerm, sortKey, sortDir, t]);

  const totalPages = Math.max(1, Math.ceil(filteredInventories.length / entriesPerPage));
  const startIndex = filteredInventories.length === 0 ? 0 : (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, filteredInventories.length);
  const currentRows = filteredInventories.slice(startIndex, endIndex);

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
      if (editingInventory) {
        await genericApi.update('inventories', rowId(editingInventory), formData);
      } else {
        await genericApi.create('inventories', formData);
      }
      closeModal();
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
      quantity: inventory.quantity || 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (inventory: Inventory) => {
    if (!confirm(t('common.deleteConfirm'))) return;
    try {
      await genericApi.delete('inventories', rowId(inventory));
      fetchData();
    } catch (error) {
      console.error('Error deleting inventory:', error);
    }
  };

  const resetForm = () => {
    setFormData({ product_id: '', warehouse_id: '', quantity: 0 });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingInventory(null);
    resetForm();
  };

  const openAddModal = () => {
    setEditingInventory(null);
    resetForm();
    setShowModal(true);
  };

  const fmtDate = (iso: string) => {
    if (!iso) return '—';
    const loc = language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-SA' : 'en-US';
    return new Date(iso).toLocaleDateString(loc, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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
        <h2 className="text-2xl font-bold text-gray-800">{t('inventories.title')}</h2>
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
                  {t('inventories.colId')}
                  <SortIcon />
                </th>
                <th className={thClass} onClick={() => toggleSort('product')}>
                  {t('inventories.colProduct')}
                  <SortIcon />
                </th>
                <th className={thClass} onClick={() => toggleSort('warehouse')}>
                  {t('inventories.colWarehouse')}
                  <SortIcon />
                </th>
                <th className={thClass} onClick={() => toggleSort('quantity')}>
                  {t('inventories.colQuantity')}
                  <SortIcon />
                </th>
                <th className={thClass} onClick={() => toggleSort('last_updated')}>
                  {t('inventories.colLastUpdate')}
                  <SortIcon />
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  {t('common.action')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                currentRows.map((inventory) => (
                  <tr key={rowId(inventory)} className="transition hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{rowId(inventory)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{productName(inventory)}</td>
                    <td className="px-4 py-3 text-gray-700">{warehouseName(inventory)}</td>
                    <td className="px-4 py-3 text-gray-700">{inventory.quantity}</td>
                    <td className="px-4 py-3 text-gray-700">{fmtDate(inventory.last_updated)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(inventory)}
                          className="rounded p-1.5 text-green-600 transition hover:bg-green-50"
                          title={t('common.edit')}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(inventory)}
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
            {filteredInventories.length === 0 ? 0 : startIndex + 1} {t('common.to')}{' '}
            {endIndex} {t('common.of')} {filteredInventories.length} {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || filteredInventories.length === 0}
              className="rounded border border-gray-300 px-3 py-1 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.previous')}
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || filteredInventories.length === 0}
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
                {editingInventory ? t('inventories.modalEditTitle') : t('inventories.modalAddTitle')}
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
                    {t('inventories.fieldProduct')}
                  </label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                    required
                  >
                    <option value="">{t('inventories.selectProduct')}</option>
                    {products.map((product) => (
                      <option key={rowId(product)} value={rowId(product)}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-800">
                    {t('inventories.fieldWarehouse')}
                  </label>
                  <select
                    value={formData.warehouse_id}
                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                    required
                  >
                    <option value="">{t('inventories.selectWarehouse')}</option>
                    {warehouses.map((warehouse) => (
                      <option key={rowId(warehouse)} value={rowId(warehouse)}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-800">
                    {t('inventories.fieldQuantity')}
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                    required
                    min={0}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-6 w-full rounded bg-[#0F3C66] py-2.5 text-sm font-medium text-white transition hover:bg-[#154b8a]"
              >
                {t('inventories.saveButton')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
