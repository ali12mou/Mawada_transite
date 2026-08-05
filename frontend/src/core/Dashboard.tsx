//  dashboard
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bus,
  CheckSquare,
  DollarSign,
  FolderOpen,
  GitBranch,
  Menu,
  Package,
  Receipt,
  RefreshCw,
  Store,
  Truck,
  Wallet,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
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

function momNumber(value?: string | number | null): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const { user } = useAuth();
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
    return Math.max(1, ...rows.map((row) => Math.max(row.files, row.transports)));
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
    { id: 'orders', label: t('dashboard.actionOrders'), icon: CheckSquare },
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
  const orders = data?.orders;
  const charts = data?.charts ?? {
    orderTrends: [],
    revenueProfit: [],
    genderDistribution: { male: 0, female: 0, total: 0 },
  };
  const userName = user?.nom || t('profile.superAdmin');

  const revenueMoM = momNumber(overview?.revenueMoM);
  const expenseMoM = momNumber(overview?.expenseMoM);
  const deliveredMoM = momNumber(overview?.deliveredMoM);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-4xl text-base leading-relaxed text-gray-800">
          {t('dashboard.welcome')} , <span className="font-bold text-gray-900">{userName}</span>{' '}
          {t('dashboard.welcomeRest')}
        </p>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <GitBranch className="h-3.5 w-3.5" />
            {t('common.version')}
          </div>
          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {t('dashboard.refresh')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <HeroStatCard
          title={t('dashboard.monthlyRevenue')}
          value={formatAmount(overview?.totalRevenue || 0)}
          bgClass="bg-[#E8F8EF]"
          icon={<DollarSign className="h-16 w-16" strokeWidth={1.25} />}
          footer={
            <MomLine
              label={`${t('dashboard.lastMonthColon')} ${formatAmount(overview?.lastMonthRevenue || 0)} (${Math.abs(revenueMoM).toFixed(2)}%)`}
              increased={revenueMoM >= 0}
              inverse={false}
            />
          }
        />

        <HeroStatCard
          title={t('dashboard.totalOrders')}
          value={String(orders?.total ?? overview?.totalOrders ?? 0)}
          bgClass="bg-[#FDECEE]"
          icon={<CheckSquare className="h-16 w-16" strokeWidth={1.25} />}
          onClick={() => onNavigate?.('orders')}
          footer={
            <div className="space-y-1 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>
                  {orders?.completed || 0} {t('dashboard.completed')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span>
                  {orders?.pending || 0} {t('dashboard.pending')}
                </span>
              </div>
            </div>
          }
        />

        <HeroStatCard
          title={t('dashboard.totalExpenses')}
          value={formatAmount(overview?.totalExpenses || 0)}
          bgClass="bg-[#EAF2FB]"
          icon={<Wallet className="h-16 w-16" strokeWidth={1.25} />}
          onClick={() => onNavigate?.('expense')}
          footer={
            <MomLine
              label={`${t('dashboard.lastMonthColon')} ${formatAmount(overview?.lastMonthExpenses || 0)} (${Math.abs(expenseMoM).toFixed(2)}%)`}
              increased={expenseMoM >= 0}
              inverse
            />
          }
        />

        <HeroStatCard
          title={t('dashboard.deliveredOrders')}
          value={String(overview?.deliveredOrders || 0)}
          bgClass="bg-white"
          borderClass="border border-gray-100"
          icon={<Truck className="h-16 w-16" strokeWidth={1.25} />}
          onClick={() => onNavigate?.('order-reception')}
          footer={
            <MomLine
              label={`${t('dashboard.lastMonthColon')} ${overview?.lastMonthDelivered || 0}`}
              increased={deliveredMoM >= 0}
              inverse={false}
              hidePercent
            />
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard title={t('dashboard.orderTrends')}>
          <LineChart
            series={[
              {
                name: t('dashboard.orderTrendsY'),
                color: '#22c55e',
                values: charts.orderTrends.map((r) => r.orders),
              },
            ]}
            labels={charts.orderTrends.map((r) => r.label)}
            yLabel={t('dashboard.orderTrendsY')}
            xLabel={t('dashboard.monthAxis')}
            formatY={(v) => v.toFixed(1)}
          />
        </ChartCard>

        <ChartCard title={t('dashboard.employeeGenderDistribution')}>
          {charts.genderDistribution.total > 0 ? (
            <GenderDonut
              male={charts.genderDistribution.male}
              female={charts.genderDistribution.female}
              maleLabel={t('dashboard.male')}
              femaleLabel={t('dashboard.female')}
            />
          ) : (
            <div className="flex h-[280px] items-start p-2 text-sm text-gray-600">
              {t('dashboard.chartNoData')}
            </div>
          )}
        </ChartCard>

        <ChartCard title={t('dashboard.revenueProfitTrends')}>
          <LineChart
            series={[
              {
                name: t('dashboard.paidRevenue'),
                color: '#22c55e',
                values: charts.revenueProfit.map((r) => r.revenue),
              },
              {
                name: t('dashboard.profitAmount'),
                color: '#ef4444',
                values: charts.revenueProfit.map((r) => r.profit),
              },
            ]}
            labels={charts.revenueProfit.map((r) => r.label)}
            yLabel={t('dashboard.amountFdj')}
            xLabel={t('dashboard.monthAxis')}
            formatY={(v) => `Fdj ${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            showLegend
          />
        </ChartCard>
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
            {(transit?.monthlyActivity || []).map((row) => (
              <div key={row.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-44 w-full items-end justify-center gap-1">
                  <div
                    className="w-3 rounded-t bg-[#0F3C66]/85 transition-all"
                    style={{
                      height: `${(row.files / activityMax) * 100}%`,
                      minHeight: row.files > 0 ? '8px' : '2px',
                    }}
                    title={`${row.files} ${t('dashboard.logisticsFiles')}`}
                  />
                  <div
                    className="w-3 rounded-t bg-[#EE964C]/90 transition-all"
                    style={{
                      height: `${(row.transports / activityMax) * 100}%`,
                      minHeight: row.transports > 0 ? '8px' : '2px',
                    }}
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
            {fileStatusItems.map((item) => {
              const total = transit?.logisticsFiles.total || 1;
              const percent = Math.round((item.value / total) * 100);
              return (
                <div key={item.key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {t(`dashboard.status.${item.key}`)}
                    </span>
                    <span className="text-gray-500">
                      {item.value} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <MiniMetric
              label={t('dashboard.pendingRequests')}
              value={transit?.operations.pendingExpenseRequests || 0}
            />
            <MiniMetric
              label={t('dashboard.pendingPurchases')}
              value={transit?.operations.pendingPurchases || 0}
            />
            <MiniMetric
              label={t('dashboard.reservations')}
              value={transit?.operations.reservations || 0}
            />
            <MiniMetric
              label={t('dashboard.monthlySales')}
              value={formatAmount(transit?.operations.monthlySales || 0)}
            />
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
                {(transit?.recentFiles || []).map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50/70">
                    <td className="py-3 pr-3 font-mono text-xs font-semibold text-[#0F3C66]">
                      {file.jobNumber}
                    </td>
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
                      {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : '—'}
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
              {quickActions.map((action) => {
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
              <OrderPill
                label={t('dashboard.completed')}
                value={data?.orders.completed || 0}
                tone="green"
              />
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

function MomLine({
  label,
  increased,
  inverse,
  hidePercent = false,
}: {
  label: string;
  increased: boolean;
  inverse: boolean;
  hidePercent?: boolean;
}) {
  const { t } = useLanguage();
  const good = inverse ? !increased : increased;
  const colorClass = good ? 'text-emerald-600' : 'text-rose-600';
  const arrow = increased ? '↑' : '↓';
  const word = increased ? t('dashboard.increased') : t('dashboard.decreased');

  return (
    <p className="text-sm text-gray-600">
      {label}
      {!hidePercent ? ' ' : ' '}
      <span className={`font-medium ${colorClass}`}>
        {arrow} {word}
      </span>
    </p>
  );
}

function HeroStatCard({
  title,
  value,
  bgClass,
  borderClass = '',
  icon,
  footer,
  onClick,
}: {
  title: string;
  value: string;
  bgClass: string;
  borderClass?: string;
  icon: React.ReactNode;
  footer: React.ReactNode;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`relative min-h-[140px] overflow-hidden rounded-2xl ${bgClass} ${borderClass} px-5 py-4 text-left shadow-sm transition ${
        onClick ? 'hover:shadow-md' : ''
      }`}
    >
      <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-black/10">
        {icon}
      </div>
      <div className="relative z-10 pr-8">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
        <div className="mt-3">{footer}</div>
      </div>
    </Wrapper>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <Menu className="h-4 w-4 text-gray-400" />
      </div>
      {children}
    </div>
  );
}

function LineChart({
  series,
  labels,
  yLabel,
  xLabel,
  formatY,
  showLegend = false,
}: {
  series: Array<{ name: string; color: string; values: number[] }>;
  labels: string[];
  yLabel: string;
  xLabel: string;
  formatY: (v: number) => string;
  showLegend?: boolean;
}) {
  const width = 420;
  const height = 260;
  const padL = 58;
  const padR = 16;
  const padT = 16;
  const padB = 42;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const allValues = series.flatMap((s) => s.values);
  const maxRaw = Math.max(0, ...allValues);
  const maxY = maxRaw === 0 ? 1 : maxRaw * 1.15;
  const ticks = 6;
  const n = Math.max(labels.length, 1);

  const xAt = (i: number) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => padT + plotH - (v / maxY) * plotH;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[280px] w-full">
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const val = (maxY / ticks) * (ticks - i);
          const y = padT + (plotH / ticks) * i;
          return (
            <g key={`tick-${i}`}>
              <line
                x1={padL}
                x2={padL + plotW}
                y1={y}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth={1}
              />
              <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-gray-500" fontSize="8">
                {formatY(val)}
              </text>
            </g>
          );
        })}

        <text
          x={14}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${height / 2})`}
          className="fill-gray-600"
          fontSize="10"
        >
          {yLabel}
        </text>

        {labels.map((label, i) => (
          <text
            key={`x-${label}-${i}`}
            x={xAt(i)}
            y={height - 18}
            textAnchor="middle"
            className="fill-gray-500"
            fontSize="8"
          >
            {label.length > 9 ? `${label.slice(0, 3)}` : label}
          </text>
        ))}

        <text
          x={padL + plotW / 2}
          y={height - 4}
          textAnchor="middle"
          className="fill-gray-600"
          fontSize="10"
        >
          {xLabel}
        </text>

        {series.map((s) => {
          const points = s.values
            .map((v, i) => `${xAt(i)},${yAt(v)}`)
            .join(' ');
          return (
            <g key={s.name}>
              <polyline
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={points}
              />
              {s.values.map((v, i) => (
                <circle
                  key={`${s.name}-${i}`}
                  cx={xAt(i)}
                  cy={yAt(v)}
                  r={3.5}
                  fill="#fff"
                  stroke={s.color}
                  strokeWidth={2}
                >
                  <title>
                    {labels[i]}: {formatY(v)}
                  </title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>

      {showLegend && (
        <div className="mt-1 flex flex-wrap gap-4 px-2 text-xs text-gray-700">
          {series.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function GenderDonut({
  male,
  female,
  maleLabel,
  femaleLabel,
}: {
  male: number;
  female: number;
  maleLabel: string;
  femaleLabel: string;
}) {
  const total = male + female || 1;
  const malePct = male / total;
  const r = 70;
  const c = 2 * Math.PI * r;
  const maleLen = malePct * c;

  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-4">
      <svg viewBox="0 0 180 180" className="h-44 w-44">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#f9a8d4" strokeWidth="28" />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="28"
          strokeDasharray={`${maleLen} ${c - maleLen}`}
          strokeDashoffset={c * 0.25}
          transform="rotate(-90 90 90)"
        />
        <text x="90" y="86" textAnchor="middle" className="fill-gray-800" fontSize="18" fontWeight="700">
          {male + female}
        </text>
        <text x="90" y="106" textAnchor="middle" className="fill-gray-500" fontSize="10">
          Total
        </text>
      </svg>
      <div className="flex gap-4 text-xs text-gray-700">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          {maleLabel}: {male}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-pink-300" />
          {femaleLabel}: {female}
        </span>
      </div>
    </div>
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
