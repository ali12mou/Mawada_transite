import { getApiBaseUrl } from '../lib/apiBase';

export interface Document9Record {
  id: string;
  sqn: number;
  date: string;
  actual_recipient: string;
  actual_recipient_nif: string;
  declarant: string;
  declarant_nif: string;
  do_number: string;
  container_number: string;
  boat: string;
  trip_number: string;
  bl_number: string;
  invoice_count: string;
  nomenclature: string;
  quantity: string;
  weight: string;
  value: string;
  exit_point: string;
  destination: string;
  description: string;
  license_code: string;
  operator_name: string;
  entry_doc_ref: string;
  entry_date: string;
  sommier_ref: string;
  do_date: string;
  quantity_entered: string;
  arrival_date: string;
  country_origin: string;
  fiscal_reg: string;
  packaging: string;
  qty_packages: string;
  net_weight: string;
  gross_weight: string;
  volume: string;
  remaining_qty: string;
  transaction_types: string[];
  transport_modes: string[];
  created_by?: string;
  seller_company?: string;
  buyer_company?: string;
  client_name?: string;
  source_destination_label?: string;
  closing_date?: string;
  bill_of_loading?: string;
  declaration_s?: string;
  declaration_e?: string;
  dossier_fee?: string;
  truck_load_quantity?: string;
  transit_fee?: string;
  service_fee?: string;
  pass_cancel_fee?: string;
  transfer_total?: string;
  doc_sydonia?: string;
  doc_delivery_order?: string;
  doc_commercial?: string;
  doc_packing_list?: string;
  doc_transfer_declaration_s?: string;
  doc_full_scan?: string;
  doc_number_9_file?: string;
  price_number_9?: string;
  doc_number_4_file?: string;
  price_number_4?: string;
  doc_ti_cancel_file?: string;
  price_ti_cancel?: string;
  doc_declaration_se_cancel_file?: string;
  price_declaration_se_cancel?: string;
  createdAt?: string;
  updatedAt?: string;
}

async function parseJson(res: Response): Promise<{ message?: string; data?: unknown }> {
  return (await res.json().catch(() => ({}))) as { message?: string; data?: unknown };
}

export async function fetchDocument9List(): Promise<Document9Record[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/document-9`);
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return (body.data as Document9Record[]) || [];
}

export async function createDocument9(
  payload: Omit<Document9Record, 'id' | 'sqn' | 'createdAt' | 'updatedAt'>
): Promise<Document9Record> {
  const res = await fetch(`${getApiBaseUrl()}/api/document-9`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return body.data as Document9Record;
}

export async function updateDocument9(
  id: string,
  payload: Partial<Omit<Document9Record, 'id' | 'sqn' | 'createdAt' | 'updatedAt'>>
): Promise<Document9Record> {
  const res = await fetch(`${getApiBaseUrl()}/api/document-9/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return body.data as Document9Record;
}

export async function deleteDocument9(id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/api/document-9/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
}


