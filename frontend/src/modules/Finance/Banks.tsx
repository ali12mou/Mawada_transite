import { useState, useEffect, useMemo } from 'react';
import { Pencil, Trash2, Building2, X } from 'lucide-react';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';

interface Bank {
  id: string;
  _id?: string;
  name: string;
  created_at?: string;
}

function rowId(row: { _id?: string; id?: string }): string {
  return row._id || row.id || '';
}

function SortIcon() {
  return (
    <span className="ml-1 inline-flex flex-col text-[8px] leading-none text-gray-400">
      <span>▲</span>
      <span>▼</span>
    </span>
  );
}

function buildPageItems(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items: (number | 'ellipsis')[] = [1];
  if (current > 3) items.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p += 1) {
    items.push(p);
  }
  if (current < total - 2) items.push('ellipsis');
  items.push(total);
  return items;
}

export function Banks() {
  const { t } = useLanguage();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    void fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const data = await genericApi.list<Bank>('banks');
      setBanks(data || []);
    } catch (error) {
      console.error('Error fetching banks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBanks = useMemo(() => {
    if (!searchTerm.trim()) return banks;
    const q = searchTerm.toLowerCase();
    return banks.filter((bank) => bank.name?.toLowerCase().includes(q));
  }, [banks, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredBanks.length / entriesPerPage));
  const page = Math.min(currentPage, totalPages);
  const startIndex = filteredBanks.length === 0 ? 0 : (page - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, filteredBanks.length);
  const currentBanks = filteredBanks.slice(startIndex, endIndex);
  const pageItems = buildPageItems(page, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, entriesPerPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: formData.name.trim() };

    try {
      if (editingId) {
        await genericApi.update('banks', editingId, payload);
      } else {
        await genericApi.create('banks', payload);
      }
      closeModal();
      void fetchBanks();
    } catch (error) {
      console.error('Error saving bank:', error);
    }
  };

  const handleEdit = (bank: Bank) => {
    setFormData({ name: bank.name || '' });
    setEditingId(rowId(bank));
    setShowForm(true);
  };

  const handleDelete = async (bank: Bank) => {
    if (!confirm(t('banks.deleteConfirm'))) return;
    try {
      await genericApi.delete('banks', rowId(bank));
      void fetchBanks();
    } catch (error) {
      console.error('Error deleting bank:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '' });
    setEditingId(null);
  };

  const closeModal = () => {
    setShowForm(false);
    resetForm();
  };

  const openAddModal = () => {
    resetForm();
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  const thClass =
    'px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800">{t('banks.manageTitle')}</h2>
          <Building2 size={24} className="text-gray-600" />
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="rounded bg-[#0F3C66] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#154b8a]"
        >
          {t('banks.addButton')}
        </button>
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
            <span>{t('banks.searchLabel')}</span>
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
                <th className={thClass}>
                  {t('banks.colName')}
                  <SortIcon />
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  {t('common.action')}
                  <SortIcon />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentBanks.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-10 text-center text-gray-500">
                    {t('banks.noData')}
                  </td>
                </tr>
              ) : (
                currentBanks.map((bank) => (
                  <tr key={rowId(bank)} className="transition hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{bank.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(bank)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100"
                          title={t('common.edit')}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(bank)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                          title={t('common.delete')}
                        >
                          <Trash2 size={14} />
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
            {filteredBanks.length === 0 ? 0 : startIndex + 1} {t('common.to')}{' '}
            {endIndex} {t('common.of')} {filteredBanks.length} {t('common.entries')}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || filteredBanks.length === 0}
              className="rounded border border-gray-300 px-3 py-1 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.previous')}
            </button>
            {pageItems.map((item, idx) =>
              item === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-gray-500">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCurrentPage(item)}
                  className={`rounded px-3 py-1 transition ${
                    page === item
                      ? 'bg-[#0F3C66] text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {item}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || filteredBanks.length === 0}
              className="rounded border border-gray-300 px-3 py-1 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">{t('banks.modalTitle')}</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 transition hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5">
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-800">
                  {t('banks.fieldBankName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 outline-none focus:border-[#0F3C66] focus:bg-white focus:ring-1 focus:ring-[#0F3C66]"
                  required
                />
              </div>

              <div className="mt-6 flex justify-end border-t border-gray-200 pt-5">
                <button
                  type="submit"
                  className="rounded bg-[#0F3C66] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#154b8a]"
                >
                  {t('banks.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
