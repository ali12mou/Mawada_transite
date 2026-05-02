import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Receipt, PieChart, TrendingUp, Eye, BarChart3, Printer } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

interface ExpenseAllocation {
  id: string;
  month: string;
  total_expenses: number;
  total_allocation: number;
  balance: number;
  created_at: string;
}

interface Expense {
  id: string;
  expense_type: string;
  category_id?: string;
  amount: number;
  amount_usd?: number;
  description?: string;
  status: string;
  expense_date: string;
  created_at: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
}

interface MonthlyProfit {
  month: string;
  total_services: number;
  total_expenses: number;
  total_hr_expenses: number;
  profit: number;
  percentage: number;
}

export function FinancialReports() {
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [currentView, setCurrentView] = useState<'main' | 'expenses' | 'allocation' | 'profit'>('main');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [allocations, setAllocations] = useState<ExpenseAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expensesRes, categoriesRes, allocationsRes] = await Promise.all([
        supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
        supabase.from('expense_categories').select('*'),
        supabase.from('expense_allocation').select('*').order('month', { ascending: false })
      ]);

      if (expensesRes.error) throw expensesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (allocationsRes.error) throw allocationsRes.error;

      setExpenses(expensesRes.data || []);
      setCategories(categoriesRes.data || []);
      setAllocations(allocationsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalFDJ = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalUSD = expenses.reduce((sum, exp) => sum + (exp.amount_usd || 0), 0);
    return { totalFDJ, totalUSD };
  };

  const getMonthlyProfitData = (): MonthlyProfit[] => {
    const monthsData: MonthlyProfit[] = [
      { month: 'Jan-2026', total_services: 0, total_expenses: 200, total_hr_expenses: 0, profit: -200, percentage: 0 },
      { month: 'Feb-2026', total_services: 2883.60, total_expenses: 0, total_hr_expenses: 0, profit: 2883.60, percentage: 100 },
      { month: 'Mar-2026', total_services: 0, total_expenses: 0, total_hr_expenses: 0, profit: 0, percentage: 0 }
    ];

    const total = monthsData.reduce((sum, m) => sum + m.profit, 0);

    return monthsData?.map(m => ({
      ...m,
      percentage: total > 0 ? (m.profit / total) * 100 : 0
    }));
  };

  if (currentView === 'main') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">{t('financial.title')}</h1>
          <p className="text-gray-600">{t('financial.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => setCurrentView('expenses')}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-8 text-left group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition">
                <Receipt className="w-8 h-8 text-[#0F3C66]" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {t('financial.expenseReport')}
            </h2>
            <p className="text-gray-600 text-sm">
              {t('financial.expenseReportDesc')}
            </p>
          </button>

          <button
            onClick={() => setCurrentView('allocation')}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-8 text-left group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition">
                <PieChart className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {t('financial.allocationReport')}
            </h2>
            <p className="text-gray-600 text-sm">
              {t('financial.allocationReportDesc')}
            </p>
          </button>

          <button
            onClick={() => setCurrentView('profit')}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-8 text-left group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {t('financial.profitReport')}
            </h2>
            <p className="text-gray-600 text-sm">
              {t('financial.profitReportDesc')}
            </p>
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'expenses') {
    const totals = calculateTotals();

    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => setCurrentView('main')}
            className="text-[#0F3C66] hover:underline mb-4 flex items-center gap-2"
          >
            {t('financial.backToReports')}
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">{t('financial.expenseReportTitle')}</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex gap-3 mb-6">
            <button className="px-6 py-2 bg-[#0F3C66] text-white rounded-md hover:bg-[#154b8a] flex items-center gap-2">
              {t('financial.viewAnalysis')}
            </button>
            <button className="px-6 py-2 bg-[#0F3C66] text-white rounded-md hover:bg-[#154b8a] flex items-center gap-2">
              <Printer className="w-4 h-4" />
              {t('financial.print')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('financial.dateRange')}
              </label>
              <input
                type="date"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('financial.expenseCategories')}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              >
                <option value="All">{t('financial.all')}</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('financial.expenseType')}
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              >
                <option value="All">{t('financial.all')}</option>
                <option value="Operational">Operational</option>
                <option value="Administrative">Administrative</option>
                <option value="Transport">Transport</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('financial.search')}
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('financial.search') + '...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.type')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.category')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.expense')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.amount')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.amountUSD')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.description')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.date')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-4 py-3 text-sm">{t('financial.total')}</td>
                  <td className="px-4 py-3 text-sm"></td>
                  <td className="px-4 py-3 text-sm"></td>
                  <td className="px-4 py-3 text-sm"></td>
                  <td className="px-4 py-3 text-sm">{formatAmount(totals.totalFDJ, 'FDJ')}</td>
                  <td className="px-4 py-3 text-sm">{formatAmount(totals.totalUSD, 'USD')}</td>
                  <td className="px-4 py-3 text-sm"></td>
                  <td className="px-4 py-3 text-sm"></td>
                  <td className="px-4 py-3 text-sm"></td>
                </tr>
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      {t('financial.noExpenses')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'allocation') {
    const totalExpenses = allocations.reduce((sum, a) => sum + a.total_expenses, 0);
    const totalAllocation = allocations.reduce((sum, a) => sum + a.total_allocation, 0);
    const totalBalance = allocations.reduce((sum, a) => sum + a.balance, 0);

    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => setCurrentView('main')}
            className="text-[#0F3C66] hover:underline mb-4 flex items-center gap-2"
          >
            {t('financial.backToReports')}
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">{t('financial.allocationTitle')}</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex gap-3 mb-6">
            <button className="px-6 py-2 bg-[#0F3C66] text-white rounded-md hover:bg-[#154b8a] flex items-center gap-2">
              {t('financial.viewDetail')}
            </button>
            <button className="px-6 py-2 bg-[#0F3C66] text-white rounded-md hover:bg-[#154b8a] flex items-center gap-2">
              <Printer className="w-4 h-4" />
              {t('financial.printSummary')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.month')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.totalExpenses')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.totalAllocation')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.balance')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.action')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allocations?.map((alloc, index) => (
                  <tr key={alloc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium">{alloc.month}</td>
                    <td className="px-4 py-3 text-sm">{formatAmount(alloc.total_expenses, 'USD')}</td>
                    <td className="px-4 py-3 text-sm">{formatAmount(alloc.total_allocation, 'USD')}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">
                      {formatAmount(alloc.balance, 'USD')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-800">
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-4 py-3 text-sm">{t('financial.total')}</td>
                  <td className="px-4 py-3 text-sm"></td>
                  <td className="px-4 py-3 text-sm">{formatAmount(totalExpenses, 'USD')}</td>
                  <td className="px-4 py-3 text-sm">{formatAmount(totalAllocation, 'USD')}</td>
                  <td className="px-4 py-3 text-sm text-green-600">{formatAmount(totalBalance, 'USD')}</td>
                  <td className="px-4 py-3 text-sm"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'profit') {
    const profitData = getMonthlyProfitData();
    const totals = {
      services: profitData.reduce((sum, m) => sum + m.total_services, 0),
      expenses: profitData.reduce((sum, m) => sum + m.total_expenses, 0),
      hr: profitData.reduce((sum, m) => sum + m.total_hr_expenses, 0),
      profit: profitData.reduce((sum, m) => sum + m.profit, 0),
    };
    const overallPercentage = totals.services > 0 ? (totals.profit / totals.services) * 100 : 0;

    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => setCurrentView('main')}
            className="text-[#0F3C66] hover:underline mb-4 flex items-center gap-2"
          >
            {t('financial.backToReports')}
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">{t('financial.profitTitle')}</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-3">
              <button className="px-6 py-2 bg-[#0F3C66] text-white rounded-md hover:bg-[#154b8a] flex items-center gap-2">
                <Printer className="w-4 h-4" />
                {t('financial.printSummary')}
              </button>
              <button className="px-6 py-2 bg-[#0F3C66] text-white rounded-md hover:bg-[#154b8a] flex items-center gap-2">
                {t('financial.viewAnalysis')}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">{t('financial.year')}</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.month')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.totalServices')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.totalExpenses')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.totalHRExpenses')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.profit')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.percentage')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('financial.action')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profitData?.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium">{row.month}</td>
                    <td className="px-4 py-3 text-sm">{formatAmount(row.total_services)}</td>
                    <td className="px-4 py-3 text-sm">{formatAmount(row.total_expenses)}</td>
                    <td className="px-4 py-3 text-sm">{formatAmount(row.total_hr_expenses)}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${row.profit < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {row.profit < 0 ? '-' : ''}{formatAmount(Math.abs(row.profit))}
                    </td>
                    <td className="px-4 py-3 text-sm">{row.percentage.toFixed(2)}%</td>
                    <td className="px-4 py-3">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-4 py-3 text-sm" colSpan={2}>TOTAL</td>
                  <td className="px-4 py-3 text-sm">{formatAmount(totals.services)}</td>
                  <td className="px-4 py-3 text-sm">{formatAmount(totals.expenses)}</td>
                  <td className="px-4 py-3 text-sm">{formatAmount(totals.hr)}</td>
                  <td className="px-4 py-3 text-sm text-green-600">{formatAmount(totals.profit)}</td>
                  <td className="px-4 py-3 text-sm">{overallPercentage.toFixed(2)}%</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="text-xs">
                      <div className="font-semibold">{t('financial.overallTotal')}</div>
                      <div className="text-green-600">{formatAmount(totals.profit)}</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
}


