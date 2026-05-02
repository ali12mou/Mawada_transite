import { getSupabaseAdminClient } from '../config/supabase.js';

function requireClient() {
  const c = getSupabaseAdminClient();
  if (!c) {
    const err = new Error(
      'Supabase non configuré côté serveur : dans backend/.env ou .env à la racine du projet, définissez au minimum SUPABASE_URL (ou VITE_SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY, ou la clé anon (VITE_SUPABASE_ANON_KEY) si les politiques RLS le permettent. Redémarrez le backend après modification.'
    );
    Object.assign(err, { code: 'SUPABASE_NOT_CONFIGURED' });
    throw err;
  }
  return c;
}

function genJobNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `DGT/${String(y).slice(2)}/${n}`;
}

export async function listLogisticsFilesBrief() {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('logistics_files')
    .select('id, job_number, company_name, contact_name, status')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listLogisticsFiles(params = {}) {
  const supabase = requireClient();
  let q = supabase.from('logistics_files').select('*').order('created_at', { ascending: false });
  if (params.status) q = q.eq('status', params.status);
  const { data, error } = await q;
  if (error) throw error;
  let rows = data || [];
  if (params.search?.trim()) {
    const s = params.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        String(r.job_number || '')
          .toLowerCase()
          .includes(s) ||
        String(r.company_name || '')
          .toLowerCase()
          .includes(s) ||
        String(r.contact_name || '')
          .toLowerCase()
          .includes(s)
    );
  }
  return rows;
}

export async function getLogisticsFile(id) {
  const supabase = requireClient();
  const { data, error } = await supabase.from('logistics_files').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function getGoodsByFileId(fileId) {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('logistics_file_goods')
    .select('*')
    .eq('logistics_file_id', fileId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getContainersByFileId(fileId) {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('logistics_file_containers')
    .select('*')
    .eq('logistics_file_id', fileId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function upsertLogisticsFile(payload) {
  const supabase = requireClient();
  const job_number = String(payload.job_number || '').trim() || genJobNumber();
  const { id, ...rest } = payload;
  const row = { ...rest, job_number };
  if (id) {
    const { data, error } = await supabase.from('logistics_files').update(row).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('logistics_files').insert([row]).select().single();
  if (error) throw error;
  return data;
}

export async function upsertFileGoods(fileId, goods) {
  const supabase = requireClient();
  const existing = await getGoodsByFileId(fileId);
  const payload = { ...goods, logistics_file_id: fileId };
  if (existing?.id) {
    const { data, error } = await supabase
      .from('logistics_file_goods')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('logistics_file_goods').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function replaceContainers(fileId, lines) {
  const supabase = requireClient();
  await supabase.from('logistics_file_containers').delete().eq('logistics_file_id', fileId);
  if (!lines?.length) return;
  const rows = lines?.map((l, i) => ({
    logistics_file_id: fileId,
    container_size: l.container_size ?? null,
    number_of_units: l.number_of_units ?? 1,
    description: l.description ?? null,
    sort_order: i,
  }));
  const { error } = await supabase.from('logistics_file_containers').insert(rows);
  if (error) throw error;
}

export async function logStatusChange(entityType, entityId, from, to, note) {
  const supabase = requireClient();
  const { error } = await supabase.from('entity_status_history').insert([
    {
      entity_type: entityType,
      entity_id: entityId,
      from_status: from,
      to_status: to,
      note: note ?? null,
    },
  ]);
  if (error) throw error;
}

export async function listTransportationRecords() {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('transportation_records')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTransportationRecord(payload) {
  const supabase = requireClient();
  const { data, error } = await supabase.from('transportation_records').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function listBulkTransportRecords() {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('bulk_transport_records')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createBulkTransportRecord(payload) {
  const supabase = requireClient();
  const { data, error } = await supabase.from('bulk_transport_records').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function listCarReservations() {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('car_reservations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function upsertCarReservation(payload) {
  const supabase = requireClient();
  if (payload.id) {
    const { data, error } = await supabase
      .from('car_reservations')
      .update(payload)
      .eq('id', payload.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('car_reservations').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function listVehicles() {
  const supabase = requireClient();
  const { data, error } = await supabase.from('transit_vehicles').select('*').order('license_plate');
  if (error) throw error;
  return data || [];
}

export async function listDrivers() {
  const supabase = requireClient();
  const { data, error } = await supabase.from('transit_drivers').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function upsertVehicle(payload) {
  const supabase = requireClient();
  if (payload.id) {
    const { data, error } = await supabase
      .from('transit_vehicles')
      .update(payload)
      .eq('id', payload.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('transit_vehicles').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function upsertDriver(payload) {
  const supabase = requireClient();
  if (payload.id) {
    const { data, error } = await supabase
      .from('transit_drivers')
      .update(payload)
      .eq('id', payload.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('transit_drivers').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function listExpenseRequests() {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('expense_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listPurchaseRequests() {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('purchase_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listSalesOrders() {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('sales_orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createExpenseRequest(payload) {
  const supabase = requireClient();
  const { data, error } = await supabase.from('expense_requests').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function createPurchaseRequest(payload) {
  const supabase = requireClient();
  const { data, error } = await supabase.from('purchase_requests').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function createSalesOrder(payload) {
  const supabase = requireClient();
  const { data, error } = await supabase.from('sales_orders').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function listVendors() {
  const supabase = requireClient();
  const { data, error } = await supabase.from('transit_vendors').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function listAccountingInvoices() {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('accounting_invoices')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listAccountingVendorBills() {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('accounting_vendor_bills')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Table optionnelle `configurations` (hors schéma transit strict) — pour devise affichée. */
export async function getCurrencySymbolSetting() {
  try {
    const supabase = requireClient();
    const { data, error } = await supabase
      .from('configurations')
      .select('value')
      .eq('key', 'currency_symbol')
      .maybeSingle();
    if (error) return null;
    return data?.value ?? null;
  } catch {
    return null;
  }
}

// --- Facture de chambre (chamber_invoice + lignes + packing + lettre) ---

function nullIfEmptyDate(v) {
  if (v == null || String(v).trim() === '') return null;
  const t = String(v).trim();
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(t);
  return m ? m[1] : t.slice(0, 10);
}

function sanitizeChamberHeader(row) {
  if (!row || typeof row !== 'object') return {};
  return {
    ...row,
    invoice_date: nullIfEmptyDate(row.invoice_date),
  };
}

function sanitizePackingRow(p) {
  if (!p || typeof p !== 'object') return {};
  return {
    ...p,
    reference_date: nullIfEmptyDate(p.reference_date),
  };
}

function sanitizeLetterRow(o) {
  if (!o || typeof o !== 'object') return {};
  return {
    ...o,
    reference_date: nullIfEmptyDate(o.reference_date),
  };
}

async function insertChamberInvoiceItems(supabase, invoiceId, items) {
  const list = Array.isArray(items) ? items : [];
  const base = list?.map((item) => ({
    chamber_invoice_id: invoiceId,
    description_of_goods: item.description_of_goods ?? '',
    origin: item.origin ?? '',
    unit: item.unit ?? '',
    quantity: Number(item.quantity) || 0,
    unit_price: Number(item.unit_price) || 0,
    total_amount: Number(item.total_amount) || 0,
  }));
  const withHs = list?.map((item) => ({
    chamber_invoice_id: invoiceId,
    description_of_goods: item.description_of_goods ?? '',
    origin: item.origin ?? '',
    unit: item.unit ?? '',
    quantity: Number(item.quantity) || 0,
    unit_price: Number(item.unit_price) || 0,
    total_amount: Number(item.total_amount) || 0,
    hs_code: item.hs_code?.trim?.() ? String(item.hs_code).trim() : null,
  }));
  let { error } = await supabase.from('chamber_invoice_items').insert(withHs);
  const msg = error ? `${error.message} ${error.details || ''}` : '';
  if (error && /hs_code|Could not find|schema cache|PGRST204|column/i.test(msg)) {
    ({ error } = await supabase.from('chamber_invoice_items').insert(base));
  }
  if (error) throw error;
}

export async function listChamberInvoices() {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('chamber_invoice')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getChamberInvoiceFull(id) {
  const supabase = requireClient();
  const { data: invoice, error: e1 } = await supabase.from('chamber_invoice').select('*').eq('id', id).single();
  if (e1) throw e1;
  const { data: items } = await supabase.from('chamber_invoice_items').select('*').eq('chamber_invoice_id', id);
  const { data: packing } = await supabase.from('chamber_invoice_packing_list').select('*').eq('chamber_invoice_id', id).maybeSingle();
  const { data: letter } = await supabase.from('chamber_invoice_original_letter').select('*').eq('chamber_invoice_id', id).maybeSingle();
  return {
    invoice,
    items: items || [],
    packing: packing || null,
    letter: letter || null,
  };
}

export async function createChamberInvoice(body) {
  const supabase = requireClient();
  const header = sanitizeChamberHeader(body.header || {});
  const { data: inv, error: e1 } = await supabase.from('chamber_invoice').insert([header]).select().single();
  if (e1) throw e1;
  const newId = inv.id;
  try {
    await insertChamberInvoiceItems(supabase, newId, body.items || []);
    const { error: e2 } = await supabase
      .from('chamber_invoice_packing_list')
      .insert([{ chamber_invoice_id: newId, ...sanitizePackingRow(body.packingList || {}) }]);
    if (e2) throw e2;
    const { error: e3 } = await supabase
      .from('chamber_invoice_original_letter')
      .insert([{ chamber_invoice_id: newId, ...sanitizeLetterRow(body.originalLetter || {}) }]);
    if (e3) throw e3;
  } catch (e) {
    await supabase.from('chamber_invoice').delete().eq('id', newId);
    throw e;
  }
  return inv;
}

export async function updateChamberInvoice(id, body) {
  const supabase = requireClient();
  const header = sanitizeChamberHeader(body.header || {});
  const { error: e1 } = await supabase.from('chamber_invoice').update(header).eq('id', id);
  if (e1) throw e1;
  await supabase.from('chamber_invoice_items').delete().eq('chamber_invoice_id', id);
  await insertChamberInvoiceItems(supabase, id, body.items || []);
  await supabase.from('chamber_invoice_packing_list').delete().eq('chamber_invoice_id', id);
  const { error: e2 } = await supabase
    .from('chamber_invoice_packing_list')
    .insert([{ chamber_invoice_id: id, ...sanitizePackingRow(body.packingList || {}) }]);
  if (e2) throw e2;
  await supabase.from('chamber_invoice_original_letter').delete().eq('chamber_invoice_id', id);
  const { error: e3 } = await supabase
    .from('chamber_invoice_original_letter')
    .insert([{ chamber_invoice_id: id, ...sanitizeLetterRow(body.originalLetter || {}) }]);
  if (e3) throw e3;
  return getChamberInvoiceFull(id);
}

export async function deleteChamberInvoice(id) {
  const supabase = requireClient();
  await supabase.from('chamber_invoice_items').delete().eq('chamber_invoice_id', id);
  await supabase.from('chamber_invoice_packing_list').delete().eq('chamber_invoice_id', id);
  await supabase.from('chamber_invoice_original_letter').delete().eq('chamber_invoice_id', id);
  const { error } = await supabase.from('chamber_invoice').delete().eq('id', id);
  if (error) throw error;
}
