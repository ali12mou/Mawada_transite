import { useLanguage } from '../../contexts/LanguageContext';

export function ConfigTransitModule() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#0F3C66]">{t('transit.config.title')}</h1>
        <p className="text-sm text-gray-600">
          {t('transit.config.subtitle')}
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-600">
        <p className="mb-4">
          {t('transit.config.placeholder')}
        </p>
        <p>
          Les tables de référence sont définies dans le schéma SQL (<code className="rounded bg-gray-100 px-1">database/geosom_transit_schema.sql</code>) —
          ex. <code className="rounded bg-gray-100 px-1">transit_currencies</code>,{' '}
          <code className="rounded bg-gray-100 px-1">transit_vendors</code>,{' '}
          <code className="rounded bg-gray-100 px-1">transit_products</code>. Les données transit passent par l’API backend{' '}
          <code className="rounded bg-gray-100 px-1">/api/transit</code> (Supabase côté serveur).
        </p>
      </div>
    </div>
  );
}


