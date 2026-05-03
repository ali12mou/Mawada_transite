import { getApiBaseUrl } from '../lib/apiBase';

export interface DashboardStats {
  overview: {
    totalRevenue: number;
    revenueMoM: string;
    totalOrders: number;
    ordersMoM: string;
    activeEmployees: number;
    totalExpenses: number;
    expenseMoM: string;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
  };
}

const base = () => `${getApiBaseUrl()}/api/dashboard`;

async function reqData<T>(...args: Parameters<typeof fetch>): Promise<T> {
  const res = await fetch(...args);
  const body = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(String(body?.message || res.statusText));
  }
  return body as T;
}

export async function fetchDashboardStats() {
  return reqData<DashboardStats>(`${base()}/stats`);
}
