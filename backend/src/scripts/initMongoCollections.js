import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { connectMongo } from '../config/mongodb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const collectionsToCreate = [
  'roles',
  'users',
  'configurations',
  'commercial_chamber',
  'local_company',
  'transfer_document_9',
  'chamber_invoice',
  'chamber_invoice_docs',
  'performa',
  'customer_file',
  'certificate_origin',
  'suppliers',
  'orders',
  'order_verification',
  'order_reception',
  'delivered_orders',
  'document_9',
  'document_4',
  'clearance_demurrage',
  'invoice_reports',
  'products',
  'inventories',
  'warehouses',
  'carriers',
  'owners',
  'carrier_modes',
  'routes',
  'shipping_lines',
  'expense_categories',
  'expenses',
  'expense_allocation',
  'other_expenses',
  'employees',
  'contract_types',
  'employee_professions',
  'employee_documents',
  'payroll',
  'tax_rates',
  'leave_request',
  'leave_types',
  'leave_return_request',
  'attendance',
  'clients',
  'banks',
  'product_prices',
  'product_categories',
  'companies',
  'locations',
  'cnss_settings'
];

async function initMongoCollections() {
  await connectMongo();
  const db = mongoose.connection.db;
  const existingCollections = await db.listCollections().toArray();
  const existingNames = new Set(existingCollections.map((c) => c.name));

  const created = [];
  const skipped = [];

  for (const collectionName of collectionsToCreate) {
    if (existingNames.has(collectionName)) {
      skipped.push(collectionName);
      continue;
    }

    await db.createCollection(collectionName);
    created.push(collectionName);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        database: process.env.MONGODB_DB_NAME || 'transit-transport',
        createdCount: created.length,
        skippedCount: skipped.length,
        created,
        skipped
      },
      null,
      2
    )
  );
}

initMongoCollections()
  .catch((error) => {
    console.error('Failed to initialize MongoDB collections:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
