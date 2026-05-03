import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { CheckCircle, XCircle, Search } from 'lucide-react';
import { ActionMenu } from '../Shared/common/ActionMenu';

interface OrderVerification {
  id: string;
  order_id: string;
  order_number: string;
  client_name: string;
  source_destination: string;
  document_action: string;
  status: string;
  verified_at: string;
  created_at: string;
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
    fetchOrdersAndSync();
  }, []);

  useEffect(() => {
    filterVerifications();
  }, [verifications, searchTerm]);

  const fetchOrdersAndSync = async () => {
    try {
      const currentVerifications = await genericApi.list<OrderVerification>('order_verifications');
      const orders = await genericApi.list('orders');
      const pendingOrders = orders.filter((o: any) => o.status === 'PENDING');

      for (const order of pendingOrders) {
        const orderId = order._id || order.id;
        const existing = currentVerifications.find(v => v.order_id === orderId);
        if (!existing) {
          await genericApi.create('order_verifications', {
            order_id: orderId,
            order_number: order.order_number,
            client_name: order.client_name,
            source_destination: order.source_destination,
            status: 'PENDING',
            created_by: user?.id,
            created_at: new Date().toISOString()
          });
        }
      }

      const updatedList = await genericApi.list<OrderVerification>('order_verifications');
      setVerifications(updatedList || []);
    } catch (error) {
      console.error('Error syncing orders for verification:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVerifications = async () => {
    try {
      const data = await genericApi.list<OrderVerification>('order_verifications');
      setVerifications(data || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    }
  };

  const filterVerifications = () => {
    let filtered = [...verifications];
    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredVerifications(filtered);
  };

  const handleApprove = async (id: string, orderId: string) => {
    try {
      await genericApi.update('order_verifications', id, {
        status: 'CHECKED',
        verified_at: new Date().toISOString()
      });
      await genericApi.update('orders', orderId, { status: 'CHECKED' });
      fetchVerifications();
    } catch (error) {
      console.error('Error approving verification:', error);
    }
  };

  const handleReject = async (id: string, orderId: string) => {
    try {
      await genericApi.update('order_verifications', id, {
        status: 'PENDING',
        verified_at: null
      });
      await genericApi.update('orders', orderId, { status: 'PENDING' });
      fetchVerifications();
    } catch (error) {
      console.error('Error rejecting verification:', error);
    }
  };

  const totalPages = Math.ceil(filteredVerifications.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentVerifications = filteredVerifications.slice(startIndex, startIndex + entriesPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 font-medium text-[#0F3C66]">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50/30 min-h-screen">
      <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20">
            <CheckCircle size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('orderVerification.title')}</h1>
            <p className="text-sm text-gray-500 font-medium">Review and approve pending logistics orders</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-[#EE964C] tracking-widest uppercase bg-[#EE964C]/10 px-2 py-1 rounded">
            {t('common.version')}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3 text-sm text-gray-600 font-bold">
            <span>{t('common.show')}</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0F3C66]/20 outline-none transition bg-white shadow-sm"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span>{t('common.entries')}</span>
          </div>

          <div className="relative min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20 transition text-sm font-medium shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16">#</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orderVerification.colOrderId')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orderVerification.colClientName')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orderVerification.colSourceDest')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orderVerification.colDocAction')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orders.colStatus')}</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-24">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentVerifications?.map((v, index) => (
                <tr key={v.id || (v as any)._id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-gray-400">{startIndex + index + 1}</td>
                  <td className="px-6 py-4 text-sm font-bold text-[#0F3C66]">{v.order_number}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{v.client_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">{v.source_destination}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#0F3C66]/5 text-[#0F3C66] border border-[#0F3C66]/10 uppercase tracking-wider">
                      {v.document_action || t('orders.title')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${
                      v.status === 'CHECKED' || v.status === 'APPROVED' 
                        ? 'bg-green-50 text-green-700 border-green-100' 
                        : v.status === 'REJECTED' 
                        ? 'bg-red-50 text-red-700 border-red-100' 
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      <div className={`w-1 h-1 rounded-full mr-2 ${
                        v.status === 'CHECKED' || v.status === 'APPROVED' ? 'bg-green-500' : v.status === 'REJECTED' ? 'bg-red-500' : 'bg-amber-500'
                      }`}></div>
                      {v.status === 'CHECKED' || v.status === 'APPROVED' ? t('common.approved') : v.status === 'REJECTED' ? t('common.rejected') : t('dashboard.pending')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <ActionMenu
                        actions={[
                          {
                            label: t('orderVerification.approve'),
                            icon: <CheckCircle size={16} />,
                            onClick: () => handleApprove(v.id || (v as any)._id, v.order_id),
                            disabled: v.status === 'CHECKED' || v.status === 'APPROVED'
                          },
                          {
                            label: t('orderVerification.reject'),
                            icon: <XCircle size={16} />,
                            onClick: () => handleReject(v.id || (v as any)._id, v.order_id),
                            variant: 'danger',
                            disabled: v.status === 'CHECKED' || v.status === 'APPROVED'
                          }
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-gray-50 bg-gray-50/30 flex justify-between items-center flex-wrap gap-4">
          <div className="text-sm font-bold text-gray-500">
            {t('common.showing')} <span className="text-gray-900">{startIndex + 1}</span> {t('common.to')} <span className="text-gray-900">{Math.min(startIndex + entriesPerPage, filteredVerifications.length)}</span> {t('common.of')} <span className="text-gray-900">{filteredVerifications.length}</span> {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm font-bold text-sm text-[#0F3C66]"
            >
              {t('common.previous')}
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-xl transition-all font-bold text-sm ${
                    currentPage === page
                      ? 'bg-[#0F3C66] text-white shadow-lg active:scale-95'
                      : 'border border-gray-200 hover:bg-white text-gray-600'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm font-bold text-sm text-[#0F3C66]"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
