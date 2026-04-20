import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { listSalesOrders, createSalesOrder, listLogisticsFilesBrief } from '../../api/transitDb';
import type { SalesOrder } from '../../types/geosomTransit';

export function SalesTransitModule() {
  const [rows, setRows] = useState<SalesOrder[]>([]);
  const [files, setFiles] = useState<{ id: string; job_number: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<SalesOrder>>({ status: 'quotation' });

  const load = async () => {
    try {
      const [s, f] = await Promise.all([listSalesOrders(), listLogisticsFilesBrief()]);
      setRows(s);
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
    if (!form.customer_name?.trim()) {
      alert('Client obligatoire');
      return;
    }
    const lf = files.find(x => x.id === form.logistics_file_id);
    try {
      await createSalesOrder({
        ...form,
        logistics_file_id: form.logistics_file_id || null,
        job_number: lf?.job_number || form.job_number || null,
      });
      setOpen(false);
      setForm({ status: 'quotation' });
      load();
    } catch (e: unknown) {
      alert((e as Error).message || 'Erreur');
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#1e3a5f]">Ventes</h1>
            <p className="text-sm text-gray-600">Devis / commandes liés aux opérations.</p>
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
                <th className="px-3 py-2 text-left">N°</th>
                <th className="px-3 py-2 text-left">Client</th>
                <th className="px-3 py-2 text-left">Job</th>
                <th className="px-3 py-2 text-right">Total</th>
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
                    Aucune vente.
                  </td>
                </tr>
              ) : (
                rows.map(r => (
                  <tr key={r.id} className="border-b">
                    <td className="px-3 py-2 font-mono">{r.number || '—'}</td>
                    <td className="px-3 py-2">{r.customer_name}</td>
                    <td className="px-3 py-2">{r.job_number || '—'}</td>
                    <td className="px-3 py-2 text-right">{r.total_amount ?? '—'}</td>
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
              <h2 className="text-lg font-semibold">Vente</h2>
              <div className="mt-4 space-y-3 text-sm">
                <label className="block">
                  Client *
                  <input
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={form.customer_name || ''}
                    onChange={e => setForm({ ...form, customer_name: e.target.value })}
                  />
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
                  Montant total
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
