import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { listExpenseRequests, createExpenseRequest, listLogisticsFilesBrief, listVendors, listVehicles } from '../../api/transitDb';
import type { ExpenseRequest } from '../../types/geosomTransit';

export function ExpenseRequestsTransitModule() {
  const [rows, setRows] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [files, setFiles] = useState<{ id: string; job_number: string }[]>([]);
  const [vehicles, setVehicles] = useState<{ id: string; license_plate: string }[]>([]);
  const [form, setForm] = useState<Partial<ExpenseRequest>>({ status: 'draft', payment_status: 'not_paid' });

  const load = async () => {
    try {
      const [e, v, f, veh] = await Promise.all([
        listExpenseRequests(),
        listVendors() as Promise<{ id: string; name: string }[]>,
        listLogisticsFilesBrief(),
        listVehicles(),
      ]);
      setRows(e);
      setVendors(v.map(x => ({ id: x.id, name: x.name })));
      setFiles(f.map(x => ({ id: x.id, job_number: x.job_number })));
      setVehicles(veh.map(x => ({ id: x.id, license_plate: x.license_plate })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    try {
      await createExpenseRequest({
        ...form,
        vendor_id: form.vendor_id || null,
        logistics_file_id: form.logistics_file_id || null,
        vehicle_id: form.vehicle_id || null,
        total_amount: form.total_amount ?? 0,
      });
      setOpen(false);
      setForm({ status: 'draft', payment_status: 'not_paid' });
      load();
    } catch (e: unknown) {
      alert((e as Error).message || 'Erreur');
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#1e3a5f]">Demandes de dépenses</h1>
            <p className="text-sm text-gray-600">Liées à un Job, un véhicule ou un fournisseur.</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm text-white"
          >
            <Plus size={18} /> Nouvelle demande
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">N°</th>
                <th className="px-3 py-2 text-left">Job</th>
                <th className="px-3 py-2 text-right">Montant</th>
                <th className="px-3 py-2 text-left">Paiement</th>
                <th className="px-3 py-2 text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center">
                    …
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    Aucune demande.
                  </td>
                </tr>
              ) : (
                rows.map(r => (
                  <tr key={r.id} className="border-b">
                    <td className="px-3 py-2 font-mono">{r.number || r.id.slice(0, 8)}</td>
                    <td className="px-3 py-2">{r.job_number || '—'}</td>
                    <td className="px-3 py-2 text-right">{r.total_amount ?? '—'}</td>
                    <td className="px-3 py-2">{r.payment_status}</td>
                    <td className="px-3 py-2">{r.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold">Demande de dépense</h2>
              <div className="mt-4 space-y-3 text-sm">
                <label className="block">
                  Fournisseur
                  <select
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={form.vendor_id || ''}
                    onChange={e => setForm({ ...form, vendor_id: e.target.value || undefined })}
                  >
                    <option value="">—</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  Dossier
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
                  Véhicule
                  <select
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={form.vehicle_id || ''}
                    onChange={e => setForm({ ...form, vehicle_id: e.target.value || undefined })}
                  >
                    <option value="">—</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.license_plate}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  Job N° (texte)
                  <input
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={form.job_number || ''}
                    onChange={e => setForm({ ...form, job_number: e.target.value })}
                  />
                </label>
                <label className="block">
                  Montant TTC
                  <input
                    type="number"
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={form.total_amount ?? ''}
                    onChange={e => setForm({ ...form, total_amount: parseFloat(e.target.value) || 0 })}
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
