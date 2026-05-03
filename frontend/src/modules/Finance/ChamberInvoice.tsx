import { useState, useEffect, useMemo } from 'react';
import { Edit, Trash2, Plus, Eye, FileText, Printer, X } from 'lucide-react';
import { ActionMenu } from '../Shared/common/ActionMenu';

import {
  listChamberInvoices,
  getChamberInvoiceFull,
  createChamberInvoice,
  updateChamberInvoice,
  deleteChamberInvoice,
} from '../../api/chamberInvoicesApi';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  buildChamberInvoicePrintHtml,
  openChamberInvoicePrintWindow,
  type ChamberInvoicePrintItem,
  type ChamberInvoicePrintRecord,
} from '../../lib/chamberInvoicePrintHtml';
import { fetchDocumentBranding } from '../../lib/documentBranding';
import { brandingFromConfig, type DocumentBranding } from '../../types/documentBranding';

interface ChamberInvoiceData {
  id: string;
  consignee_name: string;
  tin: string;
  payment_conditions: string;
  currency: string;
  created_at: string;
}

interface InvoiceItem {
  description_of_goods: string;
  origin: string;
  hs_code: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

export function ChamberInvoice() {
  const [invoices, setInvoices] = useState<ChamberInvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [branding, setBranding] = useState<DocumentBranding | null>(null);
  const [previewPrint, setPreviewPrint] = useState<{
    inv: ChamberInvoicePrintRecord;
    items: ChamberInvoicePrintItem[];
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetchDocumentBranding()
      .then(setBranding)
      .catch(() => setBranding(brandingFromConfig({})));
  }, []);

  const [formData, setFormData] = useState({
    consignee_name: '',
    tin: '',
    tel: '',
    source_destination: '',
    commercial_relation: '',
    consignment_location: '',
    invoice_number: '',
    invoice_date: '',
    sales_conditions: '',
    purchase_order: '',
    app_reference_number: '',
    payment_conditions: '',
    invoice_currency: '',
    expedition: '',
    swift_code: '',
    loading_port: '',
    final_destination: '',
    bank_details: '',
    bank_account: '',
    intermediate_bank: '',
    swift_code_2: '',
    currency: '',
  });

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    {
      description_of_goods: '',
      origin: '',
      hs_code: '',
      unit: '',
      quantity: 0,
      unit_price: 0,
      total_amount: 0,
    },
  ]);

  const [packingList, setPackingList] = useState({
    consignee_name: '',
    consignee_tin: '',
    consignee_tel: '',
    consignee_source_destination: '',
    shipper_name: '',
    shipper_mob: '',
    shipper_tel: '',
    shipper_source_destination: '',
    reference: '',
    reference_date: '',
    invoice_number: '',
    notify_party: '',
    notify_party_tin: '',
    notify_party_tel: '',
    notify_party_source_destination: '',
    packing_purchase_order: '',
  });

  const [originalLetter, setOriginalLetter] = useState({
    consignee_name: '',
    consignee_tin: '',
    consignee_tel: '',
    consignee_source_destination: '',
    shipper_name: '',
    shipper_mob: '',
    shipper_tel: '',
    shipper_source_destination: '',
    reference: '',
    reference_date: '',
    invoice_number: '',
    notify_party: '',
    notify_party_tin: '',
    notify_party_tel: '',
    notify_party_source_destination: '',
    otb_purchase_order: '',
    loading_location: '',
    transport_details: '',
    destination_location: '',
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const loadInvoices = async () => {
    try {
      const data = await listChamberInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Error loading chamber invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      header: formData as Record<string, string>,
      items: invoiceItems as unknown[],
      packingList: packingList as unknown as Record<string, string>,
      originalLetter: originalLetter as unknown as Record<string, string>,
    };

    try {
      if (editingId) {
        await updateChamberInvoice(editingId, payload);
      } else {
        await createChamberInvoice(payload);
      }

      setShowModal(false);
      resetForm();
      loadInvoices();
    } catch (error: unknown) {
      console.error('Error saving chamber invoice:', error);
      alert(error instanceof Error ? error.message : String(error));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chamber invoice?')) return;

    try {
      await deleteChamberInvoice(id);
      loadInvoices();
    } catch (error: unknown) {
      console.error('Error deleting chamber invoice:', error);
      alert(error instanceof Error ? error.message : String(error));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      consignee_name: '',
      tin: '',
      tel: '',
      source_destination: '',
      commercial_relation: '',
      consignment_location: '',
      invoice_number: '',
      invoice_date: '',
      sales_conditions: '',
      purchase_order: '',
      app_reference_number: '',
      payment_conditions: '',
      invoice_currency: '',
      expedition: '',
      swift_code: '',
      loading_port: '',
      final_destination: '',
      bank_details: '',
      bank_account: '',
      intermediate_bank: '',
      swift_code_2: '',
      currency: '',
    });
    setInvoiceItems([
      {
        description_of_goods: '',
        origin: '',
        hs_code: '',
        unit: '',
        quantity: 0,
        unit_price: 0,
        total_amount: 0,
      },
    ]);
  };

  const addInvoiceItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      {
        description_of_goods: '',
        origin: '',
        hs_code: '',
        unit: '',
        quantity: 0,
        unit_price: 0,
        total_amount: 0,
      },
    ]);
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: unknown) => {
    const newItems = [...invoiceItems];
    const row = { ...newItems[index], [field]: value } as InvoiceItem;
    if (field === 'quantity' || field === 'unit_price') {
      const q = field === 'quantity' ? Number(value) : row.quantity;
      const p = field === 'unit_price' ? Number(value) : row.unit_price;
      row.total_amount = Math.round(q * p * 100) / 100;
    }
    newItems[index] = row;
    setInvoiceItems(newItems);
  };

  async function loadInvoiceFull(id: string): Promise<{
    header: ChamberInvoicePrintRecord;
    items: ChamberInvoicePrintItem[];
  } | null> {
    try {
      const full = await getChamberInvoiceFull(id);
      const inv = full.invoice;
      if (!inv) return null;
      const items = full.items;
      const h = inv as Record<string, string>;
      const header: ChamberInvoicePrintRecord = {
        consignee_name: h.consignee_name || '',
        tin: h.tin || '',
        tel: h.tel || '',
        source_destination: h.source_destination || '',
        commercial_relation: h.commercial_relation || '',
        consignment_location: h.consignment_location || '',
        invoice_number: h.invoice_number || '',
        invoice_date: h.invoice_date || '',
        sales_conditions: h.sales_conditions || '',
        purchase_order: h.purchase_order || '',
        app_reference_number: h.app_reference_number || '',
        payment_conditions: h.payment_conditions || '',
        invoice_currency: h.invoice_currency || h.currency || '',
        expedition: h.expedition || '',
        swift_code: h.swift_code || '',
        loading_port: h.loading_port || '',
        final_destination: h.final_destination || '',
        bank_details: h.bank_details || '',
        bank_account: h.bank_account || '',
        intermediate_bank: h.intermediate_bank || '',
        swift_code_2: h.swift_code_2 || '',
        currency: h.currency || h.invoice_currency || 'USD',
      };
      const mapped: ChamberInvoicePrintItem[] = (items || [])?.map((it: Record<string, unknown>) => ({
        description_of_goods: String(it.description_of_goods ?? ''),
        origin: String(it.origin ?? ''),
        hs_code: String(it.hs_code ?? ''),
        unit: String(it.unit ?? ''),
        quantity: Number(it.quantity) || 0,
        unit_price: Number(it.unit_price) || 0,
        total_amount: Number(it.total_amount) || 0,
      }));
      return { header, items: mapped };
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async function openPreviewModal(id: string) {
    const full = await loadInvoiceFull(id);
    if (!full) {
      alert('Impossible de charger la facture.');
      return;
    }
    setPreviewPrint({ inv: full.header, items: full.items });
  }

  async function handlePrintPdf(id: string) {
    const full = await loadInvoiceFull(id);
    if (!full) {
      alert('Impossible de charger la facture.');
      return;
    }
    void openChamberInvoicePrintWindow(full.header, full.items);
  }

  async function openEditModal(id: string) {
    try {
      const full = await getChamberInvoiceFull(id);
      const inv = full.invoice as Record<string, unknown>;
      if (!inv) throw new Error('Facture introuvable.');
      const d = (v: unknown) => String(v ?? '').slice(0, 10);
      setFormData({
        consignee_name: String(inv.consignee_name ?? ''),
        tin: String(inv.tin ?? ''),
        tel: String(inv.tel ?? ''),
        source_destination: String(inv.source_destination ?? ''),
        commercial_relation: String(inv.commercial_relation ?? ''),
        consignment_location: String(inv.consignment_location ?? ''),
        invoice_number: String(inv.invoice_number ?? ''),
        invoice_date: d(inv.invoice_date),
        sales_conditions: String(inv.sales_conditions ?? ''),
        purchase_order: String(inv.purchase_order ?? ''),
        app_reference_number: String(inv.app_reference_number ?? ''),
        payment_conditions: String(inv.payment_conditions ?? ''),
        invoice_currency: String(inv.invoice_currency ?? ''),
        expedition: String(inv.expedition ?? ''),
        swift_code: String(inv.swift_code ?? ''),
        loading_port: String(inv.loading_port ?? ''),
        final_destination: String(inv.final_destination ?? ''),
        bank_details: String(inv.bank_details ?? ''),
        bank_account: String(inv.bank_account ?? ''),
        intermediate_bank: String(inv.intermediate_bank ?? ''),
        swift_code_2: String(inv.swift_code_2 ?? ''),
        currency: String(inv.currency ?? ''),
      });
      const rows = (full.items || []) as Record<string, unknown>[];
      setInvoiceItems(
        rows.length > 0
          ? rows?.map(it => ({
            description_of_goods: String(it.description_of_goods ?? ''),
            origin: String(it.origin ?? ''),
            hs_code: String(it.hs_code ?? ''),
            unit: String(it.unit ?? ''),
            quantity: Number(it.quantity) || 0,
            unit_price: Number(it.unit_price) || 0,
            total_amount: Number(it.total_amount) || 0,
          }))
          : [
            {
              description_of_goods: '',
              origin: '',
              hs_code: '',
              unit: '',
              quantity: 0,
              unit_price: 0,
              total_amount: 0,
            },
          ]
      );
      const pack = full.packing as Record<string, unknown> | null;
      if (pack) {
        setPackingList({
          consignee_name: String(pack.consignee_name ?? ''),
          consignee_tin: String(pack.consignee_tin ?? ''),
          consignee_tel: String(pack.consignee_tel ?? ''),
          consignee_source_destination: String(pack.consignee_source_destination ?? ''),
          shipper_name: String(pack.shipper_name ?? ''),
          shipper_mob: String(pack.shipper_mob ?? ''),
          shipper_tel: String(pack.shipper_tel ?? ''),
          shipper_source_destination: String(pack.shipper_source_destination ?? ''),
          reference: String(pack.reference ?? ''),
          reference_date: d(pack.reference_date),
          invoice_number: String(pack.invoice_number ?? ''),
          notify_party: String(pack.notify_party ?? ''),
          notify_party_tin: String(pack.notify_party_tin ?? ''),
          notify_party_tel: String(pack.notify_party_tel ?? ''),
          notify_party_source_destination: String(pack.notify_party_source_destination ?? ''),
          packing_purchase_order: String(pack.packing_purchase_order ?? ''),
        });
      } else {
        setPackingList({
          consignee_name: '',
          consignee_tin: '',
          consignee_tel: '',
          consignee_source_destination: '',
          shipper_name: '',
          shipper_mob: '',
          shipper_tel: '',
          shipper_source_destination: '',
          reference: '',
          reference_date: '',
          invoice_number: '',
          notify_party: '',
          notify_party_tin: '',
          notify_party_tel: '',
          notify_party_source_destination: '',
          packing_purchase_order: '',
        });
      }
      const letter = full.letter as Record<string, unknown> | null;
      if (letter) {
        setOriginalLetter({
          consignee_name: String(letter.consignee_name ?? ''),
          consignee_tin: String(letter.consignee_tin ?? ''),
          consignee_tel: String(letter.consignee_tel ?? ''),
          consignee_source_destination: String(letter.consignee_source_destination ?? ''),
          shipper_name: String(letter.shipper_name ?? ''),
          shipper_mob: String(letter.shipper_mob ?? ''),
          shipper_tel: String(letter.shipper_tel ?? ''),
          shipper_source_destination: String(letter.shipper_source_destination ?? ''),
          reference: String(letter.reference ?? ''),
          reference_date: d(letter.reference_date),
          invoice_number: String(letter.invoice_number ?? ''),
          notify_party: String(letter.notify_party ?? ''),
          notify_party_tin: String(letter.notify_party_tin ?? ''),
          notify_party_tel: String(letter.notify_party_tel ?? ''),
          notify_party_source_destination: String(letter.notify_party_source_destination ?? ''),
          otb_purchase_order: String(letter.otb_purchase_order ?? ''),
          loading_location: String(letter.loading_location ?? ''),
          transport_details: String(letter.transport_details ?? ''),
          destination_location: String(letter.destination_location ?? ''),
        });
      } else {
        setOriginalLetter({
          consignee_name: '',
          consignee_tin: '',
          consignee_tel: '',
          consignee_source_destination: '',
          shipper_name: '',
          shipper_mob: '',
          shipper_tel: '',
          shipper_source_destination: '',
          reference: '',
          reference_date: '',
          invoice_number: '',
          notify_party: '',
          notify_party_tin: '',
          notify_party_tel: '',
          notify_party_source_destination: '',
          otb_purchase_order: '',
          loading_location: '',
          transport_details: '',
          destination_location: '',
        });
      }
      setEditingId(id);
      setShowModal(true);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  const filteredInvoices = useMemo(
    () =>
      invoices.filter(
        inv =>
          inv.consignee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (inv.tin && inv.tin.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    [invoices, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / entriesPerPage));
  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredInvoices.slice(start, start + entriesPerPage);
  }, [filteredInvoices, currentPage, entriesPerPage]);

  useEffect(() => {
    setCurrentPage(p => Math.min(p, totalPages));
  }, [totalPages, filteredInvoices.length]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">{t('common.loading')}</div>;
  }

  const rangeStart =
    filteredInvoices.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const rangeEnd = Math.min(currentPage * entriesPerPage, filteredInvoices.length);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">
          {t('chamberInvoice.title')}
        </h1>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-[#0F3C66] text-white px-4 py-2 rounded-lg hover:bg-[#152a44] transition"
        >
          <Plus size={20} />
          {t('common.addNew')}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('common.show')}</span>
            <input
              type="number"
              min={1}
              max={100}
              value={entriesPerPage}
              onChange={e => {
                const v = parseInt(e.target.value, 10);
                setEntriesPerPage(Number.isFinite(v) ? Math.min(100, Math.max(1, v)) : 10);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm w-16"
            />
            <span className="text-sm text-gray-600">{t('common.entries')}</span>
          </div>
          <input
            type="text"
            placeholder={`${t('common.search')}:`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">#</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('chamberInvoice.consignee')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('chamberInvoice.tin')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('chamberInvoice.paymentConditions')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('chamberInvoice.currency')}
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  {t('common.action')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                pageSlice?.map((invoice, index) => (
                  <tr
                    key={invoice.id}
                    className={`border-b hover:bg-blue-50/40 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/80'
                      }`}
                  >
                    <td className="py-3 px-4">{(currentPage - 1) * entriesPerPage + index + 1}</td>
                    <td className="py-3 px-4">{invoice.consignee_name}</td>
                    <td className="py-3 px-4">{invoice.tin || '-'}</td>
                    <td className="py-3 px-4">{invoice.payment_conditions || '-'}</td>
                    <td className="py-3 px-4">{invoice.currency || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        <ActionMenu
                          actions={[
                            {
                              label: t('common.view'),
                              icon: <Eye size={16} />,
                              onClick: () => void openPreviewModal(invoice.id),
                            },
                            {
                              label: t('common.edit'),
                              icon: <Edit size={16} />,
                              onClick: () => void openEditModal(invoice.id),
                            },
                            {
                              label: 'PDF / Imprimer',
                              icon: <FileText size={16} />,
                              onClick: () => void handlePrintPdf(invoice.id),
                            },
                            {
                              label: t('common.delete'),
                              icon: <Trash2 size={16} />,
                              onClick: () => handleDelete(invoice.id),
                              variant: 'danger',
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
          <div>
            {t('common.showing')} {rangeStart} {t('common.to')} {rangeEnd} {t('common.of')}{' '}
            {filteredInvoices.length} {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-screen-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {editingId
                  ? `${t('common.edit')} — ${t('chamberInvoice.title')}`
                  : t('chamberInvoice.details')}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.consignee')}
                    </label>
                    <input
                      type="text"
                      value={formData.consignee_name}
                      onChange={(e) => setFormData({ ...formData, consignee_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.tin')}
                    </label>
                    <input
                      type="text"
                      value={formData.tin}
                      onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.tel')}
                    </label>
                    <input
                      type="text"
                      value={formData.tel}
                      onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.sourceDestination')}
                    </label>
                    <input
                      type="text"
                      value={formData.source_destination}
                      onChange={(e) => setFormData({ ...formData, source_destination: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.commercialRelation')}
                    </label>
                    <input
                      type="text"
                      value={formData.commercial_relation}
                      onChange={(e) => setFormData({ ...formData, commercial_relation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.consignmentLocation')}
                    </label>
                    <input
                      type="text"
                      value={formData.consignment_location}
                      onChange={(e) => setFormData({ ...formData, consignment_location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.invoiceNumber')}
                    </label>
                    <input
                      type="text"
                      value={formData.invoice_number}
                      onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.invoiceDate')}
                    </label>
                    <input
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.salesConditions')}
                    </label>
                    <input
                      type="text"
                      value={formData.sales_conditions}
                      onChange={(e) => setFormData({ ...formData, sales_conditions: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.purchaseOrder')}
                    </label>
                    <input
                      type="text"
                      value={formData.purchase_order}
                      onChange={(e) => setFormData({ ...formData, purchase_order: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.appReferenceNumber')}
                    </label>
                    <input
                      type="text"
                      value={formData.app_reference_number}
                      onChange={(e) => setFormData({ ...formData, app_reference_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.paymentConditions')}
                    </label>
                    <input
                      type="text"
                      value={formData.payment_conditions}
                      onChange={(e) => setFormData({ ...formData, payment_conditions: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.invoiceCurrency')}
                    </label>
                    <input
                      type="text"
                      value={formData.invoice_currency}
                      onChange={(e) => setFormData({ ...formData, invoice_currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.expedition')}
                    </label>
                    <input
                      type="text"
                      value={formData.expedition}
                      onChange={(e) => setFormData({ ...formData, expedition: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.swiftCode')}
                    </label>
                    <input
                      type="text"
                      value={formData.swift_code}
                      onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.loadingPort')}
                    </label>
                    <input
                      type="text"
                      value={formData.loading_port}
                      onChange={(e) => setFormData({ ...formData, loading_port: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.finalDestination')}
                    </label>
                    <input
                      type="text"
                      value={formData.final_destination}
                      onChange={(e) => setFormData({ ...formData, final_destination: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.bankDetails')}
                    </label>
                    <input
                      type="text"
                      value={formData.bank_details}
                      onChange={(e) => setFormData({ ...formData, bank_details: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.bankAccount')}
                    </label>
                    <input
                      type="text"
                      value={formData.bank_account}
                      onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.intermediateBank')}
                    </label>
                    <input
                      type="text"
                      value={formData.intermediate_bank}
                      onChange={(e) => setFormData({ ...formData, intermediate_bank: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('chamberInvoice.swiftCode')}
                    </label>
                    <input
                      type="text"
                      value={formData.swift_code_2}
                      onChange={(e) => setFormData({ ...formData, swift_code_2: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">{t('chamberInvoice.goodsDescription')}</h3>

                  {invoiceItems?.map((item, index) => (
                    <div key={index} className="mb-4 p-4 border rounded-lg">
                      <div className="grid grid-cols-1 gap-4 mb-2 sm:grid-cols-2 lg:grid-cols-8">
                        <div className="sm:col-span-2 lg:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={`goods-desc-${index}`}>
                            {t('chamberInvoice.description')}
                          </label>
                          <textarea
                            id={`goods-desc-${index}`}
                            rows={3}
                            value={item.description_of_goods}
                            onChange={(e) => updateInvoiceItem(index, 'description_of_goods', e.target.value)}
                            placeholder={t('chamberInvoice.descriptionPlaceholder')}
                            className="w-full resize-y min-h-[4.5rem] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('chamberInvoice.origin')}
                          </label>
                          <input
                            type="text"
                            value={item.origin}
                            onChange={(e) => updateInvoiceItem(index, 'origin', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('chamberInvoice.hsCode')}
                          </label>
                          <input
                            type="text"
                            value={item.hs_code}
                            onChange={(e) => updateInvoiceItem(index, 'hs_code', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('chamberInvoice.unit')}
                          </label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateInvoiceItem(index, 'unit', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('chamberInvoice.qty')}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateInvoiceItem(index, 'quantity', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('chamberInvoice.unitPrice')}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateInvoiceItem(index, 'unit_price', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('chamberInvoice.totalAmount')}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.total_amount}
                            onChange={(e) => updateInvoiceItem(index, 'total_amount', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>
                      {invoiceItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInvoiceItem(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove Item
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addInvoiceItem}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewPrint && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold text-[#0F3C66]">
                {t('chamberInvoice.title')} — {t('common.view')}
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void openChamberInvoicePrintWindow(previewPrint.inv, previewPrint.items)
                  }
                  className="inline-flex items-center gap-1 rounded-lg bg-[#0F3C66] px-3 py-1.5 text-sm text-white hover:bg-[#163252]"
                >
                  <Printer className="h-4 w-4" />
                  Imprimer
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPrint(null)}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100"
                  aria-label={t('common.cancel')}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <iframe
              title="Aperçu facture chambre"
              className="min-h-[70vh] w-full flex-1 border-0 bg-gray-100"
              srcDoc={buildChamberInvoicePrintHtml(
                previewPrint.inv,
                previewPrint.items,
                branding ?? brandingFromConfig({})
              )}
            />
          </div>
        </div>
      )}

      <div className="text-center text-sm text-gray-500 py-4">
        {t('common.copyright')}
      </div>
    </div>
  );
}



