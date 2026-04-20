export function ConfigTransitModule() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1e3a5f]">Configuration & administration</h1>
        <p className="text-sm text-gray-600">
          Paramètres transverses : journaux comptables, plan comptable, taxes, devises, droits par rôle.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-600">
        <p className="mb-4">
          Cette zone regroupera la configuration métier (journaux, comptes, taxes, listes de prix) et les règles
          d’accès par profil (Operation Manager, Finance, etc.).
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
