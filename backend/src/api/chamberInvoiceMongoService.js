import mongoose from 'mongoose';
import { ChamberInvoiceDocument } from '../models/ChamberInvoiceDocument.model.js';

function isValidMongoId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function listChamberInvoicesMongo() {
  const docs = await ChamberInvoiceDocument.find({}).sort({ createdAt: -1 }).lean();
  return docs?.map((d) => ({
    id: d._id.toString(),
    consignee_name: d.header?.consignee_name ?? '',
    tin: d.header?.tin ?? '',
    payment_conditions: d.header?.payment_conditions ?? '',
    currency: d.header?.currency ?? '',
    created_at: d.createdAt ? new Date(d.createdAt).toISOString() : '',
  }));
}

export async function getChamberInvoiceFullMongo(id) {
  if (!isValidMongoId(id)) {
    const err = new Error('Facture introuvable');
    err.statusCode = 404;
    throw err;
  }
  const doc = await ChamberInvoiceDocument.findById(id).lean();
  if (!doc) {
    const err = new Error('Facture introuvable');
    err.statusCode = 404;
    throw err;
  }
  const invoice = {
    ...doc.header,
    id: doc._id.toString(),
    created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : '',
  };
  const hasPacking = doc.packingList && typeof doc.packingList === 'object' && Object.keys(doc.packingList).length > 0;
  const hasLetter =
    doc.originalLetter && typeof doc.originalLetter === 'object' && Object.keys(doc.originalLetter).length > 0;
  return {
    invoice,
    items: doc.items || [],
    packing: hasPacking ? doc.packingList : null,
    letter: hasLetter ? doc.originalLetter : null,
  };
}

export async function createChamberInvoiceMongo(body) {
  const doc = await ChamberInvoiceDocument.create({
    header: body.header || {},
    items: body.items || [],
    packingList: body.packingList || {},
    originalLetter: body.originalLetter || {},
  });
  const created = doc.toObject();
  return {
    ...created.header,
    id: created._id.toString(),
    created_at: created.createdAt?.toISOString?.() || '',
  };
}

export async function updateChamberInvoiceMongo(id, body) {
  if (!isValidMongoId(id)) {
    const err = new Error('Facture introuvable');
    err.statusCode = 404;
    throw err;
  }
  const doc = await ChamberInvoiceDocument.findByIdAndUpdate(
    id,
    {
      $set: {
        header: body.header || {},
        items: body.items || [],
        packingList: body.packingList || {},
        originalLetter: body.originalLetter || {},
      },
    },
    { new: true, runValidators: true }
  );
  if (!doc) {
    const err = new Error('Facture introuvable');
    err.statusCode = 404;
    throw err;
  }
  return getChamberInvoiceFullMongo(id);
}

export async function deleteChamberInvoiceMongo(id) {
  if (!isValidMongoId(id)) {
    const err = new Error('Facture introuvable');
    err.statusCode = 404;
    throw err;
  }
  const r = await ChamberInvoiceDocument.findByIdAndDelete(id);
  if (!r) {
    const err = new Error('Facture introuvable');
    err.statusCode = 404;
    throw err;
  }
}
