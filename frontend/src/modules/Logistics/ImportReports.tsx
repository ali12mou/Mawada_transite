import { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { fetchOrders, type OrderData } from '../../api/ordersApi';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';

type ReportOrder = OrderData & {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  creation_date?: string;
  created_by_name?: string;
};

type DeliveredOrderRow = {
  id?: string;
  _id?: string;
  order_number?: string;
  client_name?: string;
  source_destination?: string;
  delivery_status?: string;
  shipline?: string;
  fees?: number;
  delivered_at?: string;
  delivery_document?: string | null;
};

function rowId(row: { id?: string; _id?: string }): string {
  return row._id || row.id || '';
}

function splitRoute(sourceDestination: string | undefined): { from: string; to: string } {
  const raw = String(sourceDestination || '').trim();
  if (!raw) return { from: '—', to: '—' };

  const parts = raw
    .split(/\s*[-–—→]\s*|\s+to\s+/i)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { from: parts[0], to: parts.slice(1).join(' - ') };
  }

  const comma = raw.split(',').map((p) => p.trim()).filter(Boolean);
  if (comma.length >= 2) {
    return { from: comma[0], to: comma.slice(1).join(', ') };
  }

  return { from: raw, to: '—' };
}

function formatFdj(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  const formatted = n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Fdj ${formatted}`;
}

function formatNumber(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateOnly(value?: string | Date | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const s = String(value);
    return s.length >= 10 ? s.slice(0, 10) : s;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateTime(value?: string | Date | null): string {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

/** Même logique que « MONTANT TOTAL » dans la facture de commande. */
function montantTotal(order: OrderData): number {
  const n = (v: unknown) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };
  const stored = n(order.total_services);
  if (stored > 0) return stored;
  return (
    n(order.maritime_line_fees) +
    n(order.sgtd_wharfage) +
    n(order.document_9) +
    n(order.document_4) +
    n(order.port_handling) +
    n(order.port_passage) +
    n(order.file_fees) +
    n(order.escort_fees) +
    n(order.transport) +
    n(order.elevator_cart) +
    n(order.ctn) +
    n(order.chamber) +
    n(order.exit) +
    n(order.transit)
  );
}

function profitAmount(order: OrderData): number {
  const n = (v: unknown) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };
  if (order.profit_amount != null) return n(order.profit_amount);
  const itemFdj = n(order.total_item_price) || n(order.amount_djf) * n(order.quantity);
  return itemFdj + n(order.recharge_amount) - montantTotal(order);
}

function quantityLabel(order: OrderData): string {
  const qty = order.quantity;
  const item = String(order.item_price || '').trim();
  if (item && qty != null && String(qty) !== '') {
    if (/\d/.test(item) && !item.includes(String(qty))) return item;
    return `${qty}${item ? ` ${item}` : ''}`.trim();
  }
  if (item) return item;
  if (qty != null && String(qty) !== '') return String(qty);
  return '—';
}

function computeTimeTaken(start?: string | null, end?: string | null): string {
  if (!start || !end) return 'N/A';
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 'N/A';
  const diffMs = b - a;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function isDownloadableDocument(value?: string): boolean {
  const v = String(value || '').trim();
  return (
    v.startsWith('data:') ||
    v.startsWith('blob:') ||
    v.startsWith('http://') ||
    v.startsWith('https://')
  );
}

function extensionFromDataUrl(dataUrl: string): string {
  const match = /^data:([^;,]+)/i.exec(dataUrl);
  const mime = (match?.[1] || '').toLowerCase();
  if (mime.includes('pdf')) return '.pdf';
  if (mime.includes('png')) return '.png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg';
  if (mime.includes('msword')) return '.doc';
  if (mime.includes('wordprocessingml')) return '.docx';
  if (mime.includes('sheet') || mime.includes('excel')) return '.xlsx';
  return '';
}

function downloadOrderDocument(order: ReportOrder): void {
  const doc = String(order.complete_document || '').trim();
  if (!isDownloadableDocument(doc)) {
    alert(
      'Aucun fichier importé disponible pour cette commande. Recréez ou mettez à jour la commande en joignant le document.'
    );
    return;
  }

  let fileName = String(order.complete_document_name || '').trim();
  if (!fileName) {
    const ext = doc.startsWith('data:') ? extensionFromDataUrl(doc) : '';
    fileName = `${order.order_number || 'document'}${ext || '.pdf'}`;
  }

  const link = document.createElement('a');
  link.href = doc;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function monthKey(value?: string | Date | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function LineChart({
  title,
  yLabel,
  points,
  color = '#6366f1',
}: {
  title: string;
  yLabel: string;
  points: { label: string; value: number }[];
  color?: string;
}) {
  const width = 420;
  const height = 260;
  const pad = { top: 28, right: 16, bottom: 40, left: 48 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxVal = Math.max(1, ...points.map((p) => p.value));
  const coords = points.map((p, i) => {
    const x = pad.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = pad.top + innerH - (p.value / maxVal) * innerH;
    return { ...p, x, y };
  });
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const ticks = 4;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h4 className="mb-2 text-center text-sm font-semibold text-gray-800">{title}</h4>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img">
        <text
          x={14}
          y={height / 2}
          fill="#6b7280"
          fontSize="11"
          textAnchor="middle"
          transform={`rotate(-90 14 ${height / 2})`}
        >
          {yLabel}
        </text>
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = (maxVal / ticks) * i;
          const y = pad.top + innerH - (v / maxVal) * innerH;
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={pad.left - 6} y={y + 3} textAnchor="end" fill="#9ca3af" fontSize="10">
                {Number.isInteger(v) ? v : v.toFixed(1)}
              </text>
            </g>
          );
        })}
        {coords.length > 0 ? (
          <>
            <path d={path} fill="none" stroke={color} strokeWidth="2.5" />
            {coords.map((c, i) => (
              <circle key={i} cx={c.x} cy={c.y} r="3.5" fill={color} />
            ))}
          </>
        ) : null}
        {coords.map((c, i) =>
          i % Math.max(1, Math.ceil(coords.length / 6)) === 0 || i === coords.length - 1 ? (
            <text key={`lbl-${i}`} x={c.x} y={height - 12} textAnchor="middle" fill="#6b7280" fontSize="10">
              {c.label}
            </text>
          ) : null
        )}
      </svg>
    </div>
  );
}

function PieChart({
  title,
  slices,
}: {
  title: string;
  slices: { label: string; value: number; color: string }[];
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 78;
  let angle = -Math.PI / 2;

  const arcs = slices.map((slice) => {
    const portion = slice.value / total;
    const start = angle;
    const end = angle + portion * Math.PI * 2;
    angle = end;
    const large = portion > 0.5 ? 1 : 0;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const mid = (start + end) / 2;
    const lx = cx + (r + 18) * Math.cos(mid);
    const ly = cy + (r + 18) * Math.sin(mid);
    return {
      ...slice,
      portion,
      d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
      lx,
      ly,
    };
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h4 className="mb-2 text-center text-sm font-semibold text-gray-800">{title}</h4>
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-auto w-full max-w-[240px]" role="img">
        {arcs.map((a, i) => (
          <g key={i}>
            <path d={a.d} fill={a.color} stroke="#fff" strokeWidth="2" />
            {a.portion >= 0.04 ? (
              <text
                x={a.lx}
                y={a.ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#111827"
                fontSize="11"
                fontWeight="600"
              >
                {(a.portion * 100).toFixed(1)}%
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-700">
        {slices.map((s) => (
          <div key={s.label} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ImportReports() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<DeliveredOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState('');

  useEffect(() => {
    void loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [data, delivered] = await Promise.all([
        fetchOrders(),
        genericApi.list<DeliveredOrderRow>('delivered_orders', 1000).catch(() => []),
      ]);
      const mapped = (data || []).map((o) => ({
        ...o,
        id: rowId(o as { id?: string; _id?: string }),
      })) as ReportOrder[];
      mapped.sort((a, b) => {
        const ta = new Date(a.createdAt || a.order_date || 0).getTime();
        const tb = new Date(b.createdAt || b.order_date || 0).getTime();
        return tb - ta;
      });
      setOrders(mapped);
      setDeliveredOrders(
        [...(delivered || [])].sort((a, b) =>
          String(b.delivered_at || '').localeCompare(String(a.delivered_at || ''))
        )
      );
    } catch (error) {
      console.error('Error fetching import report orders:', error);
      setOrders([]);
      setDeliveredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const customers = useMemo(() => {
    const names = new Set<string>();
    orders.forEach((o) => {
      const name = String(o.client_name || '').trim();
      if (name) names.add(name);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [orders]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      const s = String(o.status || '').trim();
      if (s) set.add(s.toUpperCase());
    });
    return Array.from(set).sort();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      if (selectedCustomer && order.client_name !== selectedCustomer) return false;

      if (statusFilter !== 'All') {
        if (String(order.status || '').toUpperCase() !== statusFilter.toUpperCase()) {
          return false;
        }
      }

      if (dateRange) {
        const started = order.createdAt || order.order_date || order.creation_date || '';
        if (formatDateOnly(started) !== dateRange) return false;
      }

      if (!q) return true;
      const { from, to } = splitRoute(order.source_destination);
      return (
        String(order.order_number || '').toLowerCase().includes(q) ||
        String(order.client_name || '').toLowerCase().includes(q) ||
        String(order.bl_number || '').toLowerCase().includes(q) ||
        String(order.created_by || '').toLowerCase().includes(q) ||
        String(order.status || '').toLowerCase().includes(q) ||
        String(order.item_price || '').toLowerCase().includes(q) ||
        from.toLowerCase().includes(q) ||
        to.toLowerCase().includes(q)
      );
    });
  }, [orders, searchTerm, selectedCustomer, statusFilter, dateRange]);

  const sumTotalAmount = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + montantTotal(order), 0),
    [filteredOrders]
  );

  const sumBalance = sumTotalAmount;

  const sumProfitAmount = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + profitAmount(order), 0),
    [filteredOrders]
  );

  const ordersOverTime = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      const key = monthKey(o.createdAt || o.order_date || o.creation_date);
      if (!key) return;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ label: formatMonthLabel(key), value }));
  }, [orders]);

  const revenueTrends = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      const key = monthKey(o.createdAt || o.order_date || o.creation_date);
      if (!key) return;
      map.set(key, (map.get(key) || 0) + montantTotal(o));
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ label: formatMonthLabel(key), value }));
  }, [orders]);

  const statusSlices = useMemo(() => {
    let checked = 0;
    let pending = 0;
    let other = 0;
    orders.forEach((o) => {
      const s = String(o.status || '').toUpperCase();
      if (s === 'PENDING') pending += 1;
      else if (s === 'CHECKED' || s === 'APPROVED' || s === 'COMPLETED') checked += 1;
      else other += 1;
    });
    const slices = [
      { label: 'Checked', value: checked, color: '#22c55e' },
      { label: 'Pending', value: pending, color: '#ef4444' },
    ];
    if (other > 0) slices.push({ label: 'Other', value: other, color: '#94a3b8' });
    if (checked === 0 && pending === 0 && other === 0) {
      return [{ label: 'No data', value: 1, color: '#e5e7eb' }];
    }
    return slices;
  }, [orders]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800">{t('menu.import-reports')}</h2>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Date Range</label>
            <input
              type="date"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Customers</label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
            >
              <option value="">SELECT CUSTOMER</option>
              {customers.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
            >
              <option value="All">All</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1600px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-white text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Order Reference</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Source (From)</th>
                <th className="px-3 py-3">Destination (To)</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Created By</th>
                <th className="px-3 py-3">Created Date</th>
                <th className="px-3 py-3">Total Amount</th>
                <th className="px-3 py-3">Balance</th>
                <th className="px-3 py-3">Profit Amount</th>
                <th className="px-3 py-3">Carry</th>
                <th className="px-3 py-3">Quantity</th>
                <th className="px-3 py-3">Started</th>
                <th className="px-3 py-3">Completed</th>
                <th className="px-3 py-3">Time-Taken</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={17} className="px-3 py-10 text-center text-gray-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={17} className="px-3 py-10 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, index) => {
                  const { from, to } = splitRoute(order.source_destination);
                  const status = String(order.status || 'PENDING').toUpperCase();
                  const started = order.createdAt || order.order_date || order.creation_date;
                  const isDone =
                    String(order.delivery_status || '').toUpperCase() === 'DELIVERED' ||
                    status === 'COMPLETED';
                  const completed = isDone ? order.updatedAt || null : null;
                  const total = montantTotal(order);
                  const profit = profitAmount(order);
                  const isPending = status === 'PENDING';

                  return (
                    <tr
                      key={order.id || order.order_number || index}
                      className={index % 2 === 1 ? 'bg-gray-50/70' : 'bg-white'}
                    >
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-700">{index + 1}</td>
                      <td className="border-t border-gray-100 px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap">
                        {order.order_number || '—'}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-800">
                        {order.client_name || '—'}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-700">{from}</td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-700">{to}</td>
                      <td className="border-t border-gray-100 px-3 py-2.5">
                        {isPending ? (
                          <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase bg-[#C47A2C] text-white">
                            {status}
                          </span>
                        ) : (
                          <span className="font-medium text-gray-900">{status}</span>
                        )}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-700">
                        {order.created_by_name || order.created_by || ''}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-700 whitespace-nowrap">
                        {formatDateOnly(started)}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-800 whitespace-nowrap">
                        {formatFdj(total)}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-800 whitespace-nowrap">
                        {formatFdj(total)}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-800 whitespace-nowrap">
                        {formatFdj(profit)}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-700">
                        {order.bl_number || '—'}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-700">
                        {quantityLabel(order)}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-700 whitespace-nowrap">
                        {formatDateTime(started)}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-700 whitespace-nowrap">
                        {completed ? formatDateTime(completed) : 'N/A'}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-700">
                        {computeTimeTaken(started || null, completed)}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => downloadOrderDocument(order)}
                          className="rounded p-1.5 text-[#0F3C66] hover:bg-gray-100"
                          title={t('common.view')}
                        >
                          <FileText size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {!loading && filteredOrders.length > 0 ? (
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold text-gray-900">
                  <td colSpan={8} className="px-3 py-3 text-right uppercase tracking-wide">
                    Total
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">{formatFdj(sumTotalAmount)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{formatFdj(sumBalance)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{formatFdj(sumProfitAmount)}</td>
                  <td className="px-3 py-3" colSpan={6} />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Delivered Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Order</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Source (From)</th>
                <th className="px-3 py-3">Destination (To)</th>
                <th className="px-3 py-3">Delivered Status</th>
                <th className="px-3 py-3">Ship Line</th>
                <th className="px-3 py-3">Delivery Fee</th>
                <th className="px-3 py-3">Delivered At</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-gray-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : deliveredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                deliveredOrders.map((order, index) => {
                  const { from, to } = splitRoute(order.source_destination);
                  const doc = String(order.delivery_document || '');
                  return (
                    <tr
                      key={rowId(order) || `${order.order_number}-${index}`}
                      className={index % 2 === 1 ? 'bg-gray-50/70' : 'bg-white'}
                    >
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-700">{index + 1}</td>
                      <td className="border-t border-gray-100 px-3 py-2.5 font-medium text-gray-900">
                        {order.order_number || '—'}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-800">
                        {order.client_name || '—'}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-700">
                        {from === '—' ? '' : from}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-700">
                        {to === '—' ? '' : to}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                          {order.delivery_status || 'Delivered'}
                        </span>
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-700">
                        {order.shipline || '—'}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-800 whitespace-nowrap">
                        {formatNumber(order.fees)}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5 text-gray-700 whitespace-nowrap">
                        {formatDateTime(order.delivered_at)}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (isDownloadableDocument(doc)) window.open(doc, '_blank');
                            else alert(t('common.noData'));
                          }}
                          className="rounded p-1.5 text-[#0F3C66] hover:bg-gray-100"
                          title={t('common.view')}
                        >
                          <FileText size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Other Analytics Charts</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <LineChart title="Orders Over Time" yLabel="Order Count" points={ordersOverTime} color="#6366f1" />
          <PieChart title="Order Status" slices={statusSlices} />
          <LineChart title="Revenue Trends" yLabel="Total Revenue" points={revenueTrends} color="#0ea5e9" />
        </div>
      </div>
    </div>
  );
}
