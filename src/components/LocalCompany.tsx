import { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Eye, FileText, X, Upload, Printer } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { fetchClients, type ClientRecord } from '../api/clientsApi';
import { formatClientLabel } from '../lib/clientLabel';
import {
  fetchLocalCompanies,
  createLocalCompany,
  updateLocalCompany,
  deleteLocalCompany,
  type LocalCompanyRecord,
  type LocalCompanyCreateInput,
} from '../api/localCompanyApi';
import { openLocalCompanyPrint } from '../lib/localCompanyPrintHtml';
import { ActionMenu } from './common/ActionMenu';

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/15';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500';

function buildLocalCompanyCreateInput(
  formData: {
    client_name: string;
    vendor_company: string;
    purchasing_company: string;
    goods_description: string;
    source_destination: string;
    closure_date: string;
    bill_of_loading: string;
    declaration_s: string;
    declaration_e: string;
    file_fee: string;
    quantity: string;
    truck_loading_quantity: string;
    transit_fee: string;
    service_fee: string;
    escort_fee: string;
    total: string;
    numero_9: string;
    numero_9_price: string;
    numero_4: string;
    numero_4_price: string;
    ti_cancellation: string;
    declaration_cancellation: string;
    transfer: string;
    declaration_cancellation_price: string;
  },
  formClientId: string
): LocalCompanyCreateInput {
  return {
    client_id: formClientId || undefined,
    client_name: formData.client_name.trim(),
    vendor_company: formData.vendor_company.trim(),
    purchasing_company: formData.purchasing_company.trim(),
    goods_description: formData.goods_description.trim(),
    source_destination: formData.source_destination.trim(),
    closure_date: formData.closure_date,
    bill_of_loading: formData.bill_of_loading.trim(),
    declaration_s: formData.declaration_s.trim(),
    declaration_e: formData.declaration_e.trim(),
    file_fee: parseFloat(formData.file_fee) || 0,
    quantity: parseFloat(formData.quantity) || 0,
    truck_loading_quantity: parseFloat(formData.truck_loading_quantity) || 0,
    transit_fee: parseFloat(formData.transit_fee) || 0,
    service_fee: parseFloat(formData.service_fee) || 0,
    escort_fee: parseFloat(formData.escort_fee) || 0,
    total: parseFloat(formData.total) || 0,
    numero_9: formData.numero_9.trim(),
    numero_9_price: parseFloat(formData.numero_9_price) || 0,
    numero_4: formData.numero_4.trim(),
    numero_4_price: parseFloat(formData.numero_4_price) || 0,
    ti_cancellation: formData.ti_cancellation.trim(),
    declaration_cancellation: formData.declaration_cancellation.trim(),
    transfer: formData.transfer.trim(),
    declaration_cancellation_price: parseFloat(formData.declaration_cancellation_price) || 0,
  };
}

function numStr(v: number | undefined | null): string {
  if (v === undefined || v === null || (typeof v === 'number' && Number.isNaN(v))) return '';
  return String(v);
}

function recordToFormData(r: LocalCompanyRecord) {
  const d = r.closure_date ? String(r.closure_date).slice(0, 10) : '';
  return {
    client_name: r.client_name || '',
    vendor_company: r.vendor_company || '',
    purchasing_company: r.purchasing_company || '',
    goods_description: r.goods_description || '',
    source_destination: r.source_destination || '',
    closure_date: d,
    bill_of_loading: r.bill_of_loading || '',
    declaration_s: r.declaration_s || '',
    declaration_e: r.declaration_e || '',
    file_fee: numStr(r.file_fee),
    quantity: numStr(r.quantity),
    truck_loading_quantity: numStr(r.truck_loading_quantity),
    transit_fee: numStr(r.transit_fee),
    service_fee: numStr(r.service_fee),
    escort_fee: numStr(r.escort_fee),
    total: numStr(r.total),
    numero_9: r.numero_9 || '',
    numero_9_price: numStr(r.numero_9_price),
    numero_4: r.numero_4 || '',
    numero_4_price: numStr(r.numero_4_price),
    ti_cancellation: r.ti_cancellation || '',
    declaration_cancellation: r.declaration_cancellation || '',
    transfer: r.transfer || '',
    declaration_cancellation_price: numStr(r.declaration_cancellation_price),
  };
}

const MAX_DELETE_AGE_DAYS = 30;

function canDeleteByPolicy(r: LocalCompanyRecord): boolean {
  if (!r.createdAt) return true;
  const created = new Date(r.createdAt).getTime();
  if (Number.isNaN(created)) return true;
  const days = (Date.now() - created) / (86400 * 1000);
  return days <= MAX_DELETE_AGE_DAYS;
}

/** Images, PDF et documents bureautiques pour les pièces jointes. */
const LOCAL_FILE_ACCEPT =
  'image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

type LocalCompanyDocSlot =
  | 'sydonia'
  | 'deliveryOrder'
  | 'commercialInvoice'
  | 'packingList'
  | 'transferDocS'
  | 'numero9'
  | 'tiCancellation'
  | 'declarationCancellation'
  | 'numero4'
  | 'fullScannedDocument';

function emptyLocalDocuments(): Record<LocalCompanyDocSlot, File | null> {
  return {
    sydonia: null,
    deliveryOrder: null,
    commercialInvoice: null,
    packingList: null,
    transferDocS: null,
    numero9: null,
    tiCancellation: null,
    declarationCancellation: null,
    numero4: null,
    fullScannedDocument: null,
  };
}

function LocalCompanyFileSlot({
  slot,
  label,
  file,
  onChange,
  t,
}: {
  slot: LocalCompanyDocSlot;
  label: string;
  file: File | null;
  onChange: (slot: LocalCompanyDocSlot, file: File | null) => void;
  t: (key: string) => string;
}) {
  const inputId = `local-company-file-${slot}`;
  return (
    <div className="relative">
      <span className={labelClass}>{label}</span>
      <div className="relative flex min-h-[118px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#0F3C66]/25 bg-gradient-to-b from-slate-50/90 to-white px-3 py-4 transition hover:border-[#0F3C66]/45 hover:bg-slate-50/80">
        <input
          id={inputId}
          type="file"
          accept={LOCAL_FILE_ACCEPT}
          className="sr-only"
          onChange={e => {
            const f = e.target.files?.[0] ?? null;
            onChange(slot, f);
          }}
        />
        {file ? (
          <>
            <FileText className="text-[#0F3C66]" size={26} strokeWidth={1.5} aria-hidden />
            <label
              htmlFor={inputId}
              className="mt-2 cursor-pointer break-all text-center text-sm font-medium text-slate-800 line-clamp-3 hover:underline"
            >
              {file.name}
            </label>
            <button
              type="button"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white shadow-sm hover:bg-red-600"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onChange(slot, null);
                const el = document.getElementById(inputId) as HTMLInputElement | null;
                if (el) el.value = '';
              }}
              aria-label={t('common.delete')}
            >
              ×
            </button>
          </>
        ) : (
          <label
            htmlFor={inputId}
            className="flex cursor-pointer flex-col items-center justify-center gap-1.5 text-sm text-slate-600"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F3C66]/10 text-[#0F3C66]">
              <Upload size={20} strokeWidth={1.75} aria-hidden />
            </div>
            <span className="font-semibold text-[#0F3C66]">{t('commercial.chooseFile')}</span>
          </label>
        )}
      </div>
    </div>
  );
}

export function LocalCompany() {
  const [companies, setCompanies] = useState<LocalCompanyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('local');
  const [clientsList, setClientsList] = useState<ClientRecord[]>([]);
  const [formClientId, setFormClientId] = useState('');
  const [documents, setDocuments] = useState<Record<LocalCompanyDocSlot, File | null>>(() =>
    emptyLocalDocuments()
  );
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();

  const [formData, setFormData] = useState({
    client_name: '',
    vendor_company: '',
    purchasing_company: '',
    goods_description: '',
    source_destination: '',
    closure_date: '',
    bill_of_loading: '',
    declaration_s: '',
    declaration_e: '',
    file_fee: '',
    quantity: '',
    truck_loading_quantity: '',
    transit_fee: '',
    service_fee: '',
    escort_fee: '',
    total: '',
    numero_9: '',
    numero_9_price: '',
    numero_4: '',
    numero_4_price: '',
    ti_cancellation: '',
    declaration_cancellation: '',
    transfer: '',
    declaration_cancellation_price: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingRecord, setViewingRecord] = useState<LocalCompanyRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LocalCompanyRecord | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

  useEffect(() => {
    loadCompanies();
    void (async () => {
      try {
        setClientsList(await fetchClients());
      } catch (e) {
        console.error('Error loading clients:', e);
      }
    })();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await fetchLocalCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error loading local companies:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Impossible de charger les dossiers. Vérifiez que l’API backend est démarrée (MongoDB).'
      );
    } finally {
      setLoading(false);
    }
  };

  const closeFormModal = () => {
    setShowModal(false);
    setCurrentStep(1);
    setEditingId(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = buildLocalCompanyCreateInput(formData, formClientId);
      if (editingId) {
        await updateLocalCompany(editingId, payload);
      } else {
        await createLocalCompany(payload);
      }

      closeFormModal();
      await loadCompanies();
    } catch (error: unknown) {
      console.error('Error saving local company:', error);
      alert(error instanceof Error ? error.message : 'Enregistrement impossible.');
    }
  };

  const requestDelete = (record: LocalCompanyRecord) => {
    if (!canDeleteByPolicy(record)) {
      alert(t('local.deleteNotAllowedAge'));
      return;
    }
    setDeleteTarget(record);
    setDeleteConfirmInput('');
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const expected = deleteTarget.client_name.trim();
    if (deleteConfirmInput.trim() !== expected) {
      alert(t('local.deleteTypeClientName'));
      return;
    }
    try {
      await deleteLocalCompany(deleteTarget.id);
      setDeleteTarget(null);
      setDeleteConfirmInput('');
      await loadCompanies();
    } catch (error: unknown) {
      console.error('Error deleting local company:', error);
      alert(error instanceof Error ? error.message : 'Suppression impossible.');
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    resetForm();
    setShowModal(true);
    setCurrentStep(1);
  };

  const openEditModal = (record: LocalCompanyRecord) => {
    setEditingId(record.id);
    setFormData(recordToFormData(record));
    setFormClientId(record.client_id || '');
    setDocuments(emptyLocalDocuments());
    setShowModal(true);
    setCurrentStep(1);
  };

  const setDocumentForSlot = (slot: LocalCompanyDocSlot, file: File | null) => {
    setDocuments(prev => ({ ...prev, [slot]: file }));
  };

  const resetForm = () => {
    setFormClientId('');
    setDocuments(emptyLocalDocuments());
    setFormData({
      client_name: '',
      vendor_company: '',
      purchasing_company: '',
      goods_description: '',
      source_destination: '',
      closure_date: '',
      bill_of_loading: '',
      declaration_s: '',
      declaration_e: '',
      file_fee: '',
      quantity: '',
      truck_loading_quantity: '',
      transit_fee: '',
      service_fee: '',
      escort_fee: '',
      total: '',
      numero_9: '',
      numero_9_price: '',
      numero_4: '',
      numero_4_price: '',
      ti_cancellation: '',
      declaration_cancellation: '',
      transfer: '',
      declaration_cancellation_price: '',
    });
  };

  const filteredCompanies = companies.filter(comp =>
    comp.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (comp.vendor_company && comp.vendor_company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (comp.goods_description && comp.goods_description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">
          {t('local.title')}
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-[#0F3C66] text-white px-4 py-2 rounded-lg hover:bg-[#152a44] transition"
          >
            <Plus size={20} />
            {t('common.addNew')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('local')}
            className={`px-6 py-3 font-medium transition ${activeTab === 'local'
              ? 'bg-[#2d3e50] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            {t('local.localCompany')}
          </button>
          <button
            onClick={() => setActiveTab('full')}
            className={`px-6 py-3 font-medium transition ${activeTab === 'full'
              ? 'bg-[#2d3e50] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            {t('local.fullLocalCompany')}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'local' && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{t('common.show')}</span>
                  <input
                    type="number"
                    defaultValue={5}
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-16"
                  />
                </div>
                <input
                  type="text"
                  placeholder={`${t('common.search')} Here`}
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
                        {t('local.client')}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        {t('local.sourceDestination')}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        {t('local.vendorCompany')}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        {t('local.goodsDescription')}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        {t('local.purchasingCompany')}
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        {t('local.fileFee')}
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        {t('local.quantity')}
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        {t('local.truckLoadingQuantity')}
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        {t('common.action')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-8 text-gray-500">
                          {t('common.noData')}
                        </td>
                      </tr>
                    ) : (
                      filteredCompanies?.map((company, index) => (
                        <tr key={company.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{index + 1}</td>
                          <td className="py-3 px-4">{company.client_name}</td>
                          <td className="py-3 px-4">{company.source_destination || '-'}</td>
                          <td className="py-3 px-4">{company.vendor_company || '-'}</td>
                          <td className="py-3 px-4">{company.goods_description || '-'}</td>
                          <td className="py-3 px-4">{company.purchasing_company || '-'}</td>
                          <td className="py-3 px-4 text-right">{formatAmount(company.file_fee ?? 0)}</td>
                          <td className="py-3 px-4 text-right">{(company.quantity ?? 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">{(company.truck_loading_quantity ?? 0).toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center">
                              <ActionMenu
                                actions={[
                                  {
                                    label: t('local.viewRecord'),
                                    icon: <Eye size={16} />,
                                    onClick: () => setViewingRecord(company),
                                  },
                                  {
                                    label: t('local.editRecord'),
                                    icon: <Edit2 size={16} />,
                                    onClick: () => openEditModal(company),
                                  },
                                  {
                                    label: t('local.printService'),
                                    icon: <Printer size={16} />,
                                    onClick: () => void openLocalCompanyPrint(company),
                                  },
                                  {
                                    label: t('common.delete'),
                                    icon: <Trash2 size={16} />,
                                    onClick: () => requestDelete(company),
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

              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <div>
                  {t('common.showing')} 1 {t('common.to')} {filteredCompanies.length > 5 ? 5 : filteredCompanies.length} {t('common.of')} {filteredCompanies.length} {t('common.entries')}
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                    {'<'}
                  </button>
                  <button className="px-3 py-1 bg-[#0F3C66] text-white rounded">1</button>
                  <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">2</button>
                  <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">3</button>
                  <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                    {'>'}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'full' && (
            <div className="py-12">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">ℹ️</span>
                  <p className="text-sm text-blue-800">
                    <strong>NOTICE:</strong> {t('local.fullCompanyNotice')}
                  </p>
                </div>
              </div>
              <div className="text-center text-gray-500">
                {t('common.noData')}
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
          <div className="flex min-h-0 max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-[#0F3C66] to-[#154b8a] px-6 py-4 text-white">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingId ? t('local.editRecord') : t('local.addUpdate')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeFormModal();
                }}
                className="rounded-lg p-2 text-white/90 transition hover:bg-white/10"
                aria-label={t('common.cancel')}
              >
                <X size={22} />
              </button>
            </div>

            <div className="border-b border-gray-100 bg-gray-50/90 px-6 py-4">
              <div className="mx-auto flex max-w-md items-center justify-between gap-2">
                <div className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${currentStep === 1 ? 'bg-[#0F3C66] text-white shadow-md' : 'bg-emerald-100 text-emerald-800'
                      }`}
                  >
                    1
                  </div>
                  <span className="text-center text-xs font-medium text-gray-600">{t('local.step1Label')}</span>
                </div>
                <div className="h-0.5 flex-1 rounded bg-gray-200" />
                <div className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${currentStep === 2 ? 'bg-[#0F3C66] text-white shadow-md' : 'bg-gray-200 text-gray-500'
                      }`}
                  >
                    2
                  </div>
                  <span className="text-center text-xs font-medium text-gray-600">{t('local.step2Label')}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className={labelClass}>
                          {t('local.vendorCompany')} *
                        </label>
                        <input
                          type="text"
                          value={formData.vendor_company}
                          onChange={(e) => setFormData({ ...formData, vendor_company: e.target.value })}
                          className={inputClass}
                          placeholder={t('local.vendorCompanyPlaceholder')}
                          required
                          autoComplete="organization"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          {t('local.purchasingCompany')} *
                        </label>
                        <input
                          type="text"
                          value={formData.purchasing_company}
                          onChange={(e) => setFormData({ ...formData, purchasing_company: e.target.value })}
                          className={inputClass}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className={labelClass}>
                          {t('local.goodsDescription')} *
                        </label>
                        <select
                          value={formData.goods_description}
                          onChange={(e) => setFormData({ ...formData, goods_description: e.target.value })}
                          className={inputClass}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Electronics">Electronics</option>
                          <option value="Automobile">Automobile</option>
                          <option value="Clothing">Clothing</option>
                          <option value="Furniture">Furniture</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>
                          {t('local.client')} *
                        </label>
                        <select
                          value={formClientId}
                          onChange={e => {
                            const id = e.target.value;
                            setFormClientId(id);
                            const c = clientsList.find(x => x.id === id);
                            setFormData({
                              ...formData,
                              client_name: c ? formatClientLabel(c) : '',
                            });
                          }}
                          className={inputClass}
                          required
                        >
                          <option value="">{t('clients.selectClient')}</option>
                          {clientsList?.map(c => (
                            <option key={c.id} value={c.id}>
                              {formatClientLabel(c)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className={labelClass}>
                          {t('local.sourceDestination')} *
                        </label>
                        <select
                          value={formData.source_destination}
                          onChange={(e) => setFormData({ ...formData, source_destination: e.target.value })}
                          className={inputClass}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Muqdisho -To- Hargeysa">Muqdisho -To- Hargeysa</option>
                          <option value="Bweyne -To- Kismaayo">Bweyne -To- Kismaayo</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>
                          {t('local.closureDate')} *
                        </label>
                        <input
                          type="date"
                          value={formData.closure_date}
                          onChange={(e) => setFormData({ ...formData, closure_date: e.target.value })}
                          className={`${inputClass} tabular-nums`}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className={labelClass}>
                          {t('local.billOfLoading')}
                        </label>
                        <input
                          type="text"
                          value={formData.bill_of_loading}
                          onChange={(e) => setFormData({ ...formData, bill_of_loading: e.target.value })}
                          className={`${inputClass} tabular-nums`}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          {t('local.declarationS')}
                        </label>
                        <input
                          type="text"
                          value={formData.declaration_s}
                          onChange={(e) => setFormData({ ...formData, declaration_s: e.target.value })}
                          className={`${inputClass} tabular-nums`}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          {t('local.declarationE')}
                        </label>
                        <input
                          type="text"
                          value={formData.declaration_e}
                          onChange={(e) => setFormData({ ...formData, declaration_e: e.target.value })}
                          className={`${inputClass} tabular-nums`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className={labelClass}>
                          {t('local.fileFee')} *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.file_fee}
                          onChange={(e) => setFormData({ ...formData, file_fee: e.target.value })}
                          className={`${inputClass} tabular-nums`}
                          required
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          {t('local.quantity')} *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          className={`${inputClass} tabular-nums`}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className={labelClass}>
                          {t('local.truckLoadingQuantity')} *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.truck_loading_quantity}
                          onChange={(e) => setFormData({ ...formData, truck_loading_quantity: e.target.value })}
                          className={`${inputClass} tabular-nums`}
                          required
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          {t('local.transitFee')} *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.transit_fee}
                          onChange={(e) => setFormData({ ...formData, transit_fee: e.target.value })}
                          className={`${inputClass} tabular-nums`}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className={labelClass}>
                          {t('local.serviceFee')} *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.service_fee}
                          onChange={(e) => setFormData({ ...formData, service_fee: e.target.value })}
                          className={`${inputClass} tabular-nums`}
                          required
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          {t('local.escortFee')}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.escort_fee}
                          onChange={(e) => setFormData({ ...formData, escort_fee: e.target.value })}
                          className={`${inputClass} tabular-nums`}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          {t('local.total')}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.total}
                          onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                          className={`${inputClass} tabular-nums`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50 to-white p-4 shadow-sm">
                      <div className="flex gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-sm font-bold text-amber-800"
                          aria-hidden
                        >
                          !
                        </div>
                        <p className="text-sm leading-relaxed text-amber-950">{t('local.documentsNote')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <LocalCompanyFileSlot
                        slot="sydonia"
                        label="Sydonia"
                        file={documents.sydonia}
                        onChange={setDocumentForSlot}
                        t={t}
                      />
                      <LocalCompanyFileSlot
                        slot="deliveryOrder"
                        label={t('local.deliveryOrder')}
                        file={documents.deliveryOrder}
                        onChange={setDocumentForSlot}
                        t={t}
                      />
                      <LocalCompanyFileSlot
                        slot="commercialInvoice"
                        label={t('commercial.commercialInvoice')}
                        file={documents.commercialInvoice}
                        onChange={setDocumentForSlot}
                        t={t}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <LocalCompanyFileSlot
                        slot="packingList"
                        label={t('commercial.packingList')}
                        file={documents.packingList}
                        onChange={setDocumentForSlot}
                        t={t}
                      />
                      <LocalCompanyFileSlot
                        slot="transferDocS"
                        label={t('local.transferDocS')}
                        file={documents.transferDocS}
                        onChange={setDocumentForSlot}
                        t={t}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <LocalCompanyFileSlot
                        slot="numero9"
                        label={t('local.numero9')}
                        file={documents.numero9}
                        onChange={setDocumentForSlot}
                        t={t}
                      />
                      <div>
                        <label className={labelClass}>
                          {t('local.numero9Price')} *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.numero_9_price}
                          onChange={(e) => setFormData({ ...formData, numero_9_price: e.target.value })}
                          className={`${inputClass} tabular-nums`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <LocalCompanyFileSlot
                        slot="tiCancellation"
                        label={t('local.tiCancellation')}
                        file={documents.tiCancellation}
                        onChange={setDocumentForSlot}
                        t={t}
                      />
                      <LocalCompanyFileSlot
                        slot="declarationCancellation"
                        label={t('local.declarationCancellation')}
                        file={documents.declarationCancellation}
                        onChange={setDocumentForSlot}
                        t={t}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <LocalCompanyFileSlot
                        slot="numero4"
                        label={t('local.numero4')}
                        file={documents.numero4}
                        onChange={setDocumentForSlot}
                        t={t}
                      />
                      <div>
                        <label className={labelClass}>
                          {t('local.numero4Price')} *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.numero_4_price}
                          onChange={(e) => setFormData({ ...formData, numero_4_price: e.target.value })}
                          className={`${inputClass} tabular-nums`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className={labelClass}>
                          {t('local.transfer')}
                        </label>
                        <input
                          type="text"
                          value={formData.transfer}
                          onChange={(e) => setFormData({ ...formData, transfer: e.target.value })}
                          className={`${inputClass} tabular-nums`}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          {t('local.declarationCancellationPrice')} *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.declaration_cancellation_price}
                          onChange={(e) => setFormData({ ...formData, declaration_cancellation_price: e.target.value })}
                          className={`${inputClass} tabular-nums`}
                        />
                      </div>
                    </div>

                    <div>
                      <LocalCompanyFileSlot
                        slot="fullScannedDocument"
                        label={`${t('local.fullScannedDocument')} *`}
                        file={documents.fullScannedDocument}
                        onChange={setDocumentForSlot}
                        t={t}
                      />
                    </div>
                  </div>
                )}

              </div>

              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 bg-slate-50/90 px-6 py-4">
                {currentStep === 2 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    {t('commercial.previous')}
                  </button>
                ) : (
                  <span />
                )}
                {currentStep === 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="ml-auto rounded-xl bg-[#0F3C66] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0F3C66]/20 transition hover:bg-[#152a44]"
                  >
                    {t('local.next')}
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="ml-auto rounded-xl bg-[#0F3C66] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0F3C66]/20 transition hover:bg-[#152a44]"
                  >
                    {t('local.finish')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingRecord && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-[#0F3C66] to-[#154b8a] px-5 py-4 text-white">
              <h2 className="text-lg font-semibold">{t('local.viewRecord')}</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void openLocalCompanyPrint(viewingRecord)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium transition hover:bg-white/25"
                >
                  <Printer size={16} />
                  {t('local.printService')}
                </button>
                <button
                  type="button"
                  onClick={() => setViewingRecord(null)}
                  className="rounded-lg p-2 text-white/90 transition hover:bg-white/10"
                  aria-label={t('common.cancel')}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-5 text-sm">
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  [t('local.client'), viewingRecord.client_name],
                  [t('local.sourceDestination'), viewingRecord.source_destination || '—'],
                  [t('local.vendorCompany'), viewingRecord.vendor_company || '—'],
                  [t('local.purchasingCompany'), viewingRecord.purchasing_company || '—'],
                  [t('local.goodsDescription'), viewingRecord.goods_description || '—'],
                  [t('local.closureDate'), viewingRecord.closure_date || '—'],
                  [t('local.fileFee'), formatAmount(viewingRecord.file_fee ?? 0)],
                  [t('local.quantity'), String(viewingRecord.quantity ?? 0)],
                  [t('local.truckLoadingQuantity'), String(viewingRecord.truck_loading_quantity ?? 0)],
                  [t('local.transitFee'), formatAmount(viewingRecord.transit_fee ?? 0)],
                  [t('local.serviceFee'), formatAmount(viewingRecord.service_fee ?? 0)],
                  [t('local.total'), formatAmount(viewingRecord.total ?? 0)],
                ]?.map(([label, val], idx) => (
                  <div key={`view-field-${idx}`} className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
                    <dd className="mt-1 font-medium text-slate-900">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="border-t border-gray-100 bg-slate-50 px-5 py-3 text-right">
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
                className="rounded-lg bg-[#0F3C66] px-4 py-2 text-sm font-semibold text-white hover:bg-[#152a44]"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">{t('local.deleteModalTitle')}</h3>
            <p className="mt-2 text-sm text-slate-600">{t('local.deleteTypeClientName')}</p>
            <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm font-semibold text-slate-800">
              {deleteTarget.client_name}
            </p>
            <label className="mt-4 block text-xs font-semibold uppercase text-slate-500">
              {t('local.client')}
            </label>
            <input
              type="text"
              value={deleteConfirmInput}
              onChange={e => setDeleteConfirmInput(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              autoComplete="off"
              placeholder={t('local.client')}
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteConfirmInput('');
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => void executeDelete()}
                disabled={deleteConfirmInput.trim() !== deleteTarget.client_name.trim()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t('local.deleteConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-sm text-gray-500 py-4">
        {t('common.copyright')}
      </div>
    </div>
  );
}


