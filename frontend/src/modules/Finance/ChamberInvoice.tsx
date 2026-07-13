import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { Edit, Trash2, Plus, Eye, FileText, Printer } from 'lucide-react';
import { ActionMenu } from '../Shared/common/ActionMenu';

import {
  listChamberInvoices,
  getChamberInvoiceFull,
  createChamberInvoice,
  updateChamberInvoice,
  deleteChamberInvoice,
} from '../../api/chamberInvoicesApi';
import { fetchClients, type ClientRecord } from '../../api/clientsApi';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  WaybillFormFields,
  emptyWaybillForm,
  emptyWaybillLineItem,
  applyWaybillLineUpdate,
  parseWaybillNumeric,
  type WaybillLineItem,
} from './chamberInvoiceWaybillFields';
import {
  ChamberInvoiceViewScreen,
  type ChamberInvoiceViewData,
} from './chamberInvoiceView';
import {
  openChamberInvoiceFullPrint,
  type ChamberInvoicePrintItem,
  type ChamberInvoicePrintRecord,
} from '../../lib/chamberInvoicePrintHtml';

interface RouteRecord {
  id?: string;
  _id?: string;
  source: string;
  destination: string;
}

function formatRouteLabel(route: RouteRecord): string {
  return `${route.source} -To- ${route.destination}`;
}

function waybillLineFromRecord(it: Record<string, unknown>): WaybillLineItem {
  return {
    description_of_goods: String(it.description_of_goods ?? ''),
    origin: String(it.origin ?? ''),
    unit: String(it.unit ?? ''),
    quantity: String(it.quantity ?? ''),
    net_weight: String(it.net_weight ?? ''),
    gross_weight: String(it.gross_weight ?? ''),
    total: String(it.total ?? ''),
  };
}

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
  quantity: string;
  unit_price: string;
  total_amount: string;
}

const invoiceLabelClass = 'mb-1 block text-xs font-bold uppercase tracking-wide text-gray-700';
const invoiceInputClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]/30';
const invoiceSelectClass = invoiceInputClass;
const invoiceGrid3 = 'grid grid-cols-1 gap-4 md:grid-cols-3';

function InvoiceField({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={invoiceLabelClass}>{label}</label>
      {children}
    </div>
  );
}

function InvoiceFormSection({
  title,
  version,
  children,
}: {
  title: string;
  version?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">{title}</h3>
        {version ? <span className="text-xs text-gray-500">{version}</span> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function ChamberInvoice() {
  const [invoices, setInvoices] = useState<ChamberInvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewData, setViewData] = useState<ChamberInvoiceViewData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { t } = useLanguage();

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
    purchase_order_date: '',
    purchase_order: '',
    proforma_invoice: '',
    proforma_date: '',
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

  const [clientsList, setClientsList] = useState<ClientRecord[]>([]);
  const [locationsList, setLocationsList] = useState<{ id?: string; _id?: string; name: string }[]>(
    []
  );
  const [routesList, setRoutesList] = useState<RouteRecord[]>([]);
  const [banksList, setBanksList] = useState<{ id?: string; _id?: string; name: string }[]>([]);
  const [goodsCategories, setGoodsCategories] = useState<{ id?: string; _id?: string; name: string }[]>(
    []
  );

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    {
      description_of_goods: '',
      origin: '',
      hs_code: '',
      unit: '',
      quantity: '',
      unit_price: '',
      total_amount: '',
    },
  ]);

  const [packingList, setPackingList] = useState(emptyWaybillForm());

  const [packingItems, setPackingItems] = useState<WaybillLineItem[]>([emptyWaybillLineItem()]);

  const [originalLetter, setOriginalLetter] = useState(emptyWaybillForm());

  const [originalLetterItems, setOriginalLetterItems] = useState<WaybillLineItem[]>([
    emptyWaybillLineItem(),
  ]);

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (!showModal) return;
    (async () => {
      try {
        const [clients, locations, routes, banks, categories] = await Promise.all([
          fetchClients(),
          genericApi.list('locations'),
          genericApi.list<RouteRecord>('routes'),
          genericApi.list('banks'),
          genericApi.list('product_categories'),
        ]);
        setClientsList(clients);
        setLocationsList(locations || []);
        setRoutesList(routes || []);
        setBanksList(banks || []);
        setGoodsCategories(categories || []);
      } catch (e) {
        console.error('Error loading chamber invoice form lists:', e);
      }
    })();
  }, [showModal]);

  const sourceDestinationOptions = useMemo(() => {
    const labels = routesList.map((route) => formatRouteLabel(route));
    const saved = [
      formData.source_destination,
      packingList.consignee_source_destination,
      packingList.shipper_source_destination,
      packingList.notify_party_source_destination,
      originalLetter.consignee_source_destination,
      originalLetter.shipper_source_destination,
      originalLetter.notify_party_source_destination,
    ].filter(Boolean) as string[];
    return [...new Set([...labels, ...saved])];
  }, [routesList, formData.source_destination, packingList, originalLetter]);

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
      packingList: { ...packingList, items: packingItems } as Record<string, unknown>,
      originalLetter: { ...originalLetter, items: originalLetterItems } as Record<string, unknown>,
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
      purchase_order_date: '',
      purchase_order: '',
      proforma_invoice: '',
      proforma_date: '',
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
        quantity: '',
        unit_price: '',
        total_amount: '',
      },
    ]);
    setPackingList(emptyWaybillForm());
    setPackingItems([emptyWaybillLineItem()]);
    setOriginalLetter(emptyWaybillForm());
    setOriginalLetterItems([emptyWaybillLineItem()]);
  };

  const addPackingItem = () => {
    setPackingItems([...packingItems, emptyWaybillLineItem()]);
  };

  const removePackingItem = (index: number) => {
    setPackingItems(packingItems.filter((_, i) => i !== index));
  };

  const updatePackingItem = (index: number, field: keyof WaybillLineItem, value: unknown) => {
    const next = [...packingItems];
    next[index] = applyWaybillLineUpdate(next[index], field, value);
    setPackingItems(next);
  };

  const addOriginalLetterItem = () => {
    setOriginalLetterItems([...originalLetterItems, emptyWaybillLineItem()]);
  };

  const removeOriginalLetterItem = (index: number) => {
    setOriginalLetterItems(originalLetterItems.filter((_, i) => i !== index));
  };

  const updateOriginalLetterItem = (index: number, field: keyof WaybillLineItem, value: unknown) => {
    const next = [...originalLetterItems];
    next[index] = applyWaybillLineUpdate(next[index], field, value);
    setOriginalLetterItems(next);
  };

  const addInvoiceItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      {
        description_of_goods: '',
        origin: '',
        hs_code: '',
        unit: '',
        quantity: '',
        unit_price: '',
        total_amount: '',
      },
    ]);
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: unknown) => {
    const newItems = [...invoiceItems];
    const row = { ...newItems[index], [field]: String(value ?? '') } as InvoiceItem;
    if (field === 'quantity' || field === 'unit_price') {
      const q = parseWaybillNumeric(field === 'quantity' ? value : row.quantity);
      const p = parseWaybillNumeric(field === 'unit_price' ? value : row.unit_price);
      const amount = Math.round(q * p * 100) / 100;
      row.total_amount = q && p ? String(amount) : '';
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
        purchase_order_date: h.purchase_order_date || '',
        proforma_invoice: h.proforma_invoice || '',
        proforma_date: h.proforma_date || '',
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

  async function loadChamberInvoiceViewData(id: string): Promise<ChamberInvoiceViewData | null> {
    try {
      const full = await getChamberInvoiceFull(id);
      const inv = full.invoice as Record<string, unknown>;
      if (!inv) return null;

      const str = (v: unknown) => String(v ?? '');
      const header: Record<string, string> = {
        consignee_name: str(inv.consignee_name),
        tin: str(inv.tin),
        tel: str(inv.tel),
        source_destination: str(inv.source_destination),
        commercial_relation: str(inv.commercial_relation),
        consignment_location: str(inv.consignment_location),
        invoice_number: str(inv.invoice_number),
        invoice_date: str(inv.invoice_date).slice(0, 10),
        sales_conditions: str(inv.sales_conditions),
        purchase_order_date: str(inv.purchase_order_date).slice(0, 10),
        purchase_order: str(inv.purchase_order),
        proforma_invoice: str(inv.proforma_invoice),
        proforma_date: str(inv.proforma_date).slice(0, 10),
        app_reference_number: str(inv.app_reference_number),
        payment_conditions: str(inv.payment_conditions),
        invoice_currency: str(inv.invoice_currency),
        expedition: str(inv.expedition),
        swift_code: str(inv.swift_code),
        loading_port: str(inv.loading_port),
        final_destination: str(inv.final_destination),
        bank_details: str(inv.bank_details),
        bank_account: str(inv.bank_account),
        intermediate_bank: str(inv.intermediate_bank),
        swift_code_2: str(inv.swift_code_2),
        currency: str(inv.currency),
      };

      const items = ((full.items || []) as Record<string, unknown>[]).map((it) => ({
        description_of_goods: str(it.description_of_goods),
        origin: str(it.origin),
        hs_code: str(it.hs_code),
        unit: str(it.unit),
        quantity: parseWaybillNumeric(it.quantity),
        unit_price: parseWaybillNumeric(it.unit_price),
        total_amount: parseWaybillNumeric(it.total_amount),
      }));

      const mapPackItems = (raw: unknown): WaybillLineItem[] => {
        if (!Array.isArray(raw)) return [];
        return raw.map((it: Record<string, unknown>) => waybillLineFromRecord(it));
      };

      const pack = full.packing as Record<string, unknown> | null;
      const letter = full.letter as Record<string, unknown> | null;
      const packItems = pack?.items;
      const letterItems = letter?.items;

      return {
        header,
        items,
        packing: pack,
        letter,
        packingItems: mapPackItems(packItems),
        letterItems: mapPackItems(letterItems),
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async function openViewScreen(id: string) {
    const data = await loadChamberInvoiceViewData(id);
    if (!data) {
      alert('Impossible de charger la facture.');
      return;
    }
    setViewData(data);
  }

  async function handlePrintPdf(id: string) {
    const data = await loadChamberInvoiceViewData(id);
    if (!data) {
      alert('Impossible de charger la facture.');
      return;
    }
    void openChamberInvoiceFullPrint({
      inv: data.header as ChamberInvoicePrintRecord,
      items: data.items,
      packing: data.packing,
      packingItems: data.packingItems,
      letter: data.letter,
      letterItems: data.letterItems,
    });
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
        purchase_order_date: d(inv.purchase_order_date),
        purchase_order: String(inv.purchase_order ?? ''),
        proforma_invoice: String(inv.proforma_invoice ?? ''),
        proforma_date: d(inv.proforma_date),
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
            quantity: String(it.quantity ?? ''),
            unit_price: String(it.unit_price ?? ''),
            total_amount: String(it.total_amount ?? ''),
          }))
          : [
            {
              description_of_goods: '',
              origin: '',
              hs_code: '',
              unit: '',
              quantity: '',
              unit_price: '',
              total_amount: '',
            },
          ]
      );
      const pack = full.packing as Record<string, unknown> | null;
      if (pack) {
        const { items: packItems, ...packFields } = pack;
        setPackingList({
          ...emptyWaybillForm(),
          consignee_name: String(packFields.consignee_name ?? ''),
          consignee_tin: String(packFields.consignee_tin ?? ''),
          consignee_tel: String(packFields.consignee_tel ?? ''),
          consignee_source_destination: String(packFields.consignee_source_destination ?? ''),
          shipper_name: String(packFields.shipper_name ?? ''),
          shipper_mob: String(packFields.shipper_mob ?? ''),
          shipper_tel: String(packFields.shipper_tel ?? ''),
          shipper_source_destination: String(packFields.shipper_source_destination ?? ''),
          reference: String(packFields.reference ?? ''),
          reference_date: d(packFields.reference_date),
          invoice_number: String(packFields.invoice_number ?? ''),
          notify_party: String(packFields.notify_party ?? ''),
          notify_party_tin: String(packFields.notify_party_tin ?? ''),
          notify_party_tel: String(packFields.notify_party_tel ?? ''),
          notify_party_source_destination: String(packFields.notify_party_source_destination ?? ''),
          packing_purchase_order: String(packFields.packing_purchase_order ?? ''),
          loading_location: String(packFields.loading_location ?? ''),
          transport_details: String(packFields.transport_details ?? ''),
          destination_location: String(packFields.destination_location ?? ''),
        });
        const rows = Array.isArray(packItems) ? packItems : [];
        setPackingItems(
          rows.length > 0
            ? rows.map((it: Record<string, unknown>) => waybillLineFromRecord(it))
            : [emptyWaybillLineItem()]
        );
      } else {
        setPackingList(emptyWaybillForm());
        setPackingItems([emptyWaybillLineItem()]);
      }
      const letter = full.letter as Record<string, unknown> | null;
      if (letter) {
        const { items: letterItems, ...letterFields } = letter;
        setOriginalLetter({
          ...emptyWaybillForm(),
          consignee_name: String(letterFields.consignee_name ?? ''),
          consignee_tin: String(letterFields.consignee_tin ?? ''),
          consignee_tel: String(letterFields.consignee_tel ?? ''),
          consignee_source_destination: String(letterFields.consignee_source_destination ?? ''),
          shipper_name: String(letterFields.shipper_name ?? ''),
          shipper_mob: String(letterFields.shipper_mob ?? ''),
          shipper_tel: String(letterFields.shipper_tel ?? ''),
          shipper_source_destination: String(letterFields.shipper_source_destination ?? ''),
          reference: String(letterFields.reference ?? ''),
          reference_date: d(letterFields.reference_date),
          invoice_number: String(letterFields.invoice_number ?? ''),
          notify_party: String(letterFields.notify_party ?? ''),
          notify_party_tin: String(letterFields.notify_party_tin ?? ''),
          notify_party_tel: String(letterFields.notify_party_tel ?? ''),
          notify_party_source_destination: String(letterFields.notify_party_source_destination ?? ''),
          packing_purchase_order: String(letterFields.packing_purchase_order ?? ''),
          otb_purchase_order: String(letterFields.otb_purchase_order ?? ''),
          loading_location: String(letterFields.loading_location ?? ''),
          transport_details: String(letterFields.transport_details ?? ''),
          destination_location: String(letterFields.destination_location ?? ''),
        });
        const letterRows = Array.isArray(letterItems) ? letterItems : [];
        setOriginalLetterItems(
          letterRows.length > 0
            ? letterRows.map((it: Record<string, unknown>) => waybillLineFromRecord(it))
            : [emptyWaybillLineItem()]
        );
      } else {
        setOriginalLetter(emptyWaybillForm());
        setOriginalLetterItems([emptyWaybillLineItem()]);
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

  if (viewData) {
    return (
      <ChamberInvoiceViewScreen
        data={viewData}
        t={t}
        onBack={() => setViewData(null)}
        onPrint={() =>
          void openChamberInvoiceFullPrint({
            inv: viewData.header as ChamberInvoicePrintRecord,
            items: viewData.items,
            packing: viewData.packing,
            packingItems: viewData.packingItems,
            letter: viewData.letter,
            letterItems: viewData.letterItems,
          })
        }
      />
    );
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
                              onClick: () => void openViewScreen(invoice.id),
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
              <h2 className="text-xl font-semibold text-[#0F3C66]">
                {editingId
                  ? `${t('common.edit')} — ${t('chamberInvoice.title')}`
                  : `${t('common.addNew')} — ${t('menu.chamber-invoice')}`}
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
              <div className="space-y-5">
                <InvoiceFormSection
                  title={t('chamberInvoice.details')}
                  version={t('chamberInvoice.formVersion')}
                >
                  <div className={`${invoiceGrid3} mb-4`}>
                    <InvoiceField label={t('chamberInvoice.consignee')}>
                      <select
                        value={formData.consignee_name}
                        onChange={(e) => {
                          const name = e.target.value;
                          const client = clientsList.find((c) => c.name === name);
                          setFormData({
                            ...formData,
                            consignee_name: name,
                            tel: client?.phone ?? formData.tel,
                          });
                        }}
                        className={invoiceSelectClass}
                        required
                      >
                        <option value="">{t('chamberInvoice.select')}</option>
                        {clientsList.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </InvoiceField>
                    <InvoiceField label={t('chamberInvoice.tin')}>
                      <input
                        type="text"
                        value={formData.tin}
                        onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                    <InvoiceField label={t('chamberInvoice.tel')}>
                      <input
                        type="text"
                        value={formData.tel}
                        onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                  </div>

                  <div className={`${invoiceGrid3} mb-4`}>
                    <InvoiceField label={t('chamberInvoice.sourceDestination')}>
                      <select
                        value={formData.source_destination}
                        onChange={(e) =>
                          setFormData({ ...formData, source_destination: e.target.value })
                        }
                        className={invoiceSelectClass}
                      >
                        <option value="">{t('orders.selectSourceDestination')}</option>
                        {sourceDestinationOptions.map((label) => (
                          <option key={label} value={label}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </InvoiceField>
                    <InvoiceField label={t('chamberInvoice.commercialRelation')}>
                      <input
                        type="text"
                        value={formData.commercial_relation}
                        onChange={(e) =>
                          setFormData({ ...formData, commercial_relation: e.target.value })
                        }
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                    <InvoiceField label={t('chamberInvoice.consignmentLocation')}>
                      <input
                        type="text"
                        value={formData.consignment_location}
                        onChange={(e) =>
                          setFormData({ ...formData, consignment_location: e.target.value })
                        }
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                  </div>

                  <div className={`${invoiceGrid3} mb-4`}>
                    <InvoiceField label={t('chamberInvoice.invoiceNumber')}>
                      <input
                        type="text"
                        value={formData.invoice_number}
                        onChange={(e) =>
                          setFormData({ ...formData, invoice_number: e.target.value })
                        }
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                    <InvoiceField label={t('chamberInvoice.invoiceDate')}>
                      <input
                        type="date"
                        value={formData.invoice_date}
                        onChange={(e) =>
                          setFormData({ ...formData, invoice_date: e.target.value })
                        }
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                    <InvoiceField label={t('chamberInvoice.salesConditions')}>
                      <input
                        type="text"
                        value={formData.sales_conditions}
                        onChange={(e) =>
                          setFormData({ ...formData, sales_conditions: e.target.value })
                        }
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                  </div>

                  <div className={`${invoiceGrid3} mb-4`}>
                    <InvoiceField label={t('chamberInvoice.purchaseOrderDate')}>
                      <input
                        type="date"
                        value={formData.purchase_order_date}
                        onChange={(e) =>
                          setFormData({ ...formData, purchase_order_date: e.target.value })
                        }
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                    <InvoiceField label={t('chamberInvoice.purchaseOrder')}>
                      <input
                        type="text"
                        value={formData.purchase_order}
                        onChange={(e) =>
                          setFormData({ ...formData, purchase_order: e.target.value })
                        }
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                    <InvoiceField label={t('chamberInvoice.proformaInvoice')}>
                      <input
                        type="text"
                        value={formData.proforma_invoice}
                        onChange={(e) =>
                          setFormData({ ...formData, proforma_invoice: e.target.value })
                        }
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                  </div>

                  <div className={`${invoiceGrid3} mb-4`}>
                    <InvoiceField label={t('chamberInvoice.proformaDate')}>
                      <input
                        type="date"
                        value={formData.proforma_date}
                        onChange={(e) =>
                          setFormData({ ...formData, proforma_date: e.target.value })
                        }
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                    <div className="hidden md:block" aria-hidden />
                    <div className="hidden md:block" aria-hidden />
                  </div>

                  <div className={invoiceGrid3}>
                    <InvoiceField label={t('chamberInvoice.appReferenceNumber')}>
                      <input
                        type="text"
                        value={formData.app_reference_number}
                        onChange={(e) =>
                          setFormData({ ...formData, app_reference_number: e.target.value })
                        }
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                    <InvoiceField label={t('chamberInvoice.paymentConditions')}>
                      <input
                        type="text"
                        value={formData.payment_conditions}
                        onChange={(e) =>
                          setFormData({ ...formData, payment_conditions: e.target.value })
                        }
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                    <InvoiceField label={t('chamberInvoice.invoiceCurrency')}>
                      <input
                        type="text"
                        value={formData.invoice_currency}
                        onChange={(e) =>
                          setFormData({ ...formData, invoice_currency: e.target.value })
                        }
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                  </div>
                </InvoiceFormSection>

                <InvoiceFormSection title={t('chamberInvoice.packingListTitle')}>
                  <WaybillFormFields
                    idPrefix="pack"
                    data={packingList}
                    onChange={setPackingList}
                    items={packingItems}
                    onAddItem={addPackingItem}
                    onRemoveItem={removePackingItem}
                    onUpdateItem={updatePackingItem}
                    purchaseOrderMode="packing"
                    clientsList={clientsList}
                    locationsList={locationsList}
                    sourceDestinationOptions={sourceDestinationOptions}
                    goodsCategories={goodsCategories}
                    t={t}
                  />
                </InvoiceFormSection>

                <InvoiceFormSection title={t('chamberInvoice.originalLetterTitle')}>
                  <WaybillFormFields
                    idPrefix="otb"
                    data={originalLetter}
                    onChange={setOriginalLetter}
                    items={originalLetterItems}
                    onAddItem={addOriginalLetterItem}
                    onRemoveItem={removeOriginalLetterItem}
                    onUpdateItem={updateOriginalLetterItem}
                    purchaseOrderMode="otb"
                    clientsList={clientsList}
                    locationsList={locationsList}
                    sourceDestinationOptions={sourceDestinationOptions}
                    goodsCategories={goodsCategories}
                    t={t}
                  />
                </InvoiceFormSection>

                <InvoiceFormSection title={t('chamberInvoice.shippingBankSection')}>
                  <div className={`${invoiceGrid3} mb-4`}>
                    <InvoiceField label={t('chamberInvoice.expedition')}>
                      <input
                        type="text"
                        value={formData.expedition}
                        onChange={(e) => setFormData({ ...formData, expedition: e.target.value })}
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                    <InvoiceField label={t('chamberInvoice.swiftCode')}>
                      <input
                        type="text"
                        value={formData.swift_code}
                        onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                    <InvoiceField label={t('chamberInvoice.loadingPort')}>
                      <input
                        type="text"
                        value={formData.loading_port}
                        onChange={(e) => setFormData({ ...formData, loading_port: e.target.value })}
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                  </div>

                  <div className={`${invoiceGrid3} mb-4`}>
                    <InvoiceField label={t('chamberInvoice.finalDestination')}>
                      <select
                        value={formData.final_destination}
                        onChange={(e) =>
                          setFormData({ ...formData, final_destination: e.target.value })
                        }
                        className={invoiceSelectClass}
                      >
                        <option value="">{t('chamberInvoice.select')}</option>
                        {locationsList.map((l) => (
                          <option key={`dest-${l.id || l._id}`} value={l.name}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </InvoiceField>
                    <InvoiceField label={t('chamberInvoice.bankDetails')}>
                      <select
                        value={formData.bank_details}
                        onChange={(e) =>
                          setFormData({ ...formData, bank_details: e.target.value })
                        }
                        className={invoiceSelectClass}
                      >
                        <option value="">{t('chamberInvoice.select')}</option>
                        {banksList.map((b) => (
                          <option key={b.id || b._id} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </InvoiceField>
                    <InvoiceField label={t('chamberInvoice.bankAccount')}>
                      <input
                        type="text"
                        value={formData.bank_account}
                        onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InvoiceField label={t('chamberInvoice.intermediateBank')}>
                      <input
                        type="text"
                        value={formData.intermediate_bank}
                        onChange={(e) =>
                          setFormData({ ...formData, intermediate_bank: e.target.value })
                        }
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                    <InvoiceField label={t('chamberInvoice.swiftCode')}>
                      <input
                        type="text"
                        value={formData.swift_code_2}
                        onChange={(e) => setFormData({ ...formData, swift_code_2: e.target.value })}
                        className={invoiceInputClass}
                      />
                    </InvoiceField>
                  </div>

                  <div className="mt-5 overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-100 text-left text-xs font-bold uppercase text-gray-800">
                          <th className="w-10 border border-gray-200 px-2 py-2 text-center">
                            {t('chamberInvoice.colNumber')}
                          </th>
                          <th className="min-w-[200px] border border-gray-200 px-2 py-2">
                            {t('chamberInvoice.goodsDescription')}
                          </th>
                          <th className="border border-gray-200 px-2 py-2">
                            {t('chamberInvoice.origin')}
                          </th>
                          <th className="border border-gray-200 px-2 py-2">
                            {t('chamberInvoice.hsCode')}
                          </th>
                          <th className="border border-gray-200 px-2 py-2">
                            {t('chamberInvoice.unit')}
                          </th>
                          <th className="border border-gray-200 px-2 py-2">
                            {t('chamberInvoice.qty')}
                          </th>
                          <th className="border border-gray-200 px-2 py-2">
                            {t('chamberInvoice.unitPrice')}
                          </th>
                          <th className="border border-gray-200 px-2 py-2">
                            {t('chamberInvoice.totalAmount')}
                          </th>
                          <th className="w-14 border border-gray-200 px-2 py-2 text-center">
                            {t('chamberInvoice.colAction')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceItems.map((item, index) => (
                          <tr key={index} className="bg-white">
                            <td className="border border-gray-200 px-2 py-2 text-center font-medium text-gray-600">
                              {index + 1}
                            </td>
                            <td className="border border-gray-200 px-2 py-2">
                              <select
                                value={item.description_of_goods}
                                onChange={(e) =>
                                  updateInvoiceItem(index, 'description_of_goods', e.target.value)
                                }
                                className={invoiceSelectClass}
                              >
                                <option value="">{t('chamberInvoice.selectDescription')}</option>
                                {goodsCategories.map((c) => (
                                  <option key={c.id || c._id} value={c.name}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="border border-gray-200 px-1 py-1">
                              <input
                                type="text"
                                value={item.origin}
                                onChange={(e) =>
                                  updateInvoiceItem(index, 'origin', e.target.value)
                                }
                                className={invoiceInputClass}
                              />
                            </td>
                            <td className="border border-gray-200 px-1 py-1">
                              <input
                                type="text"
                                value={item.hs_code}
                                onChange={(e) =>
                                  updateInvoiceItem(index, 'hs_code', e.target.value)
                                }
                                className={invoiceInputClass}
                              />
                            </td>
                            <td className="border border-gray-200 px-1 py-1">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => updateInvoiceItem(index, 'unit', e.target.value)}
                                className={invoiceInputClass}
                              />
                            </td>
                            <td className="border border-gray-200 px-1 py-1">
                              <input
                                type="text"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateInvoiceItem(index, 'quantity', e.target.value)
                                }
                                className={invoiceInputClass}
                              />
                            </td>
                            <td className="border border-gray-200 px-1 py-1">
                              <input
                                type="text"
                                value={item.unit_price}
                                onChange={(e) =>
                                  updateInvoiceItem(index, 'unit_price', e.target.value)
                                }
                                className={invoiceInputClass}
                              />
                            </td>
                            <td className="border border-gray-200 px-1 py-1">
                              <input
                                type="text"
                                readOnly
                                value={item.total_amount}
                                className={`${invoiceInputClass} bg-gray-50`}
                              />
                            </td>
                            <td className="border border-gray-200 px-2 py-2 text-center">
                              {index === invoiceItems.length - 1 ? (
                                <button
                                  type="button"
                                  onClick={addInvoiceItem}
                                  title={t('chamberInvoice.addRow')}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => removeInvoiceItem(index)}
                                  className="text-xs font-medium text-red-600 hover:text-red-800"
                                >
                                  ×
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </InvoiceFormSection>
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

      <div className="text-center text-sm text-gray-500 py-4">
        {t('common.copyright')}
      </div>
    </div>
  );
}



