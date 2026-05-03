import { useState, useEffect } from 'react';
import { Pencil, Trash2, ChevronLeft, ChevronRight, X, Building2 } from 'lucide-react';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';

interface Bank {
  id: string;
  name: string;
  created_at: string;
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
  const [formData, setFormData] = useState({
    name: '',
  });

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const data = await genericApi.list('banks');

      
      setBanks(data || []);
    } catch (error) {
      console.error('Error fetching banks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await genericApi.update('banks', editingId, formData);

        
      } else {
        await genericApi.create('banks', formData);

        
      }

      resetForm();
      fetchBanks();
    } catch (error) {
      console.error('Error saving bank:', error);
    }
  };

  const handleEdit = (bank: Bank) => {
    setFormData({
      name: bank.name,
    });
    setEditingId(bank.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('banks.deleteConfirm'))) {
      try {
        await genericApi.delete('banks', id);

        
        fetchBanks();
      } catch (error) {
        console.error('Error deleting bank:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBanks.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentBanks = filteredBanks.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800">{t('banks.manageTitle')}</h2>
          <Building2 size={24} className="text-gray-600" />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-[#EE964C] font-medium">{t('common.version')}</div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#0F3C66] text-white rounded hover:bg-[#154b8a] transition"
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
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  {t('banks.colName')}
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  {t('common.action')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {currentBanks?.map((bank) => (
                <tr key={bank.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-900 font-medium">{bank.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(bank)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(bank.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentBanks.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-gray-500 italic">
                    {t('banks.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredBanks.length > entriesPerPage && (
          <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
            <div>
              {t('common.showing')} {startIndex + 1} {t('common.to')} {Math.min(endIndex, filteredBanks.length)} {t('common.of')} {filteredBanks.length} {t('common.entries')}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)?.map(page => (
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
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F3C66] text-white">
              <h3 className="text-lg font-bold">
                {editingId ? t('banks.modalTitleUpdate') : t('banks.modalTitleAdd')}
              </h3>
              <button onClick={resetForm} className="text-white/80 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t('banks.fieldBankName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('banks.fieldBankName')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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



