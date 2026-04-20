import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { listBulkTransportRecords, createBulkTransportRecord, listLogisticsFilesBrief } from '../../api/transitDb';
import type { BulkTransportRecord } from '../../types/geosomTransit';

export function BulkTransportModule() {
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
      setFiles(f.map(x => ({ id: x.id, job_number: x.job_number })));
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
      alert('Sélectionnez un dossier.');
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
      alert((e as Error).message || 'Erreur');
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#1e3a5f]">Transport en vrac</h1>
            <p className="text-sm text-gray-600">Même logique que le transport standard, filière vrac.</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm text-white"
          >
            <Plus size={18} /> Nouveau
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Job N°</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">État</th>
                <th className="px-3 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center">
                    Chargement…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">
                    Aucune ligne.
                  </td>
                </tr>
              ) : (
                rows.map(r => (
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
              <h2 className="text-lg font-semibold">Transport vrac</h2>
              <label className="mt-4 block text-sm">
                Dossier *
                <select
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={fileId}
                  onChange={e => setFileId(e.target.value)}
                >
                  <option value="">—</option>
                  {files.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.job_number}
                    </option>
                  ))}
                </select>
              </label>
              {['goods_type', 'state', 'transferred_date'].map(f => (
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
                  Fermer
                </button>
                <button type="button" className="rounded bg-[#e67e22] px-4 py-2 text-white" onClick={submit}>
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
