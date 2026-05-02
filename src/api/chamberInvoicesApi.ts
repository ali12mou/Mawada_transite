import { getApiBaseUrl } from '../lib/apiBase';

export interface ChamberInvoiceListRow {
  id: string;
  consignee_name: string;
  tin: string;
  payment_conditions: string;
  currency: string;
  created_at: string;
}

export interface ChamberInvoiceFullPayload {
  invoice: Record<string, unknown>;
  items: Record<string, unknown>[];
  packing: Record<string, unknown> | null;
  letter: Record<string, unknown> | null;
}

const base = () => `${getApiBaseUrl()}/api/chamber-invoices`;

async function reqData<T>(...args: Parameters<typeof fetch>): Promise<T> {
  const res = await fetch(...args);
  const body = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(String(body?.message || res.statusText));
  }
  return body as T;
}

export async function listChamberInvoices() {
  return reqData<ChamberInvoiceListRow[]>(base());
}

export async function getChamberInvoiceFull(id: string) {
  return reqData<ChamberInvoiceFullPayload>(`${base()}/${encodeURIComponent(id)}`);
}

export async function createChamberInvoice(payload: {
  header: Record<string, string>;
  items: unknown[];
  packingList: Record<string, string>;
  originalLetter: Record<string, string>;
}) {
  return reqData<Record<string, unknown>>(base(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateChamberInvoice(
  id: string,
  payload: {
    header: Record<string, string>;
    items: unknown[];
    packingList: Record<string, string>;
    originalLetter: Record<string, string>;
  }
) {
  return reqData<ChamberInvoiceFullPayload>(`${base()}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteChamberInvoice(id: string) {
  await fetch(`${base()}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
