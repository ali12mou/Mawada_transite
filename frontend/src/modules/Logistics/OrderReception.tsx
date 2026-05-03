import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { FileText, Receipt, Plus, Search } from 'lucide-react';
import { ActionMenu } from '../Shared/common/ActionMenu';
import { useCurrency } from '../../contexts/CurrencyContext';
import Modal from '../Shared/common/Modal';

interface OrderReception {
  id: string;
  _id?: string;
  order_id: string;
  client_name: string;
  order_number: string;
  services: number;
  port_airport: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  payment_date: string;
  created_at: string;
}

interface Order {
  id: string;
  _id?: string;
  order_number: string;
  client_name: string;
  total: number;
  total_services: number;
}

export function OrderReception() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [receptions, setReceptions] = useState<OrderReception[]>([]);
  const [filteredReceptions, setFilteredReceptions] = useState<OrderReception[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    client_name: '',
    order_id: '',
    order_number: '',
    paid: 0,
    balance: 0
  });

  useEffect(() => {
    fetchReceptions();
    fetchOrders();
  }, []);

  useEffect(() => {
    filterReceptions();
  }, [receptions, searchTerm]);

  const fetchReceptions = async () => {
    try {
      const data = await genericApi.list('order_receptions');
      setReceptions(data || []);
    } catch (error) {
      console.error('Error fetching receptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await genericApi.list<Order>('orders');
      const filtered = data.filter((o: any) => o.status === 'CHECKED');
      setOrders(filtered || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const filterReceptions = () => {
    let filtered = [...receptions];
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.order_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredReceptions(filtered);
  };

  const handleOrderSelect = (orderId: string) => {
    const selectedOrder = orders.find(o => (o._id || o.id) === orderId);
    if (selectedOrder) {
      setFormData({
        ...formData,
        order_id: orderId,
        order_number: selectedOrder.order_number,
        client_name: selectedOrder.client_name
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedOrder = orders.find(o => (o._id || o.id) === formData.order_id);
      if (!selectedOrder) return;

      const total = selectedOrder.total || 0;
      const balance = total - Number(formData.paid);

      await genericApi.create('order_receptions', {
        ...formData,
        total,
        balance,
        payment_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      await genericApi.update('orders', formData.order_id, { status: 'COMPLETED' });

      setShowModal(false);
      resetForm();
      fetchReceptions();
      fetchOrders();
    } catch (error) {
      console.error('Error creating reception:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      order_id: '',
      order_number: '',
      paid: 0,
      balance: 0
    });
  };

  const totalPages = Math.ceil(filteredReceptions.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentReceptions = filteredReceptions.slice(startIndex, startIndex + entriesPerPage);

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
            <Receipt size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('orderReception.title')}</h1>
            <p className="text-sm text-gray-500 font-medium">Manage order payments and final receptions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-[#EE964C] tracking-widest uppercase bg-[#EE964C]/10 px-2 py-1 rounded">
            {t('common.version')}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-[#0F3C66] text-white rounded-xl hover:bg-[#154b8a] transition shadow-md shadow-[#0F3C66]/10 flex items-center gap-2 font-bold text-sm"
          >
            <Plus size={18} />
            {t('orderReception.paymentBtn')}
          </button>
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
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orders.colClient')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orderVerification.colOrderId')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orders.colTotal')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orderReception.colPaid')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orderReception.colBalance')}</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-24">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentReceptions?.map((r, index) => (
                <tr key={r._id || r.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-gray-400">{startIndex + index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-[#0F3C66]">{r.client_name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-800">{r.order_number}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatAmount(r.total)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600">{formatAmount(r.paid)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${r.balance <= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {formatAmount(r.balance)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <ActionMenu
                        actions={[
                          {
                            label: t('common.view'),
                            icon: <FileText size={16} />,
                            onClick: () => console.log('View', r.id)
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
            {t('common.showing')} <span className="text-gray-900">{startIndex + 1}</span> {t('common.to')} <span className="text-gray-900">{Math.min(startIndex + entriesPerPage, filteredReceptions.length)}</span> {t('common.of')} <span className="text-gray-900">{filteredReceptions.length}</span> {t('common.entries')}
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

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={t('orderReception.paymentDetails')}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5 p-2">
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                {t('orderReception.selectOrder')} *
              </label>
              <select
                required
                value={formData.order_id}
                onChange={(e) => handleOrderSelect(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium appearance-none"
              >
                <option value="">{t('orderReception.selectOrder')}</option>
                {orders?.map((order) => (
                  <option key={order._id || order.id} value={order._id || order.id}>
                    {order.client_name} - {order.order_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  {t('orderReception.colPaid')}
                </label>
                <input
                  type="number"
                  required
                  value={formData.paid}
                  onChange={(e) => setFormData({ ...formData, paid: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  {t('orderReception.colBalance')}
                </label>
                <input
                  type="number"
                  disabled
                  value={
                    formData.order_id
                      ? (orders.find(o => (o._id || o.id) === formData.order_id)?.total || 0) - Number(formData.paid)
                      : 0
                  }
                  className="w-full px-4 py-2.5 bg-100/50 text-red-600 font-bold border border-gray-200 rounded-xl outline-none"
                />
              </div>
            </div>

            {formData.order_id && (
              <div className="bg-[#0F3C66]/5 p-4 rounded-xl border border-[#0F3C66]/10">
                <p className="text-xs font-bold text-[#0F3C66] uppercase tracking-wide mb-1">Order Summary</p>
                <p className="text-sm font-bold text-gray-700">
                  Total Amount: {formatAmount(orders.find(o => (o._id || o.id) === formData.order_id)?.total || 0)}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 text-sm font-bold">
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20 hover:bg-[#154b8a] transition"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}



