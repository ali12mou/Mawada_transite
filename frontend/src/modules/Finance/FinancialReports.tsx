import { useState, useEffect, useMemo } from 'react';
import { genericApi } from '../../api/genericApi';
import {
  fetchExpenses,
  fetchCategories,
  type Expense as ApiExpense,
  type ExpenseCategory as ApiExpenseCategory,
} from '../../api/expensesApi';
import { fetchOrders, type OrderData } from '../../api/ordersApi';
import { fetchLocalCompanies, type LocalCompanyRecord } from '../../api/localCompanyApi';
import {
  fetchCommercialChambers,
  type CommercialChamberRecord,
} from '../../api/commercialChamberApi';
import { Receipt, PieChart, LineChart, Eye, BarChart3, FileText, Printer, ExternalLink, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { openHtmlPreviewWithDownload } from '../../lib/htmlPrintPdf';
import { DateRangePicker } from '../../components/DateRangePicker';

interface AllocationItem {
  id?: string;
  _id?: string;
  allocation_type?: string;
  allocation_date?: string;
  year?: number;
  month?: number;
  amount?: number;
  total_expenses?: number;
  total_allocation?: number;
  balance?: number;
}

interface PayrollReportRow {
  id?: string;
  _id?: string;
  period_month: number;
  period_year: number;
  totals?: { net_salary?: number };
  items?: Array<{ net_salary?: number }>;
}

interface MonthlyProfit {
  monthKey: string;
  monthLabel: string;
  monthIndex: number;
  total_services: number;
  total_expenses: number;
  total_hr_expenses: number;
  profit: number;
  percentage: number;
}

interface ProfitBreakdown {
  localCompany: number;
  orderService: number;
  chamberService: number;
  otherProfits: number;
  recurringExpenses: number;
  otherExpenses: number;
  hrExpenses: number;
}

type ExpenseReportRow = {
  key: string;
  type: string;
  categoryId: string;
  categoryName: string;
  expenseName: string;
  amount: number;
  amountUsd: number;
  description: string;
  status: string;
  date: string;
};

function rowId(row: { id?: string; _id?: string }): string {
  return row._id || row.id || '';
}

function printExpenseReport(title: string, headers: string[], rows: string[][], totals: string[]) {
  const th = headers.map((h) => `<th>${h}</th>`).join('');
  const body = rows.length
    ? rows.map((r) => `<tr>${r.map((c) => `<td>${c || '—'}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${headers.length}" style="text-align:center;padding:24px;">—</td></tr>`;
  const totalRow = `<tr style="font-weight:700;background:#f3f4f6">${totals
    .map((c) => `<td>${c}</td>`)
    .join('')}</tr>`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;color:#111}
      h1{font-size:18px;margin:0 0 16px;color:#0F3C66}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}
      th{background:#f3f4f6}
    </style></head><body>
    <h1>${title}</h1>
    <table><thead><tr>${th}</tr></thead><tbody>${body}${totalRow}</tbody></table>
    </body></html>`;
  openHtmlPreviewWithDownload(html, `${title.replace(/[^\w\-]+/g, '_') || 'rapport_depenses'}.pdf`);
}

export function FinancialReports({ onNavigate }: { onNavigate?: (page: string) => void } = {}) {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const [currentView, setCurrentView] = useState<'main' | 'expenses' | 'allocation' | 'profit'>('main');
  const [expenses, setExpenses] = useState<ApiExpense[]>([]);
  const [categories, setCategories] = useState<ApiExpenseCategory[]>([]);
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [payrollReports, setPayrollReports] = useState<PayrollReportRow[]>([]);
  const [localCompanies, setLocalCompanies] = useState<LocalCompanyRecord[]>([]);
  const [commercialChambers, setCommercialChambers] = useState<CommercialChamberRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [profitDetail, setProfitDetail] = useState<MonthlyProfit | null>(null);

  const locale = language === 'fr' ? 'fr-FR' : 'en-US';

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [
        expensesData,
        categoriesData,
        allocationsData,
        ordersData,
        payrollData,
        localData,
        chamberData,
      ] = await Promise.all([
        fetchExpenses(),
        fetchCategories(),
        genericApi.list<AllocationItem>('expense_allocation', 1000),
        fetchOrders(),
        genericApi.list<PayrollReportRow>('payroll_reports', 500),
        fetchLocalCompanies().catch(() => [] as LocalCompanyRecord[]),
        fetchCommercialChambers().catch(() => [] as CommercialChamberRecord[]),
      ]);

      setExpenses(
        [...(expensesData || [])].sort((a, b) =>
          String(b.expense_date || '').localeCompare(String(a.expense_date || ''))
        )
      );
      setCategories(categoriesData || []);
      setAllocations(allocationsData || []);
      setOrders(ordersData || []);
      setPayrollReports(payrollData || []);
      setLocalCompanies(localData || []);
      setCommercialChambers(chamberData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isInMonth = (raw: string | undefined, year: number, monthIndex: number) => {
    if (!raw) return false;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return false;
    return d.getFullYear() === year && d.getMonth() + 1 === monthIndex;
  };

  const buildProfitBreakdown = (row: MonthlyProfit): ProfitBreakdown => {
    const year = Number(selectedYear) || new Date().getFullYear();
    const monthIndex = row.monthIndex;

    const localCompany = localCompanies.reduce((sum, item) => {
      const raw = item.closure_date || item.createdAt || '';
      if (!isInMonth(raw, year, monthIndex)) return sum;
      return sum + (Number(item.total) || Number(item.service_fee) || 0);
    }, 0);

    const orderService = orders.reduce((sum, order) => {
      const raw = order.order_date || order.createdAt || '';
      if (!isInMonth(raw, year, monthIndex)) return sum;
      return sum + (Number(order.total_services) || 0);
    }, 0);

    const chamberService = commercialChambers.reduce((sum, item) => {
      const raw = item.commercial_invoice_date || item.created_at || '';
      if (!isInMonth(raw, year, monthIndex)) return sum;
      return sum + (Number(item.chamber_service_amount) || 0);
    }, 0);

    const recurringExpenses = allocations.reduce((sum, item) => {
      const type = String(item.allocation_type || '').toLowerCase();
      if (!type.includes('recurring')) return sum;
      if (Number(item.year) === year && Number(item.month) === monthIndex) {
        return sum + (Number(item.amount) || 0);
      }
      if (isInMonth(item.allocation_date, year, monthIndex)) {
        return sum + (Number(item.amount) || 0);
      }
      return sum;
    }, 0);

    const otherFromAlloc = allocations.reduce((sum, item) => {
      const type = String(item.allocation_type || '').toLowerCase();
      if (!type.includes('other')) return sum;
      if (Number(item.year) === year && Number(item.month) === monthIndex) {
        return sum + (Number(item.amount) || 0);
      }
      if (isInMonth(item.allocation_date, year, monthIndex)) {
        return sum + (Number(item.amount) || 0);
      }
      return sum;
    }, 0);

    const otherFromExpenses = expenses.reduce((sum, expense) => {
      if (!isInMonth(expense.expense_date, year, monthIndex)) return sum;
      return sum + (Number(expense.total_amount) || 0);
    }, 0);

    return {
      localCompany,
      orderService,
      chamberService,
      otherProfits: 0,
      recurringExpenses,
      otherExpenses: otherFromAlloc + otherFromExpenses,
      hrExpenses: row.total_hr_expenses,
    };
  };

  const goTo = (page: string) => {
    setProfitDetail(null);
    onNavigate?.(page);
  };

  const categoryById = useMemo(() => {
    const map = new Map<string, ApiExpenseCategory>();
    categories.forEach((c) => {
      const id = rowId(c as { id?: string; _id?: string });
      if (id) map.set(id, c);
      if (c.id) map.set(String(c.id), c);
    });
    return map;
  }, [categories]);

  const expenseRows = useMemo((): ExpenseReportRow[] => {
    const rows: ExpenseReportRow[] = [];
    expenses.forEach((expense) => {
      const items = expense.items?.length
        ? expense.items
        : [
            {
              expense_category_id: '',
              name: expense.reference_number || '—',
              amount: Number(expense.total_amount) || 0,
              description: '',
              check_number: '',
            },
          ];

      items.forEach((item, idx) => {
        const catId = String(item.expense_category_id || '');
        const cat = categoryById.get(catId);
        const amount = Number(item.amount) || 0;
        rows.push({
          key: `${rowId(expense)}-${idx}`,
          type: cat?.name || '—',
          categoryId: catId,
          categoryName: cat?.name || '—',
          expenseName: item.name || expense.reference_number || '—',
          amount,
          amountUsd: 0,
          description: item.description || '—',
          status: expense.status || '—',
          date: expense.expense_date || '',
        });
      });
    });
    return rows;
  }, [expenses, categoryById]);

  const filteredExpenseRows = useMemo(() => {
    return expenseRows.filter((row) => {
      if (dateFrom && row.date && row.date.slice(0, 10) < dateFrom) return false;
      if (dateTo && row.date && row.date.slice(0, 10) > dateTo) return false;
      if (selectedCategory !== 'All' && row.categoryId !== selectedCategory) return false;
      if (selectedType !== 'All' && row.type !== selectedType) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (
          !row.type.toLowerCase().includes(q) &&
          !row.categoryName.toLowerCase().includes(q) &&
          !row.expenseName.toLowerCase().includes(q) &&
          !row.description.toLowerCase().includes(q) &&
          !row.status.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [expenseRows, dateFrom, dateTo, selectedCategory, selectedType, searchTerm]);

  const expenseTotals = useMemo(() => {
    return filteredExpenseRows.reduce(
      (acc, row) => {
        acc.fdj += row.amount;
        acc.usd += row.amountUsd;
        return acc;
      },
      { fdj: 0, usd: 0 }
    );
  }, [filteredExpenseRows]);

  const expenseTypeOptions = useMemo(() => {
    const set = new Set<string>();
    expenseRows.forEach((r) => {
      if (r.type && r.type !== '—') set.add(r.type);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [expenseRows]);

  const formatUsd = (n: number) => `$ ${Number(n || 0).toFixed(2)}`;
  const formatFdj = (n: number) => formatAmount(n, 'FDJ');
  const formatPlain = (n: number) =>
    Number(n || 0).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  const formatProfit = (n: number) => {
    const abs = formatPlain(Math.abs(n));
    if (n < 0) return `-(${abs})`;
    return abs;
  };

  const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 2, y - 1, y, y + 1].map(String);
  }, []);


  const profitRows = useMemo((): MonthlyProfit[] => {
    const year = Number(selectedYear) || new Date().getFullYear();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // Mois terminés uniquement pour l'année en cours ; année passée = 12 mois ; année future = aucun
    let maxMonth = 12;
    if (year > currentYear) maxMonth = 0;
    else if (year === currentYear) maxMonth = Math.max(0, currentMonth - 1);

    const buckets = Array.from({ length: maxMonth }, (_, i) => ({
      monthIndex: i + 1,
      monthKey: `${year}-${String(i + 1).padStart(2, '0')}`,
      monthLabel: `${monthLabels[i]}-${year}`,
      total_services: 0,
      total_expenses: 0,
      total_hr_expenses: 0,
    }));

    orders.forEach((order) => {
      const raw = order.order_date || order.createdAt || '';
      const d = raw ? new Date(raw) : null;
      if (!d || Number.isNaN(d.getTime()) || d.getFullYear() !== year) return;
      const idx = d.getMonth();
      if (idx >= maxMonth) return;
      buckets[idx].total_services += Number(order.total_services) || 0;
    });

    expenses.forEach((expense) => {
      const raw = expense.expense_date || '';
      const d = raw ? new Date(raw) : null;
      if (!d || Number.isNaN(d.getTime()) || d.getFullYear() !== year) return;
      const idx = d.getMonth();
      if (idx >= maxMonth) return;
      buckets[idx].total_expenses += Number(expense.total_amount) || 0;
    });

    payrollReports.forEach((report) => {
      if (Number(report.period_year) !== year) return;
      const idx = Number(report.period_month) - 1;
      if (idx < 0 || idx >= maxMonth) return;
      const fromTotals = Number(report.totals?.net_salary);
      const fromItems = (report.items || []).reduce(
        (s, it) => s + (Number(it.net_salary) || 0),
        0
      );
      buckets[idx].total_hr_expenses +=
        Number.isFinite(fromTotals) && fromTotals !== 0 ? fromTotals : fromItems;
    });

    const withProfit = buckets.map((b) => ({
      ...b,
      profit: b.total_services - b.total_expenses - b.total_hr_expenses,
      percentage: 0,
    }));

    const totalProfit = withProfit.reduce((s, r) => s + r.profit, 0);
    return withProfit.map((r) => ({
      ...r,
      percentage:
        totalProfit !== 0
          ? (r.profit / Math.abs(totalProfit)) * 100
          : r.profit < 0
            ? -100
            : 0,
    }));
  }, [orders, expenses, payrollReports, selectedYear]);

  const reportCards: {
    id: 'expenses' | 'allocation' | 'profit';
    title: string;
    subtitle: string;
    icon: typeof Receipt;
  }[] = [
    {
      id: 'expenses',
      title: t('financial.expenseReport'),
      subtitle: t('financial.expenseReportDesc'),
      icon: Receipt,
    },
    {
      id: 'allocation',
      title: t('financial.allocationReport'),
      subtitle: t('financial.allocationReportDesc'),
      icon: PieChart,
    },
    {
      id: 'profit',
      title: t('financial.profitReport'),
      subtitle: t('financial.profitReportDesc'),
      icon: LineChart,
    },
  ];

  const filterFieldClass =
    'w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]';

  if (currentView === 'main') {
    return (
      <div className="p-6">
        <div className="mb-8">
          <p className="text-base text-gray-500">{t('financial.subtitle')}</p>
        </div>

        <div className="grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
          {reportCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  setShowAnalysis(false);
                  setProfitDetail(null);
                  setCurrentView(card.id);
                }}
                className="rounded-2xl bg-[#F3F4F6] p-8 text-left transition hover:bg-[#EBECEF] hover:shadow-sm"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                  <Icon className="h-7 w-7 text-[#0F3C66]" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-[#0F3C66]">{card.title}</h2>
                <p className="text-sm text-gray-500">{card.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (currentView === 'expenses') {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() => setCurrentView('main')}
          className="mb-4 flex items-center gap-2 text-sm text-[#0F3C66] hover:underline"
        >
          {t('financial.backToReports')}
        </button>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-700">
            {t('financial.expenseReportTitle')}
          </h1>
          <div className="rounded bg-[#EE964C]/10 px-2 py-1 text-xs font-bold uppercase tracking-widest text-[#EE964C]">
            {t('common.version')}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowAnalysis((v) => !v)}
              className="rounded-md bg-[#0F3C66] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#154b8a]"
            >
              {t('financial.viewAnalysis')}
            </button>
            <button
              type="button"
              onClick={() =>
                printExpenseReport(
                  t('financial.expenseReportTitle'),
                  [
                    '#',
                    t('financial.type'),
                    t('financial.category'),
                    t('financial.expense'),
                    t('financial.amount'),
                    t('financial.amountUSD'),
                    t('financial.description'),
                    t('financial.status'),
                    t('financial.date'),
                  ],
                  filteredExpenseRows.map((row, i) => [
                    String(i + 1),
                    row.type,
                    row.categoryName,
                    row.expenseName,
                    formatFdj(row.amount),
                    formatUsd(row.amountUsd),
                    row.description,
                    row.status,
                    row.date ? new Date(row.date).toLocaleDateString(locale) : '—',
                  ]),
                  [
                    t('financial.total'),
                    '',
                    '',
                    '',
                    formatFdj(expenseTotals.fdj),
                    formatUsd(expenseTotals.usd),
                    '',
                    '',
                    '',
                  ]
                )
              }
              className="inline-flex items-center gap-2 rounded-md bg-[#0F3C66] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#154b8a]"
            >
              <FileText className="h-4 w-4" />
              {t('financial.print')}
            </button>
          </div>

          {showAnalysis && (
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('financial.totalExpenses')}
                </div>
                <div className="mt-1 text-xl font-semibold text-[#0F3C66]">
                  {formatFdj(expenseTotals.fdj)}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('financial.amountUSD')}
                </div>
                <div className="mt-1 text-xl font-semibold text-[#0F3C66]">
                  {formatUsd(expenseTotals.usd)}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('financial.expense')}
                </div>
                <div className="mt-1 text-xl font-semibold text-[#0F3C66]">
                  {filteredExpenseRows.length}
                </div>
              </div>
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="relative">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('financial.dateRange')}
              </label>
              <DateRangePicker
                value={{ start: dateFrom, end: dateTo }}
                onChange={({ start, end }) => {
                  setDateFrom(start);
                  setDateTo(end);
                }}
                placeholder="YYYY-MM-DD - YYYY-MM-DD"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('financial.expenseCategories')}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={filterFieldClass}
              >
                <option value="All">{t('financial.all')}</option>
                {categories.map((cat) => {
                  const id = rowId(cat as { id?: string; _id?: string });
                  return (
                    <option key={id} value={id}>
                      {cat.name}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('financial.expenseType')}
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={filterFieldClass}
              >
                <option value="All">{t('financial.all')}</option>
                {expenseTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('financial.search')}
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={filterFieldClass}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">#</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('financial.type')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('financial.category')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('financial.expense')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('financial.amount')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('financial.amountUSD')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('financial.description')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('financial.status')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('financial.date')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenseRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center text-gray-500">
                      {t('financial.noExpenses')}
                    </td>
                  </tr>
                ) : (
                  filteredExpenseRows.map((row, index) => (
                    <tr
                      key={row.key}
                      className={index % 2 === 1 ? 'bg-gray-50/70' : 'bg-white'}
                    >
                      <td className="border-t border-gray-100 px-4 py-3 text-gray-700">
                        {index + 1}
                      </td>
                      <td className="border-t border-gray-100 px-4 py-3 text-gray-700">{row.type}</td>
                      <td className="border-t border-gray-100 px-4 py-3 text-gray-700">
                        {row.categoryName}
                      </td>
                      <td className="border-t border-gray-100 px-4 py-3 text-gray-800">
                        {row.expenseName}
                      </td>
                      <td className="border-t border-gray-100 px-4 py-3 text-gray-700">
                        {formatFdj(row.amount)}
                      </td>
                      <td className="border-t border-gray-100 px-4 py-3 text-gray-700">
                        {formatUsd(row.amountUsd)}
                      </td>
                      <td className="border-t border-gray-100 px-4 py-3 text-gray-700">
                        {row.description}
                      </td>
                      <td className="border-t border-gray-100 px-4 py-3 text-gray-700">{row.status}</td>
                      <td className="border-t border-gray-100 px-4 py-3 text-gray-700">
                        {row.date ? new Date(row.date).toLocaleDateString(locale) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-[#0F3C66]" colSpan={4}>
                    {t('financial.total')}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{formatFdj(expenseTotals.fdj)}</td>
                  <td className="px-4 py-3 text-gray-800">{formatUsd(expenseTotals.usd)}</td>
                  <td className="px-4 py-3" colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'allocation') {
    const totalExpenses = allocations.reduce((sum, a) => sum + (Number(a.amount) || Number(a.total_expenses) || 0), 0);
    const totalAllocation = allocations.reduce((sum, a) => sum + (Number(a.total_allocation) || Number(a.amount) || 0), 0);
    const totalBalance = allocations.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

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
                {allocations?.map((alloc, index) => {
                  const amount = Number(alloc.amount) || Number(alloc.total_expenses) || 0;
                  const period =
                    alloc.year && alloc.month
                      ? `${monthLabels[Number(alloc.month) - 1] || alloc.month}-${alloc.year}`
                      : alloc.allocation_date || '—';
                  return (
                  <tr key={rowId(alloc) || index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium">{period}</td>
                    <td className="px-4 py-3 text-sm">{formatAmount(amount, 'USD')}</td>
                    <td className="px-4 py-3 text-sm">{formatAmount(Number(alloc.total_allocation) || amount, 'USD')}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">
                      {formatAmount(Number(alloc.balance) || 0, 'USD')}
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
                  );
                })}
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
    const profitData = profitRows;
    const totals = {
      services: profitData.reduce((sum, m) => sum + m.total_services, 0),
      expenses: profitData.reduce((sum, m) => sum + m.total_expenses, 0),
      hr: profitData.reduce((sum, m) => sum + m.total_hr_expenses, 0),
      profit: profitData.reduce((sum, m) => sum + m.profit, 0),
    };
    const overallPercentage =
      Math.abs(totals.profit) > 0
        ? (totals.profit / Math.abs(totals.profit)) * 100
        : 0;

    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() => setCurrentView('main')}
          className="mb-4 flex items-center gap-2 text-sm text-[#0F3C66] hover:underline"
        >
          {t('financial.backToReports')}
        </button>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-700">{t('financial.profitTitle')}</h1>
          <div className="rounded bg-[#EE964C]/10 px-2 py-1 text-xs font-bold uppercase tracking-widest text-[#EE964C]">
            {t('common.version')}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  printExpenseReport(
                    t('financial.profitTitle'),
                    [
                      '#',
                      t('financial.month'),
                      t('financial.totalServices'),
                      t('financial.totalExpenses'),
                      t('financial.totalHRExpenses'),
                      t('financial.profit'),
                      t('financial.percentage'),
                    ],
                    profitData.map((row, i) => [
                      String(i + 1),
                      row.monthLabel,
                      formatPlain(row.total_services),
                      formatPlain(row.total_expenses),
                      formatPlain(row.total_hr_expenses),
                      formatProfit(row.profit),
                      `${row.percentage.toFixed(2)}%`,
                    ]),
                    [
                      t('financial.totalRow'),
                      '',
                      formatPlain(totals.services),
                      formatPlain(totals.expenses),
                      formatPlain(totals.hr),
                      formatProfit(totals.profit),
                      `${overallPercentage.toFixed(2)}%`,
                    ]
                  )
                }
                className="inline-flex items-center gap-2 rounded-md bg-[#0F3C66] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#154b8a]"
              >
                <Printer className="h-4 w-4" />
                {t('financial.printSummary')}
              </button>
              <button
                type="button"
                onClick={() => setShowAnalysis((v) => !v)}
                className="rounded-md bg-[#0F3C66] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#154b8a]"
              >
                {t('financial.viewAnalysis')}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">{t('financial.year')}</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {showAnalysis && (
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('financial.totalServices')}
                </div>
                <div className="mt-1 text-xl font-semibold text-[#0F3C66]">
                  {formatPlain(totals.services)}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('financial.totalExpenses')}
                </div>
                <div className="mt-1 text-xl font-semibold text-[#0F3C66]">
                  {formatPlain(totals.expenses)}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('financial.totalHRExpenses')}
                </div>
                <div className="mt-1 text-xl font-semibold text-[#0F3C66]">
                  {formatPlain(totals.hr)}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('financial.overallTotal')}
                </div>
                <div
                  className={`mt-1 text-xl font-semibold ${
                    totals.profit < 0 ? 'text-red-600' : 'text-[#0F3C66]'
                  }`}
                >
                  {formatProfit(totals.profit)}
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">#</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('financial.month')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('financial.totalServices')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('financial.totalExpenses')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('financial.totalHRExpenses')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('financial.profit')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('financial.percentage')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('financial.action')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {profitData.map((row, index) => (
                  <tr
                    key={row.monthKey}
                    className={index % 2 === 1 ? 'bg-gray-50/70' : 'bg-white'}
                  >
                    <td className="border-t border-gray-100 px-4 py-3 text-gray-700">
                      {index + 1}
                    </td>
                    <td className="border-t border-gray-100 px-4 py-3 font-medium text-gray-800">
                      {row.monthLabel}
                    </td>
                    <td className="border-t border-gray-100 px-4 py-3 text-gray-700">
                      {formatPlain(row.total_services)}
                    </td>
                    <td className="border-t border-gray-100 px-4 py-3 text-gray-700">
                      {formatPlain(row.total_expenses)}
                    </td>
                    <td className="border-t border-gray-100 px-4 py-3 text-gray-700">
                      {formatPlain(row.total_hr_expenses)}
                    </td>
                    <td
                      className={`border-t border-gray-100 px-4 py-3 font-semibold ${
                        row.profit < 0 ? 'text-red-600' : 'text-gray-800'
                      }`}
                    >
                      {formatProfit(row.profit)}
                    </td>
                    <td
                      className={`border-t border-gray-100 px-4 py-3 ${
                        row.percentage < 0 ? 'text-red-600' : 'text-gray-700'
                      }`}
                    >
                      {row.percentage.toFixed(2)}%
                    </td>
                    <td className="border-t border-gray-100 px-4 py-3">
                      <button
                        type="button"
                        className="rounded p-1.5 text-[#0F3C66] hover:bg-gray-100"
                        title={t('common.view')}
                        onClick={() => setProfitDetail(row)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-[#0F3C66]" colSpan={2}>
                    {t('financial.totalRow')}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{formatPlain(totals.services)}</td>
                  <td className="px-4 py-3 text-gray-800">{formatPlain(totals.expenses)}</td>
                  <td className="px-4 py-3 text-gray-800">{formatPlain(totals.hr)}</td>
                  <td
                    className={`px-4 py-3 ${
                      totals.profit < 0 ? 'text-red-600' : 'text-gray-800'
                    }`}
                  >
                    {formatProfit(totals.profit)}
                  </td>
                  <td
                    className={`px-4 py-3 ${
                      overallPercentage < 0 ? 'text-red-600' : 'text-gray-800'
                    }`}
                  >
                    {overallPercentage.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <div className="font-bold text-gray-700">{t('financial.overallTotal')}</div>
                    <div
                      className={`text-sm font-semibold ${
                        totals.profit < 0 ? 'text-red-600' : 'text-[#0F3C66]'
                      }`}
                    >
                      {formatProfit(totals.profit)}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {profitDetail && (() => {
          const breakdown = buildProfitBreakdown(profitDetail);
          const serviceTotal =
            breakdown.localCompany +
            breakdown.orderService +
            breakdown.chamberService +
            breakdown.otherProfits;
          const expenseTotal = breakdown.recurringExpenses + breakdown.otherExpenses;

          const LinkIconBtn = ({ page }: { page: string }) => (
            <button
              type="button"
              onClick={() => goTo(page)}
              className="ml-1 inline-flex rounded p-0.5 text-[#0F3C66] hover:bg-blue-50"
              title={t('common.view')}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          );

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <h2 className="text-lg font-bold uppercase tracking-wide text-gray-700">
                    {t('financial.viewDetailsMonthlyProfit')}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setProfitDetail(null)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100"
                    aria-label={t('common.close')}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6 px-6 py-5">
                  <div className="rounded-md border border-[#B6D4FE] bg-[#E7F1FF] px-4 py-3 text-sm text-[#084298]">
                    {t('financial.profitDetailHint')}{' '}
                    <ExternalLink className="mb-0.5 inline h-3.5 w-3.5" />
                  </div>

                  <div>
                    <h3 className="mb-2 text-base text-gray-600">{t('financial.serviceDetails')}</h3>
                    <div className="overflow-x-auto rounded border border-gray-300">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-white">
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">
                              {t('financial.totalLocalCompany')}
                              <LinkIconBtn page="local-company" />
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">
                              {t('financial.totalOrderService')}
                              <LinkIconBtn page="orders" />
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">
                              {t('financial.totalChamberService')}
                              <LinkIconBtn page="commercial-chamber" />
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">
                              {t('financial.totalOtherProfits')}
                              <LinkIconBtn page="other-profit" />
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 text-gray-800">
                              {formatPlain(breakdown.localCompany)}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-gray-800">
                              {formatPlain(breakdown.orderService)}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-gray-800">
                              {formatPlain(breakdown.chamberService)}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-gray-800">
                              {formatPlain(breakdown.otherProfits)}
                            </td>
                          </tr>
                          <tr>
                            <td
                              colSpan={2}
                              className="border border-gray-300 px-3 py-2 text-right font-bold text-gray-800"
                            >
                              {t('financial.totalRowLabel')}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 font-bold text-gray-900">
                              {formatPlain(serviceTotal)}
                            </td>
                            <td className="border border-gray-300 px-3 py-2" />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-base text-gray-600">{t('financial.expenseDetails')}</h3>
                    <div className="overflow-x-auto rounded border border-gray-300">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">
                              {t('financial.totalRecurringExpenses')}
                              <LinkIconBtn page="expense" />
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">
                              {t('financial.totalOtherExpenses')}
                              <LinkIconBtn page="expense" />
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 text-gray-800">
                              {formatPlain(breakdown.recurringExpenses)}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-gray-800">
                              {formatPlain(breakdown.otherExpenses)}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 text-right font-bold text-gray-800">
                              {t('financial.totalsLabel')}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 font-bold text-gray-900">
                              {formatPlain(expenseTotal)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-base text-gray-600">{t('financial.hrExpenses')}</h3>
                    <p className="text-sm text-gray-700">
                      {t('financial.hrPaysPrefix')}{' '}
                      <span className="font-bold">{formatPlain(breakdown.hrExpenses)}</span>{' '}
                      {t('financial.hrPaysSuffix')}{' '}
                      <button
                        type="button"
                        onClick={() => goTo('hr-reports')}
                        className="font-medium text-[#0F3C66] underline hover:text-[#154b8a]"
                      >
                        {t('financial.clickHere')}
                      </button>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  return null;
}



