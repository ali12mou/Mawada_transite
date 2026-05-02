import { getApiBaseUrl } from '../lib/apiBase';

export interface CompanyRecord {
  id: string;
  name: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

async function parseJson(res: Response): Promise<{ message?: string; data?: unknown }> {
  return (await res.json().catch(() => ({}))) as { message?: string; data?: unknown };
}

export async function fetchCompanies(): Promise<CompanyRecord[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/companies`);
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return (body.data as CompanyRecord[]) || [];
}

export async function createCompany(
  payload: Pick<CompanyRecord, 'name' | 'address'>
): Promise<CompanyRecord> {
  const res = await fetch(`${getApiBaseUrl()}/api/companies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return body.data as CompanyRecord;
}

export async function updateCompany(
  id: string,
  payload: Partial<Pick<CompanyRecord, 'name' | 'address'>>
): Promise<CompanyRecord> {
  const res = await fetch(`${getApiBaseUrl()}/api/companies/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return body.data as CompanyRecord;
}

export async function deleteCompany(id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/api/companies/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
}


