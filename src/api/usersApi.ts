import { getApiBaseUrl } from '../lib/apiBase';
import type { AuthUser } from '../types/authUser';

async function parseJson(res: Response): Promise<{ message?: string; data?: unknown }> {
  return (await res.json().catch(() => ({}))) as { message?: string; data?: unknown };
}

export async function fetchUsers(): Promise<AuthUser[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/users`);
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return (body.data as AuthUser[]) || [];
}

export async function createUser(payload: any): Promise<AuthUser> {
  const res = await fetch(`${getApiBaseUrl()}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return body.data as AuthUser;
}

export async function updateUser(id: string, payload: any): Promise<AuthUser> {
  const res = await fetch(`${getApiBaseUrl()}/api/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return body.data as AuthUser;
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/api/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
}


