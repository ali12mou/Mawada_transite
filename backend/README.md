# Backend MongoDB + Supabase

## Lancement

1. Mettre a jour `backend/.env`
2. Demarrer l'API :

```bash
npm run backend:dev
```

## Endpoints

- `GET /api/health` : etat du backend + MongoDB
- `GET /api/mongodb/collections` : liste des collections MongoDB
- `GET /api/mongodb/collections/:name/documents?limit=100` : lire documents d'une collection
- `POST /api/mongodb/collections/:name/documents` : inserer un document
- `POST /api/sync/mongodb/:collectionName` : synchroniser une collection MongoDB vers Supabase (`mongo_documents`)
