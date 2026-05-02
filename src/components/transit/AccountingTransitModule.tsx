import { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { listAccountingInvoices, listAccountingVendorBills } from '../../api/transitDb';

export function AccountingTransitModule() {
  const { t } = useLanguage();
  const [inv, setInv] = useState<Record<string, unknown>[]>([]);
  const [bills, setBills] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [i, b] = await Promise.all([listAccountingInvoices(), listAccountingVendorBills()]);
        setInv(i as Record<string, unknown>[]);
        setBills(b as Record<string, unknown>[]);
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
        <h1 className="text-2xl font-semibold text-[#0F3C66]">{t('transit.accounting.title')}</h1>
        <p className="text-sm text-gray-600">
          {t('transit.accounting.subtitle')}
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-gray-800">{t('transit.accounting.custInvoices')}</h2>
          {loading ? (
            <p className="text-sm text-gray-500">{t('common.loading')}</p>
          ) : inv.length === 0 ? (
            <p className="text-sm text-gray-500">{t('transit.accounting.emptyInvoices')}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {inv?.map((row, i) => (
                <li key={i} className="flex justify-between border-b border-gray-100 py-1">
                  <span>{String(row.invoice_number || row.id)}</span>
                  <span>{String(row.total_amount ?? '—')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-gray-800">{t('transit.accounting.vendBills')}</h2>
          {loading ? (
            <p className="text-sm text-gray-500">{t('common.loading')}</p>
          ) : bills.length === 0 ? (
            <p className="text-sm text-gray-500">{t('transit.accounting.emptyInvoices')}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {bills?.map((row, i) => (
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


