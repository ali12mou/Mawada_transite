import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight, Eye, CheckCircle, Printer } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

interface ExpenseCategory {
  id: string;
  name: string;
}

interface OtherExpenseItem {
  id?: string;
  expense_category_id: string;
  expense_name: string;
  amount: number;
  quantity: number;
  description: string;
  check_number: string;
}

interface OtherExpense {
  id: string;
  expense_id: string;
  expense_date: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export function OtherExpenses() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [expenses, setExpenses] = useState<OtherExpense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<OtherExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0]
  });

  const [expenseItems, setExpenseItems] = useState<OtherExpenseItem[]>([
    { expense_category_id: '', expense_name: '', amount: 0, quantity: 1, description: '', check_number: '' }
  ]);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm]);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('other_expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching other expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filterExpenses = () => {
    let filtered = [...expenses];

    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.expense_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExpenses(filtered);
  };

  const calculateTotal = () => {
    return expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const generateExpenseId = async () => {
    const { data, error } = await supabase
      .from('other_expenses')
      .select('expense_id')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return 'EXP00001';
    }

    const lastId = data[0].expense_id;
    const lastNumber = parseInt(lastId.replace('EXP', ''));
    const newNumber = lastNumber + 1;
    return `EXP${String(newNumber).padStart(5, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const totalAmount = calculateTotal();
      const expenseId = await generateExpenseId();

      const { data: expenseData, error: expenseError } = await supabase
        .from('other_expenses')
        .insert([{
          expense_id: expenseId,
          expense_date: formData.expense_date,
          total_amount: totalAmount,
          status: 'Pending',
          created_by: user?.id
        }])
        .select()
        .single();

      if (expenseError) throw expenseError;

      const itemsToInsert = expenseItems.map(item => ({
        other_expense_id: expenseData.id,
        expense_category_id: item.expense_category_id,
        expense_name: item.expense_name,
        amount: item.amount,
        quantity: item.quantity,
        description: item.description,
        check_number: item.check_number
      }));

      const { error: itemsError } = await supabase
        .from('other_expense_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      setShowModal(false);
      resetForm();
      fetchExpenses();
    } catch (error) {
      console.error('Error saving other expense:', error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('other_expenses')
        .update({ status: 'Approved' })
        .eq('id', id);

      if (error) throw error;
      fetchExpenses();
    } catch (error) {
      console.error('Error approving expense:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;

    try {
      const { error } = await supabase
        .from('other_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting other expense:', error);
    }
  };

  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, { expense_category_id: '', expense_name: '', amount: 0, quantity: 1, description: '', check_number: '' }]);
  };

  const updateExpenseItem = (index: number, field: string, value: any) => {
    const newItems = [...expenseItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setExpenseItems(newItems);
  };

  const resetForm = () => {
    setFormData({
      expense_date: new Date().toISOString().split('T')[0]
    });
    setExpenseItems([
      { expense_category_id: '', expense_name: '', amount: 0, quantity: 1, description: '', check_number: '' }
    ]);
  };

  const totalAmount = calculateTotal();

  const totalPages = Math.ceil(filteredExpenses.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentExpenses = filteredExpenses.slice(startIndex, endIndex);

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
        <h1 className="text-2xl font-semibold text-gray-800">Gérer les autres dépenses</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print Service
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Ajouter Nouveau
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span>Show</span>
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
                  ID de dépense <span className="ml-1">▲</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date de la Dépense</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{expense.expense_id}</td>
                  <td className="px-4 py-3 text-sm">{expense.expense_date}</td>
                  <td className="px-4 py-3 text-sm">{formatAmount(expense.total_amount)}</td>
                  <td className="px-4 py-3 text-sm">
                    {expense.status === 'Approved' && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Approved</span>
                    )}
                    {expense.status === 'Pending' && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800 p-1">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-800 p-1">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800 p-1">
                        <Printer className="w-4 h-4" />
                      </button>
                      {expense.status === 'Pending' && (
                        <button
                          onClick={() => handleApprove(expense.id)}
                          className="text-green-600 hover:text-green-800 p-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {currentExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Aucune dépense trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredExpenses.length)} of {filteredExpenses.length} entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-white border rounded">{currentPage}</span>
            {currentPage + 1 <= totalPages && <span className="px-3 py-1">{currentPage + 1}</span>}
            {currentPage + 2 <= totalPages && <span className="px-3 py-1">{currentPage + 2}</span>}

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-7xl w-full my-8">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold">Ajouter d'autres dépenses</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border">catégories des dépenses</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border">Dépense</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border">Montant</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border">Quantité</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border">Description</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border">Numéro de Chèque (Optionnel)</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 border">{index + 1}</td>
                        <td className="px-3 py-2 border">
                          <select
                            value={item.expense_category_id}
                            onChange={(e) => updateExpenseItem(index, 'expense_category_id', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">transport</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 border">
                          <input
                            type="text"
                            value={item.expense_name}
                            onChange={(e) => updateExpenseItem(index, 'expense_name', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </td>
                        <td className="px-3 py-2 border">
                          <input
                            type="number"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) => updateExpenseItem(index, 'amount', Number(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </td>
                        <td className="px-3 py-2 border">
                          <input
                            type="number"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => updateExpenseItem(index, 'quantity', Number(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </td>
                        <td className="px-3 py-2 border">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateExpenseItem(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2 border">
                          <input
                            type="text"
                            value={item.check_number}
                            onChange={(e) => updateExpenseItem(index, 'check_number', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2 border">
                          <button
                            type="button"
                            onClick={() => addExpenseItem()}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            +
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant total</label>
                <input
                  type="text"
                  value={formatAmount(totalAmount)}
                  readOnly
                  className="w-64 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Enregistrer les Dépenses
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
