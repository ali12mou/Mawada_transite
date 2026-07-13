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
  'seller_company',
  'buyer_company',
  'client_name',
  'source_destination_label',
  'closing_date',
  'bill_of_loading',
  'declaration_s',
  'declaration_e',
  'dossier_fee',
  'truck_load_quantity',
  'transit_fee',
  'service_fee',
  'pass_cancel_fee',
  'transfer_total',
  'doc_sydonia',
  'doc_delivery_order',
  'doc_commercial',
  'doc_packing_list',
  'doc_transfer_declaration_s',
  'doc_full_scan',
  'doc_number_9_file',
  'price_number_9',
  'doc_number_4_file',
  'price_number_4',
  'doc_ti_cancel_file',
  'price_ti_cancel',
  'doc_declaration_se_cancel_file',
  'price_declaration_se_cancel',
]);

function pickPayload(body) {
  const out = {};
  if (!body || typeof body !== 'object') return out;
  for (const key of ALLOWED) {
    if (body[key] === undefined) continue;
    if (key === 'transaction_types' || key === 'transport_modes') {
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
