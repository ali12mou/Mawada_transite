import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Eye } from 'lucide-react';
import { ActionMenu } from './common/ActionMenu';
import { useCurrency } from '../contexts/CurrencyContext';

interface DeliveredOrder {
  id: string;
  order_id: string;
  order_number: string;
  client_name: string;
  source_destination: string;
  delivery_status: string;
  shipline: string;
  fees: number;
  added_by: string;
  delivery_document: string;
  delivered_at: string;
}

interface Order {
  id: string;
  order_number: string;
  client_name: string;
  source_destination: string;
}

export function DeliveredOrders() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [deliveredOrders, setDeliveredOrders] = useState<DeliveredOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<DeliveredOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    client_name: '',
    order_id: '',
    order_number: '',
    shipline: '',
    fees: 0,
    delivery_document: null as File | null
  });

  useEffect(() => {
    fetchDeliveredOrders();
    fetchCompletedOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [deliveredOrders, searchTerm]);

  const fetchDeliveredOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('delivered_orders')
        .select('*')
        .order('delivered_at', { ascending: false });

      if (error) throw error;
      setDeliveredOrders(data || []);
    } catch (error) {
      console.error('Error fetching delivered orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, client_name, source_destination')
        .eq('status', 'COMPLETED');

      if (error) throw error;
      setCompletedOrders(data || []);
    } catch (error) {
      console.error('Error fetching completed orders:', error);
    }
  };

  const filterOrders = () => {
    let filtered = [...deliveredOrders];

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.source_destination?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const handleOrderSelect = (orderId: string) => {
    const selectedOrder = completedOrders.find(o => o.id === orderId);
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
      const selectedOrder = completedOrders.find(o => o.id === formData.order_id);

      if (!selectedOrder) return;

      const { error } = await supabase.from('delivered_orders').insert([{
        order_id: formData.order_id,
        order_number: formData.order_number,
        client_name: formData.client_name,
        source_destination: selectedOrder.source_destination,
        shipline: formData.shipline,
        fees: Number(formData.fees),
        added_by: user?.email || 'Unknown',
        delivery_status: 'DELIVERED',
        created_by: user?.id
      }]);

      if (error) throw error;

      await supabase
        .from('orders')
        .update({ delivery_status: 'DELIVERED' })
        .eq('id', formData.order_id);

      setShowModal(false);
      resetForm();
      fetchDeliveredOrders();
      fetchCompletedOrders();
    } catch (error) {
      console.error('Error creating delivered order:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      order_id: '',
      order_number: '',
      shipline: '',
      fees: 0,
      delivery_document: null
    });
  };

  const totalPages = Math.ceil(filteredOrders.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">{t('deliveredOrders.title')}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {t('deliveredOrders.markDelivered')}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>{t('common.show')}</span>
            <input
              type="number"
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="w-16 px-2 py-1 border border-gray-300 rounded"
              min="1"
            />
            <span>{t('common.entries')}</span>
          </div>

          <div className="flex items-center gap-2">
            <span>{t('common.searchLabel')}</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('orderVerification.colOrderId')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('orders.colClient')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('orderVerification.colSourceDest')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('deliveredOrders.colShipline')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('deliveredOrders.colFees')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('deliveredOrders.colAddedBy')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('orders.colStatus')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentOrders?.map((order, index) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{startIndex + index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">{order.order_number}</td>
                  <td className="px-4 py-3 text-sm">{order.client_name}</td>
                  <td className="px-4 py-3 text-sm">{order.source_destination}</td>
                  <td className="px-4 py-3 text-sm">{order.shipline}</td>
                  <td className="px-4 py-3 text-sm">{formatAmount(order.fees)}</td>
                  <td className="px-4 py-3 text-sm">{order.added_by}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {order.delivery_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ActionMenu
                      actions={[
                        {
                          label: t('common.view'),
                          icon: <Eye className="w-4 h-4" />,
                          onClick: () => order.delivery_document && window.open(order.delivery_document, '_blank')
                        }
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {t('common.showing')} {startIndex + 1} {t('common.to')} {Math.min(endIndex, filteredOrders.length)} {t('common.of')} {filteredOrders.length} {t('common.entries')}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.previous')}
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1)?.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border rounded ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'
                  }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">{t('deliveredOrders.addUpdate')}</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 font-poppins">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('orderReception.selectOrder')} *
                  </label>
                  <select
                    required
                    value={formData.order_id}
                    onChange={(e) => handleOrderSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('orderReception.selectOrder')}</option>
                    {completedOrders?.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.client_name} - {order.order_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('deliveredOrders.colShipline')} *
                  </label>
                  <select
                    required
                    value={formData.shipline}
                    onChange={(e) => setFormData({ ...formData, shipline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('deliveredOrders.selectShipline')}</option>
                    <option value="MSC">MSC</option>
                    <option value="CMA CGM">CMA CGM</option>
                    <option value="Maersk">Maersk</option>
                    <option value="Hapag-Lloyd">Hapag-Lloyd</option>
                    <option value="PIL">PIL</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('deliveredOrders.colFees')}
                  </label>
                  <input
                    type="number"
                    value={formData.fees}
                    onChange={(e) => setFormData({ ...formData, fees: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('deliveredOrders.deliveryDoc')}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFormData({ ...formData, delivery_document: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


