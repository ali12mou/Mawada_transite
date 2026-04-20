/** Base URL de l’API Express (Mongo + transit). */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (raw?.trim()) {
    return raw.trim().replace(/\/$/, '');
  }
  const port = import.meta.env.VITE_API_PORT as string | undefined;
  const p = port?.trim() || '4000';
  return `http://127.0.0.1:${p}`;
}
