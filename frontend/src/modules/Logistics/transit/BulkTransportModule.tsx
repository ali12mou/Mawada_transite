import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { listBulkTransportRecords, createBulkTransportRecord, listLogisticsFilesBrief } from '../../../api/transitDb';
import type { BulkTransportRecord } from '../../../types/geosomTransit';

export function BulkTransportModule() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<BulkTransportRecord[]>([]);
  const [files, setFiles] = useState<{ id: string; job_number: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [fileId, setFileId] = useState('');
  const [form, setForm] = useState({ goods_type: 'bulk', state: 'planned', transferred_date: '' });

  const load = async () => {
    try {
      const [t, f] = await Promise.all([listBulkTransportRecords(), listLogisticsFilesBrief()]);
      setRows(t);
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
    if (!fileId) {
      alert(t('transit.transport.errorJobRequired'));
      return;
    }
    const f = files.find(x => x.id === fileId);
    if (!f) return;
    try {
      await createBulkTransportRecord({
        logistics_file_id: fileId,
        job_number: f.job_number,
        customer_label: null,
        vehicle_id: null,
        goods_type: form.goods_type,
        state: form.state,
        transferred_date: form.transferred_date || null,
      });
      setOpen(false);
      load();
    } catch (e: unknown) {
      alert((e as Error).message || t('common.errorSaving'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F3C66]">{t('transit.bulkTransport.title')}</h1>
          <p className="text-sm text-gray-600">{t('transit.bulkTransport.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F3C66] px-4 py-2 text-sm text-white"
        >
          <Plus size={18} /> {t('transit.bulkTransport.addButton')}
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">{t('transit.logisticsFiles.colJobNo')}</th>
              <th className="px-3 py-2 text-left">{t('transit.logisticsFiles.colType')}</th>
              <th className="px-3 py-2 text-left">{t('transit.logisticsFiles.colStatus')}</th>
              <th className="px-3 py-2 text-left">{t('transit.transport.colDate')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-6 text-center">
                  {t('common.loading')}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-500">
                  {t('transit.bulkTransport.emptyInfo')}
                </td>
              </tr>
            ) : (
              rows?.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="px-3 py-2 font-mono">{r.job_number}</td>
                  <td className="px-3 py-2">{r.goods_type}</td>
                  <td className="px-3 py-2">{r.state}</td>
                  <td className="px-3 py-2">{r.transferred_date || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">{t('transit.bulkTransport.modalTitle')}</h2>
            <label className="mt-4 block text-sm">
              {t('transit.bulkTransport.fieldDossier')}
              <select
                className="mt-1 w-full rounded border px-3 py-2"
                value={fileId}
                onChange={e => setFileId(e.target.value)}
              >
                <option value="">—</option>
                {files?.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.job_number}
                  </option>
                ))}
              </select>
            </label>
            {['goods_type', 'state', 'transferred_date']?.map(f => (
              <label key={f} className="mt-3 block text-sm">
                {f}
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={(form as Record<string, string>)[f] || ''}
                  onChange={e => setForm({ ...form, [f]: e.target.value })}
                />
              </label>
            ))}
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


