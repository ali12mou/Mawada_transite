import { getApiBaseUrl } from '../lib/apiBase';

export interface OrderData {
  _id?: string;
  order_number: string;
  bl_number: string;
  client_name: string;
  client_phone?: string;
  source_destination: string;
  item_price: string;
  amount_djf: number;
  quantity: number;
  recharge_amount: number;
  maritime_line_fees: number;
  sgtd_wharfage: number;
  document_9: number;
  document_4: number;
  port_handling: number;
  port_passage: number;
  file_fees: number;
  escort_fees: number;
  transport: number;
  elevator_cart: number;
  ctn: number;
  chamber: number;
  exit: number;
  transit: number;
  total_services: number;
  total_item_price: number;
  profit_amount: number;
  total: number;
  ci_amount: number;
  order_date: string;
  delivery_status: string;
  status: string;
  created_by?: string;
  createdAt?: string;
  updatedAt?: string;
}

async function parseJson(res: Response): Promise<{ message?: string; data?: unknown, [key: string]: any }> {
  const text = await res.text();
  try {
    return JSON.parse(text) as { message?: string; data?: unknown, [key: string]: any };
  } catch(e) {
    return { error: text };
  }
}

export async function fetchOrders(): Promise<OrderData[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/orders`);
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || body.error || res.statusText);
  // Support both body returning array directly or enclosed in data wrapper
  if (Array.isArray(body)) return body as OrderData[];
  return (body.data as OrderData[]) || [];
}

export async function fetchOrder(id: string): Promise<OrderData> {
  const res = await fetch(`${getApiBaseUrl()}/api/orders/${encodeURIComponent(id)}`);
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || body.error || res.statusText);
  if (body._id) return body as OrderData;
  return body.data as OrderData;
}

export async function createOrder(payload: Partial<OrderData>): Promise<OrderData> {
  const res = await fetch(`${getApiBaseUrl()}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || body.error || res.statusText);
  if (body._id) return body as OrderData;
  return body.data as OrderData;
}

export async function updateOrder(id: string, payload: Partial<OrderData>): Promise<OrderData> {
  const res = await fetch(`${getApiBaseUrl()}/api/orders/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || body.error || res.statusText);
  if (body._id) return body as OrderData;
  return body.data as OrderData;
}

export async function deleteOrder(id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/api/orders/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(body.message || body.error || res.statusText);
}
