import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { listCarReservations, upsertCarReservation, listLogisticsFilesBrief, listVehicles } from '../../api/transitDb';
import type { CarReservation, TransitVehicle } from '../../types/geosomTransit';

export function CarReservationsModule() {
  const [rows, setRows] = useState<CarReservation[]>([]);
  const [vehicles, setVehicles] = useState<TransitVehicle[]>([]);
  const [files, setFiles] = useState<{ id: string; job_number: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<CarReservation>>({
    job_number: '',
    status: 'draft',
  });

  const load = async () => {
    try {
      const [r, v, f] = await Promise.all([
        listCarReservations(),
        listVehicles(),
        listLogisticsFilesBrief(),
      ]);
      setRows(r);
      setVehicles(v);
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
    if (!form.job_number?.trim()) {
      alert('Job N° obligatoire');
      return;
    }
    try {
      await upsertCarReservation({
        ...form,
        logistics_file_id: form.logistics_file_id || null,
        vehicle_id: form.vehicle_id || null,
      });
      setOpen(false);
      setForm({ job_number: '', status: 'draft' });
      load();
    } catch (e: unknown) {
      alert((e as Error).message || 'Erreur');
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#1e3a5f]">Réservations de véhicules</h1>
            <p className="text-sm text-gray-600">Liaison optionnelle au dossier ; Job N° requis.</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm text-white"
          >
            <Plus size={18} /> Nouvelle réservation
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Job</th>
                <th className="px-3 py-2 text-left">Début</th>
                <th className="px-3 py-2 text-left">Fin</th>
                <th className="px-3 py-2 text-left">Départ</th>
                <th className="px-3 py-2 text-left">Arrivée</th>
                <th className="px-3 py-2 text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center">
                    Chargement…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    Aucune réservation.
                  </td>
                </tr>
              ) : (
                rows.map(r => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono">{r.job_number}</td>
                    <td className="px-3 py-2">{r.start_time ? new Date(r.start_time).toLocaleString() : '—'}</td>
                    <td className="px-3 py-2">{r.end_time ? new Date(r.end_time).toLocaleString() : '—'}</td>
                    <td className="px-3 py-2">{r.pickup_location || '—'}</td>
                    <td className="px-3 py-2">{r.drop_location || '—'}</td>
                    <td className="px-3 py-2">{r.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-[#1e3a5f]">Réservation</h2>
              <div className="mt-4 grid gap-3 text-sm">
                <label className="block">
                  Dossier lié
                  <select
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={form.logistics_file_id || ''}
                    onChange={e => setForm({ ...form, logistics_file_id: e.target.value || undefined })}
                  >
                    <option value="">—</option>
                    {files.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.job_number}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  Job N° *
                  <input
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={form.job_number || ''}
                    onChange={e => setForm({ ...form, job_number: e.target.value })}
                  />
                </label>
                <label className="block">
                  Véhicule
                  <select
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={form.vehicle_id || ''}
                    onChange={e => setForm({ ...form, vehicle_id: e.target.value || undefined })}
                  >
                    <option value="">—</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.license_plate} {v.model ? `(${v.model})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                {['vehicle_owner', 'contacts_employees', 'approver', 'rfq1', 'rfq2', 'pickup_location', 'drop_location'].map(
                  f => (
                    <label key={f} className="block capitalize">
                      {f.replace(/_/g, ' ')}
                      <input
                        className="mt-1 w-full rounded border px-3 py-2"
                        value={(form as Record<string, string>)[f] || ''}
                        onChange={e => setForm({ ...form, [f]: e.target.value })}
                      />
                    </label>
                  )
                )}
                <label className="block">
                  km
                  <input
                    type="number"
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={form.kilometers ?? ''}
                    onChange={e => setForm({ ...form, kilometers: parseFloat(e.target.value) || undefined })}
                  />
                </label>
                <label className="block">
                  Début
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={form.start_time ? form.start_time.slice(0, 16) : ''}
                    onChange={e => setForm({ ...form, start_time: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  />
                </label>
                <label className="block">
                  Fin
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={form.end_time ? form.end_time.slice(0, 16) : ''}
                    onChange={e => setForm({ ...form, end_time: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  />
                </label>
                <label className="block">
                  Description
                  <textarea
                    className="mt-1 w-full rounded border px-3 py-2"
                    rows={3}
                    value={form.description || ''}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </label>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" className="rounded border px-4 py-2" onClick={() => setOpen(false)}>
                  Fermer
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
