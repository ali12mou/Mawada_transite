import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { listTransportationRecords, createTransportationRecord, listLogisticsFilesBrief } from '../../api/transitDb';
import type { TransportationRecord } from '../../types/geosomTransit';

export function TransportationModule() {
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
      alert('Sélectionnez un dossier (Job) obligatoire.');
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
      alert((e as Error).message || 'Erreur');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1e3a5f]">Gestion du transport</h1>
          <p className="text-sm text-gray-600">
            Chaque transport est lié à un dossier logistique existant (règle métier).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm text-white"
        >
          <Plus size={18} /> Nouveau transport
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Job N°</th>
              <th className="px-3 py-2 text-left">Conteneur</th>
              <th className="px-3 py-2 text-left">Camion</th>
              <th className="px-3 py-2 text-left">Type marchandise</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">État</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                  Chargement…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                  Aucun transport. Créez d’abord un dossier, puis un transport.
                </td>
              </tr>
            ) : (
              rows.map(r => (
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
            <h2 className="text-lg font-semibold text-[#1e3a5f]">Nouveau transport</h2>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-gray-600">Dossier (Job) *</span>
                <select
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={fileId}
                  onChange={e => setFileId(e.target.value)}
                >
                  <option value="">— Choisir —</option>
                  {files.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.job_number}
                    </option>
                  ))}
                </select>
              </label>
              {['container_number', 'truck_number', 'goods_type', 'transferred_date', 'state'].map(f => (
                <label key={f} className="block text-sm">
                  <span className="text-gray-600">{f.replace(/_/g, ' ')}</span>
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
                Annuler
              </button>
              <button type="button" className="rounded bg-[#e67e22] px-4 py-2 text-white" onClick={submit}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
