import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Edit2, Trash2, ChevronLeft, ChevronRight, Eye, CheckCircle, Receipt, Plus, Search, Trash } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fetchExpenses, fetchCategories, createExpense, updateExpense, approveExpense, deleteExpense, fetchExpense } from '../../api/expensesApi';
import { ActionMenu } from '../Shared/common/ActionMenu';
import Modal from '../Shared/common/Modal';

interface ExpenseCategory {
  id: string;
  name: string;
}

interface ExpenseItem {
  id?: string;
  expense_category_id: string;
  name: string;
  amount: number;
  description: string;
  check_number: string;
}

interface Expense {
  id: string;
  _id?: string;
  reference_number: string;
  expense_date: string;
  initial_balance: number;
  total_amount: number;
  final_balance: number;
  status: string;
  created_at: string;
  items?: ExpenseItem[];
}

export function Expense() {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    initial_balance: 0
  });

  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([
    { expense_category_id: '', name: '', amount: 0, description: '', check_number: '' }
  ]);

  useEffect(() => {
    fetchExpensesList();
    fetchCategoriesList();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm]);

  const fetchExpensesList = async () => {
    try {
      const data = await fetchExpenses();
      // Sort by date descending to get latest balance easily
      const sortedData = (data || []).sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
      setExpenses(sortedData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesList = async () => {
    try {
      const data = await fetchCategories();
      setCategories((data as any) || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filterExpenses = () => {
    let filtered = [...expenses];
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredExpenses(filtered);
  };

  const calculateTotals = () => {
    const totalAmount = expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const finalBalance = (Number(formData.initial_balance) || 0) - totalAmount;
    return { totalAmount, finalBalance };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) return;

    try {
      const { totalAmount, finalBalance } = calculateTotals();
      const payload = {
        expense_date: formData.expense_date,
        initial_balance: formData.initial_balance,
        total_amount: totalAmount,
        final_balance: finalBalance,
        items: expenseItems
      };

      if (editingId) {
        await updateExpense(editingId, payload);
      } else {
        await createExpense(payload);
      }

      setShowModal(false);
      resetForm();
      fetchExpensesList();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleEdit = async (expense: Expense, viewOnly = false) => {
    try {
      const id = expense._id || expense.id;
      const fullExpense = await fetchExpense(id);
      setFormData({
        expense_date: fullExpense.expense_date.split('T')[0],
        initial_balance: fullExpense.initial_balance
      });
      setExpenseItems(fullExpense.items || []);
      setEditingId(id);
      setIsViewOnly(viewOnly);
      setShowModal(true);
    } catch (error) {
      console.error('Error loading expense details:', error);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm(t('expenses.approveConfirm') || 'Are you sure you want to approve this expense?')) return;
    try {
      await approveExpense(id);
      fetchExpensesList();
    } catch (error) {
      console.error('Error approving expense:', error);
    }
  };

  const handleDelete = async (expense: Expense) => {
    const id = expense._id || expense.id;
    if (!id || !confirm(t('common.deleteConfirm'))) return;

    try {
      await deleteExpense(id);
      fetchExpensesList();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const addExpenseItem = () => {
    if (isViewOnly) return;
    setExpenseItems([...expenseItems, { expense_category_id: '', name: '', amount: 0, description: '', check_number: '' }]);
  };

  const updateExpenseItem = (index: number, field: string, value: any) => {
    if (isViewOnly) return;
    const newItems = [...expenseItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setExpenseItems(newItems);
  };

  const removeExpenseItem = (index: number) => {
    if (isViewOnly) return;
    if (expenseItems.length > 1) {
      setExpenseItems(expenseItems.filter((_, i) => i !== index));
    }
  };

  const resetForm = () => {
    // Determine last balance from expenses list
    const lastExpense = expenses.length > 0 ? expenses[0] : null;
    const defaultBalance = lastExpense ? lastExpense.final_balance : 0;

    setFormData({
      expense_date: new Date().toISOString().split('T')[0],
      initial_balance: defaultBalance
    });
    setExpenseItems([
      { expense_category_id: '', name: '', amount: 0, description: '', check_number: '' }
    ]);
    setEditingId(null);
    setIsViewOnly(false);
  };

  const { totalAmount, finalBalance } = calculateTotals();
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentExpenses = filteredExpenses.slice(startIndex, startIndex + entriesPerPage);

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
            <Receipt size={24} />
          </div>
          <div>
             <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('expenses.expenseTitle')}</h1>
             <p className="text-sm text-gray-500 font-medium">{t('expenses.subtitle') || 'Monitor and manage business expenditures'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-[#EE964C] tracking-widest uppercase bg-[#EE964C]/10 px-2 py-1 rounded">
            {t('common.version')}
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-5 py-2.5 bg-[#0F3C66] text-white rounded-xl hover:bg-[#154b8a] transition shadow-md shadow-[#0F3C66]/10 flex items-center gap-2 font-bold text-sm"
          >
            <Plus size={18} />
            {t('expenses.addExpense')}
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
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('expenses.colRef')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('expenses.colTotalAmount')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('expenses.colExpenseDate')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('expenses.colStatus')}</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-24">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentExpenses?.map((expense, index) => (
                <tr key={expense._id || expense.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-gray-400">{startIndex + index + 1}</td>
                  <td className="px-6 py-4 text-sm font-bold text-[#0F3C66]">{expense.reference_number}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatAmount(expense.total_amount)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                    {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {expense.status === 'Approved' ? (
                       <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                         <div className="w-1 h-1 bg-green-500 rounded-full mr-2"></div>
                         {t('expenses.statusApproved') || 'Approved'}
                       </span>
                    ) : (
                       <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                         <div className="w-1 h-1 bg-amber-500 rounded-full mr-2"></div>
                         {t('expenses.statusPending') || 'Pending'}
                       </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <ActionMenu
                        actions={[
                          {
                            label: t('common.view'),
                            icon: <Eye size={16} />,
                            onClick: () => handleEdit(expense, true),
                          },
                          {
                            label: t('common.edit'),
                            icon: <Edit2 size={16} />,
                            onClick: () => handleEdit(expense),
                            disabled: expense.status === 'Approved'
                          },
                          {
                            label: t('common.delete'),
                            icon: <Trash2 size={16} />,
                            onClick: () => handleDelete(expense),
                            variant: 'danger',
                           },
                          ...(expense.status === 'Pending' ? [{
                            label: t('expenses.approve'),
                            icon: <CheckCircle size={16} />,
                            onClick: () => handleApprove(expense._id || expense.id),
                          }] : [])
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {currentExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-500 italic bg-gray-50/20">
                    <div className="flex flex-col items-center gap-2">
                       <Receipt size={40} className="text-gray-200" />
                       <span className="font-bold opacity-50">{t('expenses.emptyExpenses')}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-gray-50 bg-gray-50/30 flex justify-between items-center flex-wrap gap-4 text-sm font-bold text-gray-500">
          <div>
             {t('common.showing')} {startIndex + 1} {t('common.to')} {Math.min(startIndex + entriesPerPage, filteredExpenses.length)} {t('common.of')} {filteredExpenses.length} {t('common.entries')}
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
          resetForm();
        }}
        title={isViewOnly ? t('common.view') : (editingId ? t('common.edit') : t('expenses.addExpense'))}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
             <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">{t('expenses.fieldDate')}</label>
                  <input
                    type="date"
                    disabled={isViewOnly}
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20 transition text-sm font-bold shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                    required
                  />
                </div>
             </div>
             <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">{t('expenses.fieldBalance')}</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={isViewOnly}
                    value={formData.initial_balance}
                    onChange={(e) => setFormData({ ...formData, initial_balance: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20 transition text-sm font-bold shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                    required
                  />
                </div>
             </div>
           </div>

           <div className="space-y-4">
             <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{t('expenses.itemsTitle')}</h3>
                {!isViewOnly && (
                  <button
                    type="button"
                    onClick={addExpenseItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EE964C]/10 text-[#EE964C] rounded-lg hover:bg-[#EE964C]/20 transition font-bold text-xs"
                  >
                    <Plus size={14} />
                    {t('expenses.addItem') || 'Add Item'}
                  </button>
                )}
             </div>

             <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm relative">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest w-12 bg-gray-50/50">#</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[180px]">{t('expenses.fieldName')}</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[150px]">{t('common.name')}</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest w-32">{t('expenses.colAmount')}</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('expenses.fieldDescription')}</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest w-40">{t('expenses.colCheckNumber')}</th>
                      {!isViewOnly && <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest w-16"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {expenseItems?.map((item, index) => (
                      <tr key={index} className="bg-white hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 font-bold">{index + 1}</td>
                        <td className="px-4 py-3">
                          <select
                            disabled={isViewOnly}
                            value={item.expense_category_id}
                            onChange={(e) => updateExpenseItem(index, 'expense_category_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-100 rounded-lg focus:ring-2 focus:ring-[#0F3C66]/20 outline-none transition text-xs font-bold disabled:bg-transparent"
                            required
                          >
                            <option value="">{t('expenses.selectType')}</option>
                            {categories?.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            disabled={isViewOnly}
                            value={item.name}
                            onChange={(e) => updateExpenseItem(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-100 rounded-lg focus:ring-2 focus:ring-[#0F3C66]/20 outline-none transition text-xs font-bold disabled:bg-transparent"
                            required
                            placeholder="e.g. Office Supplies"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            disabled={isViewOnly}
                            value={item.amount}
                            onChange={(e) => updateExpenseItem(index, 'amount', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-100 rounded-lg focus:ring-2 focus:ring-[#0F3C66]/20 outline-none transition text-xs font-bold text-gray-900 disabled:bg-transparent"
                            required
                          />
                        </td>
                        <td className="px-4 py-3 text-xs italic">
                          <input
                            type="text"
                            disabled={isViewOnly}
                            value={item.description}
                            onChange={(e) => updateExpenseItem(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-100 rounded-lg focus:ring-2 focus:ring-[#0F3C66]/20 outline-none transition text-xs font-medium disabled:bg-transparent"
                            placeholder="Reason for expense..."
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            disabled={isViewOnly}
                            value={item.check_number}
                            onChange={(e) => updateExpenseItem(index, 'check_number', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-100 rounded-lg focus:ring-2 focus:ring-[#0F3C66]/20 outline-none transition text-xs font-medium disabled:bg-transparent"
                            placeholder="Optional check #"
                          />
                        </td>
                        {!isViewOnly && (
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeExpenseItem(index)}
                              className="p-1 px-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition shadow-sm"
                            >
                              <Trash size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
             <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('expenses.colTotalAmount')}</label>
                <div className="text-xl font-bold text-[#0F3C66]">{formatAmount(totalAmount)}</div>
             </div>
             <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('expenses.fieldFinalBalance')}</label>
                <div className={`text-xl font-bold ${finalBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatAmount(finalBalance)}</div>
             </div>
           </div>

           {!isViewOnly && (
             <div className="flex gap-3 pt-6 border-t border-gray-100 text-sm font-bold">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-2.5 bg-[#0F3C66] text-white rounded-xl hover:bg-[#154b8a] transition shadow-md shadow-[#0F3C66]/10"
                >
                  {t('expenses.saveExpenses')}
                </button>
             </div>
           )}
        </form>
      </Modal>
    </div>
  );
}


