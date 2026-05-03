import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Eye, FileText, X } from 'lucide-react';
import { ActionMenu } from '../Shared/common/ActionMenu';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  buildPerformaPrintHtml,
  openPerformaPrintWindow,
  type PerformaPrintItem,
  type PerformaPrintRecord,
} from '../../lib/performaPrintHtml';
import { fetchDocumentBranding } from '../../lib/documentBranding';
import { brandingFromConfig, type DocumentBranding } from '../../types/documentBranding';

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
  quantity: number;
  unit_price: number;
  total_unit_price: number;
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

  const [branding, setBranding] = useState<DocumentBranding | null>(null);
  const [previewPerforma, setPreviewPerforma] = useState<{
    p: PerformaPrintRecord;
    items: PerformaPrintItem[];
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [performaItems, setPerformaItems] = useState<PerformaItem[]>([
    { description_of_goods: '', origin: '', hs_code: '', quantity: 0, unit_price: 0, total_unit_price: 0 },
    { description_of_goods: '', origin: '', hs_code: '', quantity: 0, unit_price: 0, total_unit_price: 0 },
  ]);

  useEffect(() => {
    fetchDocumentBranding()
      .then(setBranding)
      .catch(() => setBranding(brandingFromConfig({})));
  }, []);

  useEffect(() => {
    loadPerformas();
  }, []);

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
        items: performaItems,
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
    setPerformaItems([
      { description_of_goods: '', origin: '', hs_code: '', quantity: 0, unit_price: 0, total_unit_price: 0 },
      { description_of_goods: '', origin: '', hs_code: '', quantity: 0, unit_price: 0, total_unit_price: 0 },
    ]);
  };

  const addPerformaItem = () => {
    setPerformaItems([
      ...performaItems,
      { description_of_goods: '', origin: '', hs_code: '', quantity: 0, unit_price: 0, total_unit_price: 0 },
    ]);
  };

  const removePerformaItem = (index: number) => {
    if (performaItems.length > 1) {
      setPerformaItems(performaItems.filter((_, i) => i !== index));
    }
  };

  const updatePerformaItem = (index: number, field: keyof PerformaItem, value: unknown) => {
    const newItems = [...performaItems];
    const row = { ...newItems[index], [field]: value } as PerformaItem;
    if (field === 'quantity' || field === 'unit_price') {
      const q = field === 'quantity' ? Number(value) : row.quantity;
      const pr = field === 'unit_price' ? Number(value) : row.unit_price;
      row.total_unit_price = Math.round(q * pr * 100) / 100;
    }
    newItems[index] = row;
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
      invoice_date: s('invoice_date'),
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
      quantity: Number(it.quantity) || 0,
      unit_price: Number(it.unit_price) || 0,
      total_unit_price: Number(it.total_unit_price) || 0,
    }));
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
    const full = await loadPerformaForPrint(id);
    if (!full) {
      alert('Impossible de charger le Performa.');
      return;
    }
    setPreviewPerforma(full);
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
        fiscal_id_number: String(row.fiscal_id_number ?? row.fiscalIdNumber ?? ''),
      });

      const items = (row.items || []) as any[];
      setPerformaItems(
        items.length > 0
          ? items.map(it => ({
            description_of_goods: String(it.description_of_goods ?? ''),
            origin: String(it.origin ?? ''),
            hs_code: String(it.hs_code ?? ''),
            quantity: Number(it.quantity) || 0,
            unit_price: Number(it.unit_price) || 0,
            total_unit_price: Number(it.total_unit_price) || 0,
          }))
          : [
            { description_of_goods: '', origin: '', hs_code: '', quantity: 0, unit_price: 0, total_unit_price: 0 },
            { description_of_goods: '', origin: '', hs_code: '', quantity: 0, unit_price: 0, total_unit_price: 0 },
          ]
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
      invoice_date: formData.invoice_date,
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-7xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {editingId ? t('performa.addUpdate') : t('performa.addNew')}
              </h2>
              <button
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('performa.performaCode')} (PERFORMA INVOICE No.)
                    </label>
                    <input
                      type="text"
                      value={formData.performa_code}
                      onChange={(e) => setFormData({ ...formData, performa_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date (document)
                    </label>
                    <input
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('performa.vendor')} (vendeur)
                    </label>
                    <input
                      type="text"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      placeholder="HAMILTON"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse vendeur</label>
                    <input
                      type="text"
                      value={formData.vendor_address}
                      onChange={(e) => setFormData({ ...formData, vendor_address: e.target.value })}
                      placeholder="..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tél. vendeur</label>
                    <input
                      type="text"
                      value={formData.vendor_tel}
                      onChange={(e) => setFormData({ ...formData, vendor_tel: e.target.value })}
                      placeholder="..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('performa.buyer')}
                    </label>
                    <input
                      type="text"
                      value={formData.buyer}
                      onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('performa.tinNo')}</label>
                    <input
                      type="text"
                      value={formData.buyer_tin}
                      onChange={(e) => setFormData({ ...formData, buyer_tin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tél. acheteur</label>
                    <input
                      type="text"
                      value={formData.buyer_tel}
                      onChange={(e) => setFormData({ ...formData, buyer_tel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('performa.sourceDestination')}
                    </label>
                    <input
                      type="text"
                      value={formData.source_destination}
                      onChange={(e) => setFormData({ ...formData, source_destination: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="border-t pt-5">
                  <h3 className="text-base font-semibold mb-3">{t('performa.goodsTable')}</h3>

                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm min-w-[720px]">
                      <thead>
                        <tr className="bg-[#00a651] text-white">
                          <th className="text-left py-2.5 px-2 font-semibold w-10">#</th>
                          <th className="text-left py-2.5 px-2 font-semibold">{t('performa.descriptionOfGoods')}</th>
                          <th className="text-left py-2.5 px-2 font-semibold">{t('performa.origin')}</th>
                          <th className="text-left py-2.5 px-2 font-semibold">{t('performa.hsCode')}</th>
                          <th className="text-left py-2.5 px-2 font-semibold">{t('performa.qty')}</th>
                          <th className="text-left py-2.5 px-2 font-semibold">{t('performa.unitPrice')}</th>
                          <th className="text-left py-2.5 px-2 font-semibold">{t('performa.totalUnitPrice')}</th>
                          <th className="text-center py-2.5 px-2 font-semibold w-16">{t('common.action')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {performaItems?.map((item, index) => (
                          <tr key={index} className="border-b border-gray-100 bg-white odd:bg-gray-50/50">
                            <td className="py-2 px-2 align-top">{index + 1}</td>
                            <td className="py-2 px-2 align-top">
                              <input
                                type="text"
                                value={item.description_of_goods}
                                onChange={(e) => updatePerformaItem(index, 'description_of_goods', e.target.value)}
                                className="w-full min-w-[140px] px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-[#00a651]/40 outline-none"
                              />
                            </td>
                            <td className="py-2 px-2 align-top">
                              <input
                                type="text"
                                value={item.origin}
                                onChange={(e) => updatePerformaItem(index, 'origin', e.target.value)}
                                placeholder="CHINA"
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-[#00a651]/40 outline-none"
                              />
                            </td>
                            <td className="py-2 px-2 align-top">
                              <input
                                type="text"
                                value={item.hs_code}
                                onChange={(e) => updatePerformaItem(index, 'hs_code', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-[#00a651]/40 outline-none"
                              />
                            </td>
                            <td className="py-2 px-2 align-top w-24">
                              <input
                                type="number"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => updatePerformaItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded"
                              />
                            </td>
                            <td className="py-2 px-2 align-top w-28">
                              <input
                                type="number"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => updatePerformaItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded"
                              />
                            </td>
                            <td className="py-2 px-2 align-top w-28">
                              <input
                                type="number"
                                step="0.01"
                                readOnly
                                value={item.total_unit_price}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded bg-gray-50 text-gray-800"
                              />
                            </td>
                            <td className="py-2 px-2 text-center align-top">
                              {performaItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removePerformaItem(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  ✕
                                </button>
                              )}
                              {index === performaItems.length - 1 && (
                                <button
                                  type="button"
                                  onClick={addPerformaItem}
                                  className="text-blue-600 hover:text-blue-700 ml-1"
                                >
                                  +
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Origine par ligne (comme le modèle). Valeur par défaut pour ligne vide : champ « Origine (global) » ci-dessous.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 border-t pt-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('performa.origin')} (si ligne vide)
                    </label>
                    <input
                      type="text"
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('performa.expedition')}
                    </label>
                    <input
                      type="text"
                      value={formData.expedition}
                      onChange={(e) => setFormData({ ...formData, expedition: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('performa.swiftCode')}
                    </label>
                    <input
                      type="text"
                      value={formData.swift_code}
                      onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('performa.loadingPort')}
                    </label>
                    <input
                      type="text"
                      value={formData.loading_port}
                      onChange={(e) => setFormData({ ...formData, loading_port: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('performa.finalDestination')}
                    </label>
                    <input
                      type="text"
                      value={formData.final_destination}
                      onChange={(e) => setFormData({ ...formData, final_destination: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('performa.payment')}
                    </label>
                    <input
                      type="text"
                      value={formData.payment}
                      onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('performa.bank')}
                    </label>
                    <input
                      type="text"
                      value={formData.bank}
                      onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                      placeholder="..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax ID Number
                    </label>
                    <input
                      type="text"
                      value={formData.fiscal_id_number}
                      onChange={(e) => setFormData({ ...formData, fiscal_id_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewPerforma(buildPrintFromForm())}
                  className="px-4 py-2 border border-[#0F3C66] text-[#0F3C66] rounded-lg hover:bg-[#0F3C66]/5 transition"
                >
                  {t('common.view')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const x = buildPrintFromForm();
                    void openPerformaPrintWindow(x.p, x.items);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  {t('performa.print')}
                </button>
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
                  className="px-6 py-2 bg-[#00a651] text-white rounded-lg hover:bg-[#008a45] transition"
                >
                  {t('performa.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewPerforma && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold text-[#0F3C66]">PERFORMA INVOICE — {t('common.view')}</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void openPerformaPrintWindow(previewPerforma.p, previewPerforma.items)
                  }
                  className="inline-flex items-center gap-1 rounded-lg bg-[#0F3C66] px-3 py-1.5 text-sm text-white hover:bg-[#163252]"
                >
                  {t('performa.print')}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPerforma(null)}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100"
                  aria-label={t('common.cancel')}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <iframe
              title="Aperçu Performa"
              className="min-h-[70vh] w-full flex-1 border-0 bg-gray-100"
              srcDoc={buildPerformaPrintHtml(
                previewPerforma.p,
                previewPerforma.items,
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



