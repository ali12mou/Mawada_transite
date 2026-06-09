import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { CheckCircle, Ban, FileText } from 'lucide-react';

interface OrderVerification {
  id: string;
  _id?: string;
  order_id: string;
  order_number: string;
  client_name: string;
  source_destination: string;
  document_action?: string;
  status: string;
  verified_at?: string;
  created_at?: string;
}

function rowId(v: OrderVerification): string {
  return v.id || v._id || '';
}

function isChecked(status: string): boolean {
  return status === 'CHECKED' || status === 'APPROVED';
}

export function OrderVerification() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [verifications, setVerifications] = useState<OrderVerification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<OrderVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    void fetchOrdersAndSync();
  }, []);

  useEffect(() => {
    let filtered = [...verifications];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.order_number?.toLowerCase().includes(q) ||
          v.client_name?.toLowerCase().includes(q) ||
          v.source_destination?.toLowerCase().includes(q)
      );
    }
    setFilteredVerifications(filtered);
  }, [verifications, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, entriesPerPage]);

  const fetchOrdersAndSync = async () => {
    try {
      const currentVerifications = await genericApi.list<OrderVerification>('order_verifications');
      const orders = await genericApi.list<Record<string, unknown>>('orders');
      const pendingOrders = orders.filter((o) => String(o.status ?? '') === 'PENDING');

      for (const order of pendingOrders) {
        const orderId = String(order._id ?? order.id ?? '');
        const existing = currentVerifications.find((v) => v.order_id === orderId);
        if (!existing) {
          await genericApi.create('order_verifications', {
            order_id: orderId,
            order_number: order.order_number,
            client_name: order.client_name,
            source_destination: order.source_destination,
            status: 'PENDING',
            created_by: user?.id,
            created_at: new Date().toISOString(),
          });
        }
      }

      const updatedList = await genericApi.list<OrderVerification>('order_verifications');
      const sorted = [...(updatedList || [])].sort((a, b) => {
        const aPending = !isChecked(a.status);
        const bPending = !isChecked(b.status);
        if (aPending !== bPending) return aPending ? 1 : -1;
        return String(b.created_at ?? '').localeCompare(String(a.created_at ?? ''));
      });
      setVerifications(sorted);
    } catch (error) {
      console.error('Error syncing orders for verification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (v: OrderVerification) => {
    const id = rowId(v);
    if (!id) return;
    try {
      await genericApi.update('order_verifications', id, {
        status: 'CHECKED',
        verified_at: new Date().toISOString(),
      });
      if (v.order_id) {
        await genericApi.update('orders', v.order_id, { status: 'CHECKED' });
      }
      await fetchOrdersAndSync();
    } catch (error) {
      console.error('Error approving verification:', error);
    }
  };

  const handleReject = async (v: OrderVerification) => {
    const id = rowId(v);
    if (!id) return;
    try {
      await genericApi.update('order_verifications', id, {
        status: 'PENDING',
        verified_at: null,
      });
      if (v.order_id) {
        await genericApi.update('orders', v.order_id, { status: 'PENDING' });
      }
      await fetchOrdersAndSync();
    } catch (error) {
      console.error('Error rejecting verification:', error);
    }
  };

  const handleViewDocument = async (v: OrderVerification) => {
    if (!v.order_id) return;
    try {
      const order = await genericApi.get<Record<string, unknown>>('orders', v.order_id);
      const bl = String(order?.bl_number ?? '').trim();
      const msg = bl
        ? `${v.order_number}\nBL: ${bl}`
        : `${v.order_number}\n${v.client_name}`;
      alert(msg);
    } catch {
      alert(v.order_number || t('common.noData'));
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredVerifications.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentVerifications = filteredVerifications.slice(startIndex, startIndex + entriesPerPage);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-600">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">{t('orderVerification.title')}</h1>

      <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>{t('common.show')}</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-[#0F3C66]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>{t('common.entries')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <label htmlFor="ov-search">{t('common.search')}:</label>
            <input
              id="ov-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded border border-gray-300 px-3 py-1 text-sm outline-none focus:border-[#0F3C66]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-gray-800">{t('orderVerification.colId')}</th>
                <th className="px-4 py-3 font-semibold text-gray-800">{t('orderVerification.colOrderId')}</th>
                <th className="px-4 py-3 font-semibold text-gray-800">{t('orderVerification.colClientName')}</th>
                <th className="px-4 py-3 font-semibold text-gray-800">{t('orderVerification.colSourceDest')}</th>
                <th className="px-4 py-3 font-semibold text-gray-800">{t('orderVerification.colDocAction')}</th>
                <th className="px-4 py-3 font-semibold text-gray-800">{t('orderVerification.colStatus')}</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-800">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody>
              {currentVerifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                currentVerifications.map((v, index) => {
                  const checked = isChecked(v.status);
                  return (
                    <tr
                      key={rowId(v) || `${v.order_number}-${index}`}
                      className={index % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}
                    >
                      <td className="border-t border-gray-100 px-4 py-3 text-gray-700">
                        {startIndex + index + 1}
                      </td>
                      <td className="border-t border-gray-100 px-4 py-3 font-medium text-gray-900">
                        {v.order_number || '—'}
                      </td>
                      <td className="border-t border-gray-100 px-4 py-3 text-gray-900">
                        {v.client_name || '—'}
                      </td>
                      <td className="border-t border-gray-100 px-4 py-3 text-gray-800">
                        {v.source_destination || '—'}
                      </td>
                      <td className="border-t border-gray-100 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void handleViewDocument(v)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded text-[#0F3C66] hover:bg-[#0F3C66]/10"
                          title={t('orderVerification.colDocAction')}
                        >
                          <FileText size={18} />
                        </button>
                      </td>
                      <td className="border-t border-gray-100 px-4 py-3">
                        {checked ? (
                          <span className="font-medium text-gray-900">{t('orderVerification.statusChecked')}</span>
                        ) : (
                          <span className="inline-block rounded-full bg-[#C47A2C] px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
                            {t('orderVerification.statusPending')}
                          </span>
                        )}
                      </td>
                      <td className="border-t border-gray-100 px-4 py-3">
                        {!checked ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => void handleApprove(v)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                              title={t('orderVerification.approve')}
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleReject(v)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                              title={t('orderVerification.reject')}
                            >
                              <Ban size={18} />
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm text-gray-600">
          <div>
            {t('common.showing')} {filteredVerifications.length === 0 ? 0 : startIndex + 1} {t('common.to')}{' '}
            {Math.min(startIndex + entriesPerPage, filteredVerifications.length)} {t('common.of')}{' '}
            {filteredVerifications.length} {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
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
                  currentPage === page
                    ? 'bg-[#0F3C66] text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-40"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
