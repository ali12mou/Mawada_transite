import { useEffect, useState } from 'react';
import { listAccountingInvoices, listAccountingVendorBills } from '../../api/transitDb';

export function AccountingTransitModule() {
  const [inv, setInv] = useState<Record<string, unknown>[]>([]);
  const [bills, setBills] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [i, b] = await Promise.all([listAccountingInvoices(), listAccountingVendorBills()]);
        setInv(i);
        setBills(b);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#1e3a5f]">Comptabilité</h1>
        <p className="text-sm text-gray-600">
          Factures clients et factures fournisseurs — alimentées par les modules Ventes, Achats et Dépenses.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-gray-800">Factures clients</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : inv.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune facture.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {inv.map((row, i) => (
                <li key={i} className="flex justify-between border-b border-gray-100 py-1">
                  <span>{String(row.invoice_number || row.id)}</span>
                  <span>{String(row.total_amount ?? '—')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-gray-800">Factures fournisseurs</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : bills.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune facture.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {bills.map((row, i) => (
                <li key={i} className="flex justify-between border-b border-gray-100 py-1">
                  <span>{String(row.bill_number || row.id)}</span>
                  <span>{String(row.total_amount ?? '—')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
