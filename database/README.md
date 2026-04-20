# Base de données GEOSOM TRANSIT (modules transport)

## Installation

1. Ouvrez le **SQL Editor** dans le tableau de bord Supabase du projet.
2. Collez le contenu de `geosom_transit_schema.sql` et exécutez-le.
3. Vérifiez les erreurs éventuelles (extensions, droits).

## Contenu du schéma

- **logistics_files** — Dossier principal (Job Number, type, client, statut, onglets texte).
- **logistics_file_goods** / **logistics_file_containers** — Marchandises et lignes conteneurs.
- **transportation_records** / **bulk_transport_records** — Transports liés à un dossier (`logistics_file_id` obligatoire).
- **car_reservations** (+ **car_reservation_containers**) — Réservations véhicules.
- **transit_vehicles** / **transit_drivers** — Flotte.
- **expense_requests** (+ lignes + historique), **purchase_requests**, **sales_orders**.
- **accounting_*** — Factures, factures fournisseur, paiements, écritures.
- **entity_status_history** — Historique de statuts transversal.
- **transit_vendors**, **transit_products**, **transit_currencies** — Référentiels.

## RLS

Les politiques actuelles autorisent le rôle `authenticated` sur ces tables. À restreindre selon vos rôles métier (Operation Manager, Finance, etc.).

## API

- **Modules transport / logistique** : le frontend appelle uniquement le backend Express **`/api/transit/*`** (voir `backend/src/routes/transit.routes.js`). Le serveur utilise la **clé service role** Supabase (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` dans `backend/.env`) — elle ne doit pas être exposée au navigateur.
- **Autres écrans** (imports, RH, etc.) peuvent encore utiliser le client Supabase côté navigateur si `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont définis dans `.env` à la racine du projet.

Après avoir exécuté le script SQL, vérifiez `GET http://localhost:4000/api/transit/health` : `transitData: true` si Supabase est bien configuré côté backend.
