import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectMongo } from './config/mongodb.js';
import { getSupabaseAdminClient } from './config/supabase.js';
import healthRoutes from './routes/health.routes.js';
import mongoRoutes from './routes/mongo.routes.js';
import syncRoutes from './routes/sync.routes.js';
import usersRoutes from './routes/users.routes.js';
import transitRoutes from './routes/transit.routes.js';
import clientsRoutes from './routes/clients.routes.js';
import commercialChamberRoutes from './routes/commercial-chamber.routes.js';
import document9Routes from './routes/document9.routes.js';
import configRoutes from './routes/config.routes.js';
import companiesRoutes from './routes/companies.routes.js';
import localCompanyRoutes from './routes/local-company.routes.js';
import suppliersRoutes from './routes/suppliers.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import chamberInvoicesRoutes from './routes/chamber-invoices.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Racine du dépôt puis backend/.env (ce dernier écrase les clés en doublon).
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = Number(process.env.BACKEND_PORT || 4000);

app.use(cors());
app.use(express.json({ limit: '25mb' }));

app.use('/api/health', healthRoutes);
app.use('/api/mongodb', mongoRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/transit', transitRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/commercial-chamber', commercialChamberRoutes);
app.use('/api/chamber-invoices', chamberInvoicesRoutes);
app.use('/api/document-9', document9Routes);
app.use('/api/config', configRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/local-company', localCompanyRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/orders', ordersRoutes);

app.use((error, _req, res, _next) => {
  res.status(500).json({
    message: error.message || 'Internal server error'
  });
});

async function start() {
  try {
    await connectMongo();
    app.listen(port, () => {
      console.log(`Backend API running on http://localhost:${port}`);
      const sb = getSupabaseAdminClient();
      console.log(
        `[transit] Factures chambre : ${sb ? 'Supabase (PostgreSQL)' : 'MongoDB — collection chamber_invoice_docs (Supabase non configuré)'}`
      );
    });
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
}

start();
