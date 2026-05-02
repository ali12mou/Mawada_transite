import { Document9 } from '../models/Document9.model.js';

const ALLOWED = new Set([
  'date',
  'actual_recipient',
  'actual_recipient_nif',
  'declarant',
  'declarant_nif',
  'do_number',
  'container_number',
  'boat',
  'trip_number',
  'bl_number',
  'invoice_count',
  'nomenclature',
  'quantity',
  'weight',
  'value',
  'exit_point',
  'destination',
  'description',
  'license_code',
  'operator_name',
  'entry_doc_ref',
  'entry_date',
  'sommier_ref',
  'do_date',
  'quantity_entered',
  'arrival_date',
  'country_origin',
  'fiscal_reg',
  'packaging',
  'qty_packages',
  'net_weight',
  'gross_weight',
  'volume',
  'remaining_qty',
  'transaction_types',
  'transport_modes',
  'created_by',
]);

function pickPayload(body) {
  const out = {};
  if (!body || typeof body !== 'object') return out;
  for (const key of ALLOWED) {
    if (body[key] === undefined) continue;
    if (key === 'invoice_count' || key === 'value') {
      const n = Number(body[key]);
      out[key] = Number.isFinite(n) ? n : 0;
    } else if (key === 'transaction_types' || key === 'transport_modes') {
      out[key] = Array.isArray(body[key]) ? body[key]?.map(String) : [];
    } else {
      out[key] = body[key] == null ? '' : String(body[key]);
    }
  }
  return out;
}

async function nextSqn() {
  const last = await Document9.findOne().sort({ sqn: -1 }).select('sqn').lean();
  return (last?.sqn || 0) + 1;
}

export async function listDocument9() {
  const docs = await Document9.find({}).sort({ sqn: -1 });
  return docs?.map((d) => d.toJSON());
}

export async function getDocument9ById(id) {
  const doc = await Document9.findById(id);
  return doc ? doc.toJSON() : null;
}

export async function createDocument9(body) {
  const sqn = await nextSqn();
  const payload = pickPayload(body);
  const doc = await Document9.create({ ...payload, sqn });
  return doc.toJSON();
}

export async function updateDocument9(id, body) {
  const payload = pickPayload(body);
  delete payload.sqn;
  const doc = await Document9.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!doc) {
    const err = new Error('Document introuvable');
    err.statusCode = 404;
    throw err;
  }
  return doc.toJSON();
}

export async function deleteDocument9(id) {
  const result = await Document9.findByIdAndDelete(id);
  if (!result) {
    const err = new Error('Document introuvable');
    err.statusCode = 404;
    throw err;
  }
  return { ok: true };
}
