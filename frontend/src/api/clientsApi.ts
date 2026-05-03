import { getApiBaseUrl } from '../lib/apiBase';

export interface ClientRecord {
  id: string;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

async function parseJson(res: Response): Promise<{ message?: string; data?: unknown }> {
  return (await res.json().catch(() => ({}))) as { message?: string; data?: unknown };
}

export async function fetchClients(): Promise<ClientRecord[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/clients`);
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return (body.data as ClientRecord[]) || [];
}

export async function fetchClient(id: string): Promise<ClientRecord> {
  const res = await fetch(`${getApiBaseUrl()}/api/clients/${encodeURIComponent(id)}`);
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return body.data as ClientRecord;
}

export async function createClient(payload: Omit<ClientRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClientRecord> {
  const res = await fetch(`${getApiBaseUrl()}/api/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return body.data as ClientRecord;
}

export async function updateClient(
  id: string,
  payload: Partial<Omit<ClientRecord, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<ClientRecord> {
  const res = await fetch(`${getApiBaseUrl()}/api/clients/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return body.data as ClientRecord;
}

export async function deleteClient(id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/api/clients/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
}


