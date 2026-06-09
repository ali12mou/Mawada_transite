import { useState, useEffect, useMemo } from 'react';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { Pencil, Trash2, Users, X } from 'lucide-react';

interface ShippingLine {
  id: string;
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
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

export function ShippingLines() {
  const { t } = useLanguage();
  const [shippingLines, setShippingLines] = useState<ShippingLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingLine, setEditingLine] = useState<ShippingLine | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    void fetchShippingLines();
  }, []);

  const fetchShippingLines = async () => {
    try {
      const data = await genericApi.list<ShippingLine>('shipping_lines');
      setShippingLines(data || []);
    } catch (error) {
      console.error('Error fetching shipping lines:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLines = useMemo(() => {
    if (!searchTerm.trim()) return shippingLines;
    const q = searchTerm.toLowerCase();
    return shippingLines.filter(
      (line) =>
        line.name?.toLowerCase().includes(q) ||
        line.email?.toLowerCase().includes(q) ||
        line.phone?.toLowerCase().includes(q) ||
        line.address?.toLowerCase().includes(q)
    );
  }, [shippingLines, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredLines.length / entriesPerPage));
  const startIndex = filteredLines.length === 0 ? 0 : (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, filteredLines.length);
  const currentLines = filteredLines.slice(startIndex, endIndex);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
    };

    try {
      if (editingLine) {
        await genericApi.update('shipping_lines', rowId(editingLine), payload);
      } else {
        await genericApi.create('shipping_lines', payload);
      }
      closeModal();
      void fetchShippingLines();
    } catch (error) {
      console.error('Error saving shipping line:', error);
    }
  };

  const handleEdit = (line: ShippingLine) => {
    setEditingLine(line);
    setFormData({
      name: line.name || '',
      email: line.email || '',
      phone: line.phone || '',
      address: line.address || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (line: ShippingLine) => {
    if (!confirm(t('shippingLines.deleteConfirm'))) return;
    try {
      await genericApi.delete('shipping_lines', rowId(line));
      void fetchShippingLines();
    } catch (error) {
      console.error('Error deleting shipping line:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', address: '' });
    setEditingLine(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const openAddModal = () => {
    setEditingLine(null);
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
          <h2 className="text-2xl font-bold text-gray-800">{t('shippingLines.manageTitle')}</h2>
          <Users size={24} className="text-gray-600" />
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="rounded bg-[#0F3C66] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#154b8a]"
        >
          {t('shippingLines.addButton')}
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
                  {t('shippingLines.colName')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('shippingLines.colPhone')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('shippingLines.colEmail')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('shippingLines.colAddress')}
                  <SortIcon />
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  {t('common.action')}
                  <SortIcon />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentLines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    {t('shippingLines.empty')}
                  </td>
                </tr>
              ) : (
                currentLines.map((line) => (
                  <tr key={rowId(line)} className="transition hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{line.name}</td>
                    <td className="px-4 py-3 text-gray-700">{line.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{line.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{line.address || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(line)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100"
                          title={t('common.edit')}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(line)}
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
            {filteredLines.length === 0 ? 0 : startIndex + 1} {t('common.to')}{' '}
            {endIndex} {t('common.of')} {filteredLines.length} {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || filteredLines.length === 0}
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
              disabled={currentPage >= totalPages || filteredLines.length === 0}
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
              <h3 className="text-lg font-bold text-gray-900">{t('shippingLines.modalTitle')}</h3>
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
                    {t('shippingLines.colName')} <span className="text-red-500">*</span>
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
                    {t('shippingLines.colEmail')}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-800">
                    {t('shippingLines.colPhone')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-800">
                    {t('shippingLines.colAddress')}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end border-t border-gray-200 pt-5">
                <button
                  type="submit"
                  className="rounded bg-[#0F3C66] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#154b8a]"
                >
                  {t('shippingLines.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
