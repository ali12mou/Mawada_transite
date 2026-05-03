import { genericApi } from '../../api/genericApi';
import { getApiBaseUrl } from '../lib/apiBase';

export interface MongoDoc {
  id: string;
  [key: string]: any;
}

const base = () => `${getApiBaseUrl()}/api/mongodb/collections`;

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || res.statusText || 'Generic API Error');
  }
  return json.data as T;
}

export const genericApi = {
  list: <T = any>(collection: string, limit = 500) => 
    req<T[]>(`/${collection}/documents?limit=${limit}`),
    
  get: <T = any>(collection: string, id: string) => 
    req<T>(`/${collection}/documents/${id}`),
    
  create: <T = any>(collection: string, payload: any) => 
    req<T>(`/${collection}/documents`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    
  update: <T = any>(collection: string, id: string, payload: any) => 
    req<T>(`/${collection}/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
    
  delete: (collection: string, id: string) => 
    req<any>(`/${collection}/documents/${id}`, {
      method: 'DELETE',
    }),
};
