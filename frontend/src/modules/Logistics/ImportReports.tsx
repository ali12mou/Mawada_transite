import { useState, useEffect } from 'react';
import { Folder, List, FileText, Search } from 'lucide-react';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fetchClients as fetchClientsApi } from '../../api/clientsApi';

interface Order {
  id: string;
  order_number: string;
  client_id: string;
  source_location: string;
  destination_location: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  created_at: string;
  created_by: string;
  completion_date: string;
  quantity: number;
  benefit_amount: number;
  clients?: {
    name: string;
    company_name: string;
  };
}

export function ImportReports() {
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [view, setView] = useState<'cards' | 'client-orders' | 'all-orders'>('cards');
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    if (view !== 'cards') {
      fetchOrders();
    }
  }, [view]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const data = await fetchClientsApi();
      setClients(data?.map(c => ({ id: c.id, name: c.name, company_name: c.company_name || '' })));
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await genericApi.list<Order>('orders');
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clients?.company_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClient = !selectedClient || order.client_id === selectedClient;
    const matchesStatus = selectedStatus === 'All' || order.status === selectedStatus;

    return matchesSearch && matchesClient && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CHECKED': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  if (view === 'cards') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Tous les rapports de celui sélectionné</h2>
          <div className="text-sm text-gray-500">Version: 2.0.0 / MAJOR</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={() => setView('client-orders')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-[#0F3C66]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <Folder size={32} className="text-[#0F3C66]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Archiver les documents de commande</h3>
                <p className="text-gray-600 text-sm mt-1">View archived order documents.</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setView('all-orders')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-[#0F3C66]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <List size={32} className="text-[#0F3C66]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Rapport des commandes</h3>
                <p className="text-gray-600 text-sm mt-1">View and analyze all orders data.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'client-orders') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('cards')}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              ← Retour
            </button>
            <h2 className="text-xl font-bold text-gray-800">Rapport des commandes clients</h2>
          </div>
          <div className="text-sm text-gray-500">Version: 2.0.0 / MAJOR</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Plage de dates</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Clients</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              >
                <option value="">SELECT CUSTOMER</option>
                {clients?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">#</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Commande</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Client</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Source (De)</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Destination (À)</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Statut</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Total</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Solde</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Commencé</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Terminé</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Temps pris</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="px-3 py-8 text-center text-gray-500">
                      Chargement...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-3 py-8 text-center text-gray-500">
                      Aucune donnée disponible
                    </td>
                  </tr>
                ) : (
                  filteredOrders?.map((order, index) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs">{index + 1}</td>
                      <td className="px-3 py-2 text-xs">{order.order_number}</td>
                      <td className="px-3 py-2 text-xs">{order.clients?.name || 'N/A'}</td>
                      <td className="px-3 py-2 text-xs">{order.source_location}</td>
                      <td className="px-3 py-2 text-xs">{order.destination_location}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">{formatAmount(order.total_amount)}</td>
                      <td className="px-3 py-2 text-xs">{formatAmount(order.paid_amount)}</td>
                      <td className="px-3 py-2 text-xs">{new Date(order.created_at).toLocaleString()}</td>
                      <td className="px-3 py-2 text-xs">{order.completion_date ? new Date(order.completion_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-3 py-2 text-xs">N/A</td>
                      <td className="px-3 py-2">
                        <button className="p-1 text-[#0F3C66] hover:bg-gray-100 rounded">
                          <FileText size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView('cards')}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            ← Retour
          </button>
          <h2 className="text-xl font-bold text-gray-800">Rapport des commandes</h2>
        </div>
        <div className="text-sm text-gray-500">Version: 2.0.0 / MAJOR</div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plage de dates</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
            >
              <option value="All">All</option>
              <option value="PENDING">PENDING</option>
              <option value="CHECKED">CHECKED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">#</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Référence de la commande</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Client</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Statut</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Créé par</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Date de création</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Montant total</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Montant du bénéfice</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Report</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Quantité</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Montant de</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-gray-500">
                    Aucune donnée disponible
                  </td>
                </tr>
              ) : (
                filteredOrders?.map((order, index) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs">{index + 1}</td>
                    <td className="px-3 py-2 text-xs">{order.order_number}</td>
                    <td className="px-3 py-2 text-xs">{order.clients?.name || 'N/A'} - {order.clients?.company_name || ''}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">{order.created_by}</td>
                    <td className="px-3 py-2 text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-xs">{formatAmount(order.total_amount)}</td>
                    <td className="px-3 py-2 text-xs">{formatAmount(order.benefit_amount || 0)}</td>
                    <td className="px-3 py-2 text-xs">Container Shipping</td>
                    <td className="px-3 py-2 text-xs">{order.quantity || 'N/A'}</td>
                    <td className="px-3 py-2 text-xs">{formatAmount(order.paid_amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



