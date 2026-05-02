import { getApiBaseUrl } from '../lib/apiBase';

export type AppConfigMap = Record<string, string>;

async function parseJson(res: Response): Promise<{ message?: string; data?: unknown }> {
  return (await res.json().catch(() => ({}))) as { message?: string; data?: unknown };
}

export async function fetchAppConfig(): Promise<AppConfigMap> {
  const res = await fetch(`${getApiBaseUrl()}/api/config`);
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return (body.data as AppConfigMap) || {};
}

export async function patchAppConfig(updates: AppConfigMap): Promise<AppConfigMap> {
  const res = await fetch(`${getApiBaseUrl()}/api/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return (body.data as AppConfigMap) || {};
}


