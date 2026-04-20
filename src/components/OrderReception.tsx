import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, Plus, X, FileText, Download } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

interface OrderReception {
  id: string;
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
      const { data, error } = await supabase
        .from('order_receptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceptions(data || []);
    } catch (error) {
      console.error('Error fetching receptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, client_name, total, total_services')
        .eq('status', 'CHECKED');

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const filterReceptions = () => {
    let filtered = [...receptions];

    if (searchTerm) {
      filtered = filtered.filter(reception =>
        reception.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reception.order_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReceptions(filtered);
  };

  const handleOrderSelect = (orderId: string) => {
    const selectedOrder = orders.find(o => o.id === orderId);
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
      const selectedOrder = orders.find(o => o.id === formData.order_id);

      if (!selectedOrder) return;

      const services = selectedOrder.total_services || 0;
      const portAirport = 0;
      const tax = 0;
      const total = selectedOrder.total || 0;
      const balance = total - Number(formData.paid);

      const { error } = await supabase.from('order_receptions').insert([{
        order_id: formData.order_id,
        client_name: formData.client_name,
        order_number: formData.order_number,
        services,
        port_airport: portAirport,
        tax,
        total,
        paid: Number(formData.paid),
        balance,
        payment_date: new Date().toISOString(),
        created_by: user?.id
      }]);

      if (error) throw error;

      await supabase
        .from('orders')
        .update({ status: 'COMPLETED' })
        .eq('id', formData.order_id);

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

  const formatCurrency = (amount: number) => formatAmount(amount);

  const totalPages = Math.ceil(filteredReceptions.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentReceptions = filteredReceptions.slice(startIndex, endIndex);

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
        <h1 className="text-2xl font-semibold text-gray-800">Gérer la liste des commandes de reçu</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Paiement de la commande du reçu
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Services</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Port/Aéroport</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Taxe</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Payé</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Solde</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentReceptions.map((reception, index) => (
                <tr key={reception.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{startIndex + index + 1}</td>
                  <td className="px-4 py-3 text-sm">{reception.client_name}</td>
                  <td className="px-4 py-3 text-sm">{reception.order_number}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(reception.services)}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(reception.port_airport)}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(reception.tax)}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(reception.total)}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(reception.paid)}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(reception.balance)}</td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:text-blue-800">
                      <FileText className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredReceptions.length)} of {filteredReceptions.length} entries
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
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Reçu de commande</h2>
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
                    Client
                  </label>
                  <select
                    required
                    value={formData.order_id}
                    onChange={(e) => handleOrderSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner le client</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.client_name} - {order.order_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commande
                  </label>
                  <select
                    required
                    value={formData.order_id}
                    onChange={(e) => handleOrderSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner la commande</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.order_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Voir les documents</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="font-medium">Documents</div>
                    <div className="font-medium">Actions</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Détails du paiement du reçu</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payé
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.paid}
                        onChange={(e) => setFormData({ ...formData, paid: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Solde
                      </label>
                      <input
                        type="number"
                        disabled
                        value={
                          formData.order_id
                            ? (orders.find(o => o.id === formData.order_id)?.total || 0) - Number(formData.paid)
                            : 0
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {formData.order_id && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-600">
                      Order Total Payment: {formatCurrency(orders.find(o => o.id === formData.order_id)?.total || 0)}
                    </p>
                  </div>
                )}
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
