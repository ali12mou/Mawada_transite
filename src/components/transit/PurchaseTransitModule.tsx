import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { listPurchaseRequests, createPurchaseRequest, listLogisticsFilesBrief, listVendors } from '../../api/transitDb';
import type { PurchaseRequest } from '../../types/geosomTransit';

export function PurchaseTransitModule() {
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
      setVendors(v.map(x => ({ id: x.id, name: x.name })));
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
      alert((e as Error).message || 'Erreur');
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#1e3a5f]">Achats (RFQ / commandes)</h1>
            <p className="text-sm text-gray-600">Demandes d’achat liées à un Job.</p>
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
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Réf.</th>
                <th className="px-3 py-2 text-left">Job</th>
                <th className="px-3 py-2 text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center">
                    …
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-500">
                    Aucune ligne.
                  </td>
                </tr>
              ) : (
                rows.map(r => (
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
              <h2 className="text-lg font-semibold">Demande d’achat</h2>
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
                  Dossier (Job)
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
