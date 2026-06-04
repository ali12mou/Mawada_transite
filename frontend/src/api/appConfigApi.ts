import { getApiBaseUrl } from '../lib/apiBase';

export type AppConfigMap = Record<string, string>;

let configCache: AppConfigMap | null = null;
let configPromise: Promise<AppConfigMap> | null = null;

async function parseJson(res: Response): Promise<{ message?: string; data?: unknown }> {
  return (await res.json().catch(() => ({}))) as { message?: string; data?: unknown };
}

export async function fetchAppConfig(options?: { force?: boolean }): Promise<AppConfigMap> {
  if (!options?.force && configCache) return configCache;
  if (!options?.force && configPromise) return configPromise;

  configPromise = (async () => {
    const res = await fetch(`${getApiBaseUrl()}/api/config`);
    const body = await parseJson(res);
    if (!res.ok) throw new Error(body.message || res.statusText);
    const data = (body.data as AppConfigMap) || {};
    configCache = data;
    return data;
  })();

  try {
    return await configPromise;
  } finally {
    configPromise = null;
  }
}

export function invalidateAppConfigCache(): void {
  configCache = null;
  configPromise = null;
}

export async function patchAppConfig(updates: AppConfigMap): Promise<AppConfigMap> {
  const res = await fetch(`${getApiBaseUrl()}/api/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  const data = (body.data as AppConfigMap) || {};
  configCache = data;
  return data;
}


