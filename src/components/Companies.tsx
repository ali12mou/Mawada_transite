import { useState, useEffect } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import {
  fetchCompanies as fetchCompaniesApi,
  createCompany,
  updateCompany,
  deleteCompany,
  type CompanyRecord,
} from '../api/companiesApi';
import { useLanguage } from '../contexts/LanguageContext';

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
              : 'Impossible de charger les entreprises. Vérifiez que l’API est démarrée.'
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
      alert(error instanceof Error ? error.message : 'Enregistrement impossible.');
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) return;
    try {
      await deleteCompany(id);
      await loadCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      alert(error instanceof Error ? error.message : 'Suppression impossible.');
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Gérer les Entreprises Vendeuses</h2>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            {t('common.version')}
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded bg-[#1e3a5f] px-4 py-2 text-white transition hover:bg-[#2d4a6f]"
          >
            + Ajouter Nouveau
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('common.show')}</span>
            <select
              value={entriesPerPage}
              onChange={e => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border border-gray-300 px-3 py-1 focus:border-transparent focus:ring-2 focus:ring-[#1e3a5f]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">{t('common.entries')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('common.search')}:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded border border-gray-300 px-3 py-1 focus:border-transparent focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Nom de l'entreprise
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Adresse</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentCompanies.map(company => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{company.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{company.address || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(company)}
                        className="rounded p-1.5 text-green-600 transition hover:bg-green-50"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(company.id)}
                        className="rounded p-1.5 text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentCompanies.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {filteredCompanies.length === 0
              ? '—'
              : `${t('common.showing')} ${startIndex + 1} ${t('common.to')} ${Math.min(endIndex, filteredCompanies.length)} ${t('common.of')} ${filteredCompanies.length} ${t('common.entries')}`}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('commercial.previous')}
            </button>
            <span className="min-w-[3rem] text-center text-sm font-medium text-[#1e3a5f]">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('commercial.next')}
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? "Modifier l'entreprise" : 'Ajouter une nouvelle entreprise'}
              </h3>
              <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={e => void handleSubmit(e)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nom de l'entreprise <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#1e3a5f]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#1e3a5f]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-[#1e3a5f] px-6 py-2 text-white transition hover:bg-[#2d4a6f] disabled:opacity-60"
                >
                  {saving ? '…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
