import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, X, Edit2, Trash2, Eye } from 'lucide-react';
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

  const formatCurrency = (amount: number) => formatAmount(amount);

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
        <h1 className="text-2xl font-semibold text-gray-800">Gérer les commandes livrées</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Marquer la commande comme livrée
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <input
              type="number"
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="w-16 px-2 py-1 border border-gray-300 rounded"
              min="1"
            />
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Search:</span>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Commande</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Source et Destination</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Statut de livraison</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ligne d'expédition</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Frais</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ajouté par</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentOrders.map((order, index) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{startIndex + index + 1}</td>
                  <td className="px-4 py-3 text-sm">{order.client_name}</td>
                  <td className="px-4 py-3 text-sm text-blue-600">{order.order_number}</td>
                  <td className="px-4 py-3 text-sm">{order.source_destination || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-semibold">
                      {order.delivery_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{order.shipline || 'null'}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(order.fees)}</td>
                  <td className="px-4 py-3 text-sm">{order.added_by || 'null'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <X className="w-4 h-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-800">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border rounded ${
                  currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'
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
              Next
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Marquer/Mise à jour des commandes livrées</h2>
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

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client *
                  </label>
                  <select
                    required
                    value={formData.order_id}
                    onChange={(e) => handleOrderSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Customer</option>
                    {completedOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.client_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commande *
                  </label>
                  <select
                    required
                    value={formData.order_id}
                    onChange={(e) => handleOrderSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Order</option>
                    {completedOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.order_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ligne d'expédition *
                  </label>
                  <select
                    required
                    value={formData.shipline}
                    onChange={(e) => setFormData({ ...formData, shipline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Shipline</option>
                    <option value="Mohamed Qasaala 2">Mohamed Qasaala 2</option>
                    <option value="Shipline A">Shipline A</option>
                    <option value="Shipline B">Shipline B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frais *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.fees}
                    onChange={(e) => setFormData({ ...formData, fees: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document de livraison *
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFormData({ ...formData, delivery_document: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Aucun fichier choisi</p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
