import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Edit2, Trash2, ChevronLeft, ChevronRight, Settings2, Plus, Search } from 'lucide-react';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../../api/expensesApi';
import { ActionMenu } from '../Shared/common/ActionMenu';
import Modal from '../Shared/common/Modal';

interface ExpenseCategory {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  created_at: string;
}

export function ExpenseCategories() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchCategoriesList();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [categories, searchTerm]);

  const fetchCategoriesList = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching expense categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    let filtered = [...categories];

    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCategories(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const id = editingCategory?._id || editingCategory?.id;
      if (editingCategory && id) {
        await updateCategory(id, formData);
      } else {
        await createCategory(formData);
      }

      setShowModal(false);
      setEditingCategory(null);
      resetForm();
      fetchCategoriesList();
    } catch (error) {
      console.error('Error saving expense category:', error);
    }
  };

  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (category: ExpenseCategory) => {
    const id = category._id || category.id;
    if (!id || !confirm(t('expenses.deleteConfirm'))) return;

    try {
      await deleteCategory(id);
      fetchCategoriesList();
    } catch (error) {
      console.error('Error deleting expense category:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
  };

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentCategories = filteredCategories.slice(startIndex, startIndex + entriesPerPage);
  const endIndex = startIndex + currentCategories.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 font-medium text-[#0F3C66]">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50/30 min-h-screen">
      <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20">
            <Settings2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('expenses.categoriesTitle')}</h1>
            <p className="text-sm text-gray-500 font-medium">{t('expenses.categoriesSubtitle') || 'Manage your business expense classifications'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-[#EE964C] tracking-widest uppercase bg-[#EE964C]/10 px-2 py-1 rounded">
            {t('common.version')}
          </div>
          <button
            onClick={() => {
              setEditingCategory(null);
              resetForm();
              setShowModal(true);
            }}
            className="px-5 py-2.5 bg-[#0F3C66] text-white rounded-xl hover:bg-[#154b8a] transition shadow-md shadow-[#0F3C66]/10 flex items-center gap-2 font-bold text-sm"
          >
            <Plus size={18} />
            {t('expenses.addCategory')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3 text-sm text-gray-600 font-bold">
            <span>{t('common.show')}</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0F3C66]/20 outline-none transition bg-white shadow-sm"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span>{t('common.entries')}</span>
          </div>

          <div className="relative min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20 transition text-sm font-medium shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16">#</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {t('expenses.colCategory')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {t('expenses.colDescription')}
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-24">
                  {t('common.action')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentCategories?.map((category, index) => (
                <tr key={category._id || category.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-gray-400">{startIndex + index + 1}</td>
                  <td className="px-6 py-4 text-sm font-bold text-[#0F3C66]">{category.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">{category.description || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <ActionMenu
                        actions={[
                          {
                            label: t('common.edit'),
                            icon: <Edit2 size={16} />,
                            onClick: () => handleEdit(category),
                          },
                          {
                            label: t('common.delete'),
                            icon: <Trash2 size={16} />,
                            onClick: () => handleDelete(category),
                            variant: 'danger',
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {currentCategories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-gray-500 italic bg-gray-50/20">
                    <div className="flex flex-col items-center gap-2">
                       <Settings2 size={40} className="text-gray-200" />
                       <span className="font-bold opacity-50">{t('expenses.emptyCategories')}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-gray-50 bg-gray-50/30 flex justify-between items-center flex-wrap gap-4 text-sm font-bold text-gray-500">
          <div>
            {t('common.showing')} {startIndex + 1} {t('common.to')} {Math.min(endIndex, filteredCategories.length)} {t('common.of')} {filteredCategories.length} {t('common.entries')}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition bg-gray-100/50 shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 py-2 bg-white border border-[#0F3C66]/20 rounded-lg shadow-sm text-[#0F3C66]">
              {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition bg-gray-100/50 shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCategory(null);
          resetForm();
        }}
        title={editingCategory ? t('common.edit') : t('expenses.addCategory')}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 font-sans">
                {t('expenses.fieldName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20 transition text-sm font-bold shadow-sm"
                required
                placeholder="e.g. Travel Expenses"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 font-sans">
                {t('expenses.fieldDescription')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20 transition text-sm font-bold shadow-sm min-h-[100px]"
                placeholder="Optional details about this category..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 text-sm font-bold">
             <button
              type="button"
              onClick={() => { setShowModal(false); setEditingCategory(null); resetForm(); }}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-[#0F3C66] text-white rounded-xl hover:bg-[#154b8a] transition shadow-md shadow-[#0F3C66]/10"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


