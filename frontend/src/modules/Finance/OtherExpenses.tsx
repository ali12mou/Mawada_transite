import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { genericApi } from '../../api/genericApi';
import { fetchCategories } from '../../api/expensesApi';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CheckCircle,
  Eye,
  FileStack,
  Plus,
  Printer,
  Trash,
  Trash2,
  X,
} from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';

interface ExpenseCategory {
  id: string;
  _id?: string;
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
  _id?: string;
  expense_id: string;
  expense_date: string;
  total_amount: number;
  status: string;
  created_at: string;
  items?: OtherExpenseItem[];
}

function rowId(row: { _id?: string; id?: string }): string {
  return row._id || row.id || '';
}

function catId(cat: ExpenseCategory): string {
  return cat._id || cat.id || '';
}

function SortIcon() {
  return (
    <span className="ml-1 inline-flex flex-col text-[8px] leading-none text-gray-400">
      <span>▲</span>
      <span>▼</span>
    </span>
  );
}

function buildPageItems(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | 'ellipsis')[] = [1];
  if (current > 3) items.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p += 1) items.push(p);
  if (current < total - 2) items.push('ellipsis');
  items.push(total);
  return items;
}

function generateExpenseId(existing: OtherExpense[]): string {
  if (existing.length === 0) return 'EXP00001';
  const numbers = existing
    .map((e) => e.expense_id)
    .filter(Boolean)
    .map((id) => parseInt(id.replace('EXP', ''), 10))
    .filter((n) => !Number.isNaN(n));
  const max = numbers.length ? Math.max(...numbers) : 0;
  return `EXP${String(max + 1).padStart(5, '0')}`;
}

const fieldClass =
  'w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#0F3C66] focus:bg-white focus:ring-1 focus:ring-[#0F3C66]';
const labelClass = 'mb-1 block text-sm font-bold text-gray-800';

export function OtherExpenses() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const [expenses, setExpenses] = useState<OtherExpense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
  });

  const [expenseItems, setExpenseItems] = useState<OtherExpenseItem[]>([
    {
      expense_category_id: '',
      expense_name: '',
      amount: 0,
      quantity: 1,
      description: '',
      check_number: '',
    },
  ]);

  useEffect(() => {
    void fetchExpenses();
    void fetchCategoriesList();
  }, []);

  const fetchExpenses = async () => {
    try {
      const data = await genericApi.list<OtherExpense>('other_expenses');
      const sorted = (data || []).sort(
        (a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
      );
      setExpenses(sorted);
    } catch (error) {
      console.error('Error fetching other expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesList = async () => {
    try {
      const data = await fetchCategories();
      setCategories((data as ExpenseCategory[]) || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredExpenses = useMemo(() => {
    if (!searchTerm.trim()) return expenses;
    const q = searchTerm.toLowerCase();
    return expenses.filter(
      (expense) =>
        expense.expense_id?.toLowerCase().includes(q) ||
        expense.status?.toLowerCase().includes(q)
    );
  }, [expenses, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / entriesPerPage));
  const page = Math.min(currentPage, totalPages);
  const startIndex = filteredExpenses.length === 0 ? 0 : (page - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, filteredExpenses.length);
  const currentExpenses = filteredExpenses.slice(startIndex, endIndex);
  const pageItems = buildPageItems(page, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, entriesPerPage]);

  const calculateTotal = () =>
    expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const totalAmount = calculateTotal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) return;

    try {
      const payload = {
        expense_id: generateExpenseId(expenses),
        expense_date: formData.expense_date,
        total_amount: totalAmount,
        status: 'Pending',
        created_by: user?.id,
        items: expenseItems,
      };

      await genericApi.create('other_expenses', payload);
      closeModal();
      void fetchExpenses();
    } catch (error) {
      console.error('Error saving other expense:', error);
    }
  };

  const handleView = async (expense: OtherExpense) => {
    try {
      const full = await genericApi.get<OtherExpense>('other_expenses', rowId(expense));
      setFormData({
        expense_date: full.expense_date?.split('T')[0] || expense.expense_date,
      });
      setExpenseItems(
        full.items?.length
          ? full.items
          : [
              {
                expense_category_id: '',
                expense_name: '',
                amount: 0,
                quantity: 1,
                description: '',
                check_number: '',
              },
            ]
      );
      setIsViewOnly(true);
      setShowModal(true);
    } catch (error) {
      console.error('Error loading other expense:', error);
    }
  };

  const handleApprove = async (expense: OtherExpense) => {
    if (!confirm(t('expenses.approveConfirm'))) return;
    try {
      await genericApi.update('other_expenses', rowId(expense), { status: 'Approved' });
      void fetchExpenses();
    } catch (error) {
      console.error('Error approving expense:', error);
    }
  };

  const handleDelete = async (expense: OtherExpense) => {
    if (!confirm(t('common.deleteConfirm'))) return;
    try {
      await genericApi.delete('other_expenses', rowId(expense));
      void fetchExpenses();
    } catch (error) {
      console.error('Error deleting other expense:', error);
    }
  };

  const addExpenseItem = () => {
    if (isViewOnly) return;
    setExpenseItems([
      ...expenseItems,
      {
        expense_category_id: '',
        expense_name: '',
        amount: 0,
        quantity: 1,
        description: '',
        check_number: '',
      },
    ]);
  };

  const updateExpenseItem = (index: number, field: string, value: unknown) => {
    if (isViewOnly) return;
    const newItems = [...expenseItems];
    newItems[index] = { ...newItems[index], [field]: value } as OtherExpenseItem;
    setExpenseItems(newItems);
  };

  const removeExpenseItem = (index: number) => {
    if (isViewOnly) return;
    if (expenseItems.length > 1) {
      setExpenseItems(expenseItems.filter((_, i) => i !== index));
    }
  };

  const resetForm = () => {
    setFormData({
      expense_date: new Date().toISOString().split('T')[0],
    });
    setExpenseItems([
      {
        expense_category_id: '',
        expense_name: '',
        amount: 0,
        quantity: 1,
        description: '',
        check_number: '',
      },
    ]);
    setIsViewOnly(false);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const openAddModal = () => {
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
          <h2 className="text-2xl font-bold text-gray-800">{t('expenses.otherManageTitle')}</h2>
          <FileStack size={24} className="text-gray-600" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <Printer size={16} />
            {t('expenses.printService')}
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded bg-[#0F3C66] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#154b8a]"
          >
            <Plus size={16} />
            {t('expenses.addExpense')}
          </button>
        </div>
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
            <span>{t('expenses.searchLabel')}</span>
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
                <th className={`${thClass} w-12`}>
                  #
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('expenses.colExpenseId')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('expenses.colExpenseDate')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('expenses.colAmount')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('expenses.colStatus')}
                  <SortIcon />
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  {t('common.action')}
                  <SortIcon />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    {t('expenses.emptyExpenses')}
                  </td>
                </tr>
              ) : (
                currentExpenses.map((expense, index) => (
                  <tr
                    key={rowId(expense)}
                    className={`transition hover:bg-gray-50 ${index % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}`}
                  >
                    <td className="px-4 py-3 text-gray-600">{startIndex + index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{expense.expense_id}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {expense.expense_date
                        ? new Date(expense.expense_date).toLocaleDateString(
                            language === 'fr' ? 'fr-FR' : 'en-US'
                          )
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatAmount(expense.total_amount)}</td>
                    <td className="px-4 py-3">
                      {expense.status === 'Approved' ? (
                        <span className="inline-flex rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          {t('expenses.statusApproved')}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          {t('expenses.statusPending')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleView(expense)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100"
                          title={t('common.view')}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(expense)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                          title={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                        {expense.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => void handleApprove(expense)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                            title={t('expenses.approve')}
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
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
            {filteredExpenses.length === 0 ? 0 : startIndex + 1} {t('common.to')}{' '}
            {endIndex} {t('common.of')} {filteredExpenses.length} {t('common.entries')}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || filteredExpenses.length === 0}
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
              disabled={page >= totalPages || filteredExpenses.length === 0}
              className="rounded border border-gray-300 px-3 py-1 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">
                {isViewOnly ? t('common.view') : t('expenses.addOtherModalTitle')}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 transition hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-5">
              <div className="max-w-xs">
                <label className={labelClass}>{t('expenses.fieldDate')}</label>
                <input
                  type="date"
                  disabled={isViewOnly}
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  className={fieldClass}
                  required
                />
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-800">{t('expenses.itemsTitle')}</h4>
                  {!isViewOnly && (
                    <button
                      type="button"
                      onClick={addExpenseItem}
                      className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-[#0F3C66] transition hover:bg-gray-50"
                    >
                      <Plus size={14} />
                      {t('expenses.addItem')}
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto rounded-md border border-gray-200">
                  <table className="w-full min-w-[800px] text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-3 py-2.5 text-left font-medium text-gray-700">#</th>
                        <th className="px-3 py-2.5 text-left font-medium text-gray-700">
                          {t('expenses.colCat')}
                        </th>
                        <th className="px-3 py-2.5 text-left font-medium text-gray-700">
                          {t('menu.expense')}
                        </th>
                        <th className="px-3 py-2.5 text-left font-medium text-gray-700">
                          {t('expenses.colAmount')}
                        </th>
                        <th className="px-3 py-2.5 text-left font-medium text-gray-700">
                          {t('expenses.colQuantity')}
                        </th>
                        <th className="px-3 py-2.5 text-left font-medium text-gray-700">
                          {t('expenses.fieldDescription')}
                        </th>
                        <th className="px-3 py-2.5 text-left font-medium text-gray-700">
                          {t('expenses.colCheckNumber')}
                        </th>
                        {!isViewOnly && (
                          <th className="px-3 py-2.5 text-center font-medium text-gray-700" />
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {expenseItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                          <td className="px-3 py-2">
                            <select
                              disabled={isViewOnly}
                              value={item.expense_category_id}
                              onChange={(e) =>
                                updateExpenseItem(index, 'expense_category_id', e.target.value)
                              }
                              className={fieldClass}
                              required
                            >
                              <option value="">{t('expenses.selectType')}</option>
                              {categories.map((cat) => (
                                <option key={catId(cat)} value={catId(cat)}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              disabled={isViewOnly}
                              value={item.expense_name}
                              onChange={(e) =>
                                updateExpenseItem(index, 'expense_name', e.target.value)
                              }
                              className={fieldClass}
                              required
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              disabled={isViewOnly}
                              value={item.amount}
                              onChange={(e) =>
                                updateExpenseItem(index, 'amount', Number(e.target.value))
                              }
                              className={fieldClass}
                              required
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="1"
                              disabled={isViewOnly}
                              value={item.quantity}
                              onChange={(e) =>
                                updateExpenseItem(index, 'quantity', Number(e.target.value))
                              }
                              className={fieldClass}
                              required
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              disabled={isViewOnly}
                              value={item.description}
                              onChange={(e) =>
                                updateExpenseItem(index, 'description', e.target.value)
                              }
                              className={fieldClass}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              disabled={isViewOnly}
                              value={item.check_number}
                              onChange={(e) =>
                                updateExpenseItem(index, 'check_number', e.target.value)
                              }
                              className={fieldClass}
                            />
                          </td>
                          {!isViewOnly && (
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeExpenseItem(index)}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
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

              <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <span className="text-xs font-medium uppercase text-gray-500">
                  {t('expenses.colTotalAmount')}
                </span>
                <p className="text-lg font-bold text-[#0F3C66]">{formatAmount(totalAmount)}</p>
              </div>

              {!isViewOnly && (
                <div className="flex justify-end border-t border-gray-200 pt-5">
                  <button
                    type="submit"
                    className="rounded bg-[#0F3C66] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#154b8a]"
                  >
                    {t('expenses.save')}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
