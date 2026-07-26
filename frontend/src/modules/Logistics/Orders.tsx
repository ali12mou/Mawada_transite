import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Printer, Eye, Edit2, Trash2, FileText } from 'lucide-react';
import { ActionMenu } from '../Shared/common/ActionMenu';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fetchClients, type ClientRecord } from '../../api/clientsApi';
import {
  fetchOrders as apiFetchOrders,
  createOrder,
  deleteOrder,
  type OrderData,
} from '../../api/ordersApi';
import { genericApi } from '../../api/genericApi';
import { openOrdersPrintWindow, orderToPrintRow } from '../../lib/ordersPrintHtml';
import { parseLocalizedNumber } from '../../lib/commercialChamberCalculations';

interface Order extends OrderData {
  id: string;
  creation_date?: string;
  created_by_name?: string;
}

type RouteRecord = {
  id?: string;
  _id?: string;
  source: string;
  destination: string;
};

function formatRouteLabel(route: RouteRecord): string {
  return `${route.source} -To- ${route.destination}`;
}

function numStr(v: string | number | undefined | null): string {
  if (v == null || v === '') return '';
  return String(v);
}

type OrderFormData = {
  client_name: string;
  client_phone: string;
  source_destination: string;
  item_price: string;
  bl_number: string;
  amount_djf: string;
  quantity: string;
  recharge_amount: string;
  maritime_line_fees: string;
  sgtd_wharfage: string;
  document_9: string;
  document_4: string;
  port_handling: string;
  port_passage: string;
  file_fees: string;
  escort_fees: string;
  transport: string;
  elevator_cart: string;
  ctn: string;
  chamber: string;
  exit: string;
  transit: string;
  ci_amount: string;
  order_date: string;
};

const emptyForm = (): OrderFormData => ({
  client_name: '',
  client_phone: '',
  source_destination: '',
  item_price: '',
  bl_number: '',
  amount_djf: '',
  quantity: '',
  recharge_amount: '',
  maritime_line_fees: '',
  sgtd_wharfage: '',
  document_9: '',
  document_4: '',
  port_handling: '',
  port_passage: '',
  file_fees: '',
  escort_fees: '',
  transport: '',
  elevator_cart: '',
  ctn: '',
  chamber: '',
  exit: '',
  transit: '',
  ci_amount: '',
  order_date: new Date().toISOString().slice(0, 16),
});

function computeTotalServices(fd: OrderFormData): number {
  return (
    parseLocalizedNumber(fd.maritime_line_fees) +
    parseLocalizedNumber(fd.sgtd_wharfage) +
    parseLocalizedNumber(fd.document_9) +
    parseLocalizedNumber(fd.document_4) +
    parseLocalizedNumber(fd.port_handling) +
    parseLocalizedNumber(fd.port_passage) +
    parseLocalizedNumber(fd.file_fees) +
    parseLocalizedNumber(fd.escort_fees) +
    parseLocalizedNumber(fd.transport) +
    parseLocalizedNumber(fd.elevator_cart) +
    parseLocalizedNumber(fd.ctn) +
    parseLocalizedNumber(fd.chamber) +
    parseLocalizedNumber(fd.exit) +
    parseLocalizedNumber(fd.transit)
  );
}

function computeTotalItemPrice(fd: OrderFormData): number {
  return parseLocalizedNumber(fd.amount_djf) * parseLocalizedNumber(fd.quantity);
}

function computeProfit(fd: OrderFormData): number {
  const total = computeTotalItemPrice(fd) + parseLocalizedNumber(fd.recharge_amount);
  return total - computeTotalServices(fd);
}

function fmtDateFr(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR');
}

const labelClass = 'mb-1 block text-sm font-semibold text-gray-800';
const inputClass =
  'w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]/30';
const selectClass = inputClass;

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

const DOC_UPLOAD_FIELDS = [
  'orders.livraison',
  'orders.connaissement',
  'orders.syndonia',
  'orders.countryDeclaration',
  'orders.doc9',
  'orders.doc4',
  'orders.docS',
  'orders.docE',
] as const;

export function Orders() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [routesList, setRoutesList] = useState<RouteRecord[]>([]);
  const [itemPrices, setItemPrices] = useState<{ id?: string; _id?: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [formData, setFormData] = useState<OrderFormData>(emptyForm());

  const totalServices = useMemo(() => computeTotalServices(formData), [formData]);
  const totalItemPrice = useMemo(() => computeTotalItemPrice(formData), [formData]);
  const profitAmount = useMemo(() => computeProfit(formData), [formData]);

  useEffect(() => {
    void fetchOrders();
    fetchClients().then(setClients).catch(console.error);
    genericApi
      .list<RouteRecord>('routes')
      .then((d) => setRoutesList(d || []))
      .catch(console.error);
    genericApi
      .list('item_prices')
      .then((d) => setItemPrices(d || []))
      .catch(() => setItemPrices([]));
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await apiFetchOrders();
      const mappedOrders = data.map(
        (item: OrderData & { _id?: string; createdAt?: string; creation_date?: string; id?: string }) => ({
          ...item,
          id: item._id || item.id || '',
          creation_date: item.createdAt || item.creation_date || new Date().toISOString(),
        })
      );
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const sourceOptions = useMemo(() => {
    const fromRoutes = routesList.map((route) => formatRouteLabel(route)).filter(Boolean);
    const fromOrders = orders.map((o) => o.source_destination).filter(Boolean);
    return [...new Set([...fromRoutes, ...fromOrders])];
  }, [routesList, orders]);

  const formSourceOptions = useMemo(() => {
    const labels = routesList.map((route) => formatRouteLabel(route)).filter(Boolean);
    if (formData.source_destination && !labels.includes(formData.source_destination)) {
      return [formData.source_destination, ...labels];
    }
    return labels;
  }, [routesList, formData.source_destination]);

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.order_number?.toLowerCase().includes(q) ||
          o.client_name?.toLowerCase().includes(q) ||
          o.bl_number?.toLowerCase().includes(q) ||
          o.source_destination?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'All') {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }
    if (sourceFilter !== 'All') {
      filtered = filtered.filter((o) => o.source_destination === sourceFilter);
    }
    if (dateFrom) {
      filtered = filtered.filter((o) => {
        const d = (o.order_date || o.creation_date || '').slice(0, 10);
        return d >= dateFrom;
      });
    }
    if (dateTo) {
      filtered = filtered.filter((o) => {
        const d = (o.order_date || o.creation_date || '').slice(0, 10);
        return d <= dateTo;
      });
    }
    return filtered;
  }, [orders, searchTerm, statusFilter, sourceFilter, dateFrom, dateTo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sourceFilter, dateFrom, dateTo, entriesPerPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    try {
      const orderNumber = `ORDER${String(orders.length + 1).padStart(5, '0')}`;
      await createOrder({
        client_name: formData.client_name,
        client_phone: formData.client_phone,
        source_destination: formData.source_destination,
        item_price: formData.item_price,
        bl_number: formData.bl_number,
        amount_djf: parseLocalizedNumber(formData.amount_djf),
        quantity: parseLocalizedNumber(formData.quantity),
        recharge_amount: parseLocalizedNumber(formData.recharge_amount),
        maritime_line_fees: parseLocalizedNumber(formData.maritime_line_fees),
        sgtd_wharfage: parseLocalizedNumber(formData.sgtd_wharfage),
        document_9: parseLocalizedNumber(formData.document_9),
        document_4: parseLocalizedNumber(formData.document_4),
        port_handling: parseLocalizedNumber(formData.port_handling),
        port_passage: parseLocalizedNumber(formData.port_passage),
        file_fees: parseLocalizedNumber(formData.file_fees),
        escort_fees: parseLocalizedNumber(formData.escort_fees),
        transport: parseLocalizedNumber(formData.transport),
        elevator_cart: parseLocalizedNumber(formData.elevator_cart),
        ctn: parseLocalizedNumber(formData.ctn),
        chamber: parseLocalizedNumber(formData.chamber),
        exit: parseLocalizedNumber(formData.exit),
        transit: parseLocalizedNumber(formData.transit),
        order_number: orderNumber,
        total_services: totalServices,
        total_item_price: totalItemPrice,
        total: totalItemPrice + parseLocalizedNumber(formData.recharge_amount),
        profit_amount: profitAmount,
        ci_amount: parseLocalizedNumber(formData.ci_amount),
        delivery_status: 'PENDING',
        status: 'PENDING',
        created_by: user?.nom || user?.id,
        order_date: formData.order_date,
      });
      setShowModal(false);
      setCurrentStep(1);
      setFormData(emptyForm());
      await fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('common.confirmDelete') || 'Delete?')) return;
    try {
      await deleteOrder(id);
      await fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + entriesPerPage);

  const printOrders = (list: Order[]) => {
    void openOrdersPrintWindow(
      list.map(orderToPrintRow),
      user?.nom || user?.email || '—'
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-600">{t('common.loading')}</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">{t('orders.title')}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => printOrders(filteredOrders)}
            className="inline-flex items-center gap-2 rounded border border-[#0F3C66] bg-white px-4 py-2 text-sm font-medium text-[#0F3C66] hover:bg-[#0F3C66]/5"
          >
            <Printer size={16} />
            {t('orders.printOrder')}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData(emptyForm());
              setCurrentStep(1);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 rounded bg-[#0F3C66] px-4 py-2 text-sm font-medium text-white hover:bg-[#152a44]"
          >
            <Plus size={16} />
            {t('orders.addNew')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-md border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <Field label={t('orders.statusFilter')}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
          >
            <option value="All">{t('orders.filterAll')}</option>
            <option value="PENDING">PENDING</option>
            <option value="CHECKED">CHECKED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </Field>
        <Field label={t('orders.sourceFilter')}>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className={selectClass}
          >
            <option value="All">{t('orders.filterAll')}</option>
            {sourceOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('orders.dateRange')}>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={inputClass}
            />
            <span className="text-gray-500">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={inputClass}
            />
          </div>
        </Field>
      </div>

      <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>{t('common.show')}</span>
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>{t('common.entries')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <label htmlFor="orders-search">{t('common.search')}:</label>
            <input
              id="orders-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded border border-gray-300 px-3 py-1 text-sm outline-none focus:border-[#0F3C66]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-3 py-2.5 font-semibold text-gray-800">#</th>
                <th className="px-3 py-2.5 font-semibold text-gray-800">{t('orders.colBl')}</th>
                <th className="px-3 py-2.5 font-semibold text-gray-800">{t('orders.colClient')}</th>
                <th className="px-3 py-2.5 font-semibold text-gray-800">{t('orders.colSourceDest')}</th>
                <th className="px-3 py-2.5 font-semibold text-gray-800">{t('orders.colDeliveryStatus')}</th>
                <th className="px-3 py-2.5 font-semibold text-gray-800">{t('orders.colTotal')}</th>
                <th className="px-3 py-2.5 font-semibold text-gray-800">{t('orders.colCiAmount')}</th>
                <th className="px-3 py-2.5 font-semibold text-gray-800">{t('orders.colCreationDate')}</th>
                <th className="px-3 py-2.5 font-semibold text-gray-800">{t('orders.colOrderDate')}</th>
                <th className="px-3 py-2.5 font-semibold text-gray-800">{t('orders.colStatus')}</th>
                <th className="px-3 py-2.5 font-semibold text-gray-800">{t('orders.colCreatedBy')}</th>
                <th className="px-3 py-2.5 text-center font-semibold text-gray-800">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                currentOrders.map((order, idx) => (
                  <tr key={order.id} className={idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}>
                    <td className="border-t border-gray-100 px-3 py-2.5 font-medium text-gray-900">
                      {order.order_number}
                    </td>
                    <td className="border-t border-gray-100 px-3 py-2.5">{order.bl_number || '—'}</td>
                    <td className="border-t border-gray-100 px-3 py-2.5">{order.client_name}</td>
                    <td className="border-t border-gray-100 px-3 py-2.5">{order.source_destination || '—'}</td>
                    <td className="border-t border-gray-100 px-3 py-2.5">
                      {order.delivery_status === 'DELIVERED' ? (
                        <span className="inline-block rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-semibold uppercase text-white">
                          DELIVERED
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-[#C47A2C] px-2.5 py-0.5 text-xs font-semibold uppercase text-white">
                          {order.delivery_status || 'PENDING'}
                        </span>
                      )}
                    </td>
                    <td className="border-t border-gray-100 px-3 py-2.5">
                      {formatAmount(order.total || 0)}
                    </td>
                    <td className="border-t border-gray-100 px-3 py-2.5">
                      {formatAmount(order.ci_amount || 0)}
                    </td>
                    <td className="border-t border-gray-100 px-3 py-2.5">
                      {fmtDateFr(order.creation_date)}
                    </td>
                    <td className="border-t border-gray-100 px-3 py-2.5">
                      {order.order_date ? fmtDateFr(order.order_date) : '—'}
                    </td>
                    <td className="border-t border-gray-100 px-3 py-2.5 font-medium text-gray-900">
                      {order.status || '—'}
                    </td>
                    <td className="border-t border-gray-100 px-3 py-2.5">
                      {order.created_by_name || order.created_by || '—'}
                    </td>
                    <td className="border-t border-gray-100 px-3 py-2.5 text-center">
                      <ActionMenu
                        actions={[
                          {
                            label: t('common.view'),
                            icon: <Eye size={16} />,
                            onClick: () =>
                              alert(
                                `${order.order_number}\n${order.client_name}\n${order.source_destination}`
                              ),
                          },
                          {
                            label: t('common.edit'),
                            icon: <Edit2 size={16} />,
                            onClick: () => {
                              setFormData({
                                client_name: order.client_name,
                                client_phone: order.client_phone || '',
                                source_destination: order.source_destination,
                                item_price: order.item_price,
                                bl_number: order.bl_number,
                                amount_djf: numStr(order.amount_djf),
                                quantity: numStr(order.quantity),
                                recharge_amount: numStr(order.recharge_amount),
                                maritime_line_fees: numStr(order.maritime_line_fees),
                                sgtd_wharfage: numStr(order.sgtd_wharfage),
                                document_9: numStr(order.document_9),
                                document_4: numStr(order.document_4),
                                port_handling: numStr(order.port_handling),
                                port_passage: numStr(order.port_passage),
                                file_fees: numStr(order.file_fees),
                                escort_fees: numStr(order.escort_fees),
                                transport: numStr(order.transport),
                                elevator_cart: numStr(order.elevator_cart),
                                ctn: numStr(order.ctn),
                                chamber: numStr(order.chamber),
                                exit: numStr(order.exit),
                                transit: numStr(order.transit),
                                ci_amount: numStr(order.ci_amount),
                                order_date: order.order_date?.slice(0, 16) || emptyForm().order_date,
                              });
                              setCurrentStep(1);
                              setShowModal(true);
                            },
                          },
                          {
                            label: t('common.delete'),
                            icon: <Trash2 size={16} />,
                            onClick: () => void handleDelete(order.id),
                            variant: 'danger',
                          },
                          {
                            label: t('orders.pdf'),
                            icon: <FileText size={16} />,
                            onClick: () => printOrders([order]),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm text-gray-600">
          <div>
            {t('common.showing')} {filteredOrders.length === 0 ? 0 : startIndex + 1} {t('common.to')}{' '}
            {Math.min(startIndex + entriesPerPage, filteredOrders.length)} {t('common.of')}{' '}
            {filteredOrders.length} {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-40"
            >
              {t('common.previous')}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`min-w-[2rem] rounded px-2 py-1 ${
                  currentPage === page ? 'bg-[#0F3C66] text-white' : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-40"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{t('orders.addUpdate')}</h2>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setCurrentStep(1);
                  setFormData(emptyForm());
                }}
                className="text-xl text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 flex items-center justify-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                  currentStep === 1 ? 'bg-[#0F3C66] text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                1
              </div>
              <div className="h-px w-16 bg-gray-300" />
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                  currentStep === 2 ? 'bg-[#0F3C66] text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                2
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {currentStep === 1 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={t('orders.colClient')} required>
                      <select
                        required
                        value={formData.client_name}
                        onChange={(e) => {
                          const client = clients.find((c) => c.name === e.target.value);
                          setFormData({
                            ...formData,
                            client_name: e.target.value,
                            client_phone: client?.phone || '',
                          });
                        }}
                        className={selectClass}
                      >
                        <option value="">{t('orders.selectCustomer')}</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                            {c.phone ? ` - ${c.phone}` : ''}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label={t('orders.colSourceDest')} required>
                      <select
                        required
                        value={formData.source_destination}
                        onChange={(e) =>
                          setFormData({ ...formData, source_destination: e.target.value })
                        }
                        className={selectClass}
                      >
                        <option value="">{t('orders.selectSourceDestination')}</option>
                        {formSourceOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label={t('orders.pricePlaceholder')} required>
                      <select
                        required
                        value={formData.item_price}
                        onChange={(e) => setFormData({ ...formData, item_price: e.target.value })}
                        className={selectClass}
                      >
                        <option value="">{t('orders.selectItemPrice')}</option>
                        {itemPrices.length > 0 ? (
                          itemPrices.map((p) => (
                            <option key={p.id || p._id} value={p.name}>
                              {p.name}
                            </option>
                          ))
                        ) : (
                          <option value="Expédition de conteneurs - 810 (USD)">
                            Expédition de conteneurs - 810 (USD)
                          </option>
                        )}
                      </select>
                    </Field>
                    <Field label={t('orders.colBl')}>
                      <input
                        type="text"
                        value={formData.bl_number}
                        onChange={(e) => setFormData({ ...formData, bl_number: e.target.value })}
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label={t('orders.amountDjf')}>
                      <input
                        type="text"
                        value={formData.amount_djf}
                        onChange={(e) =>
                          setFormData({ ...formData, amount_djf: e.target.value })
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label={t('orders.quantity')} required>
                      <input
                        type="text"
                        required
                        value={formData.quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, quantity: e.target.value })
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label={t('orders.rechargeAmount')}>
                      <input
                        type="text"
                        value={formData.recharge_amount}
                        onChange={(e) =>
                          setFormData({ ...formData, recharge_amount: e.target.value })
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {(
                      [
                        ['maritime_line_fees', t('orders.maritimeFees'), true],
                        ['sgtd_wharfage', t('orders.sgtdWharfage'), true],
                        ['document_9', t('orders.doc9'), false],
                        ['document_4', t('orders.doc4'), false],
                      ] as const
                    ).map(([key, label, req]) => (
                      <Field key={key} label={label} required={req}>
                        <input
                          type="text"
                          value={formData[key]}
                          onChange={(e) =>
                            setFormData({ ...formData, [key]: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {(
                      [
                        ['port_handling', t('orders.portHandling'), true],
                        ['port_passage', t('orders.portPassage'), true],
                        ['file_fees', t('orders.fileFees'), true],
                      ] as const
                    ).map(([key, label, req]) => (
                      <Field key={key} label={label} required={req}>
                        <input
                          type="text"
                          value={formData[key]}
                          onChange={(e) =>
                            setFormData({ ...formData, [key]: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {(
                      [
                        ['escort_fees', t('orders.escortFees'), false],
                        ['transport', t('orders.transport'), true],
                        ['elevator_cart', t('orders.elevatorCart'), false],
                      ] as const
                    ).map(([key, label, req]) => (
                      <Field key={key} label={label} required={req}>
                        <input
                          type="text"
                          value={formData[key]}
                          onChange={(e) =>
                            setFormData({ ...formData, [key]: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={t('orders.dateLabel')}>
                      <input
                        type="datetime-local"
                        value={formData.order_date}
                        onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                        className={inputClass}
                      />
                    </Field>
                    <Field label={t('orders.ctn')}>
                      <input
                        type="text"
                        value={formData.ctn}
                        onChange={(e) => setFormData({ ...formData, ctn: e.target.value })}
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={t('orders.chamber')}>
                      <input
                        type="text"
                        value={formData.chamber}
                        onChange={(e) =>
                          setFormData({ ...formData, chamber: e.target.value })
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label={t('orders.exit')}>
                      <input
                        type="text"
                        value={formData.exit}
                        onChange={(e) => setFormData({ ...formData, exit: e.target.value })}
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={t('orders.transit')} required>
                      <input
                        type="text"
                        required
                        value={formData.transit}
                        onChange={(e) =>
                          setFormData({ ...formData, transit: e.target.value })
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label={t('orders.totalServices')}>
                      <input
                        type="text"
                        readOnly
                        value={totalServices.toFixed(2)}
                        className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={t('orders.totalItemPrice')}>
                      <input
                        type="text"
                        readOnly
                        value={totalItemPrice.toFixed(2)}
                        className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                      />
                    </Field>
                    <Field label={t('orders.profitAmount')}>
                      <input
                        type="text"
                        readOnly
                        value={profitAmount.toFixed(2)}
                        className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                      />
                    </Field>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md bg-[#0F3C66] px-4 py-3 text-sm text-white">
                    <span className="font-bold text-[#EE964C]">NOTE </span>
                    {t('orders.reqDocsDesc')}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {DOC_UPLOAD_FIELDS.map((key) => (
                      <Field key={key} label={t(key)} required>
                        <input type="file" className={inputClass} />
                      </Field>
                    ))}
                  </div>

                  <Field label={t('orders.factureSgtd')} required>
                    <input type="file" className={inputClass} />
                  </Field>

                  <Field label={t('orders.docCi')} required>
                    <input type="file" className={inputClass} />
                  </Field>

                  <Field label={`${t('orders.ciAmountDesc')} *`} required>
                    <input
                      type="text"
                      required
                      value={formData.ci_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, ci_amount: e.target.value })
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>
              )}

              <div className="mt-6 flex justify-between">
                {currentStep === 2 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="rounded bg-[#0F3C66] px-5 py-2 text-sm font-medium text-white hover:bg-[#152a44]"
                  >
                    {t('orders.previous')}
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  className="rounded bg-[#0F3C66] px-5 py-2 text-sm font-medium text-white hover:bg-[#152a44]"
                >
                  {currentStep === 1 ? t('orders.next') : t('orders.finish')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
