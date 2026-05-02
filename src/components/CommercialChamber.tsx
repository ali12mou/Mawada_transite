import { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Eye, FileText, Printer, Search, Upload, Briefcase } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { fetchClients, type ClientRecord } from '../api/clientsApi';
import { formatClientLabel } from '../lib/clientLabel';
import {
  fetchCommercialChambers,
  createCommercialChamber,
  updateCommercialChamber,
  deleteCommercialChamber,
  type CommercialChamberRecord,
} from '../api/commercialChamberApi';
import { openCommercialDetailPrint, openCommercialListPrint } from '../lib/commercialChamberPrintHtml';
import { FormLabel, FormInput, FormSelect, PrimaryButton, SecondaryButton } from './common/FormComponents';
import Modal from './common/Modal';
import { ActionMenu } from './common/ActionMenu';

type CommercialDocSlot =
  | 'customerDocument'
  | 'chamberDocument'
  | 'chamberInvoice'
  | 'commercialInvoice'
  | 'packingList'
  | 'truckWayBill'
  | 'originalCertificate';

const emptyCommercialDocuments = (): Record<CommercialDocSlot, File | null> => ({
  customerDocument: null,
  chamberDocument: null,
  chamberInvoice: null,
  commercialInvoice: null,
  packingList: null,
  truckWayBill: null,
  originalCertificate: null,
});

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/15';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500';

function recordToFormData(r: CommercialChamberRecord) {
  return {
    client_name: r.client_name || '',
    responsible: r.responsible || '',
    commercial_invoice_no: r.commercial_invoice_no || '',
    commercial_invoice_date: r.commercial_invoice_date || '',
    purchase_order_no: r.purchase_order_no || '',
    purchase_order_date: r.purchase_order_date || '',
    chamber_service_amount: String(r.chamber_service_amount ?? ''),
    quantity: String(r.quantity ?? ''),
    unit_price: String(r.unit_price ?? ''),
    percentage: String(r.percentage ?? ''),
    goods_description: r.goods_description || '',
    service_charge: String(r.service_charge ?? ''),
    tell: r.tell || '',
    timno: r.timno || '',
    bank_commission_fee: String(r.bank_commission_fee ?? ''),
    transport_dhl: String(r.transport_dhl ?? ''),
    total: String(r.total ?? ''),
    certificate_fee: String(r.certificate_fee ?? ''),
  };
}

function CommercialChamberFileSlot({
  slot,
  label,
  file,
  onChange,
  t,
}: {
  slot: CommercialDocSlot;
  label: string;
  file: File | null;
  onChange: (slot: CommercialDocSlot, file: File | null) => void;
  t: (key: string) => string;
}) {
  const inputId = `commercial-chamber-file-${slot}`;
  return (
    <div className="relative">
      <span className={labelClass}>{label}</span>
      <div className="relative flex min-h-[118px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#0F3C66]/25 bg-gradient-to-b from-slate-50/90 to-white px-3 py-4 transition hover:border-[#0F3C66]/45 hover:bg-slate-50/80">
        <input
          id={inputId}
          type="file"
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

export function CommercialChamber() {
  const [commercials, setCommercials] = useState<CommercialChamberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewRecord, setViewRecord] = useState<CommercialChamberRecord | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState('');
  const [clientsList, setClientsList] = useState<ClientRecord[]>([]);
  const [formClientId, setFormClientId] = useState('');
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();

  const [documents, setDocuments] = useState<Record<CommercialDocSlot, File | null>>(() =>
    emptyCommercialDocuments()
  );

  const setDocumentForSlot = (slot: CommercialDocSlot, file: File | null) => {
    setDocuments(prev => ({ ...prev, [slot]: file }));
  };

  const [formData, setFormData] = useState({
    client_name: '',
    responsible: '',
    commercial_invoice_no: '',
    commercial_invoice_date: '',
    purchase_order_no: '',
    purchase_order_date: '',
    chamber_service_amount: '',
    quantity: '',
    unit_price: '',
    percentage: '',
    goods_description: '',
    service_charge: '',
    tell: '',
    timno: '',
    bank_commission_fee: '',
    transport_dhl: '',
    total: '',
    certificate_fee: '',
  });

  useEffect(() => {
    loadCommercials();
    (async () => {
      try {
        setClientsList(await fetchClients());
      } catch (e) {
        console.error('Error loading clients:', e);
      }
    })();
  }, []);

  const loadCommercials = async () => {
    try {
      const data = await fetchCommercialChambers();
      setCommercials(data || []);
    } catch (error) {
      console.error('Error loading commercials:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildPayload = () => ({
    ...formData,
    chamber_service_amount: parseFloat(formData.chamber_service_amount) || 0,
    quantity: parseFloat(formData.quantity) || 0,
    unit_price: parseFloat(formData.unit_price) || 0,
    percentage: parseFloat(formData.percentage) || 0,
    service_charge: parseFloat(formData.service_charge) || 0,
    bank_commission_fee: parseFloat(formData.bank_commission_fee) || 0,
    transport_dhl: parseFloat(formData.transport_dhl) || 0,
    total: parseFloat(formData.total) || 0,
    certificate_fee: parseFloat(formData.certificate_fee) || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    try {
      const payload = buildPayload();
      if (editingId) {
        await updateCommercialChamber(editingId, payload);
      } else {
        await createCommercialChamber(payload);
      }

      setShowModal(false);
      setCurrentStep(1);
      setEditingId(null);
      resetForm();
      await loadCommercials();
    } catch (error: unknown) {
      console.error('Error saving commercial:', error);
      alert((error as Error).message || 'Error saving commercial');
    }
  };

  const handleDelete = async (record: CommercialChamberRecord) => {
    const total = record.total ?? 0;
    const baseMsg =
      total > 0
        ? `Le dossier ${record.commercial_no} a un total de ${formatAmount(total)}. La suppression est définitive et irréversible.`
        : `Supprimer définitivement le dossier ${record.commercial_no} ?`;
    if (!confirm(`${baseMsg}\n\nConfirmer la suppression ?`)) return;
    if (total > 0) {
      if (!confirm('Dernière confirmation : voulez-vous vraiment supprimer cet enregistrement ?')) return;
    }

    try {
      await deleteCommercialChamber(record.id);
      await loadCommercials();
    } catch (error: unknown) {
      console.error('Error deleting commercial:', error);
      alert((error as Error).message || 'Error deleting commercial');
    }
  };

  const openCreate = () => {
    setEditingId(null);
    resetForm();
    setCurrentStep(1);
    setShowModal(true);
  };

  const openEdit = (record: CommercialChamberRecord) => {
    setEditingId(record.id);
    setFormData(recordToFormData(record));
    const match = clientsList.find((c) => formatClientLabel(c) === record.client_name || c.name === record.client_name);
    setFormClientId(match?.id || '');
    setDocuments(emptyCommercialDocuments());
    setCurrentStep(1);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormClientId('');
    setFormData({
      client_name: '',
      responsible: '',
      commercial_invoice_no: '',
      commercial_invoice_date: '',
      purchase_order_no: '',
      purchase_order_date: '',
      chamber_service_amount: '',
      quantity: '',
      unit_price: '',
      percentage: '',
      goods_description: '',
      service_charge: '',
      tell: '',
      timno: '',
      bank_commission_fee: '',
      transport_dhl: '',
      total: '',
      certificate_fee: '',
    });
    setDocuments(emptyCommercialDocuments());
  };

  const filteredCommercials = commercials.filter(comm => {
    const searchMatch =
      comm.commercial_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comm.goods_description &&
        comm.goods_description.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!searchMatch) return false;
    if (!selectedClient) return true;
    const c = clientsList.find(x => x.id === selectedClient);
    if (!c) return false;
    const label = formatClientLabel(c);
    return (
      comm.client_name === label ||
      comm.client_name === c.name ||
      (comm.client_name && c.name && comm.client_name.includes(c.name))
    );
  });

  const totalFiltered = filteredCommercials.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / Math.max(1, entriesPerPage)));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedCommercials = filteredCommercials.slice(startIndex, startIndex + entriesPerPage);
  const endIndex = Math.min(startIndex + paginatedCommercials.length, totalFiltered);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClient, entriesPerPage]);

  useEffect(() => {
    setCurrentPage(p => Math.min(p, totalPages));
  }, [totalPages, totalFiltered]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">{t('common.loading')}</div>;
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] space-y-6 bg-gradient-to-b from-slate-50 to-white px-1 pb-8 sm:px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0F3C66] text-white shadow-md shadow-[#0F3C66]/25">
            <Briefcase size={24} strokeWidth={1.5} aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F3C66]">{t('commercial.title')}</h1>
            <p className="mt-0.5 text-sm text-gray-500">{t('commercial.pageSubtitle')}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0F3C66] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0F3C66]/20 transition hover:bg-[#152a44]"
          >
            <Plus size={20} />
            {t('common.addNew')}
          </button>
          <button
            type="button"
            onClick={() => void openCommercialListPrint(filteredCommercials)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#EE964C] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-200/60 transition hover:bg-[#d35400]"
          >
            <Printer size={20} />
            {t('commercial.print')}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-lg shadow-gray-200/50">
        <div className="border-b border-gray-100 bg-slate-50/80 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-1.5 sm:min-w-[240px]">
              <label className={labelClass}>{t('commercial.client')} *</label>
              <select
                value={selectedClient}
                onChange={e => setSelectedClient(e.target.value)}
                className={inputClass + ' max-w-md'}
              >
                <option value="">{t('clients.selectClient')}</option>
                {clientsList?.map(c => (
                  <option key={c.id} value={c.id}>
                    {formatClientLabel(c)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{t('common.show')}</span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={entriesPerPage}
                  onChange={e => setEntriesPerPage(Math.max(1, Number(e.target.value) || 10))}
                  className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-center text-sm shadow-sm"
                />
                <span className="text-sm text-gray-600">{t('common.entries')}</span>
              </div>
              <div className="relative min-w-[200px] flex-1 lg:min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={inputClass + ' pl-9'}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-[#0F3C66] to-[#154b8a] text-left text-xs font-bold uppercase tracking-wider text-white">
                <th className="whitespace-nowrap px-4 py-3.5">#</th>
                <th className="whitespace-nowrap px-4 py-3.5">{t('commercial.client')}</th>
                <th className="whitespace-nowrap px-4 py-3.5">{t('commercial.responsible')}</th>
                <th className="min-w-[120px] px-4 py-3.5">{t('commercial.goodsDescription')}</th>
                <th className="whitespace-nowrap px-4 py-3.5 text-right">{t('commercial.servicesTotal')}</th>
                <th className="whitespace-nowrap px-4 py-3.5 text-right">{t('commercial.serviceCharge')}</th>
                <th className="whitespace-nowrap px-4 py-3.5 text-right">{t('commercial.bankFee')}</th>
                <th className="whitespace-nowrap px-4 py-3.5 text-right">{t('commercial.transport')}</th>
                <th className="whitespace-nowrap px-4 py-3.5 text-right">{t('commercial.total')}</th>
                <th className="whitespace-nowrap px-4 py-3.5 text-center">{t('commercial.createdBy')}</th>
                <th className="whitespace-nowrap px-4 py-3.5 text-center">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {totalFiltered === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-14 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                paginatedCommercials?.map((commercial, idx) => (
                  <tr
                    key={commercial.id}
                    className={`transition hover:bg-[#0F3C66]/[0.04] ${idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-700">{commercial.commercial_no}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 font-medium text-gray-900" title={commercial.client_name}>
                      {commercial.client_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{commercial.responsible || 'N/A'}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-gray-600">{commercial.goods_description || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-800">{formatAmount(commercial.chamber_service_amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-800">{formatAmount(commercial.service_charge)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-800">{formatAmount(commercial.bank_commission_fee)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-800">{formatAmount(commercial.transport_dhl)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-base font-bold tabular-nums text-[#0F3C66]">{formatAmount(commercial.total)}</td>
                    <td className="px-4 py-3 text-center text-gray-400">—</td>
                    <td className="px-4 py-3 text-center">
                      <ActionMenu
                        actions={[
                          {
                            label: t('common.view'),
                            icon: <Eye size={16} />,
                            onClick: () => setViewRecord(commercial),
                          },
                          {
                            label: t('common.edit'),
                            icon: <Edit2 size={16} />,
                            onClick: () => openEdit(commercial),
                          },
                          {
                            label: t('commercial.print'),
                            icon: <Printer size={16} />,
                            onClick: () => void openCommercialDetailPrint(commercial),
                          },
                          {
                            label: t('common.delete'),
                            icon: <Trash2 size={16} />,
                            onClick: () => void handleDelete(commercial),
                            variant: 'danger',
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {totalFiltered > 0 && (
              <tfoot>
                <tr className="border-t-2 border-[#0F3C66]/20 bg-gradient-to-r from-slate-100/90 to-slate-50/90 text-[#0F3C66]">
                  <td colSpan={4} className="px-4 py-3 text-sm font-bold uppercase tracking-wide">
                    Total
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold tabular-nums">
                    {formatAmount(filteredCommercials.reduce((sum, c) => sum + c.chamber_service_amount, 0))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold tabular-nums">
                    {formatAmount(filteredCommercials.reduce((sum, c) => sum + c.service_charge, 0))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold tabular-nums">
                    {formatAmount(filteredCommercials.reduce((sum, c) => sum + c.bank_commission_fee, 0))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold tabular-nums">
                    {formatAmount(filteredCommercials.reduce((sum, c) => sum + c.transport_dhl, 0))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold tabular-nums">
                    {formatAmount(filteredCommercials.reduce((sum, c) => sum + c.total, 0))}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-gray-600">
            {totalFiltered === 0
              ? '—'
              : `${t('common.showing')} ${startIndex + 1} ${t('common.to')} ${endIndex} ${t('common.of')} ${totalFiltered} ${t('common.entries')}`}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('commercial.previous')}
            </button>
            <span className="min-w-[3rem] text-center text-sm font-semibold text-[#0F3C66]">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('commercial.next')}
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        size="xxl"
        onClose={() => {
          setShowModal(false);
          setCurrentStep(1);
          setEditingId(null);
          resetForm();
        }}
        title={editingId ? t('commercial.editEntry') : t('commercial.addUpdate')}
      >
        <div className="flex flex-col">
          <div className="border-b border-gray-100 bg-gray-50/90 -mx-6 px-6 py-4 mb-4">
            <div className="mx-auto flex max-w-md items-center justify-between gap-2">
              <div className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${currentStep === 1 ? 'bg-[#0F3C66] text-white shadow-md' : 'bg-emerald-100 text-emerald-800'
                    }`}
                >
                  1
                </div>
                <span className="text-center text-xs font-medium text-gray-600">{t('commercial.step1Label')}</span>
              </div>
              <div className="h-0.5 flex-1 rounded bg-gray-200" />
              <div className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${currentStep === 2 ? 'bg-[#0F3C66] text-white shadow-md' : 'bg-gray-200 text-gray-500'
                    }`}
                >
                  2
                </div>
                <span className="text-center text-xs font-medium text-gray-600">{t('commercial.step2Label')}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="py-2">
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                  <div>
                    <FormLabel>
                      {t('commercial.client')} *
                    </FormLabel>
                    <FormSelect
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
                      className="tabular-nums"
                      required
                    >
                      <option value="">{t('clients.selectClient')}</option>
                      {clientsList?.map(c => (
                        <option key={c.id} value={c.id}>
                          {formatClientLabel(c)}
                        </option>
                      ))}
                    </FormSelect>
                  </div>

                  <div>
                    <FormLabel>
                      {t('commercial.responsible')}
                    </FormLabel>
                    <FormInput
                      type="text"
                      value={formData.responsible}
                      onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                      placeholder={t('commercial.responsiblePlaceholder')}
                    />
                  </div>

                  <div>
                    <FormLabel>
                      {t('commercial.commercialInvoiceNo')}
                    </FormLabel>
                    <FormInput
                      type="text"
                      value={formData.commercial_invoice_no}
                      onChange={(e) => setFormData({ ...formData, commercial_invoice_no: e.target.value })}
                      className="tabular-nums"
                      placeholder="e.g. INV-2024-001"
                    />
                  </div>
                  <div>
                    <FormLabel>
                      {t('commercial.commercialInvoiceDate')}
                    </FormLabel>
                    <FormInput
                      type="date"
                      value={formData.commercial_invoice_date}
                      onChange={(e) => setFormData({ ...formData, commercial_invoice_date: e.target.value })}
                      className="tabular-nums"
                    />
                  </div>

                  <div>
                    <FormLabel>
                      {t('commercial.purchaseOrderNo')}
                    </FormLabel>
                    <FormInput
                      type="text"
                      value={formData.purchase_order_no}
                      onChange={(e) => setFormData({ ...formData, purchase_order_no: e.target.value })}
                      className="tabular-nums"
                      placeholder="e.g. PO-98745"
                    />
                  </div>
                  <div>
                    <FormLabel>
                      {t('commercial.purchaseOrderDate')}
                    </FormLabel>
                    <FormInput
                      type="date"
                      value={formData.purchase_order_date}
                      onChange={(e) => setFormData({ ...formData, purchase_order_date: e.target.value })}
                      className="tabular-nums"
                    />
                  </div>

                  <div>
                    <FormLabel>
                      {t('commercial.chamberServiceAmount')} *
                    </FormLabel>
                    <FormInput
                      type="number"
                      step="0.01"
                      value={formData.chamber_service_amount}
                      onChange={(e) => setFormData({ ...formData, chamber_service_amount: e.target.value })}
                      className="tabular-nums"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <FormLabel>
                      {t('commercial.quantity')}
                    </FormLabel>
                    <FormInput
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="tabular-nums"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <FormLabel>
                      {t('commercial.unitPrice')}
                    </FormLabel>
                    <FormInput
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                      className="tabular-nums"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <FormLabel>
                      {t('commercial.percentage')}
                    </FormLabel>
                    <FormInput
                      type="number"
                      step="0.01"
                      value={formData.percentage}
                      onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                      className="tabular-nums"
                      placeholder="0"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <FormLabel>
                      {t('commercial.goodsDescription')}
                    </FormLabel>
                    <FormInput
                      type="text"
                      value={formData.goods_description}
                      onChange={(e) => setFormData({ ...formData, goods_description: e.target.value })}
                      placeholder="Ex. Electronics, sucre…"
                    />
                  </div>
                  <div>
                    <FormLabel>
                      {t('commercial.serviceCharge')} *
                    </FormLabel>
                    <FormInput
                      type="number"
                      step="0.01"
                      value={formData.service_charge}
                      onChange={(e) => setFormData({ ...formData, service_charge: e.target.value })}
                      className="tabular-nums"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <FormLabel>
                      {t('commercial.tell')} *
                    </FormLabel>
                    <FormInput
                      type="text"
                      value={formData.tell}
                      onChange={(e) => setFormData({ ...formData, tell: e.target.value })}
                      className="tabular-nums"
                      placeholder="+253 77..."
                      required
                    />
                  </div>
                  <div>
                    <FormLabel>
                      {t('commercial.timno')} *
                    </FormLabel>
                    <FormInput
                      type="text"
                      value={formData.timno}
                      onChange={(e) => setFormData({ ...formData, timno: e.target.value })}
                      className="tabular-nums"
                      placeholder="e.g. 12345"
                      required
                    />
                  </div>
                  <div>
                    <FormLabel>
                      {t('commercial.bankFee')} *
                    </FormLabel>
                    <FormInput
                      type="number"
                      step="0.01"
                      value={formData.bank_commission_fee}
                      onChange={(e) => setFormData({ ...formData, bank_commission_fee: e.target.value })}
                      className="tabular-nums"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <FormLabel>
                      {t('commercial.transport')} *
                    </FormLabel>
                    <FormInput
                      type="number"
                      step="0.01"
                      value={formData.transport_dhl}
                      onChange={(e) => setFormData({ ...formData, transport_dhl: e.target.value })}
                      className="tabular-nums"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <FormLabel>
                      {t('commercial.total')}
                    </FormLabel>
                    <FormInput
                      type="number"
                      step="0.01"
                      value={formData.total}
                      onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                      className="tabular-nums"
                      placeholder="0.00"
                    />
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
                      <p className="text-sm leading-relaxed text-amber-950">{t('commercial.optionalDocumentsNote')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <CommercialChamberFileSlot
                      slot="customerDocument"
                      label={t('commercial.customerDocument')}
                      file={documents.customerDocument}
                      onChange={setDocumentForSlot}
                      t={t}
                    />
                    <CommercialChamberFileSlot
                      slot="chamberDocument"
                      label={t('commercial.chamberDocument')}
                      file={documents.chamberDocument}
                      onChange={setDocumentForSlot}
                      t={t}
                    />

                    <CommercialChamberFileSlot
                      slot="chamberInvoice"
                      label={t('commercial.chamberInvoice')}
                      file={documents.chamberInvoice}
                      onChange={setDocumentForSlot}
                      t={t}
                    />
                    <CommercialChamberFileSlot
                      slot="commercialInvoice"
                      label={t('commercial.commercialInvoice')}
                      file={documents.commercialInvoice}
                      onChange={setDocumentForSlot}
                      t={t}
                    />

                    <CommercialChamberFileSlot
                      slot="packingList"
                      label={t('commercial.packingList')}
                      file={documents.packingList}
                      onChange={setDocumentForSlot}
                      t={t}
                    />
                    <CommercialChamberFileSlot
                      slot="truckWayBill"
                      label={t('commercial.truckWayBill')}
                      file={documents.truckWayBill}
                      onChange={setDocumentForSlot}
                      t={t}
                    />

                    <CommercialChamberFileSlot
                      slot="originalCertificate"
                      label={t('commercial.originalCertificate')}
                      file={documents.originalCertificate}
                      onChange={setDocumentForSlot}
                      t={t}
                    />
                  </div>

                  <div className="max-w-md">
                    <FormLabel>
                      {t('commercial.certificateFee')}
                    </FormLabel>
                    <FormInput
                      type="number"
                      step="0.01"
                      value={formData.certificate_fee}
                      onChange={(e) => setFormData({ ...formData, certificate_fee: e.target.value })}
                      className="tabular-nums"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 bg-slate-50/90 -mx-6 px-6 py-4 mt-6">
              {currentStep === 2 ? (
                <SecondaryButton
                  type="button"
                  onClick={() => setCurrentStep(1)}
                >
                  {t('commercial.previous')}
                </SecondaryButton>
              ) : (
                <span />
              )}
              {currentStep === 1 ? (
                <PrimaryButton
                  type="submit"
                >
                  {t('commercial.next')}
                </PrimaryButton>
              ) : (
                <PrimaryButton
                  type="submit"
                >
                  {t('commercial.finish')}
                </PrimaryButton>
              )}
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={!!viewRecord}
        size="lg"
        onClose={() => setViewRecord(null)}
        title={viewRecord ? `${t('commercial.title')} — ${viewRecord.commercial_no}` : ''}
      >
        {viewRecord && (
          <div className="flex flex-col space-y-6 overflow-hidden">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Section: Stakeholder Info */}
              <div className="space-y-4 rounded-2xl border border-gray-100 bg-slate-50/50 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-[#0F3C66]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F3C66]/10">
                    <Briefcase size={18} />
                  </div>
                  <h3 className="font-bold uppercase tracking-wider text-xs">{t('commercial.client')}</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <dt className={labelClass}>{t('commercial.client')}</dt>
                    <dd className="text-base font-semibold text-gray-900">{viewRecord.client_name}</dd>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className={labelClass}>{t('commercial.responsible')}</dt>
                      <dd className="font-medium text-gray-800">{viewRecord.responsible || '—'}</dd>
                    </div>
                    <div>
                      <dt className={labelClass}>{t('commercial.tell')}</dt>
                      <dd className="font-medium text-gray-800 tracking-wider tabular-nums">{viewRecord.tell || '—'}</dd>
                    </div>
                  </div>
                  <div>
                    <dt className={labelClass}>TIM NO</dt>
                    <dd className="font-medium text-gray-800 tabular-nums uppercase">{viewRecord.timno || '—'}</dd>
                  </div>
                </div>
              </div>

              {/* Section: Reference Documents */}
              <div className="space-y-4 rounded-2xl border border-gray-100 bg-slate-50/50 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-[#0F3C66]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F3C66]/10">
                    <FileText size={18} />
                  </div>
                  <h3 className="font-bold uppercase tracking-wider text-xs">Reference Documents</h3>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className={labelClass}>{t('commercial.commercialInvoiceNo')}</dt>
                      <dd className="font-medium text-[#0F3C66] tabular-nums font-mono text-xs uppercase">{viewRecord.commercial_invoice_no || '—'}</dd>
                    </div>
                    <div>
                      <dt className={labelClass}>{t('commercial.commercialInvoiceDate')}</dt>
                      <dd className="font-medium text-gray-800 tabular-nums">
                        {viewRecord.commercial_invoice_date?.substring(0, 10).split('-').reverse().join('/') || '—'}
                      </dd>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
                    <div>
                      <dt className={labelClass}>{t('commercial.purchaseOrderNo')}</dt>
                      <dd className="font-medium text-[#0F3C66] tabular-nums font-mono text-xs uppercase">{viewRecord.purchase_order_no || '—'}</dd>
                    </div>
                    <div>
                      <dt className={labelClass}>{t('commercial.purchaseOrderDate')}</dt>
                      <dd className="font-medium text-gray-800 tabular-nums">
                        {viewRecord.purchase_order_date?.substring(0, 10).split('-').reverse().join('/') || '—'}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Description */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <dt className={labelClass}>{t('commercial.goodsDescription')}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-gray-700 font-medium italic underline decoration-blue-100 underline-offset-4">
                &ldquo;{viewRecord.goods_description || '—'}&rdquo;
              </dd>
              <div className="mt-4 flex flex-wrap gap-4 border-t border-gray-50 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-tight">{t('commercial.quantity')}:</span>
                  <span className="text-sm font-bold text-[#0F3C66]">{viewRecord.quantity || '0'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-tight">{t('commercial.unitPrice')}:</span>
                  <span className="text-sm font-bold text-[#0F3C66]">{formatAmount(viewRecord.unit_price || 0)}</span>
                </div>
              </div>
            </div>

            {/* Section: Financial Details */}
            <div className="rounded-2xl border border-[#0F3C66]/10 bg-white shadow-md overflow-hidden">
              <div className="bg-[#0F3C66] px-5 py-3 text-white">
                <h3 className="text-sm font-bold uppercase tracking-wider">{t('commercial.servicesTotal')} Breakdown</h3>
              </div>
              <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 font-medium">{t('commercial.chamberServiceAmount')}</span>
                    <span className="font-semibold text-gray-900 tabular-nums">{formatAmount(viewRecord.chamber_service_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 font-medium">{t('commercial.serviceCharge')}</span>
                    <span className="font-semibold text-gray-900 tabular-nums">{formatAmount(viewRecord.service_charge)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 font-medium">{t('commercial.bankFee')}</span>
                    <span className="font-semibold text-gray-900 tabular-nums">{formatAmount(viewRecord.bank_commission_fee)}</span>
                  </div>
                </div>
                <div className="p-4 space-y-3 bg-slate-50/30">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 font-medium">{t('commercial.transport')} (DHL)</span>
                    <span className="font-semibold text-gray-900 tabular-nums">{formatAmount(viewRecord.transport_dhl)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 font-medium">{t('commercial.certificateFee')}</span>
                    <span className="font-semibold text-gray-900 tabular-nums">{formatAmount(viewRecord.certificate_fee)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-sm font-bold text-[#0F3C66] uppercase tracking-tight">{t('commercial.total')}</span>
                    <span className="text-xl font-black text-[#0F3C66] tabular-nums tracking-tighter">
                      {formatAmount(viewRecord.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 bg-slate-50/90 -mx-6 px-6 py-4 mt-2">
              <SecondaryButton
                type="button"
                onClick={() => setViewRecord(null)}
                className="px-6"
              >
                {t('common.cancel')}
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={() => void openCommercialDetailPrint(viewRecord)}
                className="inline-flex items-center gap-2 group transition-all"
              >
                <Printer size={18} className="group-hover:scale-110 transition-transform" />
                <span className="font-bold">{t('commercial.print')} Detail</span>
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>

      <div className="py-4 text-center text-sm text-gray-500">
        {t('common.copyright')}
      </div>
    </div>
  );
}


