import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Search, Edit2, Trash2, Printer, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

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
  const [entriesPerPage, setEntriesPerPage] = useState(5);
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
      const { data, error } = await supabase
        .from('invoice_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);
      const totalAmountUsd = items.reduce((sum, item) => sum + Number(item.amount_usd), 0);

      if (editingInvoice) {
        const { error } = await supabase
          .from('invoice_reports')
          .update({
            ...formData,
            total_amount: totalAmount,
            total_amount_usd: totalAmountUsd,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingInvoice.id);

        if (error) throw error;

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

        if (error) throw error;

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

    const { data: itemsData } = await supabase
      .from('invoice_report_items')
      .select('*')
      .eq('invoice_report_id', invoice.id);

    if (itemsData && itemsData.length > 0) {
      setItems(itemsData);
    }

    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return;

    try {
      const { error } = await supabase
        .from('invoice_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
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

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceReportItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const uniqueConsignees = ['All', ...Array.from(new Set(invoices.map(i => i.consignee).filter(Boolean)))];
  const totalPages = Math.ceil(filteredInvoices.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentInvoices = filteredInvoices.slice(startIndex, endIndex);

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
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('invoice')}
            className={`px-6 py-2 font-medium ${
              activeTab === 'invoice'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Invoice Report
          </button>
          <button
            onClick={() => setActiveTab('applicant')}
            className={`px-6 py-2 font-medium ${
              activeTab === 'applicant'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Applicant Invoice
          </button>
        </div>

        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-gray-700">📋</span> Manage Invoice Reports
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Plage de dates</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Consigné</label>
              <select
                value={selectedConsignee}
                onChange={(e) => setSelectedConsignee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {uniqueConsignees.map((consignee) => (
                  <option key={consignee} value={consignee}>
                    {consignee}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <input
                type="number"
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="w-16 px-2 py-1 border border-gray-300 rounded"
                min="1"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingInvoice(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add New Invoice
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <Printer className="w-4 h-4" />
                Imprimer
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                Import Invoice Report
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Invoice No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">No Declaration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Consignee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Freight Forwarder</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Truck Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount (USD)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentInvoices.map((invoice, index) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{startIndex + index + 1}</td>
                  <td className="px-4 py-3 text-sm">{invoice.invoice_no || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">{invoice.no_declaration || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">N/A</td>
                  <td className="px-4 py-3 text-sm">{invoice.consignee || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">{invoice.freight_forwarder || '-'}</td>
                  <td className="px-4 py-3 text-sm">{invoice.truck_number || '-'}</td>
                  <td className="px-4 py-3 text-sm">-</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {invoice.status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatAmount(invoice.total_amount)}</td>
                  <td className="px-4 py-3 text-sm">{formatAmount(invoice.total_amount_usd, 'USD')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="text-gray-800 hover:text-gray-900">
                        <Printer className="w-4 h-4" />
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredInvoices.length)} of {filteredInvoices.length} entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1">{currentPage}</span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Add / Update Invoice</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingInvoice(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consignee</label>
                  <select
                    value={formData.consignee}
                    onChange={(e) => setFormData({ ...formData, consignee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Consignee</option>
                    <option value="GUTU ABDUKERIM MUSA">GUTU ABDUKERIM MUSA</option>
                    <option value="Client A">Client A</option>
                    <option value="Client B">Client B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bill of Lading (BL)</label>
                  <input
                    type="text"
                    value={formData.bill_of_lading}
                    onChange={(e) => setFormData({ ...formData, bill_of_lading: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No</label>
                  <input
                    type="text"
                    value={formData.invoice_no}
                    onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-xs font-medium text-gray-700 border">S/N</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-700 border">Description of Goods</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-700 border">Quantity</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-700 border">Unit</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-700 border">Amount</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-700 border">Amount (USD)</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-700 border">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-2 py-2 text-sm border text-center">{index + 1}</td>
                          <td className="px-2 py-2 border">
                            <select
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Select</option>
                              <option value="Electronics">Electronics</option>
                              <option value="SUNFLOWER 3LTR">SUNFLOWER 3LTR</option>
                              <option value="Furniture">Furniture</option>
                            </select>
                          </td>
                          <td className="px-2 py-2 border">
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-2 py-2 border">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => updateItem(index, 'unit', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-2 py-2 border">
                            <input
                              type="number"
                              value={item.amount}
                              onChange={(e) => updateItem(index, 'amount', Number(e.target.value))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-2 py-2 border">
                            <input
                              type="number"
                              value={item.amount_usd}
                              onChange={(e) => updateItem(index, 'amount_usd', Number(e.target.value))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-2 py-2 border text-center">
                            <button
                              type="button"
                              onClick={() => addItem()}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={6} className="px-2 py-2 text-right font-semibold border">
                          TOTAL AMOUNT
                        </td>
                        <td className="px-2 py-2 border"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Truck Number</label>
                  <input
                    type="text"
                    value={formData.truck_number}
                    onChange={(e) => setFormData({ ...formData, truck_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Operation No</label>
                  <input
                    type="text"
                    value={formData.operation_no}
                    onChange={(e) => setFormData({ ...formData, operation_no: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Freight Forwarder</label>
                  <input
                    type="text"
                    value={formData.freight_forwarder}
                    onChange={(e) => setFormData({ ...formData, freight_forwarder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No Declaration</label>
                  <input
                    type="text"
                    value={formData.no_declaration}
                    onChange={(e) => setFormData({ ...formData, no_declaration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Responsible</label>
                  <input
                    type="text"
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Status</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Import Product</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">Upload file to import product</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900">
                  Choisir un fichier
                </button>
                <p className="text-sm text-gray-500 mt-2">Aucun fichier choisi</p>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Preview
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Cancel
              </button>
            </div>

            <div className="text-right">
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Download sample
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
