import { useState, useEffect } from 'react';
import { Pencil, Trash2, Building2, Plus, Search } from 'lucide-react';
import {
  fetchCompanies as fetchCompaniesApi,
  createCompany,
  updateCompany,
  deleteCompany,
  type CompanyRecord,
} from '../../api/companiesApi';
import { useLanguage } from '../../contexts/LanguageContext';
import Modal from '../Shared/common/Modal';
import { ActionMenu } from '../Shared/common/ActionMenu';

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
  const [formData, setFormData] = useState({
    name: '',
    address: '',
  });

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
          alert(
            error instanceof Error
              ? error.message
              : t('companies.errorLoad')
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateCompany(editingId, {
          name: formData.name.trim(),
          address: formData.address.trim(),
        });
      } else {
        await createCompany({
          name: formData.name.trim(),
          address: formData.address.trim(),
        });
      }
      resetForm();
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
    setFormData({
      name: '',
      address: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredCompanies = companies.filter(
    company =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentCompanies = filteredCompanies.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(p => Math.min(p, totalPages));
  }, [totalPages, filteredCompanies.length]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#0F3C66]">{t('companies.manageTitle')}</h1>
          <Building2 size={24} className="text-[#0F3C66] opacity-80" />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-[#EE964C]">{t('common.version')}</div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20 font-bold hover:bg-[#154b8a] transition active:scale-95 flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            {t('common.add')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">{t('common.show')}</span>
            <select
              value={entriesPerPage}
              onChange={e => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3C66]/20 outline-none transition text-sm font-medium"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm font-medium text-gray-600">{t('common.entries')}</span>
          </div>
          <div className="relative w-72">
            <input
              type="text"
              placeholder={`${t('common.search')}...`}
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20 focus:border-[#0F3C66] transition shadow-sm text-sm"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-[#0F3C66] text-white">
              <tr>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">
                  {t('companies.colName')}
                </th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">
                  {t('companies.colAddress')}
                </th>
                <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider w-24">
                  {t('common.action')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {currentCompanies?.map(company => (
                <tr key={company.id} className="hover:bg-[#0F3C66]/5 transition group">
                  <td className="px-5 py-4 text-sm font-bold text-[#0F3C66]">{company.name}</td>
                  <td className="px-5 py-4 text-sm text-gray-600 font-medium">{company.address || 'N/A'}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionMenu
                        actions={[
                          {
                            label: t('common.edit'),
                            icon: <Pencil size={16} />,
                            onClick: () => handleEdit(company),
                          },
                          {
                            label: t('common.delete'),
                            icon: <Trash2 size={16} />,
                            onClick: () => void handleDelete(company.id),
                            variant: 'danger',
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {currentCompanies.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-gray-500 italic">
                    {t('common.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-between items-center text-sm">
          <div className="text-gray-500 font-medium">
            {filteredCompanies.length === 0
              ? '—'
              : <>{t('common.showing')} <span className="font-bold text-gray-900">{startIndex + 1}</span> {t('common.to')} <span className="font-bold text-gray-900">{Math.min(endIndex, filteredCompanies.length)}</span> {t('common.of')} <span className="font-bold text-gray-900">{filteredCompanies.length}</span> {t('common.entries')}</>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm font-bold text-sm text-[#0F3C66]"
            >
              {t('commercial.previous') || t('common.previous')}
            </button>
            <div className="px-4 py-2 font-bold text-sm text-gray-700">
              {currentPage} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm font-bold text-sm text-[#0F3C66]"
            >
              {t('commercial.next') || t('common.next')}
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editingId ? t('companies.modalTitleUpdate') : t('companies.modalTitleAdd')}
        size="md"
      >
        <form onSubmit={e => void handleSubmit(e)} className="space-y-5 p-2">
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                {t('companies.colName')} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                {t('companies.colAddress')}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6 text-sm">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition active:scale-95 font-bold"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20 font-bold hover:bg-[#154b8a] transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? '…' : t('common.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


