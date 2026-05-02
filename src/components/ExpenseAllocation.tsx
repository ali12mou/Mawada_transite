import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Edit2, Trash2, X, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

interface ExpenseAllocation {
  id: string;
  name: string;
  allocation_type: string;
  allocation_date?: string;
  year?: number;
  month?: number;
  amount: number;
  is_locked: boolean;
  created_at: string;
}

// Months are now pulled from i18n

export function ExpenseAllocation() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [allocations, setAllocations] = useState<ExpenseAllocation[]>([]);
  const [filteredAllocations, setFilteredAllocations] = useState<ExpenseAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingAllocation, setEditingAllocation] = useState<ExpenseAllocation | null>(null);

  const [allocationType, setAllocationType] = useState<'Other Expense' | 'Recurring Expense'>('Other Expense');
  const [formData, setFormData] = useState({
    name: '',
    amount: 0,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });

  useEffect(() => {
    fetchAllocations();
  }, []);

  useEffect(() => {
    filterAllocations();
  }, [allocations, searchTerm]);

  const fetchAllocations = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_allocations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllocations(data || []);
    } catch (error) {
      console.error('Error fetching expense allocations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAllocations = () => {
    let filtered = [...allocations];

    if (searchTerm) {
      filtered = filtered.filter(allocation =>
        allocation.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        allocation.allocation_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAllocations(filtered);
  };

  const generateName = () => {
    if (allocationType === 'Recurring Expense') {
      const monthName = t(`common.months.${formData.month}`);
      return `${monthName}_${formData.year}`;
    }
    return formData.name;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const generatedName = generateName();

      const allocationData: any = {
        name: generatedName,
        allocation_type: allocationType,
        amount: formData.amount,
        created_by: user?.id
      };

      if (allocationType === 'Recurring Expense') {
        allocationData.year = formData.year;
        allocationData.month = formData.month;
        allocationData.is_locked = true;
      } else {
        allocationData.allocation_date = new Date().toISOString().split('T')[0];
      }

      if (editingAllocation) {
        const { error } = await supabase
          .from('expense_allocations')
          .update({
            ...allocationData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAllocation.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('expense_allocations')
          .insert([allocationData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingAllocation(null);
      resetForm();
      fetchAllocations();
    } catch (error) {
      console.error('Error saving expense allocation:', error);
    }
  };

  const handleEdit = (allocation: ExpenseAllocation) => {
    if (allocation.is_locked) return;

    setEditingAllocation(allocation);
    setAllocationType(allocation.allocation_type as any);
    setFormData({
      name: allocation.name || '',
      amount: allocation.amount || 0,
      year: allocation.year || new Date().getFullYear(),
      month: allocation.month || new Date().getMonth() + 1
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, isLocked: boolean) => {
    if (isLocked) return;
    if (!confirm(t('expenses.allocDeleteConfirm'))) return;

    try {
      const { error } = await supabase
        .from('expense_allocations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAllocations();
    } catch (error) {
      console.error('Error deleting expense allocation:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: 0,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1
    });
    setAllocationType('Other Expense');
  };

  const formatDisplayDate = (allocation: ExpenseAllocation) => {
    if (allocation.allocation_type === 'Recurring Expense' && allocation.year && allocation.month) {
      return `${t(`common.months.${allocation.month}`)}_${allocation.year}`;
    }
    return allocation.allocation_date || '-';
  };

  const totalPages = Math.ceil(filteredAllocations.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentAllocations = filteredAllocations.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">{t('expenses.allocManageTitle')}</h1>
        <button
          onClick={() => {
            setEditingAllocation(null);
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {t('expenses.addCategory')}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span>{t('common.show')}</span>
              <input
                type="number"
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="w-16 px-2 py-1 border border-gray-300 rounded"
                min="1"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer">
                  {t('common.name')} <span className="ml-1">▲</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('expenses.fieldDate')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('expenses.colAmount')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('expenses.allocColType')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentAllocations?.map((allocation) => (
                <tr key={allocation.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{allocation.name}</td>
                  <td className="px-4 py-3 text-sm">{formatDisplayDate(allocation)}</td>
                  <td className="px-4 py-3 text-sm">{allocation.amount}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs rounded ${allocation.allocation_type === 'Recurring Expense'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                      {allocation.allocation_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {allocation.is_locked ? (
                      <div className="flex items-center gap-1 text-gray-500">
                        <Lock className="w-4 h-4" />
                        <span className="text-xs">{t('expenses.locked')}</span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(allocation)}
                          className="text-green-600 hover:text-green-800 p-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(allocation.id, allocation.is_locked)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {currentAllocations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {t('expenses.allocEmpty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {t('common.showing')} {startIndex + 1} {t('common.to')} {Math.min(endIndex, filteredAllocations.length)} {t('common.of')} {filteredAllocations.length} {t('common.entries')}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {[...Array(Math.min(4, totalPages))]?.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 text-sm ${currentPage === i + 1 ? 'bg-blue-600 text-white border rounded' : 'hover:bg-gray-100'
                  }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">{t('expenses.allocModalTitle')}</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingAllocation(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-4">{t('expenses.allocSubTitle')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setAllocationType('Other Expense')}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${allocationType === 'Other Expense'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className={`font-semibold mb-1 ${allocationType === 'Other Expense' ? 'text-blue-600' : 'text-gray-700'}`}>
                      {t('expenses.allocOther')}
                    </div>
                    <div className="text-sm text-gray-600">{t('expenses.allocOtherDesc')}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAllocationType('Recurring Expense')}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${allocationType === 'Recurring Expense'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className={`font-semibold mb-1 ${allocationType === 'Recurring Expense' ? 'text-blue-600' : 'text-gray-700'}`}>
                      {t('expenses.allocRecurring')}
                    </div>
                    <div className="text-sm text-gray-600">{t('expenses.allocRecurringDesc')}</div>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {allocationType === 'Recurring Expense' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.year')}</label>
                      <select
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">{t('expenses.selectYear')}</option>
                        {[2024, 2025, 2026, 2027, 2028]?.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.month')}</label>
                      <select
                        value={formData.month}
                        onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">{t('expenses.selectMonth')}</option>
                        {[...Array(12)]?.map((_, index) => (
                          <option key={index} value={index + 1}>{t(`common.months.${index + 1}`)}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('expenses.fieldGeneratedName')}
                      </label>
                      <input
                        type="text"
                        value={generateName()}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                  </>
                )}

                {allocationType === 'Other Expense' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('expenses.fieldGeneratedName')}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.colAmount')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {t('expenses.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


