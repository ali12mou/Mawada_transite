import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Download, Edit2, Trash2, Eye, Search } from 'lucide-react';
import { ActionMenu } from '../Shared/common/ActionMenu';
import Modal from '../Shared/common/Modal';
import { useCurrency } from '../../contexts/CurrencyContext';
import { fetchClients, type ClientRecord } from '../../api/clientsApi';
import { fetchOrders as apiFetchOrders, createOrder, deleteOrder, type OrderData } from '../../api/ordersApi';

interface Order extends OrderData {
  id: string;
  creation_date?: string;
}

export function Orders() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
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
    ci_amount: 0,
    order_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchOrders();
    fetchClients().then(setClients).catch(console.error);
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, sourceFilter]);

  const fetchOrders = async () => {
    try {
      const data = await apiFetchOrders();
      const mappedOrders = data.map((item: OrderData & { _id?: string, createdAt?: string, creation_date?: string, id?: string }) => ({
        ...item,
        id: item._id || item.id || '',
        creation_date: item.createdAt || item.creation_date || new Date().toISOString()
      }));
      setOrders(mappedOrders);
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

      await createOrder({
        ...formData,
        order_number: orderNumber,
        total_services: totalServices,
        total_item_price: totalItemPrice,
        total,
        profit_amount: profitAmount,
        ci_amount: formData.ci_amount,
        created_by: user?.id
      });

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
      ci_amount: 0,
      order_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await deleteOrder(id);
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
    }
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
        <h1 className="text-2xl font-bold tracking-tight text-[#0F3C66] mb-6">{t('orders.title')}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              {t('orders.statusFilter')}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] transition text-sm font-medium"
            >
              <option value="All">All</option>
              <option value="PENDING">PENDING</option>
              <option value="CHECKED">CHECKED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              {t('orders.sourceFilter')}
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] transition text-sm font-medium"
            >
              <option value="All">All</option>
              <option value="Djibouti -To- DIRE DAWA">Djibouti -To- DIRE DAWA</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              {t('orders.dateRange')}
            </label>
            <input
              type="date"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] transition text-sm font-medium"
            />
          </div>

          <div className="flex items-end gap-2">
            <button className="flex-1 px-4 py-2 border border-gray-200 text-[#0F3C66] rounded-xl font-bold shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2 transition active:scale-95 text-sm">
              <Download className="w-4 h-4" />
              {t('orders.printOrder')}
            </button>
            <button
              onClick={() => {
                setShowModal(true);
                setCurrentStep(1);
              }}
              className="flex-1 px-4 py-2 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20 font-bold hover:bg-[#154b8a] flex items-center justify-center gap-2 transition active:scale-95 text-sm"
            >
              <Plus className="w-4 h-4" />
              {t('orders.addNew')}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">{t('common.show')}</span>
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3C66]/20 outline-none transition text-sm font-medium"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm font-medium text-gray-600">{t('common.entries')}</span>
          </div>

          <div className="relative w-72">
            <input
              type="text"
              placeholder={`${t('common.searchLabel') || t('common.search')}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20 focus:border-[#0F3C66] transition shadow-sm text-sm"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-[#0F3C66] text-white">
              <tr>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">#</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('orders.colBl')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('orders.colClient')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('orders.colSourceDest')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('orders.colDeliveryStatus')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('orders.colTotal')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('orders.colCiAmount')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('orders.colCreationDate')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('orders.colStatus')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider w-24 text-center">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentOrders?.map((order) => (
                <tr key={order.id} className="hover:bg-[#0F3C66]/5 transition group">
                  <td className="px-5 py-4 text-sm font-bold text-gray-500">{order.order_number}</td>
                  <td className="px-5 py-4 text-sm font-mono text-gray-800">{order.bl_number || '-'}</td>
                  <td className="px-5 py-4 text-sm">
                    <div className="font-bold text-[#0F3C66]">{order.client_name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{order.client_phone}</div>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-600">{order.source_destination || '-'}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg ${getDeliveryStatusBadgeClass(order.delivery_status)}`}>
                      {order.delivery_status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-mono text-[#0F3C66] font-bold">{formatCurrency(order.total)}</td>
                  <td className="px-5 py-4 text-sm font-mono font-medium text-gray-600">{formatCurrency(order.ci_amount)}</td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-500">
                    {new Date(order.creation_date || new Date().toISOString()).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionMenu
                        actions={[
                          {
                            label: t('common.view'),
                            icon: <Eye size={16} />,
                            onClick: () => console.log('View Order', order.id),
                          },
                          {
                            label: t('common.edit'),
                            icon: <Edit2 size={16} />,
                            onClick: () => console.log('Edit Order', order.id),
                          },
                          {
                            label: t('common.delete'),
                            icon: <Trash2 size={16} />,
                            onClick: () => handleDelete(order.id),
                            variant: 'danger',
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-between items-center">
          <div className="text-sm font-medium text-gray-500">
            {t('common.showing')} <span className="font-bold text-gray-900">{startIndex + 1}</span> {t('common.to')} <span className="font-bold text-gray-900">{Math.min(endIndex, filteredOrders.length)}</span> {t('common.of')} <span className="font-bold text-gray-900">{filteredOrders.length}</span> {t('common.entries')}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm font-bold text-sm text-[#0F3C66]"
            >
              {t('common.previous') || 'Previous'}
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1)?.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-xl transition-all font-bold text-sm ${
                    currentPage === page
                      ? 'bg-[#0F3C66] text-white shadow-lg shadow-[#0F3C66]/20 active:scale-95'
                      : 'border border-gray-200 hover:bg-white hover:border-[#0F3C66]/30 text-gray-600'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm font-bold text-sm text-[#0F3C66]"
            >
              {t('common.next') || 'Next'}
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
        title={t('orders.addUpdate') || 'Add/Update Order'}
        size="xxl"
      >
        <div className="p-2">
              <div className="flex gap-4 mb-8">
                <div className={`flex-1 h-2 rounded-full ${currentStep === 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <div className={`flex-1 h-2 rounded-full ${currentStep === 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              </div>

              <div className="flex justify-between mb-8 text-sm font-medium">
                <span className={currentStep === 1 ? 'text-blue-600' : 'text-gray-400'}>{t('orders.step1')}</span>
                <span className={currentStep === 2 ? 'text-blue-600' : 'text-gray-400'}>{t('orders.step2')}</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {currentStep === 1 ? (
                  <div className="space-y-6 p-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('orders.colClient')} *</label>
                        <div className="relative">
                          <select
                            required
                            value={formData.client_name}
                            onChange={(e) => {
                              const client = clients.find(c => c.name === e.target.value);
                              setFormData({ 
                                ...formData, 
                                client_name: e.target.value,
                                client_phone: client?.phone || '' 
                              });
                            }}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium appearance-none"
                          >
                            <option value="" disabled>{t('orders.clientPlaceholder') || 'Select Client...'}</option>
                            {clients.map(c => (
                              <option key={c.id} value={c.name}>
                                {c.name} {c.phone ? `- ${c.phone}` : ''}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('orders.sourceFilter')} *</label>
                        <input
                          type="text"
                          required
                          placeholder={t('orders.sourceDestPlaceholder')}
                          value={formData.source_destination}
                          onChange={(e) => setFormData({ ...formData, source_destination: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('orders.pricePlaceholder')} *</label>
                        <input
                          type="text"
                          required
                          placeholder={t('orders.pricePlaceholder')}
                          value={formData.item_price}
                          onChange={(e) => setFormData({ ...formData, item_price: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('orders.colBl')} *</label>
                        <input
                          type="text"
                          required
                          placeholder={t('orders.blPlaceholder')}
                          value={formData.bl_number}
                          onChange={(e) => setFormData({ ...formData, bl_number: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="text-[11px] font-bold text-[#0F3C66] mb-4 uppercase tracking-wide">{t('orders.pricingAndFees')}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[
                          { key: 'amount_djf', label: t('orders.amountDjf') },
                          { key: 'quantity', label: t('orders.quantity') },
                          { key: 'recharge_amount', label: t('orders.rechargeAmount') },
                          { key: 'maritime_line_fees', label: t('orders.maritimeFees') },
                          { key: 'sgtd_wharfage', label: t('orders.sgtdWharfage') },
                          { key: 'document_9', label: t('orders.doc9') },
                          { key: 'document_4', label: t('orders.doc4') },
                          { key: 'port_handling', label: t('orders.portHandling') },
                          { key: 'port_passage', label: t('orders.portPassage') },
                          { key: 'file_fees', label: `${t('orders.fileFees')} *` },
                          { key: 'escort_fees', label: t('orders.escortFees') },
                          { key: 'transport', label: `${t('orders.transport')} *` },
                          { key: 'elevator_cart', label: t('orders.elevatorCart') },
                          { key: 'ctn', label: t('orders.ctn') },
                          { key: 'chamber', label: t('orders.chamber') },
                          { key: 'exit', label: t('orders.exit') },
                          { key: 'transit', label: `${t('orders.transit')} *` },
                        ]?.map((field) => (
                          <div key={field.key}>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide truncate" title={field.label as string}>{field.label}</label>
                            <input
                              type="number"
                              value={formData[field.key as keyof typeof formData] as number}
                              onChange={(e) => setFormData({ ...formData, [field.key]: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-gray-100 pt-6">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                          {t('orders.totalServices')}
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
                          className="w-full px-4 py-2.5 bg-gray-100/50 text-[#0F3C66] font-bold border border-gray-200 rounded-xl outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                          {t('orders.dateLabel')}
                        </label>
                        <input
                          type="date"
                          value={formData.order_date}
                          onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 p-1">
                    <div className="bg-[#0F3C66]/5 rounded-xl border border-[#0F3C66]/10 p-4 mb-4">
                      <div className="flex gap-3">
                        <div className="text-[#EE964C] mt-0.5">⚠️</div>
                        <div>
                          <p className="text-[11px] font-bold text-[#0F3C66] uppercase tracking-wide">{t('orders.reqDocs')}</p>
                          <p className="text-sm font-medium text-gray-600">{t('orders.reqDocsDesc')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {[
                        { label: `${t('orders.livraison')} *` },
                        { label: `${t('orders.connaissement')} *` },
                        { label: `${t('orders.syndonia')} *` },
                        { label: `${t('orders.countryDeclaration')} *` },
                        { label: `${t('orders.doc9')} *` },
                        { label: `${t('orders.doc4')} *` },
                        { label: `${t('orders.docS')} *` },
                        { label: `${t('orders.docE')} *` },
                        { label: `${t('orders.factureSgtd')} *` },
                        { label: `${t('orders.docCi')} *` },
                      ].map((doc, idx) => (
                        <div key={idx}>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide truncate" title={doc.label}>{doc.label}</label>
                          <input
                            type="file"
                            className="w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#0F3C66]/5 file:text-[#0F3C66] hover:file:bg-[#0F3C66]/10 cursor-pointer block border border-gray-200 bg-gray-50 rounded-xl"
                          />
                        </div>
                      ))}
                      
                      <div className="md:col-span-2 lg:col-span-3 border-t border-gray-100 pt-5 mt-2">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide text-center">
                          {t('orders.ciAmountDesc')} *
                        </label>
                        <input
                          type="number"
                          value={formData.ci_amount || 0}
                          onChange={(e) => setFormData({ ...formData, ci_amount: Number(e.target.value) })}
                          className="max-w-xs mx-auto block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] focus:bg-white outline-none transition text-sm font-medium text-center"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                  {currentStep === 2 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm"
                    >
                      {t('orders.previous')}
                    </button>
                  ) : <div />}

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20 font-bold hover:bg-[#154b8a] transition active:scale-95 flex items-center gap-2 text-sm"
                  >
                    {currentStep === 1 ? t('orders.next') : t('orders.finish')}
                  </button>
                </div>
              </form>
            </div>
      </Modal>
    </div>
  );
}


