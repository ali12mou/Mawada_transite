import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Layers, Lock, Pencil, Plus, Trash2, X } from 'lucide-react';

interface ExpenseAllocation {
  id: string;
  _id?: string;
  name: string;
  allocation_type: string;
  allocation_date?: string;
  year?: number;
  month?: number;
  amount: number;
  is_locked: boolean;
  created_at: string;
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

const fieldClass =
  'w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#0F3C66] focus:bg-white focus:ring-1 focus:ring-[#0F3C66]';
const labelClass = 'mb-1 block text-sm font-bold text-gray-800';

export function ExpenseAllocation() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [allocations, setAllocations] = useState<ExpenseAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingAllocation, setEditingAllocation] = useState<ExpenseAllocation | null>(null);

  const [allocationType, setAllocationType] = useState<'Other Expense' | 'Recurring Expense'>(
    'Other Expense'
  );
  const [formData, setFormData] = useState({
    name: '',
    amount: 0,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  useEffect(() => {
    void fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      const data = await genericApi.list<ExpenseAllocation>('expense_allocation');
      setAllocations(data || []);
    } catch (error) {
      console.error('Error fetching expense allocations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAllocations = useMemo(() => {
    if (!searchTerm.trim()) return allocations;
    const q = searchTerm.toLowerCase();
    return allocations.filter(
      (allocation) =>
        allocation.name?.toLowerCase().includes(q) ||
        allocation.allocation_type?.toLowerCase().includes(q)
    );
  }, [allocations, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredAllocations.length / entriesPerPage));
  const page = Math.min(currentPage, totalPages);
  const startIndex = filteredAllocations.length === 0 ? 0 : (page - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, filteredAllocations.length);
  const currentAllocations = filteredAllocations.slice(startIndex, endIndex);
  const pageItems = buildPageItems(page, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, entriesPerPage]);

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

      const allocationData: Record<string, unknown> = {
        name: generatedName,
        allocation_type: allocationType,
        amount: formData.amount,
        created_by: user?.id,
      };

      if (allocationType === 'Recurring Expense') {
        allocationData.year = formData.year;
        allocationData.month = formData.month;
        allocationData.is_locked = true;
      } else {
        allocationData.allocation_date = new Date().toISOString().split('T')[0];
        allocationData.is_locked = false;
      }

      if (editingAllocation) {
        await genericApi.update('expense_allocation', rowId(editingAllocation), allocationData);
      } else {
        await genericApi.create('expense_allocation', allocationData);
      }

      closeModal();
      void fetchAllocations();
    } catch (error) {
      console.error('Error saving expense allocation:', error);
    }
  };

  const handleEdit = (allocation: ExpenseAllocation) => {
    if (allocation.is_locked) return;

    setEditingAllocation(allocation);
    setAllocationType(allocation.allocation_type as 'Other Expense' | 'Recurring Expense');
    setFormData({
      name: allocation.name || '',
      amount: allocation.amount || 0,
      year: allocation.year || new Date().getFullYear(),
      month: allocation.month || new Date().getMonth() + 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (allocation: ExpenseAllocation) => {
    if (allocation.is_locked) return;
    if (!confirm(t('expenses.allocDeleteConfirm'))) return;

    try {
      await genericApi.delete('expense_allocation', rowId(allocation));
      void fetchAllocations();
    } catch (error) {
      console.error('Error deleting expense allocation:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: 0,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    });
    setAllocationType('Other Expense');
    setEditingAllocation(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const formatDisplayDate = (allocation: ExpenseAllocation) => {
    if (allocation.allocation_type === 'Recurring Expense' && allocation.year && allocation.month) {
      return `${t(`common.months.${allocation.month}`)}_${allocation.year}`;
    }
    return allocation.allocation_date || '—';
  };

  const formatAllocationType = (type: string) => {
    if (type === 'Recurring Expense') return t('expenses.allocRecurring');
    if (type === 'Other Expense') return t('expenses.allocOther');
    return type;
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
          <h2 className="text-2xl font-bold text-gray-800">{t('expenses.allocManageTitle')}</h2>
          <Layers size={24} className="text-gray-600" />
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded bg-[#0F3C66] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#154b8a]"
        >
          <Plus size={16} />
          {t('expenses.addCategory')}
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
                  {t('common.name')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('expenses.fieldDate')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('expenses.colAmount')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('expenses.allocColType')}
                  <SortIcon />
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  {t('common.action')}
                  <SortIcon />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentAllocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    {t('expenses.allocEmpty')}
                  </td>
                </tr>
              ) : (
                currentAllocations.map((allocation, index) => (
                  <tr
                    key={rowId(allocation)}
                    className={`transition hover:bg-gray-50 ${index % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}`}
                  >
                    <td className="px-4 py-3 text-gray-600">{startIndex + index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{allocation.name}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDisplayDate(allocation)}</td>
                    <td className="px-4 py-3 text-gray-700">{formatAmount(allocation.amount)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          allocation.allocation_type === 'Recurring Expense'
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {formatAllocationType(allocation.allocation_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {allocation.is_locked ? (
                        <div className="flex items-center justify-center gap-1 text-gray-500">
                          <Lock size={14} />
                          <span className="text-xs">{t('expenses.locked')}</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(allocation)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-green-200 bg-green-50 text-green-600 transition hover:bg-green-100"
                            title={t('common.edit')}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(allocation)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                            title={t('common.delete')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
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
            {filteredAllocations.length === 0 ? 0 : startIndex + 1} {t('common.to')}{' '}
            {endIndex} {t('common.of')} {filteredAllocations.length} {t('common.entries')}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || filteredAllocations.length === 0}
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
              disabled={page >= totalPages || filteredAllocations.length === 0}
              className="rounded border border-gray-300 px-3 py-1 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">{t('expenses.allocModalTitle')}</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 transition hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-5">
              <div>
                <h4 className="mb-3 text-sm font-bold text-gray-800">{t('expenses.allocSubTitle')}</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setAllocationType('Other Expense')}
                    className={`rounded-lg border-2 p-4 text-left transition ${
                      allocationType === 'Other Expense'
                        ? 'border-[#0F3C66] bg-sky-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`mb-1 font-semibold ${
                        allocationType === 'Other Expense' ? 'text-[#0F3C66]' : 'text-gray-700'
                      }`}
                    >
                      {t('expenses.allocOther')}
                    </div>
                    <div className="text-sm text-gray-600">{t('expenses.allocOtherDesc')}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAllocationType('Recurring Expense')}
                    className={`rounded-lg border-2 p-4 text-left transition ${
                      allocationType === 'Recurring Expense'
                        ? 'border-[#0F3C66] bg-sky-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`mb-1 font-semibold ${
                        allocationType === 'Recurring Expense' ? 'text-[#0F3C66]' : 'text-gray-700'
                      }`}
                    >
                      {t('expenses.allocRecurring')}
                    </div>
                    <div className="text-sm text-gray-600">{t('expenses.allocRecurringDesc')}</div>
                  </button>
                </div>
              </div>

              {allocationType === 'Recurring Expense' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>{t('common.year')}</label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                      className={fieldClass}
                      required
                    >
                      <option value="">{t('expenses.selectYear')}</option>
                      {[2024, 2025, 2026, 2027, 2028].map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{t('common.month')}</label>
                    <select
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                      className={fieldClass}
                      required
                    >
                      <option value="">{t('expenses.selectMonth')}</option>
                      {Array.from({ length: 12 }, (_, index) => (
                        <option key={index + 1} value={index + 1}>
                          {t(`common.months.${index + 1}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>{t('expenses.fieldGeneratedName')}</label>
                    <input
                      type="text"
                      value={generateName()}
                      readOnly
                      className={`${fieldClass} bg-gray-100`}
                    />
                  </div>
                </div>
              )}

              {allocationType === 'Other Expense' && (
                <div>
                  <label className={labelClass}>
                    {t('expenses.fieldGeneratedName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={fieldClass}
                    required
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>
                  {t('expenses.colAmount')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className={fieldClass}
                  required
                />
              </div>

              <div className="flex justify-end border-t border-gray-200 pt-5">
                <button
                  type="submit"
                  className="rounded bg-[#0F3C66] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#154b8a]"
                >
                  {t('expenses.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
