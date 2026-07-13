import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { Edit, Trash2, Plus, Eye, FileText } from 'lucide-react';
import { ActionMenu } from '../Shared/common/ActionMenu';
import { genericApi } from '../../api/genericApi';
import { fetchClients, type ClientRecord } from '../../api/clientsApi';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  openPerformaPrintWindow,
  type PerformaPrintItem,
  type PerformaPrintRecord,
} from '../../lib/performaPrintHtml';
import { parseLocalizedNumber } from '../../lib/commercialChamberCalculations';

interface PerformaData {
  id: string;
  _id?: string;
  buyer: string;
  vendor: string;
  performa_code: string;
  buyer_tin: string;
  created_at: string;
}

interface PerformaItem {
  description_of_goods: string;
  origin: string;
  hs_code: string;
  quantity: string;
  unit_price: string;
  total_unit_price: string;
}

function valStr(v: unknown): string {
  if (v == null || v === '') return '';
  return String(v);
}

function computePerformaLineTotal(quantity: string, unitPrice: string): string {
  const q = parseLocalizedNumber(quantity);
  const p = parseLocalizedNumber(unitPrice);
  if (!q || !p) return '';
  const amount = Math.round(q * p * 100) / 100;
  return String(amount);
}

function applyPerformaItemUpdate(
  row: PerformaItem,
  field: keyof PerformaItem,
  value: unknown
): PerformaItem {
  const next = { ...row, [field]: String(value ?? '') } as PerformaItem;
  if (field === 'quantity' || field === 'unit_price') {
    next.total_unit_price = computePerformaLineTotal(next.quantity, next.unit_price);
  }
  return next;
}

interface RouteRecord {
  id?: string;
  _id?: string;
  source: string;
  destination: string;
}

function formatRouteLabel(route: RouteRecord): string {
  return `${route.source} -To- ${route.destination}`;
}

const emptyPerformaItem = (): PerformaItem => ({
  description_of_goods: '',
  origin: '',
  hs_code: '',
  quantity: '',
  unit_price: '',
  total_unit_price: '',
});

const pfLabelClass = 'mb-1 block text-sm font-semibold text-gray-800';
const pfInputClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]/30';
const pfSelectClass = pfInputClass;
const pfGrid2 = 'grid grid-cols-1 gap-4 sm:grid-cols-2';

function PerformaField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className={pfLabelClass}>{label}</label>
      {children}
    </div>
  );
}

export function Performa() {
  const [performas, setPerformas] = useState<PerformaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    performa_code: '',
    vendor: '',
    vendor_address: '',
    vendor_tel: '',
    buyer: '',
    buyer_tin: '',
    buyer_tel: '',
    invoice_date: '',
    source_destination: '',
    origin: '',
    expedition: '',
    swift_code: '',
    loading_port: '',
    final_destination: '',
    bank: '',
    payment: '',
    fiscal_id_number: '',
  });

  const [viewData, setViewData] = useState<PerformaViewData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientsList, setClientsList] = useState<ClientRecord[]>([]);
  const [routesList, setRoutesList] = useState<RouteRecord[]>([]);
  const [locationsList, setLocationsList] = useState<{ id?: string; _id?: string; name: string }[]>([]);
  const [banksList, setBanksList] = useState<{ id?: string; _id?: string; name: string }[]>([]);
  const [goodsCategories, setGoodsCategories] = useState<{ id?: string; _id?: string; name: string }[]>([]);

  const [performaItems, setPerformaItems] = useState<PerformaItem[]>([emptyPerformaItem()]);

  const sourceDestinationOptions = useMemo(() => {
    const labels = routesList.map((route) => formatRouteLabel(route));
    if (formData.source_destination && !labels.includes(formData.source_destination)) {
      return [formData.source_destination, ...labels];
    }
    return labels;
  }, [routesList, formData.source_destination]);

  useEffect(() => {
    loadPerformas();
  }, []);

  useEffect(() => {
    if (!showModal) return;
    (async () => {
      try {
        const [clients, routes, locations, banks, categories] = await Promise.all([
          fetchClients(),
          genericApi.list<RouteRecord>('routes'),
          genericApi.list('locations'),
          genericApi.list('banks'),
          genericApi.list('product_categories'),
        ]);
        setClientsList(clients);
        setRoutesList(routes || []);
        setLocationsList(locations || []);
        setBanksList(banks || []);
        setGoodsCategories(categories || []);
      } catch (error) {
        console.error('Error loading performa form lists:', error);
      }
    })();
  }, [showModal]);

  const loadPerformas = async () => {
    try {
      const data = await genericApi.list('performa');

      
      setPerformas(data || []);
    } catch (error) {
      console.error('Error loading performas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        invoice_date: formData.invoice_date || new Date().toISOString().slice(0, 10),
        buyer_tin: formData.fiscal_id_number || formData.buyer_tin,
        items: performaItems.map((it) => ({
          ...it,
          origin: it.origin || formData.origin,
        })),
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        await genericApi.update('performa', editingId, payload);
      } else {
        await genericApi.create('performa', payload);
      }

      setShowModal(false);
      resetForm();
      loadPerformas();
    } catch (error: unknown) {
      console.error('Error saving performa:', error);
      const msg = error instanceof Error ? error.message : 'Error saving performa';
      alert(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this performa?')) return;

    try {
      await genericApi.delete('performa', id);

      
      loadPerformas();
    } catch (error: any) {
      console.error('Error deleting performa:', error);
      alert(error.message || 'Error deleting performa');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      performa_code: '',
      vendor: '',
      vendor_address: '',
      vendor_tel: '',
      buyer: '',
      buyer_tin: '',
      buyer_tel: '',
      invoice_date: '',
      source_destination: '',
      origin: '',
      expedition: '',
      swift_code: '',
      loading_port: '',
      final_destination: '',
      bank: '',
      payment: '',
      fiscal_id_number: '',
    });
    setPerformaItems([emptyPerformaItem()]);
  };

  const addPerformaItem = () => {
    setPerformaItems([...performaItems, emptyPerformaItem()]);
  };

  const removePerformaItem = (index: number) => {
    if (performaItems.length > 1) {
      setPerformaItems(performaItems.filter((_, i) => i !== index));
    }
  };

  const updatePerformaItem = (index: number, field: keyof PerformaItem, value: unknown) => {
    const newItems = [...performaItems];
    newItems[index] = applyPerformaItemUpdate(newItems[index], field, value);
    setPerformaItems(newItems);
  };

  function mapDbRowToPrintRecord(row: Record<string, unknown>): PerformaPrintRecord {
    const s = (k: string) => String(row[k] ?? '');
    return {
      vendor: s('vendor'),
      vendor_address: s('vendor_address'),
      vendor_tel: s('vendor_tel'),
      buyer: s('buyer'),
      buyer_tin: s('buyer_tin'),
      buyer_tel: s('buyer_tel'),
      performa_code: s('performa_code'),
      invoice_date: s('invoice_date') || new Date().toISOString().slice(0, 10),
      source_destination: s('source_destination'),
      expedition: s('expedition'),
      swift_code: s('swift_code'),
      loading_port: s('loading_port'),
      final_destination: s('final_destination'),
      payment: s('payment'),
      bank: s('bank'),
      fiscal_id_number: s('fiscal_id_number'),
    };
  }

  function mapDbItemsToPrint(items: Record<string, unknown>[]): PerformaPrintItem[] {
    return items?.map(it => ({
      description_of_goods: String(it.description_of_goods ?? ''),
      origin: String(it.origin ?? ''),
      hs_code: String(it.hs_code ?? ''),
      unit: String(it.unit ?? ''),
      quantity: valStr(it.quantity),
      unit_price: valStr(it.unit_price),
      total_unit_price: valStr(it.total_unit_price),
    }));
  }

  async function loadPerformaForView(id: string): Promise<PerformaViewData | null> {
    try {
      if (!id) return null;
      const row = (await genericApi.get('performa', id)) as Record<string, unknown>;
      if (!row) return null;
      const items = (row.items || []) as Record<string, unknown>[];
      return {
        record: row,
        items: mapDbItemsToPrint(items),
      };
    } catch (e) {
      console.error('Error loading performa for view:', e);
      return null;
    }
  }

  async function loadPerformaForPrint(id: string): Promise<{ p: PerformaPrintRecord; items: PerformaPrintItem[] } | null> {
    try {
      if (!id) return null;
      const row = await genericApi.get('performa', id) as any;
      if (!row) return null;
      
      
      const items = row.items || [];
      
      return {
        p: mapDbRowToPrintRecord(row as Record<string, unknown>),
        items: mapDbItemsToPrint((items || []) as Record<string, unknown>[]),
      };
    } catch (e) {
      console.error('Error loading performa for print:', e);
      return null;
    }
  }

  async function handlePrintRow(id: string) {
    const full = await loadPerformaForPrint(id);
    if (!full) {
      alert('Impossible de charger le Performa pour impression.');
      return;
    }
    void openPerformaPrintWindow(full.p, full.items);
  }

  async function openPreviewModal(id: string) {
    const full = await loadPerformaForView(id);
    if (!full) {
      alert('Impossible de charger le Performa.');
      return;
    }
    setViewData(full);
  }

  function viewDataToPrint(full: PerformaViewData): { p: PerformaPrintRecord; items: PerformaPrintItem[] } {
    return {
      p: mapDbRowToPrintRecord(full.record),
      items: full.items,
    };
  }

  async function openEditModal(pId: string) {
    try {
      const row = await genericApi.get('performa', pId) as any;
      if (!row) throw new Error('Performa not found');

      setFormData({
        performa_code: String(row.performa_code ?? ''),
        vendor: String(row.vendor ?? ''),
        vendor_address: String(row.vendor_address ?? ''),
        vendor_tel: String(row.vendor_tel ?? ''),
        buyer: String(row.buyer ?? ''),
        buyer_tin: String(row.buyer_tin ?? ''),
        buyer_tel: String(row.buyer_tel ?? ''),
        invoice_date: String(row.invoice_date ?? '').slice(0, 10),
        source_destination: String(row.source_destination ?? ''),
        origin: String(row.origin ?? ''),
        expedition: String(row.expedition ?? ''),
        swift_code: String(row.swift_code ?? ''),
        loading_port: String(row.loading_port ?? ''),
        final_destination: String(row.final_destination ?? ''),
        bank: String(row.bank ?? ''),
        payment: String(row.payment ?? ''),
        fiscal_id_number: String(row.fiscal_id_number ?? row.fiscalIdNumber ?? row.buyer_tin ?? ''),
      });

      const items = (row.items || []) as any[];
      setPerformaItems(
        items.length > 0
          ? items.map(it => ({
            description_of_goods: String(it.description_of_goods ?? ''),
            origin: String(it.origin ?? ''),
            hs_code: String(it.hs_code ?? ''),
            quantity: valStr(it.quantity),
            unit_price: valStr(it.unit_price),
            total_unit_price: valStr(it.total_unit_price),
          }))
          : [emptyPerformaItem()]
      );

      setEditingId(pId);
      setShowModal(true);
    } catch (e) {
      console.error('Error loading performa for edit:', e);
      alert('Error loading performa data');
    }
  }

  function buildPrintFromForm(): { p: PerformaPrintRecord; items: PerformaPrintItem[] } {
    const p: PerformaPrintRecord = {
      vendor: formData.vendor,
      vendor_address: formData.vendor_address,
      vendor_tel: formData.vendor_tel,
      buyer: formData.buyer,
      buyer_tin: formData.buyer_tin,
      buyer_tel: formData.buyer_tel,
      performa_code: formData.performa_code,
      invoice_date: formData.invoice_date || new Date().toISOString().slice(0, 10),
      source_destination: formData.source_destination,
      expedition: formData.expedition,
      swift_code: formData.swift_code,
      loading_port: formData.loading_port,
      final_destination: formData.final_destination,
      payment: formData.payment,
      bank: formData.bank,
      fiscal_id_number: formData.fiscal_id_number,
    };
    const items: PerformaPrintItem[] = performaItems?.map(it => ({
      description_of_goods: it.description_of_goods,
      origin: it.origin || formData.origin,
      hs_code: it.hs_code,
      unit: (it as PerformaItem & { unit?: string }).unit || '',
      quantity: it.quantity,
      unit_price: it.unit_price,
      total_unit_price: it.total_unit_price,
    }));
    return { p, items };
  }

  const filteredPerformas = performas.filter(perf =>
    (perf.buyer && perf.buyer.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (perf.vendor && perf.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (perf.performa_code && perf.performa_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">
          {t('performa.title')}
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
          {t('performa.addNew')}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('common.show')}</span>
            <input
              type="number"
              defaultValue={10}
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
                <th className="text-left py-3 px-4 font-semibold text-gray-700 w-10">#</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('performa.buyer')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('performa.vendor')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('performa.performaCode')}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t('performa.tinNo')}
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  {t('common.action')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPerformas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredPerformas?.map((performa, idx) => {
                  const pId = performa._id || performa.id || '';
                  return (
                    <tr key={pId} className={`border-b hover:bg-blue-50/30 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/80'}`}>
                      <td className="py-3 px-4 text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4">{performa.buyer || '-'}</td>
                      <td className="py-3 px-4">{performa.vendor || '-'}</td>
                      <td className="py-3 px-4">{performa.performa_code}</td>
                      <td className="py-3 px-4">{performa.buyer_tin || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center">
                          <ActionMenu
                            actions={[
                              {
                                label: t('common.view'),
                                icon: <Eye size={16} />,
                                onClick: () => void openPreviewModal(pId),
                              },
                              {
                                label: t('common.edit'),
                                icon: <Edit size={16} />,
                                onClick: () => void openEditModal(pId),
                              },
                              {
                                label: t('performa.print'),
                                icon: <FileText size={16} />,
                                onClick: () => void handlePrintRow(pId),
                              },
                              {
                                label: t('common.delete'),
                                icon: <Trash2 size={16} />,
                                onClick: () => handleDelete(pId),
                                variant: 'danger',
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            {t('common.showing')} 1 {t('common.to')} {Math.min(filteredPerformas.length, 9)} {t('common.of')} {filteredPerformas.length} {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 bg-[#0F3C66] text-white rounded">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{t('performa.addUpdate')}</h2>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-xl leading-none text-gray-500 hover:text-gray-700"
                aria-label={t('common.cancel')}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className={pfGrid2}>
                  <PerformaField label={t('performa.performaCode')}>
                    <input
                      type="text"
                      value={formData.performa_code}
                      onChange={(e) => setFormData({ ...formData, performa_code: e.target.value })}
                      className={pfInputClass}
                      required
                    />
                  </PerformaField>
                  <PerformaField label={t('performa.vendor')}>
                    <input
                      type="text"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      className={pfInputClass}
                    />
                  </PerformaField>
                  <PerformaField label={t('performa.buyer')}>
                    <select
                      value={formData.buyer}
                      onChange={(e) => {
                        const name = e.target.value;
                        const client = clientsList.find((c) => c.name === name);
                        setFormData({
                          ...formData,
                          buyer: name,
                          buyer_tel: client?.phone ?? formData.buyer_tel,
                        });
                      }}
                      className={pfSelectClass}
                    >
                      <option value="">{t('performa.selectBuyer')}</option>
                      {clientsList.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </PerformaField>
                  <PerformaField label={t('performa.sourceDestination')}>
                    <select
                      value={formData.source_destination}
                      onChange={(e) =>
                        setFormData({ ...formData, source_destination: e.target.value })
                      }
                      className={pfSelectClass}
                    >
                      <option value="">{t('performa.selectSourceDestination')}</option>
                      {sourceDestinationOptions.map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </PerformaField>
                </div>

                <div className="overflow-x-auto rounded-md border border-gray-200">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left">
                        <th className="w-10 px-3 py-2.5 font-semibold text-gray-700">#</th>
                        <th className="px-3 py-2.5 font-semibold text-gray-700">
                          {t('performa.descriptionOfGoods')}
                        </th>
                        <th className="px-3 py-2.5 font-semibold text-gray-700">
                          {t('performa.hsCode')}
                        </th>
                        <th className="w-24 px-3 py-2.5 font-semibold text-gray-700">
                          {t('performa.qty')}
                        </th>
                        <th className="w-28 px-3 py-2.5 font-semibold text-gray-700">
                          {t('performa.unitPrice')}
                        </th>
                        <th className="w-32 px-3 py-2.5 font-semibold text-gray-700">
                          {t('performa.totalUnitPrice')}
                        </th>
                        <th className="w-16 px-3 py-2.5 text-center font-semibold text-gray-700">
                          {t('common.action')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {performaItems.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100 bg-white">
                          <td className="px-3 py-2 align-top text-gray-600">{index + 1}</td>
                          <td className="px-3 py-2 align-top">
                            <select
                              value={item.description_of_goods}
                              onChange={(e) =>
                                updatePerformaItem(index, 'description_of_goods', e.target.value)
                              }
                              className={pfSelectClass}
                            >
                              <option value="">{t('performa.selectGoodsDescription')}</option>
                              {goodsCategories.map((c) => (
                                <option key={c.id || c._id} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="text"
                              value={item.hs_code}
                              onChange={(e) => updatePerformaItem(index, 'hs_code', e.target.value)}
                              className={pfInputClass}
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) =>
                                updatePerformaItem(index, 'quantity', e.target.value)
                              }
                              className={pfInputClass}
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="text"
                              value={item.unit_price}
                              onChange={(e) =>
                                updatePerformaItem(index, 'unit_price', e.target.value)
                              }
                              className={pfInputClass}
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="text"
                              readOnly
                              value={item.total_unit_price}
                              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800"
                            />
                          </td>
                          <td className="px-3 py-2 text-center align-top">
                            {index === performaItems.length - 1 ? (
                              <button
                                type="button"
                                onClick={addPerformaItem}
                                className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-lg font-semibold text-[#0F3C66] hover:bg-gray-50"
                                aria-label={t('common.add')}
                              >
                                +
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => removePerformaItem(index)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-red-600"
                                aria-label={t('common.delete')}
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={`${pfGrid2} pt-1`}>
                  <PerformaField label={t('performa.origin')}>
                    <input
                      type="text"
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      className={pfInputClass}
                    />
                  </PerformaField>
                  <PerformaField label={t('performa.expedition')}>
                    <input
                      type="text"
                      value={formData.expedition}
                      onChange={(e) => setFormData({ ...formData, expedition: e.target.value })}
                      className={pfInputClass}
                    />
                  </PerformaField>
                  <PerformaField label={t('performa.swiftCode')}>
                    <input
                      type="text"
                      value={formData.swift_code}
                      onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                      className={pfInputClass}
                    />
                  </PerformaField>
                  <PerformaField label={t('performa.loadingPort')}>
                    <input
                      type="text"
                      value={formData.loading_port}
                      onChange={(e) => setFormData({ ...formData, loading_port: e.target.value })}
                      className={pfInputClass}
                    />
                  </PerformaField>
                  <PerformaField label={t('performa.finalDestination')}>
                    <select
                      value={formData.final_destination}
                      onChange={(e) =>
                        setFormData({ ...formData, final_destination: e.target.value })
                      }
                      className={pfSelectClass}
                    >
                      <option value="">{t('performa.selectFinalDestination')}</option>
                      {locationsList.map((l) => (
                        <option key={`dest-${l.id || l._id}`} value={l.name}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </PerformaField>
                  <PerformaField label={t('performa.payment')}>
                    <input
                      type="text"
                      value={formData.payment}
                      onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
                      className={pfInputClass}
                    />
                  </PerformaField>
                  <PerformaField label={t('performa.bank')}>
                    <select
                      value={formData.bank}
                      onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                      className={pfSelectClass}
                    >
                      <option value="">{t('performa.selectBank')}</option>
                      {banksList.map((b) => (
                        <option key={b.id || b._id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </PerformaField>
                  <PerformaField label={t('performa.fiscalIdNumber')}>
                    <input
                      type="text"
                      value={formData.fiscal_id_number}
                      onChange={(e) =>
                        setFormData({ ...formData, fiscal_id_number: e.target.value })
                      }
                      className={pfInputClass}
                    />
                  </PerformaField>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="rounded-md bg-[#0F3C66] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#152a44] transition"
                >
                  {t('performa.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewData && (
        <PerformaViewModal
          data={viewData}
          t={t}
          onClose={() => setViewData(null)}
          onPrint={() => {
            const printPayload = viewDataToPrint(viewData);
            void openPerformaPrintWindow(printPayload.p, printPayload.items);
          }}
        />
      )}

      <div className="text-center text-sm text-gray-500 py-4">
        {t('common.copyright')}
      </div>
    </div>
  );
}



