//  dashboard
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Banknote,
  Bus,
  FolderOpen,
  Package,
  Receipt,
  RefreshCw,
  Store,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { fetchDashboardStats, DashboardStats } from '../api/dashboardApi';
import { DEFAULT_TRANSPORT_MANAGEMENT_PAGE } from '../constants/transportMenu';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-sky-100 text-sky-800',
  operation_started: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
};

export function Dashboard({ onNavigate }: DashboardProps) {
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const stats = await fetchDashboardStats();
      setData(stats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const activityMax = useMemo(() => {
    const rows = data?.transit.monthlyActivity || [];
    return Math.max(1, ...rows.map(row => Math.max(row.files, row.transports)));
  }, [data]);

  const fileStatusItems = useMemo(() => {
    const files = data?.transit.logisticsFiles;
    if (!files) return [];
    return [
      { key: 'open', value: files.open, color: 'bg-sky-500' },
      { key: 'operation_started', value: files.operation_started, color: 'bg-amber-500' },
      { key: 'completed', value: files.completed, color: 'bg-emerald-500' },
      { key: 'cancelled', value: files.cancelled, color: 'bg-rose-500' },
    ];
  }, [data]);

  const quickActions = [
    { id: DEFAULT_TRANSPORT_MANAGEMENT_PAGE, label: t('dashboard.actionLogistics'), icon: FolderOpen },
    { id: 'transportation-management', label: t('dashboard.actionTransport'), icon: Truck },
    { id: 'fleet-management', label: t('dashboard.actionFleet'), icon: Bus },
    { id: 'transport-expense-requests', label: t('dashboard.actionExpenses'), icon: Receipt },
    { id: 'sales-management', label: t('dashboard.actionSales'), icon: Store },
    { id: 'orders', label: t('dashboard.actionOrders'), icon: Package },
  ];

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#0F3C66]" />
      </div>
    );
  }

  const transit = data?.transit ?? {
    logisticsFiles: { total: 0, open: 0, operation_started: 0, completed: 0, cancelled: 0 },
    operations: {
      activeTransports: 0,
      totalTransports: 0,
      reservations: 0,
      pendingExpenseRequests: 0,
      pendingPurchases: 0,
      monthlySales: 0,
    },
    fleet: { vehicles: 0, drivers: 0 },
    recentFiles: [],
    monthlyActivity: [],
  };
  const overview = data?.overview;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F3C66]">{t('menu.dashboard')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('dashboard.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => loadDashboardData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {t('dashboard.refresh')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title={t('dashboard.logisticsFiles')}
          value={String(transit?.logisticsFiles.total || 0)}
          hint={`${transit?.logisticsFiles.open || 0} ${t('dashboard.openFiles')}`}
          icon={<FolderOpen className="text-[#0F3C66]" size={22} />}
          onClick={() => onNavigate?.(DEFAULT_TRANSPORT_MANAGEMENT_PAGE)}
        />
        <StatCard
          title={t('dashboard.activeTransports')}
          value={String(transit?.operations.activeTransports || 0)}
          hint={`${transit?.operations.totalTransports || 0} ${t('dashboard.total')}`}
          icon={<Truck className="text-[#0F3C66]" size={22} />}
          onClick={() => onNavigate?.('transportation-management')}
        />
        <StatCard
          title={t('dashboard.fleet')}
          value={String(transit?.fleet.vehicles || 0)}
          hint={`${transit?.fleet.drivers || 0} ${t('dashboard.drivers')}`}
          icon={<Bus className="text-[#0F3C66]" size={22} />}
          onClick={() => onNavigate?.('fleet-management')}
        />
        <StatCard
          title={t('dashboard.monthlyRevenue')}
          value={formatAmount(overview?.totalRevenue || 0)}
          mom={overview?.revenueMoM}
          icon={<Banknote className="text-[#0F3C66]" size={22} />}
        />
        <StatCard
          title={t('dashboard.monthlyExpenses')}
          value={formatAmount(overview?.totalExpenses || 0)}
          mom={overview?.expenseMoM}
          icon={<TrendingDown className="text-[#0F3C66]" size={22} />}
          inverse
          onClick={() => onNavigate?.('transport-expense-requests')}
        />
        <StatCard
          title={t('dashboard.employees')}
          value={String(overview?.activeEmployees || 0)}
          hint={`${overview?.onLeaveEmployees || 0} ${t('dashboard.onLeave')}`}
          icon={<Users className="text-[#0F3C66]" size={22} />}
          onClick={() => onNavigate?.('employees')}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#0F3C66]">{t('dashboard.monthlyActivity')}</h2>
              <p className="text-sm text-gray-500">{t('dashboard.monthlyActivityHint')}</p>
            </div>
            <div className="flex gap-4 text-xs font-medium text-gray-600">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0F3C66]" />
                {t('dashboard.logisticsFiles')}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#EE964C]" />
                {t('dashboard.transports')}
              </span>
            </div>
          </div>
          <div className="flex h-56 items-end justify-between gap-2 border-b border-gray-100 pb-2">
            {(transit?.monthlyActivity || []).map(row => (
              <div key={row.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-44 w-full items-end justify-center gap-1">
                  <div
                    className="w-3 rounded-t bg-[#0F3C66]/85 transition-all"
                    style={{ height: `${(row.files / activityMax) * 100}%`, minHeight: row.files > 0 ? '8px' : '2px' }}
                    title={`${row.files} ${t('dashboard.logisticsFiles')}`}
                  />
                  <div
                    className="w-3 rounded-t bg-[#EE964C]/90 transition-all"
                    style={{ height: `${(row.transports / activityMax) * 100}%`, minHeight: row.transports > 0 ? '8px' : '2px' }}
                    title={`${row.transports} ${t('dashboard.transports')}`}
                  />
                </div>
                <span className="text-[11px] font-medium uppercase text-gray-500">{row.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0F3C66]">{t('dashboard.fileStatus')}</h2>
          <p className="mb-5 text-sm text-gray-500">{t('dashboard.fileStatusHint')}</p>
          <div className="space-y-4">
            {fileStatusItems.map(item => {
              const total = transit?.logisticsFiles.total || 1;
              const percent = Math.round((item.value / total) * 100);
              return (
                <div key={item.key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{t(`dashboard.status.${item.key}`)}</span>
                    <span className="text-gray-500">
                      {item.value} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <MiniMetric label={t('dashboard.pendingRequests')} value={transit?.operations.pendingExpenseRequests || 0} />
            <MiniMetric label={t('dashboard.pendingPurchases')} value={transit?.operations.pendingPurchases || 0} />
            <MiniMetric label={t('dashboard.reservations')} value={transit?.operations.reservations || 0} />
            <MiniMetric label={t('dashboard.monthlySales')} value={formatAmount(transit?.operations.monthlySales || 0)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0F3C66]">{t('dashboard.recentFiles')}</h2>
            <button
              type="button"
              onClick={() => onNavigate?.(DEFAULT_TRANSPORT_MANAGEMENT_PAGE)}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#0F3C66] hover:text-[#EE964C]"
            >
              {t('dashboard.viewAll')}
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="pb-3 pr-3">{t('dashboard.colJob')}</th>
                  <th className="pb-3 pr-3">{t('dashboard.colClient')}</th>
                  <th className="pb-3 pr-3">{t('dashboard.colType')}</th>
                  <th className="pb-3 pr-3">{t('dashboard.colStatus')}</th>
                  <th className="pb-3">{t('dashboard.colDate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(transit?.recentFiles || []).map(file => (
                  <tr key={file.id} className="hover:bg-gray-50/70">
                    <td className="py-3 pr-3 font-mono text-xs font-semibold text-[#0F3C66]">{file.jobNumber}</td>
                    <td className="py-3 pr-3 text-gray-800">{file.client}</td>
                    <td className="py-3 pr-3 uppercase text-gray-500">{file.fileType}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[file.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {t(`dashboard.status.${file.status}`) || file.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {file.createdAt
                        ? new Date(file.createdAt).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
                {(transit?.recentFiles || []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-400">
                      {t('dashboard.noRecentFiles')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-[#0F3C66]">{t('dashboard.quickActions')}</h2>
            <div className="grid grid-cols-1 gap-2">
              {quickActions.map(action => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => onNavigate?.(action.id)}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 text-left text-sm transition hover:border-[#0F3C66]/30 hover:bg-[#0F3C66]/5"
                  >
                    <span className="inline-flex items-center gap-2 font-medium text-gray-800">
                      <Icon size={16} className="text-[#0F3C66]" />
                      {action.label}
                    </span>
                    <ArrowRight size={14} className="text-gray-400" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-[#0F3C66]">{t('dashboard.importOrders')}</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <OrderPill label={t('dashboard.total')} value={data?.orders.total || 0} />
              <OrderPill label={t('dashboard.pending')} value={data?.orders.pending || 0} tone="amber" />
              <OrderPill label={t('dashboard.completed')} value={data?.orders.completed || 0} tone="green" />
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('orders')}
              className="mt-4 w-full rounded-lg bg-[#0F3C66] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#154b8a]"
            >
              {t('dashboard.manageOrders')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  hint?: string;
  mom?: string;
  icon: React.ReactNode;
  inverse?: boolean;
  onClick?: () => void;
}

function StatCard({ title, value, hint, mom, icon, inverse = false, onClick }: StatCardProps) {
  const isPositive = Number(mom || 0) >= 0;
  let sentimentClass = 'text-emerald-600';
  if (mom) {
    sentimentClass = inverse
      ? isPositive
        ? 'text-rose-600'
        : 'text-emerald-600'
      : isPositive
        ? 'text-emerald-600'
        : 'text-rose-600';
  }

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-xl border border-gray-100 bg-white p-5 text-left shadow-sm transition ${
        onClick ? 'hover:border-[#0F3C66]/20 hover:shadow-md' : ''
      }`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="rounded-lg bg-[#0F3C66]/10 p-2.5">{icon}</div>
        {mom && (
          <div className={`inline-flex items-center gap-1 text-xs font-semibold ${sentimentClass}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isPositive ? '+' : ''}
            {mom}%
          </div>
        )}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </Wrapper>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

function OrderPill({
  label,
  value,
  tone = 'blue',
}: {
  label: string;
  value: number;
  tone?: 'blue' | 'amber' | 'green';
}) {
  const toneClass =
    tone === 'amber'
      ? 'text-amber-700 bg-amber-50'
      : tone === 'green'
        ? 'text-emerald-700 bg-emerald-50'
        : 'text-[#0F3C66] bg-[#0F3C66]/10';

  return (
    <div className={`rounded-lg px-2 py-3 ${toneClass}`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] font-medium uppercase">{label}</p>
    </div>
  );
}
