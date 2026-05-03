import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { listPurchaseRequests, createPurchaseRequest, listLogisticsFilesBrief, listVendors } from '../../../api/transitDb';
import type { PurchaseRequest } from '../../../types/geosomTransit';

export function PurchaseTransitModule() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [files, setFiles] = useState<{ id: string; job_number: string }[]>([]);
  const [form, setForm] = useState<Partial<PurchaseRequest>>({ status: 'rfq', currency: 'DJF' });

  const load = async () => {
    try {
      const [p, v, f] = await Promise.all([
        listPurchaseRequests(),
        listVendors() as Promise<{ id: string; name: string }[]>,
        listLogisticsFilesBrief(),
      ]);
      setRows(p);
      setVendors(v?.map(x => ({ id: x.id, name: x.name })));
      setFiles(f?.map(x => ({ id: x.id, job_number: x.job_number })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    const f = files.find(x => x.id === form.logistics_file_id);
    try {
      await createPurchaseRequest({
        ...form,
        vendor_id: form.vendor_id || null,
        logistics_file_id: form.logistics_file_id || null,
        job_number: f?.job_number || form.job_number || null,
      });
      setOpen(false);
      setForm({ status: 'rfq', currency: 'DJF' });
      load();
    } catch (e: unknown) {
      alert((e as Error).message || t('common.errorSaving'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F3C66]">{t('transit.purchases.title')}</h1>
          <p className="text-sm text-gray-600">{t('transit.purchases.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F3C66] px-4 py-2 text-sm text-white"
        >
          <Plus size={18} /> {t('transit.expenseRequests.addButton')}
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">{t('transit.purchases.colRef')}</th>
              <th className="px-3 py-2 text-left">{t('transit.expenseRequests.colJob')}</th>
              <th className="px-3 py-2 text-left">{t('transit.expenseRequests.colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="py-6 text-center">
                  {t('common.loading')}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-gray-500">
                  {t('transit.bulkTransport.emptyInfo')}
                </td>
              </tr>
            ) : (
              rows?.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="px-3 py-2 font-mono">{r.reference || '—'}</td>
                  <td className="px-3 py-2">{r.job_number || '—'}</td>
                  <td className="px-3 py-2">{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">{t('transit.purchases.modalTitle')}</h2>
            <div className="mt-4 space-y-3 text-sm">
              <label className="block">
                {t('transit.expenseRequests.fieldVendor')}
                <select
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.vendor_id || ''}
                  onChange={e => setForm({ ...form, vendor_id: e.target.value || undefined })}
                >
                  <option value="">—</option>
                  {vendors?.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                {t('transit.transport.fieldJob')}
                <select
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.logistics_file_id || ''}
                  onChange={e => setForm({ ...form, logistics_file_id: e.target.value || undefined })}
                >
                  <option value="">—</option>
                  {files?.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.job_number}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="rounded border px-4 py-2" onClick={() => setOpen(false)}>
                {t('common.cancel')}
              </button>
              <button type="button" className="rounded bg-[#EE964C] px-4 py-2 text-white" onClick={submit}>
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


