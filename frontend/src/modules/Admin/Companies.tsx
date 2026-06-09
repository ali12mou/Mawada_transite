import { useState, useEffect, useMemo } from 'react';
import { Pencil, Plus, Building2, Trash2, X } from 'lucide-react';
import {
  fetchCompanies as fetchCompaniesApi,
  createCompany,
  updateCompany,
  deleteCompany,
  type CompanyRecord,
} from '../../api/companiesApi';
import { useLanguage } from '../../contexts/LanguageContext';

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

export function Companies() {
  const { t } = useLanguage();
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({ name: '', address: '' });

  const loadCompanies = async () => {
    const data = await fetchCompaniesApi();
    setCompanies(data);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchCompaniesApi();
        if (!cancelled) setCompanies(data);
      } catch (error) {
        console.error('Error fetching companies:', error);
        if (!cancelled) {
          alert(error instanceof Error ? error.message : t('companies.errorLoad'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) return companies;
    const q = searchTerm.toLowerCase();
    return companies.filter(
      (company) =>
        company.name.toLowerCase().includes(q) ||
        (company.address || '').toLowerCase().includes(q)
    );
  }, [companies, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / entriesPerPage));
  const page = Math.min(currentPage, totalPages);
  const startIndex = filteredCompanies.length === 0 ? 0 : (page - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, filteredCompanies.length);
  const currentCompanies = filteredCompanies.slice(startIndex, endIndex);
  const pageItems = buildPageItems(page, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, entriesPerPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
      };
      if (editingId) {
        await updateCompany(editingId, payload);
      } else {
        await createCompany(payload);
      }
      closeModal();
      await loadCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
      alert(error instanceof Error ? error.message : t('companies.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (company: CompanyRecord) => {
    setFormData({
      name: company.name,
      address: company.address || '',
    });
    setEditingId(company.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('companies.deleteConfirm'))) return;
    try {
      await deleteCompany(id);
      await loadCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      alert(error instanceof Error ? error.message : t('companies.errorDelete'));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', address: '' });
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
          <h2 className="text-2xl font-bold text-gray-800">{t('companies.manageTitle')}</h2>
          <Building2 size={24} className="text-gray-600" />
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded bg-[#0F3C66] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#154b8a]"
        >
          <Plus size={16} />
          {t('companies.addButton')}
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
            <span>{t('companies.searchLabel')}</span>
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
                  {t('companies.colName')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('companies.colAddress')}
                  <SortIcon />
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  {t('common.action')}
                  <SortIcon />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentCompanies.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-gray-500">
                    {t('companies.empty')}
                  </td>
                </tr>
              ) : (
                currentCompanies.map((company, idx) => (
                  <tr
                    key={company.id}
                    className={`transition hover:bg-gray-50 ${idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}`}
                  >
                    <td className="px-4 py-3 font-medium uppercase text-gray-900">
                      {company.name}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{company.address || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(company)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-green-200 bg-green-50 text-green-600 transition hover:bg-green-100"
                          title={t('common.edit')}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(company.id)}
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
            {filteredCompanies.length === 0 ? 0 : startIndex + 1} {t('common.to')}{' '}
            {endIndex} {t('common.of')} {filteredCompanies.length} {t('common.entries')}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || filteredCompanies.length === 0}
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
              disabled={page >= totalPages || filteredCompanies.length === 0}
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
              <h3 className="text-lg font-bold text-gray-900">{t('companies.modalTitle')}</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 transition hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-800">
                    {t('companies.colName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 outline-none focus:border-[#0F3C66] focus:bg-white focus:ring-1 focus:ring-[#0F3C66]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-800">
                    {t('companies.colAddress')}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 outline-none focus:border-[#0F3C66] focus:bg-white focus:ring-1 focus:ring-[#0F3C66]"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end border-t border-gray-200 pt-5">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-[#0F3C66] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#154b8a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? '…' : t('companies.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
