import { getApiBaseUrl } from '../lib/apiBase';

export interface LocalCompanyRecord {
  id: string;
  client_id?: string;
  client_name: string;
  vendor_company?: string;
  purchasing_company?: string;
  goods_description?: string;
  source_destination?: string;
  closure_date?: string;
  bill_of_loading?: string;
  declaration_s?: string;
  declaration_e?: string;
  file_fee?: number;
  quantity?: string;
  truck_loading_quantity?: string;
  transit_fee?: number;
  service_fee?: number;
  escort_fee?: number;
  total?: number;
  numero_9?: string;
  numero_9_price?: number;
  numero_4?: string;
  numero_4_price?: number;
  ti_cancellation?: string;
  declaration_cancellation?: string;
  transfer?: string;
  declaration_cancellation_price?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type LocalCompanyCreateInput = Omit<LocalCompanyRecord, 'id' | 'createdAt' | 'updatedAt'>;

async function parseJson(res: Response): Promise<{ message?: string; data?: unknown }> {
  return (await res.json().catch(() => ({}))) as { message?: string; data?: unknown };
}

export async function fetchLocalCompanies(): Promise<LocalCompanyRecord[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/local-company`);
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return (body.data as LocalCompanyRecord[]) || [];
}

export async function createLocalCompany(payload: LocalCompanyCreateInput): Promise<LocalCompanyRecord> {
  const res = await fetch(`${getApiBaseUrl()}/api/local-company`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return body.data as LocalCompanyRecord;
}

export async function fetchLocalCompanyById(id: string): Promise<LocalCompanyRecord> {
  const res = await fetch(`${getApiBaseUrl()}/api/local-company/${encodeURIComponent(id)}`);
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return body.data as LocalCompanyRecord;
}

export async function updateLocalCompany(
  id: string,
  payload: LocalCompanyCreateInput
): Promise<LocalCompanyRecord> {
  const res = await fetch(`${getApiBaseUrl()}/api/local-company/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return body.data as LocalCompanyRecord;
}

export async function deleteLocalCompany(id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/api/local-company/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
}


