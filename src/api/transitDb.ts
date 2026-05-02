/**
 * Données modules GEOSOM TRANSIT via l’API Express (`/api/transit`), qui relaie Supabase côté serveur.
 * Plus besoin de VITE_SUPABASE_* dans le navigateur.
 */
import { getApiBaseUrl } from '../lib/apiBase';
import type {
  LogisticsFile,
  LogisticsFileGoods,
  LogisticsFileContainer,
  TransportationRecord,
  BulkTransportRecord,
  CarReservation,
  TransitVehicle,
  TransitDriver,
  ExpenseRequest,
  PurchaseRequest,
  SalesOrder,
} from '../types/geosomTransit';

const base = () => `${getApiBaseUrl()}/api/transit`;

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

async function reqOk(path: string, init?: RequestInit): Promise<void> {
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(String(body.message || res.statusText));
  }
}

async function reqData<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(String(body.message || res.statusText));
  }
  if (!('data' in body)) {
    throw new Error('Réponse API invalide (data manquant)');
  }
  return body.data as T;
}

export async function listLogisticsFilesBrief() {
  return reqData<
    Pick<LogisticsFile, 'id' | 'job_number' | 'company_name' | 'contact_name' | 'status'>[]
  >('/logistics-files/brief');
}

export async function listLogisticsFiles(params?: { status?: string; search?: string }) {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.search?.trim()) q.set('search', params.search.trim());
  const qs = q.toString();
  return reqData<LogisticsFile[]>(`/logistics-files${qs ? `?${qs}` : ''}`);
}

export async function getLogisticsFile(id: string) {
  return reqData<LogisticsFile>(`/logistics-files/${encodeURIComponent(id)}`);
}

export async function getGoodsByFileId(fileId: string) {
  return reqData<LogisticsFileGoods | null>(`/logistics-files/${encodeURIComponent(fileId)}/goods`);
}

export async function getContainersByFileId(fileId: string) {
  return reqData<LogisticsFileContainer[]>(
    `/logistics-files/${encodeURIComponent(fileId)}/containers`
  );
}

export async function upsertLogisticsFile(payload: Partial<LogisticsFile> & { job_number?: string }) {
  return reqData<LogisticsFile>('/logistics-files', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function upsertFileGoods(fileId: string, goods: Partial<LogisticsFileGoods>) {
  return reqData<LogisticsFileGoods>(`/logistics-files/${encodeURIComponent(fileId)}/goods`, {
    method: 'PUT',
    body: JSON.stringify(goods),
  });
}

export async function replaceContainers(fileId: string, lines: Partial<LogisticsFileContainer>[]) {
  await reqOk(`/logistics-files/${encodeURIComponent(fileId)}/containers`, {
    method: 'PUT',
    body: JSON.stringify({ lines }),
  });
}

export async function logStatusChange(
  entityType: string,
  entityId: string,
  from: string | null,
  to: string | null,
  note?: string
) {
  await reqOk('/entity-status-history', {
    method: 'POST',
    body: JSON.stringify({ entityType, entityId, from, to, note }),
  });
}

export async function listTransportationRecords() {
  return reqData<TransportationRecord[]>('/transportation-records');
}

export async function createTransportationRecord(
  payload: Omit<TransportationRecord, 'id' | 'created_at' | 'updated_at'>
) {
  return reqData<TransportationRecord>('/transportation-records', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listBulkTransportRecords() {
  return reqData<BulkTransportRecord[]>('/bulk-transport-records');
}

export async function createBulkTransportRecord(
  payload: Omit<BulkTransportRecord, 'id' | 'created_at' | 'updated_at'>
) {
  return reqData<BulkTransportRecord>('/bulk-transport-records', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listCarReservations() {
  return reqData<CarReservation[]>('/car-reservations');
}

export async function upsertCarReservation(payload: Partial<CarReservation>) {
  return reqData<CarReservation>('/car-reservations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listVehicles() {
  return reqData<TransitVehicle[]>('/vehicles');
}

export async function listDrivers() {
  return reqData<TransitDriver[]>('/drivers');
}

export async function upsertVehicle(payload: Partial<TransitVehicle>) {
  return reqData<TransitVehicle>('/vehicles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function upsertDriver(payload: Partial<TransitDriver>) {
  return reqData<TransitDriver>('/drivers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listExpenseRequests() {
  return reqData<ExpenseRequest[]>('/expense-requests');
}

export async function listPurchaseRequests() {
  return reqData<PurchaseRequest[]>('/purchase-requests');
}

export async function listSalesOrders() {
  return reqData<SalesOrder[]>('/sales-orders');
}

export async function createExpenseRequest(payload: Partial<ExpenseRequest>) {
  return reqData<ExpenseRequest>('/expense-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createPurchaseRequest(payload: Partial<PurchaseRequest>) {
  return reqData<PurchaseRequest>('/purchase-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createSalesOrder(payload: Partial<SalesOrder>) {
  return reqData<SalesOrder>('/sales-orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listVendors() {
  return reqData<unknown[]>('/vendors');
}

export async function listAccountingInvoices() {
  return reqData<unknown[]>('/accounting/invoices');
}

export async function listAccountingVendorBills() {
  return reqData<unknown[]>('/accounting/vendor-bills');
}

/** Facture de chambre — tables `chamber_invoice`, `chamber_invoice_items`, etc. (API `/api/transit`). */
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

export async function listChamberInvoices() {
  return reqData<ChamberInvoiceListRow[]>('/chamber-invoices');
}

export async function getChamberInvoiceFull(id: string) {
  return reqData<ChamberInvoiceFullPayload>(`/chamber-invoices/${encodeURIComponent(id)}`);
}

export async function createChamberInvoice(payload: {
  header: Record<string, string>;
  items: unknown[];
  packingList: Record<string, string>;
  originalLetter: Record<string, string>;
}) {
  return reqData<Record<string, unknown>>('/chamber-invoices', {
    method: 'POST',
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
  return reqData<ChamberInvoiceFullPayload>(`/chamber-invoices/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteChamberInvoice(id: string) {
  await reqOk(`/chamber-invoices/${encodeURIComponent(id)}`, { method: 'DELETE' });
}


