import { getApiBaseUrl } from '../lib/apiBase';

export interface DashboardRecentFile {
  id: string;
  jobNumber: string;
  client: string;
  status: string;
  fileType: string;
  createdAt: string | null;
}

export interface DashboardMonthlyActivity {
  label: string;
  files: number;
  transports: number;
}

export interface DashboardStats {
  overview: {
    totalRevenue: number;
    revenueMoM: string;
    totalOrders: number;
    ordersMoM: string;
    activeEmployees: number;
    onLeaveEmployees: number;
    totalExpenses: number;
    expenseMoM: string;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
  };
  transit: {
    logisticsFiles: {
      total: number;
      open: number;
      operation_started: number;
      completed: number;
      cancelled: number;
    };
    operations: {
      activeTransports: number;
      totalTransports: number;
      reservations: number;
      pendingExpenseRequests: number;
      pendingPurchases: number;
      monthlySales: number;
    };
    fleet: {
      vehicles: number;
      drivers: number;
    };
    recentFiles: DashboardRecentFile[];
    monthlyActivity: DashboardMonthlyActivity[];
  };
}

const base = () => `${getApiBaseUrl()}/api/dashboard`;

async function reqData<T>(...args: Parameters<typeof fetch>): Promise<T> {
  const res = await fetch(...args);
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(String(body?.message || res.statusText));
  }
  return body as T;
}

export async function fetchDashboardStats() {
  return reqData<DashboardStats>(`${base()}/stats`);
}
