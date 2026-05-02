import { getApiBaseUrl } from '../lib/apiBase';

export interface SupplierRecord {
  id: string;
  name: string;
  contact: string;
  address: string;
  created_by?: string;
  createdAt?: string;
  updatedAt?: string;
}

async function parseJson(res: Response): Promise<{ message?: string; data?: unknown }> {
  return (await res.json().catch(() => ({}))) as { message?: string; data?: unknown };
}

export async function fetchSuppliers(): Promise<SupplierRecord[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/suppliers`);
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return (body.data as SupplierRecord[]) || [];
}

export async function createSupplier(payload: Omit<SupplierRecord, 'id'>): Promise<SupplierRecord> {
  const res = await fetch(`${getApiBaseUrl()}/api/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return body.data as SupplierRecord;
}

export async function updateSupplier(
  id: string,
  payload: Partial<Omit<SupplierRecord, 'id'>>
): Promise<SupplierRecord> {
  const res = await fetch(`${getApiBaseUrl()}/api/suppliers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return body.data as SupplierRecord;
}

export async function deleteSupplier(id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/api/suppliers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
}


