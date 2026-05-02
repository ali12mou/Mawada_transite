import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { listTransportationRecords, createTransportationRecord, listLogisticsFilesBrief } from '../../api/transitDb';
import type { TransportationRecord } from '../../types/geosomTransit';

export function TransportationModule() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<TransportationRecord[]>([]);
  const [files, setFiles] = useState<{ id: string; job_number: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [fileId, setFileId] = useState('');
  const [form, setForm] = useState({
    container_number: '',
    truck_number: '',
    goods_type: '',
    transferred_date: '',
    state: 'planned',
  });

  const load = async () => {
    try {
      const [t, f] = await Promise.all([listTransportationRecords(), listLogisticsFilesBrief()]);
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
      await createTransportationRecord({
        logistics_file_id: fileId,
        job_number: f.job_number,
        customer_label: null,
        container_number: form.container_number || null,
        truck_number: form.truck_number || null,
        goods_type: form.goods_type || null,
        transferred_date: form.transferred_date || null,
        state: form.state,
        vehicle_id: null,
        driver_id: null,
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
          <h1 className="text-2xl font-semibold text-[#0F3C66]">{t('transit.transport.title')}</h1>
          <p className="text-sm text-gray-600">
            {t('transit.transport.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F3C66] px-4 py-2 text-sm text-white"
        >
          <Plus size={18} /> {t('transit.transport.addButton')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">{t('transit.transport.colJobNo')}</th>
              <th className="px-3 py-2 text-left">{t('transit.transport.colContainer')}</th>
              <th className="px-3 py-2 text-left">{t('transit.transport.colTruck')}</th>
              <th className="px-3 py-2 text-left">{t('transit.transport.colGoodsType')}</th>
              <th className="px-3 py-2 text-left">{t('transit.transport.colDate')}</th>
              <th className="px-3 py-2 text-left">{t('transit.transport.colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                  {t('transit.transport.empty')}
                </td>
              </tr>
            ) : (
              rows?.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono">{r.job_number}</td>
                  <td className="px-3 py-2">{r.container_number || '—'}</td>
                  <td className="px-3 py-2">{r.truck_number || '—'}</td>
                  <td className="px-3 py-2">{r.goods_type || '—'}</td>
                  <td className="px-3 py-2">{r.transferred_date || '—'}</td>
                  <td className="px-3 py-2">{r.state}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[#0F3C66]">{t('transit.transport.modalTitleAdd')}</h2>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-gray-600">{t('transit.transport.fieldJob')}</span>
                <select
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={fileId}
                  onChange={e => setFileId(e.target.value)}
                >
                  <option value="">{t('transit.transport.selectJob')}</option>
                  {files?.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.job_number}
                    </option>
                  ))}
                </select>
              </label>
              {['container_number', 'truck_number', 'goods_type', 'transferred_date', 'state'].map(f => (
                <label key={f} className="block text-sm">
                  <span className="text-gray-600">{t(`transit.logisticsFiles.field${f.split('_')?.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')}`) || f.replace(/_/g, ' ')}</span>
                  <input
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={(form as Record<string, string>)[f] || ''}
                    onChange={e => setForm({ ...form, [f]: e.target.value })}
                  />
                </label>
              ))}
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


