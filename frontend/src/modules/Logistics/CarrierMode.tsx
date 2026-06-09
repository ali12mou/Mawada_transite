import { useState, useEffect, useMemo } from 'react';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { Pencil, Settings2, Trash2, X } from 'lucide-react';

interface CarrierMode {
  id: string;
  _id?: string;
  name: string;
  created_at?: string;
}

function rowId(row: { _id?: string; id?: string }): string {
  return row._id || row.id || '';
}

function displayModeName(name: string): string {
  if (!name) return '—';
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

function SortIcon() {
  return (
    <span className="ml-1 inline-flex flex-col text-[8px] leading-none text-gray-400">
      <span>▲</span>
      <span>▼</span>
    </span>
  );
}

export function CarrierMode() {
  const { t } = useLanguage();
  const [modes, setModes] = useState<CarrierMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMode, setEditingMode] = useState<CarrierMode | null>(null);

  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    void fetchModes();
  }, []);

  const fetchModes = async () => {
    try {
      const data = await genericApi.list<CarrierMode>('carrier_modes');
      setModes(data || []);
    } catch (error) {
      console.error('Error fetching carrier modes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredModes = useMemo(() => {
    if (!searchTerm.trim()) return modes;
    const q = searchTerm.toLowerCase();
    return modes.filter((mode) =>
      displayModeName(mode.name).toLowerCase().includes(q)
    );
  }, [modes, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredModes.length / entriesPerPage));
  const startIndex = filteredModes.length === 0 ? 0 : (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, filteredModes.length);
  const currentModes = filteredModes.slice(startIndex, endIndex);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: formData.name.trim() };

    try {
      if (editingMode) {
        await genericApi.update('carrier_modes', rowId(editingMode), payload);
      } else {
        await genericApi.create('carrier_modes', payload);
      }
      closeModal();
      void fetchModes();
    } catch (error) {
      console.error('Error saving carrier mode:', error);
    }
  };

  const handleEdit = (mode: CarrierMode) => {
    setEditingMode(mode);
    setFormData({ name: displayModeName(mode.name) });
    setShowModal(true);
  };

  const handleDelete = async (mode: CarrierMode) => {
    if (!confirm(t('carrierMode.deleteConfirm'))) return;
    try {
      await genericApi.delete('carrier_modes', rowId(mode));
      void fetchModes();
    } catch (error) {
      console.error('Error deleting carrier mode:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '' });
    setEditingMode(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const openAddModal = () => {
    setEditingMode(null);
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
    'px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800">{t('carrierMode.title')}</h2>
          <Settings2 size={24} className="text-gray-600" />
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="rounded bg-[#0F3C66] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#154b8a]"
        >
          {t('carrierMode.addButton')}
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
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>{t('common.entries')}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={t('common.search')}
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
                  {t('carrierMode.colId')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('carrierMode.colName')}
                  <SortIcon />
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  {t('common.action')}
                  <SortIcon />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentModes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-gray-500">
                    {t('carrierMode.empty')}
                  </td>
                </tr>
              ) : (
                currentModes.map((mode, index) => (
                  <tr key={rowId(mode)} className="transition hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{startIndex + index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {displayModeName(mode.name)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(mode)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100"
                          title={t('common.edit')}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(mode)}
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
            {filteredModes.length === 0 ? 0 : startIndex + 1} {t('common.to')}{' '}
            {endIndex} {t('common.of')} {filteredModes.length} {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || filteredModes.length === 0}
              className="rounded border border-gray-300 px-3 py-1 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`rounded px-3 py-1 transition ${
                  currentPage === page
                    ? 'bg-[#0F3C66] text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || filteredModes.length === 0}
              className="rounded border border-gray-300 px-3 py-1 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">{t('carrierMode.modalTitle')}</h3>
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
                  {t('carrierMode.fieldName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                  required
                />
              </div>

              <div className="mt-6 flex justify-end border-t border-gray-200 pt-5">
                <button
                  type="submit"
                  className="rounded bg-[#0F3C66] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#154b8a]"
                >
                  {t('carrierMode.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
