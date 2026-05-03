import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight, Warehouse as WarehouseIcon, Search, MapPin } from 'lucide-react';
import { ActionMenu } from '../Shared/common/ActionMenu';

interface Warehouse {
  id: string;
  name: string;
  location: string;
  description: string;
  created_at: string;
}

const COLLECTION = 'warehouses';

export function Warehouse() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    filterWarehouses();
  }, [warehouses, searchTerm]);

  const fetchWarehouses = async () => {
    try {
      const data = await genericApi.list<Warehouse>(COLLECTION);
      setWarehouses(data || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterWarehouses = () => {
    let filtered = [...warehouses];

    if (searchTerm) {
      filtered = filtered.filter(warehouse =>
        warehouse.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouse.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredWarehouses(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingWarehouse) {
        await genericApi.update(COLLECTION, editingWarehouse.id, {
          ...formData,
          updated_at: new Date().toISOString()
        });
      } else {
        await genericApi.create(COLLECTION, {
          ...formData,
          created_by: user?.id,
          created_at: new Date().toISOString()
        });
      }

      setShowModal(false);
      setEditingWarehouse(null);
      resetForm();
      fetchWarehouses();
    } catch (error) {
      console.error('Error saving warehouse:', error);
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name || '',
      location: warehouse.location || '',
      description: warehouse.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.deleteConfirm'))) return;

    try {
      await genericApi.delete(COLLECTION, id);
      fetchWarehouses();
    } catch (error) {
      console.error('Error deleting warehouse:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      description: ''
    });
  };

  const totalPages = Math.ceil(filteredWarehouses.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentWarehouses = filteredWarehouses.slice(startIndex, endIndex);

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
            <WarehouseIcon size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {t('warehouse.title')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('warehouse.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setEditingWarehouse(null);
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0F3C66] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0F3C66]/20 transition hover:bg-[#152a44]"
          >
            <Plus size={20} />
            {t('warehouse.addButton')}
          </button>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50">
              PDF
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50">
              Excel
            </button>
          </div>
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
                {[5, 10, 25, 50].map((n) => (
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
                placeholder={t('warehouse.searchPlaceholder')}
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
                <th className="px-6 py-4">{t('warehouse.colId')}</th>
                <th className="px-6 py-4">{t('warehouse.colName')}</th>
                <th className="px-6 py-4">{t('warehouse.colLocation')}</th>
                <th className="px-6 py-4">{t('warehouse.colCapacity')}</th>
                <th className="px-6 py-4 text-center">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentWarehouses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <WarehouseIcon size={40} className="text-gray-200" />
                      <span>{t('warehouse.empty')}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentWarehouses.map((warehouse, index) => (
                  <tr key={warehouse.id} className="transition hover:bg-[#0F3C66]/[0.02]">
                    <td className="px-6 py-4 font-medium text-gray-400">
                      #{startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {warehouse.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} className="text-gray-400" />
                        {warehouse.location || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {warehouse.description ? (
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-700/10">
                          {warehouse.description}
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
                              onClick: () => handleEdit(warehouse),
                            },
                            {
                              label: t('common.delete'),
                              icon: <Trash2 size={16} />,
                              onClick: () => handleDelete(warehouse.id),
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
              {t('common.showing')} {startIndex + 1} {t('common.to')} {Math.min(endIndex, filteredWarehouses.length)} {t('common.of')} {filteredWarehouses.length} {t('common.entries')}
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
                {editingWarehouse ? t('warehouse.modalEditTitle') : t('warehouse.modalAddTitle')}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingWarehouse(null);
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
                    {t('warehouse.fieldName')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/15"
                    placeholder={t('warehouse.placeholderName')}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('warehouse.fieldLocation')}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm font-medium text-gray-900 transition focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/15"
                      placeholder={t('warehouse.placeholderLocation')}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('warehouse.fieldCapacity')}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/15"
                    placeholder={t('warehouse.placeholderCapacity')}
                  />
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingWarehouse(null);
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
