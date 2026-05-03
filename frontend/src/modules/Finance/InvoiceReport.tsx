import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Edit2, Trash2, Printer, Download, Eye, FileText, Search, UploadCloud } from 'lucide-react';
import { ActionMenu } from '../Shared/common/ActionMenu';
import Modal from '../Shared/common/Modal';
import { useCurrency } from '../../contexts/CurrencyContext';

interface InvoiceReportItem {
  id?: string;
  description: string;
  quantity: string;
  unit: string;
  amount: number;
  amount_usd: number;
}

interface InvoiceReport {
  id: string;
  invoice_no: string;
  consignee: string;
  phone_number: string;
  email: string;
  bill_of_lading: string;
  invoice_date: string;
  unit: string;
  weight: string;
  truck_number: string;
  operation_no: string;
  freight_forwarder: string;
  no_declaration: string;
  responsible: string;
  status: string;
  total_amount: number;
  total_amount_usd: number;
  created_at: string;
}

export function InvoiceReport() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [invoices, setInvoices] = useState<InvoiceReport[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'invoice' | 'applicant'>('invoice');
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedConsignee, setSelectedConsignee] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [editingInvoice, setEditingInvoice] = useState<InvoiceReport | null>(null);

  const [formData, setFormData] = useState({
    consignee: '',
    phone_number: '',
    email: '',
    bill_of_lading: '',
    invoice_no: '',
    invoice_date: new Date().toISOString().split('T')[0],
    unit: '',
    weight: '',
    truck_number: '',
    operation_no: '',
    freight_forwarder: '',
    no_declaration: '',
    responsible: '',
    status: 'unpaid'
  });

  const [items, setItems] = useState<InvoiceReportItem[]>([
    { description: 'Electronics', quantity: '', unit: '', amount: 0, amount_usd: 0 }
  ]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, selectedConsignee, selectedStatus, dateRange]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await genericApi.list('invoice_reports');

      
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    if (selectedConsignee !== 'All') {
      filtered = filtered.filter(inv => inv.consignee === selectedConsignee);
    }

    if (selectedStatus !== 'All') {
      filtered = filtered.filter(inv => inv.status === selectedStatus);
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(inv => {
        const invDate = new Date(inv.invoice_date);
        return invDate >= new Date(dateRange.start) && invDate <= new Date(dateRange.end);
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(inv =>
        inv.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.consignee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.freight_forwarder?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
    setCurrentPage(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);
      const totalAmountUsd = items.reduce((sum, item) => sum + Number(item.amount_usd), 0);

      if (editingInvoice) {
        await genericApi.update('invoice_reports', editingId, formData);

        

        await supabase
          .from('invoice_report_items')
          .delete()
          .eq('invoice_report_id', editingInvoice.id);

        for (const item of items) {
          await supabase.from('invoice_report_items').insert([{
            invoice_report_id: editingInvoice.id,
            ...item
          }]);
        }
      } else {
        const { data: invoiceData, error } = await supabase
          .from('invoice_reports')
          .insert([{
            ...formData,
            total_amount: totalAmount,
            total_amount_usd: totalAmountUsd,
            created_by: user?.id
          }])
          .select()
          .single();

        

        for (const item of items) {
          await supabase.from('invoice_report_items').insert([{
            invoice_report_id: invoiceData.id,
            ...item
          }]);
        }
      }

      setShowModal(false);
      setEditingInvoice(null);
      resetForm();
      fetchInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const handleEdit = async (invoice: InvoiceReport) => {
    setEditingInvoice(invoice);
    setFormData({
      consignee: invoice.consignee || '',
      phone_number: invoice.phone_number || '',
      email: invoice.email || '',
      bill_of_lading: invoice.bill_of_lading || '',
      invoice_no: invoice.invoice_no || '',
      invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
      unit: invoice.unit || '',
      weight: invoice.weight || '',
      truck_number: invoice.truck_number || '',
      operation_no: invoice.operation_no || '',
      freight_forwarder: invoice.freight_forwarder || '',
      no_declaration: invoice.no_declaration || '',
      responsible: invoice.responsible || '',
      status: invoice.status || 'unpaid'
    });

    const { data: itemsData } = await genericApi.list('invoice_report_items')
      .eq('invoice_report_id', invoice.id);

    if (itemsData && itemsData.length > 0) {
      setItems(itemsData);
    }

    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return;

    try {
      await genericApi.delete('invoice_reports', id);

      
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      consignee: '',
      phone_number: '',
      email: '',
      bill_of_lading: '',
      invoice_no: '',
      invoice_date: new Date().toISOString().split('T')[0],
      unit: '',
      weight: '',
      truck_number: '',
      operation_no: '',
      freight_forwarder: '',
      no_declaration: '',
      responsible: '',
      status: 'unpaid'
    });
    setItems([{ description: 'Electronics', quantity: '', unit: '', amount: 0, amount_usd: 0 }]);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: '', unit: '', amount: 0, amount_usd: 0 }]);
  };

  const updateItem = (index: number, field: keyof InvoiceReportItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const uniqueConsignees = ['All', ...Array.from(new Set(invoices?.map(i => i.consignee).filter(Boolean)))];
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentItems = filteredInvoices.slice(startIndex, startIndex + entriesPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 animate-pulse font-medium">{t('common.loading')}</div>
      </div>
    );
  }

  // Common Header Style
  const thClass = "px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap text-white";

  return (
    <div className="p-6 bg-gray-50/30 min-h-screen animate-fadeIn">
      {/* Dynamic Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100/80 rounded-xl w-fit items-center mb-6 border border-gray-200">
        <button
          onClick={() => setActiveTab('invoice')}
          className={`px-6 py-2.5 font-bold text-sm rounded-lg transition-all ${activeTab === 'invoice'
            ? 'bg-white text-[#0F3C66] shadow-md shadow-gray-200/50'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
        >
          {t('invoiceReport.invoiceTab') || 'Invoice Report'}
        </button>
        <button
          onClick={() => setActiveTab('applicant')}
          className={`px-6 py-2.5 font-bold text-sm rounded-lg transition-all ${activeTab === 'applicant'
            ? 'bg-white text-[#0F3C66] shadow-md shadow-gray-200/50'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
        >
          {t('invoiceReport.applicantTab') || 'Applicant Invoice'}
        </button>
      </div>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0F3C66] rounded-xl text-white shadow-lg shadow-blue-900/20">
            <FileText size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{t('invoiceReport.title')}</h1>
        </div>
        <div className="hidden md:block text-sm font-semibold px-3 py-1 bg-orange-50 text-[#EE964C] border border-orange-100 rounded-full">
          {t('common.version')}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        {/* Filters Section */}
        <div className="p-5 border-b border-gray-100 bg-white/50 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('invoiceReport.dateRange')} (Start)</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-gray-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('invoiceReport.dateRange')} (End)</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-gray-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('invoiceReport.consignee')}</label>
              <select
                value={selectedConsignee}
                onChange={(e) => setSelectedConsignee(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-gray-50/50"
              >
                {uniqueConsignees?.map((consignee) => (
                  <option key={consignee} value={consignee}>
                    {consignee === 'All' ? t('financial.all') : consignee}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('invoiceReport.colStatus')}</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-gray-50/50"
              >
                <option value="All">{t('financial.all')}</option>
                <option value="paid">{t('invoiceReport.statusPaid') || 'Paid'}</option>
                <option value="unpaid">{t('invoiceReport.statusUnpaid') || 'Unpaid'}</option>
              </select>
            </div>
          </div>

          {/* Table Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
              <span className="text-gray-400 uppercase tracking-wider text-xs">{t('common.show')}</span>
              <select
                value={entriesPerPage}
                onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0F3C66] outline-none bg-gray-50 transition"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-gray-400 uppercase tracking-wider text-xs">{t('common.entries') || 'entries'}</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              <button
                onClick={() => {
                  setEditingInvoice(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="px-5 py-2.5 bg-[#0F3C66] text-white rounded-lg hover:bg-[#154b8a] transition-all shadow-md active:scale-95 flex items-center gap-2 font-bold text-sm"
              >
                <Plus size={16} />
                {t('invoiceReport.addNew')}
              </button>
              <button className="px-4 py-2.5 bg-gray-100 text-[#0F3C66] border border-gray-200 rounded-lg hover:bg-gray-200 transition-all font-bold text-sm flex items-center gap-2">
                <Printer size={16} />
                {t('commercial.print') || 'Print'}
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2.5 bg-gray-100 text-[#0F3C66] border border-gray-200 rounded-lg hover:bg-gray-200 transition-all font-bold text-sm flex items-center gap-2"
              >
                <Download size={16} />
                {t('invoiceReport.importBtn') || 'Import'}
              </button>
              <div className="relative w-full md:w-60 group border-l border-gray-100 pl-3">
                <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0F3C66] transition" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20 focus:border-[#0F3C66] transition bg-gray-50/50"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-[#0F3C66] text-white">
              <tr>
                <th className={thClass}>#</th>
                <th className={thClass}>{t('invoiceReport.colInvoiceNo')}</th>
                <th className={thClass}>{t('invoiceReport.colNoDeclaration')}</th>
                <th className={thClass}>{t('invoiceReport.colDate')}</th>
                <th className={thClass}>{t('invoiceReport.colQuantity')}</th>
                <th className={thClass}>{t('invoiceReport.colConsignee')}</th>
                <th className={thClass}>{t('invoiceReport.colForwarder')}</th>
                <th className={thClass}>{t('invoiceReport.colTruckNo')}</th>
                <th className={thClass}>{t('invoiceReport.colDescription')}</th>
                <th className={thClass}>{t('invoiceReport.colStatus')}</th>
                <th className={thClass}>{t('invoiceReport.colAmount')}</th>
                <th className={thClass}>{t('invoiceReport.colAmountUsd')}</th>
                <th className={`${thClass} text-center`}>{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-12 text-center text-gray-400 font-medium italic">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                currentItems.map((invoice, index) => (
                  <tr key={invoice.id} className="hover:bg-blue-50/40 transition group">
                    <td className="px-4 py-3 text-sm text-gray-400 font-mono">#{startIndex + index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium">{invoice.invoice_no || '-'}</td>
                    <td className="px-4 py-3 text-sm">{invoice.no_declaration || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">-</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.consignee || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{invoice.freight_forwarder || '-'}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">{invoice.truck_number || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">-</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${invoice.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-[#EE964C]/10 text-orange-800 border border-orange-200'
                        }`}>
                        {invoice.status === 'paid' ? (t('invoiceReport.statusPaid') || 'Paid') : (t('invoiceReport.statusUnpaid') || 'Unpaid')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-[#0F3C66]">{formatAmount(invoice.total_amount)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-600">{formatAmount(invoice.total_amount_usd, 'USD')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <ActionMenu
                          actions={[
                            {
                              label: t('common.view'),
                              icon: <Eye size={16} />,
                              onClick: () => console.log('View Invoice', invoice.id),
                            },
                            {
                              label: t('common.edit'),
                              icon: <Edit2 size={16} />,
                              onClick: () => handleEdit(invoice),
                            },
                            {
                              label: t('common.delete'),
                              icon: <Trash2 size={16} />,
                              onClick: () => handleDelete(invoice.id),
                              variant: 'danger',
                            },
                            {
                              label: t('commercial.print') || 'Print',
                              icon: <Printer size={16} />,
                              onClick: () => console.log('Print Invoice', invoice.id),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
          <div className="text-sm text-gray-500 font-medium">
            <span className="text-gray-400">{t('common.showing')}</span> {startIndex + 1} <span className="text-gray-400">{t('common.to')}</span> {Math.min(startIndex + entriesPerPage, filteredInvoices.length)} <span className="text-gray-400">{t('common.of')}</span> {filteredInvoices.length} <span className="text-gray-400">{t('common.entries') || 'entries'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-blue-100 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm font-bold text-sm text-[#0F3C66]"
            >
              {t('common.previous') || 'Previous'}
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-xl transition-all font-bold text-sm ${currentPage === pageNum
                      ? 'bg-[#0F3C66] text-white shadow-lg shadow-blue-900/20 active:scale-95'
                      : 'border border-gray-100 hover:bg-white hover:border-blue-200 text-gray-600'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-blue-100 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm font-bold text-sm text-[#0F3C66]"
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
          setEditingInvoice(null);
          resetForm();
        }}
        title={editingInvoice ? t('invoiceReport.addUpdate') : t('invoiceReport.addNew')}
        size="xxl"
      >
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('invoiceReport.colConsignee')}</label>
              <select
                value={formData.consignee}
                onChange={(e) => setFormData({ ...formData, consignee: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
              >
                <option value="">{t('invoiceReport.consignee') || 'Select Consignee'}</option>
                <option value="GUTU ABDUKERIM MUSA">GUTU ABDUKERIM MUSA</option>
                <option value="Client A">Client A</option>
                <option value="Client B">Client B</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('clients.fieldPhone')}</label>
              <input
                type="text"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
                placeholder="+1 234 567"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('clients.fieldEmail')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
                placeholder="example@domain.com"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('local.billOfLoading')} (BL)</label>
              <input
                type="text"
                value={formData.bill_of_lading}
                onChange={(e) => setFormData({ ...formData, bill_of_lading: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
                placeholder="Bill of Lading"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('invoiceReport.colInvoiceNo')}</label>
              <input
                type="text"
                value={formData.invoice_no}
                onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
                placeholder="INV-XXXXX"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('invoiceReport.colDate')}</label>
              <input
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
              />
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-center w-12 border-r border-gray-200">#</th>
                    <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-left border-r border-gray-200">{t('invoiceReport.colDescription')}</th>
                    <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-center border-r border-gray-200">{t('invoiceReport.colQuantity')}</th>
                    <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-center border-r border-gray-200">{t('chamberInvoice.unit')}</th>
                    <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-center border-r border-gray-200">{t('invoiceReport.colAmount')}</th>
                    <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-center border-r border-gray-200">{t('invoiceReport.colAmountUsd')}</th>
                    <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider w-16 text-center">{t('common.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {items?.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition">
                      <td className="px-3 py-2 text-sm text-center border-r border-gray-100 font-mono text-gray-500">{index + 1}</td>
                      <td className="px-2 py-2 border-r border-gray-100">
                        <select
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:border-[#0F3C66] focus:ring-2 focus:ring-[#0F3C66]/20 bg-white shadow-sm outline-none transition"
                        >
                          <option value="">{t('common.search') || 'Choose Item'}</option>
                          <option value="Electronics">Electronics</option>
                          <option value="SUNFLOWER 3LTR">SUNFLOWER 3LTR</option>
                          <option value="Furniture">Furniture</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 border-r border-gray-100">
                        <input
                          type="text"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-center text-sm focus:border-[#0F3C66] focus:ring-2 focus:ring-[#0F3C66]/20 bg-white shadow-sm outline-none transition"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-2 py-2 border-r border-gray-100">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-center text-sm focus:border-[#0F3C66] focus:ring-2 focus:ring-[#0F3C66]/20 bg-white shadow-sm outline-none transition"
                          placeholder="pcs"
                        />
                      </td>
                      <td className="px-2 py-2 border-r border-gray-100">
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateItem(index, 'amount', Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-center text-sm font-semibold text-[#0F3C66] focus:border-[#0F3C66] focus:ring-2 focus:ring-[#0F3C66]/20 bg-white shadow-sm outline-none transition"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-2 py-2 border-r border-gray-100">
                        <input
                          type="number"
                          value={item.amount_usd}
                          onChange={(e) => updateItem(index, 'amount_usd', Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-center text-sm font-semibold text-[#0F3C66] focus:border-[#0F3C66] focus:ring-2 focus:ring-[#0F3C66]/20 bg-white shadow-sm outline-none transition"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => addItem()}
                          className="p-2 bg-[#0F3C66]/10 text-[#0F3C66] hover:bg-[#0F3C66] hover:text-white rounded-lg transition-all shadow-sm"
                          title="Add Row"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-700">
                      {t('financial.total').toUpperCase()}
                    </td>
                    <td className="px-2 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('chamberInvoice.unit') || 'Unit'}</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
                placeholder="Unit"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('document9.colWeight') || 'Weight'}</label>
              <input
                type="text"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
                placeholder="Weight (kg/ton)"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('invoiceReport.colTruckNo') || 'Truck No'}</label>
              <input
                type="text"
                value={formData.truck_number}
                onChange={(e) => setFormData({ ...formData, truck_number: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
                placeholder="Plate Number"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('local.operationNo') || 'Operation No'}</label>
              <input
                type="text"
                value={formData.operation_no}
                onChange={(e) => setFormData({ ...formData, operation_no: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
                placeholder="OP-XXXX"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('invoiceReport.colForwarder') || 'Freight Forwarder'}</label>
              <input
                type="text"
                value={formData.freight_forwarder}
                onChange={(e) => setFormData({ ...formData, freight_forwarder: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
                placeholder="Forwarder Info"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('invoiceReport.colNoDeclaration') || 'No Declaration'}</label>
              <input
                type="text"
                value={formData.no_declaration}
                onChange={(e) => setFormData({ ...formData, no_declaration: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
                placeholder="DCL-XXXX"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('commercial.responsible') || 'Responsible'}</label>
              <input
                type="text"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
                placeholder="Name of Responsible"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('invoiceReport.colStatus')}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white"
              >
                <option value="">{t('deliveredOrders.selectStatus') || 'Select Status'}</option>
                <option value="paid">{t('invoiceReport.statusPaid') || 'Paid'}</option>
                <option value="unpaid">{t('invoiceReport.statusUnpaid') || 'Unpaid'}</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-100 font-bold">
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 hover:shadow-inner transition active:scale-95"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-[#0F3C66] text-white rounded-xl hover:bg-[#154b8a] transition shadow-lg shadow-blue-900/10 active:scale-95"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title={t('invoiceReport.importBtn') || 'Import'}
        size="md"
      >
        <div className="p-4">
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-600 mb-4">{t('deliveredOrders.uploadMessage')}</p>
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:bg-gray-50 transition cursor-pointer group">
              <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-3 group-hover:text-[#0F3C66] transition" />
              <button className="px-6 py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition font-bold shadow-md">
                {t('commercial.chooseFile')}
              </button>
              <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-wide">{t('config.noFileChosen')}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              onClick={() => setShowImportModal(false)}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-bold"
            >
              {t('common.cancel')}
            </button>
            <button className="px-5 py-2.5 bg-[#0F3C66] text-white rounded-xl hover:bg-[#154b8a] transition font-bold shadow-lg shadow-blue-900/10">
              {t('common.view')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}



