import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { appConfirm } from '../../lib/appConfirm';
import { useCrudToast } from '../../hooks/useCrudToast';
import { Edit2, Trash2, Plus, Printer, FileText, Search } from 'lucide-react';
import { ActionMenu } from '../Shared/common/ActionMenu';
import Modal from '../Shared/common/Modal';
import { genericApi } from '../../api/genericApi';
import { fetchClients, type ClientRecord } from '../../api/clientsApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatClientLabel } from '../../lib/clientLabel';
import { parseLocalizedNumber } from '../../lib/commercialChamberCalculations';
import { openApplicantInvoicePrint } from '../../lib/applicantInvoicePrintHtml';

const COLLECTION = 'applicant_invoices';

export type ApplicantInvoiceRecord = {
  id?: string;
  _id?: string;
  phone: string;
  address: string;
  invoice_no: string;
  invoice_date: string;
  seller: string;
  buyer: string;
  description_of_goods: string;
  hs_code: string;
  origin: string;
  quantity: string;
  unit_price_djf: string;
  total_djf: string;
  created_at?: string;
};

type GoodsCategory = { id?: string; _id?: string; name: string };

function rowId(row: ApplicantInvoiceRecord): string {
  const raw = row.id || row._id;
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && raw !== null && '$oid' in raw) {
    return String((raw as { $oid: string }).$oid);
  }
  return String(raw);
}

function numStr(v: unknown): string {
  if (v == null || v === '') return '';
  return String(v);
}

function computeTotalDjf(quantity: string, unitPrice: string): string {
  const q = parseLocalizedNumber(quantity);
  const p = parseLocalizedNumber(unitPrice);
  if (!q && !p) return '';
  return String(Math.round(q * p * 100) / 100);
}

function fmtDjf(v: string | number | undefined | null): string {
  const n = parseLocalizedNumber(v);
  if (!Number.isFinite(n) || (!n && String(v ?? '').trim() === '')) return '—';
  return `${n.toLocaleString('fr-FR')} DJF`;
}

const emptyForm = (): Omit<ApplicantInvoiceRecord, 'id' | '_id' | 'created_at'> => ({
  phone: '',
  address: '',
  invoice_no: '',
  invoice_date: new Date().toISOString().split('T')[0],
  seller: '',
  buyer: '',
  description_of_goods: '',
  hs_code: '',
  origin: '',
  quantity: '',
  unit_price_djf: '',
  total_djf: '',
});

const labelClass = 'mb-1 block text-xs font-bold uppercase tracking-wide text-gray-700';
const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#0F3C66] focus:ring-4 focus:ring-[#0F3C66]/10';

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

export function ApplicantInvoice() {
  const { t } = useLanguage();
  const crudToast = useCrudToast();
  const [rows, setRows] = useState<ApplicantInvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm());
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [goodsCategories, setGoodsCategories] = useState<GoodsCategory[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await genericApi.list<ApplicantInvoiceRecord>(COLLECTION);
      setRows(data || []);
    } catch (error) {
      console.error('Error fetching applicant invoices:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!showModal) return;
    (async () => {
      try {
        const [clientsData, categories] = await Promise.all([
          fetchClients(),
          genericApi.list<GoodsCategory>('product_categories'),
        ]);
        setClients(clientsData || []);
        setGoodsCategories(categories || []);
      } catch (error) {
        console.error('Error loading applicant invoice lists:', error);
      }
    })();
  }, [showModal]);

  const descriptionOptions = useMemo(() => {
    const names = goodsCategories.map((c) => c.name).filter(Boolean);
    if (formData.description_of_goods && !names.includes(formData.description_of_goods)) {
      return [formData.description_of_goods, ...names];
    }
    return names;
  }, [goodsCategories, formData.description_of_goods]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter(
      (r) =>
        r.seller?.toLowerCase().includes(q) ||
        r.buyer?.toLowerCase().includes(q) ||
        r.description_of_goods?.toLowerCase().includes(q) ||
        r.hs_code?.toLowerCase().includes(q) ||
        r.origin?.toLowerCase().includes(q) ||
        r.invoice_no?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q)
    );
  }, [rows, searchTerm]);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm());
    setShowModal(true);
  };

  const openEdit = (row: ApplicantInvoiceRecord) => {
    setEditingId(rowId(row));
    setFormData({
      phone: row.phone || '',
      address: row.address || '',
      invoice_no: row.invoice_no || '',
      invoice_date: row.invoice_date || '',
      seller: row.seller || '',
      buyer: row.buyer || '',
      description_of_goods: row.description_of_goods || '',
      hs_code: row.hs_code || '',
      origin: row.origin || '',
      quantity: numStr(row.quantity),
      unit_price_djf: numStr(row.unit_price_djf),
      total_djf: numStr(row.total_djf) || computeTotalDjf(numStr(row.quantity), numStr(row.unit_price_djf)),
    });
    setShowModal(true);
  };

  const patchForm = (patch: Partial<typeof formData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...patch };
      if ('quantity' in patch || 'unit_price_djf' in patch) {
        next.total_djf = computeTotalDjf(next.quantity, next.unit_price_djf);
      }
      return next;
    });
  };

  const onBuyerChange = (buyerLabel: string) => {
    const client = clients.find((c) => formatClientLabel(c) === buyerLabel);
    setFormData((prev) => ({
      ...prev,
      buyer: buyerLabel,
      phone: client?.phone || prev.phone,
      address: client?.address || prev.address,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      total_djf: computeTotalDjf(formData.quantity, formData.unit_price_djf) || formData.total_djf,
    };
    try {
      if (editingId) {
        await genericApi.update(COLLECTION, editingId, payload);
      } else {
        await genericApi.create(COLLECTION, payload);
      }
      crudToast.onSaved(!!editingId);
      setShowModal(false);
      setEditingId(null);
      setFormData(emptyForm());
      await load();
    } catch (error) {
      crudToast.onError(error);
      console.error('Error saving applicant invoice:', error);
    }
  };

  const handleDelete = async (row: ApplicantInvoiceRecord) => {
    if (!(await appConfirm(t('applicantInvoice.deleteConfirm')))) return;
    try {
      await genericApi.delete(COLLECTION, rowId(row));
      crudToast.onDeleted();
      await load();
    } catch (error) {
      crudToast.onError(error, 'common.errorDeleting');
      console.error('Error deleting applicant invoice:', error);
    }
  };

  const handlePrint = (row: ApplicantInvoiceRecord) => {
    void openApplicantInvoicePrint({
      invoice_no: row.invoice_no,
      invoice_date: row.invoice_date,
      seller: row.seller,
      buyer: row.buyer,
      phone: row.phone,
      address: row.address,
      description_of_goods: row.description_of_goods,
      hs_code: row.hs_code,
      origin: row.origin,
      quantity: row.quantity,
      unit_price_djf: row.unit_price_djf,
      total_djf: row.total_djf,
    });
  };

  const thClass =
    'border border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-700';

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">{t('common.loading')}</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileText size={22} className="text-[#0F3C66]" />
          <h2 className="text-xl font-bold tracking-tight text-gray-800">
            {t('applicantInvoice.title')}
          </h2>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#1d4ed8] active:scale-95"
        >
          <Plus size={16} />
          {t('applicantInvoice.addNew')}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/40">
        <div className="flex flex-wrap items-center justify-end gap-3 border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <label htmlFor="applicant-search" className="font-semibold">
              {t('common.search')}:
            </label>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="applicant-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-56 rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#0F3C66] focus:ring-2 focus:ring-[#0F3C66]/20"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse">
            <thead>
              <tr>
                <th className={thClass}>#</th>
                <th className={thClass}>{t('applicantInvoice.colSeller')}</th>
                <th className={thClass}>{t('applicantInvoice.colBuyer')}</th>
                <th className={thClass}>{t('applicantInvoice.colDescription')}</th>
                <th className={thClass}>{t('applicantInvoice.colHsCode')}</th>
                <th className={thClass}>{t('applicantInvoice.colOrigin')}</th>
                <th className={thClass}>{t('applicantInvoice.colQuantity')}</th>
                <th className={thClass}>{t('applicantInvoice.colUnitPrice')}</th>
                <th className={thClass}>{t('applicantInvoice.colTotal')}</th>
                <th className={`${thClass} text-center`}>{t('common.action')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                    {t('applicantInvoice.empty')}
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr key={rowId(row) || idx} className="hover:bg-[#0F3C66]/5">
                    <td className="border border-gray-100 px-3 py-2.5 text-sm text-gray-500">{idx + 1}</td>
                    <td className="border border-gray-100 px-3 py-2.5 text-sm font-medium text-gray-900">{row.seller || '—'}</td>
                    <td className="border border-gray-100 px-3 py-2.5 text-sm text-gray-800">{row.buyer || '—'}</td>
                    <td className="border border-gray-100 px-3 py-2.5 text-sm text-gray-800">{row.description_of_goods || '—'}</td>
                    <td className="border border-gray-100 px-3 py-2.5 text-sm font-mono text-gray-700">{row.hs_code || '—'}</td>
                    <td className="border border-gray-100 px-3 py-2.5 text-sm text-gray-700">{row.origin || '—'}</td>
                    <td className="border border-gray-100 px-3 py-2.5 text-sm text-gray-700">{row.quantity || '—'}</td>
                    <td className="border border-gray-100 px-3 py-2.5 text-sm text-gray-800">{fmtDjf(row.unit_price_djf)}</td>
                    <td className="border border-gray-100 px-3 py-2.5 text-sm font-semibold text-[#0F3C66]">{fmtDjf(row.total_djf)}</td>
                    <td className="border border-gray-100 px-3 py-2.5 text-center">
                      <ActionMenu
                        actions={[
                          {
                            label: t('common.edit'),
                            icon: <Edit2 size={16} />,
                            onClick: () => openEdit(row),
                          },
                          {
                            label: t('common.delete'),
                            icon: <Trash2 size={16} />,
                            onClick: () => void handleDelete(row),
                            variant: 'danger',
                          },
                          {
                            label: t('performa.print'),
                            icon: <Printer size={16} />,
                            onClick: () => handlePrint(row),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingId(null);
          setFormData(emptyForm());
        }}
        title={t('applicantInvoice.addUpdate')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('applicantInvoice.colPhone')}>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => patchForm({ phone: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label={t('applicantInvoice.colAddress')}>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => patchForm({ address: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label={t('applicantInvoice.colInvoiceNo')}>
              <input
                type="text"
                value={formData.invoice_no}
                onChange={(e) => patchForm({ invoice_no: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label={t('applicantInvoice.colInvoiceDate')}>
              <input
                type="date"
                value={formData.invoice_date}
                onChange={(e) => patchForm({ invoice_date: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label={t('applicantInvoice.colSeller')}>
              <input
                type="text"
                value={formData.seller}
                onChange={(e) => patchForm({ seller: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label={t('applicantInvoice.colBuyer')}>
              <select
                value={formData.buyer}
                onChange={(e) => onBuyerChange(e.target.value)}
                className={inputClass}
              >
                <option value="">{t('applicantInvoice.selectBuyer')}</option>
                {clients.map((c) => {
                  const label = formatClientLabel(c);
                  return (
                    <option key={c.id} value={label}>
                      {label}
                    </option>
                  );
                })}
                {formData.buyer && !clients.some((c) => formatClientLabel(c) === formData.buyer) ? (
                  <option value={formData.buyer}>{formData.buyer}</option>
                ) : null}
              </select>
            </Field>

            <Field label={t('applicantInvoice.colDescription')}>
              <select
                value={formData.description_of_goods}
                onChange={(e) => patchForm({ description_of_goods: e.target.value })}
                className={inputClass}
              >
                <option value="">{t('applicantInvoice.selectDescription')}</option>
                {descriptionOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('applicantInvoice.colHsCode')}>
              <input
                type="text"
                value={formData.hs_code}
                onChange={(e) => patchForm({ hs_code: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label={t('applicantInvoice.colOrigin')}>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => patchForm({ origin: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label={t('applicantInvoice.colQuantity')}>
              <input
                type="text"
                value={formData.quantity}
                onChange={(e) => patchForm({ quantity: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label={t('applicantInvoice.colUnitPrice')}>
              <input
                type="text"
                value={formData.unit_price_djf}
                onChange={(e) => patchForm({ unit_price_djf: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label={t('applicantInvoice.colTotal')}>
              <input
                type="text"
                value={formData.total_djf}
                onChange={(e) => patchForm({ total_djf: e.target.value })}
                className={`${inputClass} font-semibold text-[#0F3C66]`}
              />
            </Field>
          </div>

          <div className="flex justify-between gap-3 border-t border-gray-100 pt-4">
            <button
              type="submit"
              className="rounded-xl bg-[#0F3C66] px-8 py-2.5 text-sm font-bold text-white hover:bg-[#154b8a]"
            >
              {t('common.save')}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingId(null);
                setFormData(emptyForm());
              }}
              className="rounded-xl bg-[#0F3C66] px-8 py-2.5 text-sm font-bold text-white hover:bg-[#154b8a]"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
