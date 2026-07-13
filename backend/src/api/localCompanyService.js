import { LocalCompany } from '../models/LocalCompany.model.js';

function num(v, def = 0) {
  if (v == null || v === '') return def;
  const normalized = String(v).trim().replace(/\s/g, '').replace(/,/g, '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : def;
}

function str(v) {
  return String(v ?? '').trim();
}

function payloadFromBody(body) {
  return {
    client_id: str(body?.client_id),
    client_name: str(body?.client_name),
    vendor_company: str(body?.vendor_company),
    purchasing_company: str(body?.purchasing_company),
    goods_description: str(body?.goods_description),
    source_destination: str(body?.source_destination),
    closure_date: str(body?.closure_date),
    bill_of_loading: str(body?.bill_of_loading),
    declaration_s: str(body?.declaration_s),
    declaration_e: str(body?.declaration_e),
    file_fee: num(body?.file_fee),
    quantity: str(body?.quantity),
    truck_loading_quantity: str(body?.truck_loading_quantity),
    transit_fee: num(body?.transit_fee),
    service_fee: num(body?.service_fee),
    escort_fee: num(body?.escort_fee),
    total: num(body?.total),
    numero_9: str(body?.numero_9),
    numero_9_price: num(body?.numero_9_price),
    numero_4: str(body?.numero_4),
    numero_4_price: num(body?.numero_4_price),
    ti_cancellation: str(body?.ti_cancellation),
    declaration_cancellation: str(body?.declaration_cancellation),
    transfer: str(body?.transfer),
    declaration_cancellation_price: num(body?.declaration_cancellation_price),
  };
}

export async function listLocalCompanies() {
  const docs = await LocalCompany.find({}).sort({ createdAt: -1 });
  return docs?.map((d) => d.toJSON());
}

export async function getLocalCompanyById(id) {
  const doc = await LocalCompany.findById(id);
  return doc ? doc.toJSON() : null;
}

export async function createLocalCompany(body) {
  const data = payloadFromBody(body);
  if (!data.client_name) {
    const err = new Error('Le client est requis');
    err.statusCode = 400;
    throw err;
  }
  const doc = await LocalCompany.create(data);
  return doc.toJSON();
}

export async function updateLocalCompany(id, body) {
  const data = payloadFromBody(body);
  const doc = await LocalCompany.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!doc) {
    const err = new Error('Dossier entreprise locale introuvable');
    err.statusCode = 404;
    throw err;
  }
  return doc.toJSON();
}

export async function deleteLocalCompany(id) {
  const result = await LocalCompany.findByIdAndDelete(id);
  if (!result) {
    const err = new Error('Dossier entreprise locale introuvable');
    err.statusCode = 404;
    throw err;
  }
  return { ok: true };
}
