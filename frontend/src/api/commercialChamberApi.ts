import { getApiBaseUrl } from '../lib/apiBase';

export interface CommercialChamberRecord {
  id: string;
  commercial_no: string;
  client_name: string;
  responsible: string;
  goods_description: string;
  chamber_service_amount: number;
  service_charge: number;
  bank_commission_fee: number;
  transport_dhl: number;
  total: number;
  certificate_fee: number;
  commercial_invoice_no: string;
  commercial_invoice_date: string;
  purchase_order_no: string;
  purchase_order_date: string;
  quantity: string;
  unit_price: number;
  percentage: number;
  tell: string;
  timno: string;
  created_at?: string;
  updated_at?: string;
}

async function parseJson(res: Response): Promise<{ message?: string; data?: unknown }> {
  return (await res.json().catch(() => ({}))) as { message?: string; data?: unknown };
}

export async function fetchCommercialChambers(): Promise<CommercialChamberRecord[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/commercial-chamber`);
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return (body.data as CommercialChamberRecord[]) || [];
}

export async function fetchCommercialChamber(id: string): Promise<CommercialChamberRecord> {
  const res = await fetch(`${getApiBaseUrl()}/api/commercial-chamber/${encodeURIComponent(id)}`);
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return body.data as CommercialChamberRecord;
}

export async function createCommercialChamber(payload: Record<string, unknown>): Promise<CommercialChamberRecord> {
  const res = await fetch(`${getApiBaseUrl()}/api/commercial-chamber`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return body.data as CommercialChamberRecord;
}

export async function updateCommercialChamber(
  id: string,
  payload: Record<string, unknown>
): Promise<CommercialChamberRecord> {
  const res = await fetch(`${getApiBaseUrl()}/api/commercial-chamber/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
  return body.data as CommercialChamberRecord;
}

export async function deleteCommercialChamber(id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/api/commercial-chamber/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || res.statusText);
}


