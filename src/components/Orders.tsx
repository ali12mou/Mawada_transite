import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Search, Download, MoreVertical, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

interface Order {
  id: string;
  order_number: string;
  bl_number: string;
  client_name: string;
  client_phone: string;
  source_destination: string;
  delivery_status: string;
  status: string;
  item_price: string;
  amount_djf: number;
  quantity: number;
  recharge_amount: number;
  maritime_line_fees: number;
  sgtd_wharfage: number;
  document_9: number;
  document_4: number;
  port_handling: number;
  port_passage: number;
  file_fees: number;
  escort_fees: number;
  transport: number;
  elevator_cart: number;
  ctn: number;
  chamber: number;
  exit: number;
  transit: number;
  total_services: number;
  total_item_price: number;
  profit_amount: number;
  total: number;
  ci_amount: number;
  order_date: string;
  creation_date: string;
}

export function Orders() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [dateRange, setDateRange] = useState('');

  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    source_destination: '',
    item_price: '',
    bl_number: '',
    amount_djf: 0,
    quantity: 0,
    recharge_amount: 0,
    maritime_line_fees: 0,
    sgtd_wharfage: 0,
    document_9: 0,
    document_4: 0,
    port_handling: 0,
    port_passage: 0,
    file_fees: 0,
    escort_fees: 0,
    transport: 0,
    elevator_cart: 0,
    ctn: 0,
    chamber: 0,
    exit: 0,
    transit: 0,
    order_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, sourceFilter]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('creation_date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.bl_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (sourceFilter !== 'All') {
      filtered = filtered.filter(order => order.source_destination?.includes(sourceFilter));
    }

    setFilteredOrders(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    try {
      const totalServices =
        Number(formData.maritime_line_fees) +
        Number(formData.sgtd_wharfage) +
        Number(formData.document_9) +
        Number(formData.document_4) +
        Number(formData.port_handling) +
        Number(formData.port_passage) +
        Number(formData.file_fees) +
        Number(formData.escort_fees) +
        Number(formData.transport) +
        Number(formData.elevator_cart) +
        Number(formData.ctn) +
        Number(formData.chamber) +
        Number(formData.exit) +
        Number(formData.transit);

      const totalItemPrice = Number(formData.amount_djf) * Number(formData.quantity);
      const total = totalItemPrice + Number(formData.recharge_amount);
      const profitAmount = total - totalServices;

      const orderNumber = `ORDER${Date.now().toString().slice(-6)}`;

      const { error } = await supabase.from('orders').insert([{
        ...formData,
        order_number: orderNumber,
        total_services: totalServices,
        total_item_price: totalItemPrice,
        total,
        profit_amount: profitAmount,
        created_by: user?.id
      }]);

      if (error) throw error;

      setShowModal(false);
      setCurrentStep(1);
      resetForm();
      fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      client_phone: '',
      source_destination: '',
      item_price: '',
      bl_number: '',
      amount_djf: 0,
      quantity: 0,
      recharge_amount: 0,
      maritime_line_fees: 0,
      sgtd_wharfage: 0,
      document_9: 0,
      document_4: 0,
      port_handling: 0,
      port_passage: 0,
      file_fees: 0,
      escort_fees: 0,
      transport: 0,
      elevator_cart: 0,
      ctn: 0,
      chamber: 0,
      exit: 0,
      transit: 0,
      order_date: new Date().toISOString().split('T')[0]
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500 text-white';
      case 'CHECKED':
        return 'bg-blue-500 text-white';
      case 'PENDING':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getDeliveryStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-500 text-white';
      case 'PENDING':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const totalPages = Math.ceil(filteredOrders.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const formatCurrency = (amount: number) => formatAmount(amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Gérer la liste des commandes</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut de la commande *
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>All</option>
                <option>COMPLETED</option>
                <option>CHECKED</option>
                <option>PENDING</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source et Destination *
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>All</option>
                <option>DIRE DAWA</option>
                <option>China</option>
                <option>Mogadishu</option>
                <option>Hargeisa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page de dates *
              </label>
              <input
                type="text"
                placeholder="2026-02-28 - 2026-02-28"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-56 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Imprimer la Commande
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              Ajouter Nouveau
            </button>
          </div>
        </div>

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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">BL Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Source et Destination</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Statut de livraison</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Montant CI</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date de création</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Order Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Créé par</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentOrders.map((order, index) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{order.order_number}</td>
                  <td className="px-4 py-3 text-sm">{order.bl_number || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>{order.client_name}</div>
                    <div className="text-xs text-gray-500">{order.client_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{order.source_destination || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getDeliveryStatusBadgeClass(order.delivery_status)}`}>
                      {order.delivery_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(order.ci_amount)}</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(order.creation_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {order.order_date ? new Date(order.order_date).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">-</td>
                  <td className="px-4 py-3">
                    <button className="text-gray-600 hover:text-gray-900">
                      <MoreVertical className="w-5 h-5" />
                    </button>
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
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Ajouter/Mettre à jour la commande</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setCurrentStep(1);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep === 1 ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    1
                  </div>
                  <div className="w-24 h-1 bg-gray-300"></div>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep === 2 ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    2
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {currentStep === 1 ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.client_name}
                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Mohamed Ali - 09812991912 -"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Source et Destination *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.source_destination}
                        onChange={(e) => setFormData({ ...formData, source_destination: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Djibouti -To- DIRE DAWA"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Price *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.item_price}
                        onChange={(e) => setFormData({ ...formData, item_price: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Container Shipping - 810 (USD)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        BL Number
                      </label>
                      <input
                        type="text"
                        value={formData.bl_number}
                        onChange={(e) => setFormData({ ...formData, bl_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1234567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Montant en DJF
                      </label>
                      <input
                        type="number"
                        value={formData.amount_djf}
                        onChange={(e) => setFormData({ ...formData, amount_djf: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantité *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Montant de la recharge
                      </label>
                      <input
                        type="number"
                        value={formData.recharge_amount}
                        onChange={(e) => setFormData({ ...formData, recharge_amount: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frais de ligne maritime *
                      </label>
                      <input
                        type="number"
                        value={formData.maritime_line_fees}
                        onChange={(e) => setFormData({ ...formData, maritime_line_fees: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SGTD Wharfage *
                      </label>
                      <input
                        type="number"
                        value={formData.sgtd_wharfage}
                        onChange={(e) => setFormData({ ...formData, sgtd_wharfage: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document N° 9
                      </label>
                      <input
                        type="number"
                        value={formData.document_9}
                        onChange={(e) => setFormData({ ...formData, document_9: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document N° 4
                      </label>
                      <input
                        type="number"
                        value={formData.document_4}
                        onChange={(e) => setFormData({ ...formData, document_4: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chargement ou Main-d'œuvre *
                      </label>
                      <input
                        type="number"
                        value={formData.port_handling}
                        onChange={(e) => setFormData({ ...formData, port_handling: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Passage de Porte *
                      </label>
                      <input
                        type="number"
                        value={formData.port_passage}
                        onChange={(e) => setFormData({ ...formData, port_passage: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frais de Dossier *
                      </label>
                      <input
                        type="number"
                        value={formData.file_fees}
                        onChange={(e) => setFormData({ ...formData, file_fees: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frais d'Escorte
                      </label>
                      <input
                        type="number"
                        value={formData.escort_fees}
                        onChange={(e) => setFormData({ ...formData, escort_fees: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transport *
                      </label>
                      <input
                        type="number"
                        value={formData.transport}
                        onChange={(e) => setFormData({ ...formData, transport: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chariot Elévateur
                      </label>
                      <input
                        type="number"
                        value={formData.elevator_cart}
                        onChange={(e) => setFormData({ ...formData, elevator_cart: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CTN
                      </label>
                      <input
                        type="number"
                        value={formData.ctn}
                        onChange={(e) => setFormData({ ...formData, ctn: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chambre
                      </label>
                      <input
                        type="number"
                        value={formData.chamber}
                        onChange={(e) => setFormData({ ...formData, chamber: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sortie
                      </label>
                      <input
                        type="number"
                        value={formData.exit}
                        onChange={(e) => setFormData({ ...formData, exit: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transit *
                      </label>
                      <input
                        type="number"
                        value={formData.transit}
                        onChange={(e) => setFormData({ ...formData, transit: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total des services
                      </label>
                      <input
                        type="number"
                        disabled
                        value={
                          Number(formData.maritime_line_fees) +
                          Number(formData.sgtd_wharfage) +
                          Number(formData.document_9) +
                          Number(formData.document_4) +
                          Number(formData.port_handling) +
                          Number(formData.port_passage) +
                          Number(formData.file_fees) +
                          Number(formData.escort_fees) +
                          Number(formData.transport) +
                          Number(formData.elevator_cart) +
                          Number(formData.ctn) +
                          Number(formData.chamber) +
                          Number(formData.exit) +
                          Number(formData.transit)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={formData.order_date}
                        onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="bg-blue-900 text-yellow-400 p-4 rounded-md mb-6">
                      <p className="text-sm">
                        NOTE:Les documents suivants sont requis. Veuillez vous assurer qu'ils sont valides et en bon état.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Livraison *
                        </label>
                        <input
                          type="file"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Connaissement *
                        </label>
                        <input
                          type="file"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Syndonia *
                        </label>
                        <input
                          type="file"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Exigence de déclaration de pays *
                        </label>
                        <input
                          type="file"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Numéro 9 *
                        </label>
                        <input
                          type="file"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Numéro 4 *
                        </label>
                        <input
                          type="file"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Déclaration S *
                        </label>
                        <input
                          type="file"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Déclaration E *
                        </label>
                        <input
                          type="file"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Facture SGTD *
                        </label>
                        <input
                          type="file"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Document CI *
                        </label>
                        <input
                          type="file"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CI Amount (must match predefined amount in USD) *
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  {currentStep === 2 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Précédent
                    </button>
                  )}

                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ml-auto"
                  >
                    {currentStep === 1 ? 'Suivant' : 'Terminer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
