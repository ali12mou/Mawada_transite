import { useEffect, useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { listLogisticsFiles, listTransportationRecords, listExpenseRequests } from '../../../api/transitDb';

export function ReportingTransitModule() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ files: 0, transports: 0, expenses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [f, t, e] = await Promise.all([
          listLogisticsFiles(),
          listTransportationRecords(),
          listExpenseRequests(),
        ]);
        setStats({ files: f.length, transports: t.length, expenses: e.length });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#0F3C66]">{t('transit.reporting.title')}</h1>
        <p className="text-sm text-gray-600">{t('transit.reporting.subtitle')}</p>
      </div>
      {loading ? (
        <p className="text-gray-500">{t('common.loading')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-6 text-center">
            <div className="text-3xl font-bold text-[#0F3C66]">{stats.files}</div>
            <div className="text-sm text-gray-600">{t('transit.logisticsFiles.title')}</div>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-6 text-center">
            <div className="text-3xl font-bold text-[#0F3C66]">{stats.transports}</div>
            <div className="text-sm text-gray-600">{t('transit.transport.title')}</div>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-6 text-center">
            <div className="text-3xl font-bold text-[#0F3C66]">{stats.expenses}</div>
            <div className="text-sm text-gray-600">{t('transit.expenseRequests.title')}</div>
          </div>
        </div>
      )}
    </div>
  );
}


