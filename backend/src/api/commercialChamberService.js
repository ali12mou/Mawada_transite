import { CommercialChamber } from '../models/CommercialChamber.model.js';
import {
  applyCommercialCalculations,
} from '../lib/commercialChamberCalculations.js';

function generateCommercialNo() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `CC-${y}${m}${day}-${n}`;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function listCommercialChambers() {
  const docs = await CommercialChamber.find({}).sort({ createdAt: -1 });
  return docs?.map((d) => d.toJSON());
}

export async function getCommercialChamberById(id) {
  const doc = await CommercialChamber.findById(id);
  return doc ? doc.toJSON() : null;
}

const UPDATABLE = [
  'client_name',
  'responsible',
  'goods_description',
  'chamber_service_amount',
  'service_charge',
  'bank_commission_fee',
  'transport_dhl',
  'total',
  'certificate_fee',
  'commercial_invoice_no',
  'commercial_invoice_date',
  'purchase_order_no',
  'purchase_order_date',
  'quantity',
  'unit_price',
  'percentage',
  'tell',
  'timno',
];

function sanitizeUpdate(body) {
  const out = {};
  if (!body || typeof body !== 'object') return out;
  for (const key of UPDATABLE) {
    if (body[key] === undefined) continue;
    if (key === 'quantity') {
      out[key] = body[key] == null ? '' : String(body[key]).trim();
    } else if (
      [
        'chamber_service_amount',
        'service_charge',
        'bank_commission_fee',
        'transport_dhl',
        'total',
        'certificate_fee',
        'unit_price',
        'percentage',
      ].includes(key)
    ) {
      out[key] = toNumber(body[key]);
    } else {
      out[key] = body[key] == null ? '' : String(body[key]).trim();
    }
  }
  return out;
}

export async function updateCommercialChamber(id, body) {
  const payload = sanitizeUpdate(body);
  const computed = applyCommercialCalculations({ ...payload });
  Object.assign(payload, computed);

  const doc = await CommercialChamber.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true });
  if (!doc) {
    const err = new Error('Enregistrement introuvable');
    err.statusCode = 404;
    throw err;
  }
  return doc.toJSON();
}

export async function createCommercialChamber(body) {
  const clientName = String(body?.client_name || '').trim();
  if (!clientName) {
    const err = new Error('Le client est requis');
    err.statusCode = 400;
    throw err;
  }

  const computed = applyCommercialCalculations(body);

  const doc = await CommercialChamber.create({
    ...body,
    commercial_no: String(body?.commercial_no || '').trim() || generateCommercialNo(),
    client_name: clientName,
    responsible: String(body?.responsible || '').trim(),
    chamber_service_amount: toNumber(body?.chamber_service_amount),
    quantity: String(body?.quantity ?? '').trim(),
    unit_price: toNumber(body?.unit_price),
    percentage: computed.percentage,
    service_charge: computed.service_charge,
    bank_commission_fee: toNumber(body?.bank_commission_fee),
    transport_dhl: toNumber(body?.transport_dhl),
    total: computed.total,
    certificate_fee: toNumber(body?.certificate_fee),
  });
  return doc.toJSON();
}

export async function deleteCommercialChamber(id) {
  const result = await CommercialChamber.findByIdAndDelete(id);
  if (!result) {
    const err = new Error('Enregistrement introuvable');
    err.statusCode = 404;
    throw err;
  }
  return { ok: true };
}
