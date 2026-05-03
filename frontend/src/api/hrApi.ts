import { getApiBaseUrl } from '../lib/apiBase';

export interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  gender: string;
  birth_place?: string;
  nationality?: string;
  civil_status?: string;
  judicial_record?: string;
  residence_status: string;
  identification_type: string;
  identification_number?: string;
  address?: string;
  phone_number?: string;
  email?: string;
  emergency_contact?: string;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  employee_type: string;
  profession?: string;
  contract_type?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  employment_date?: string;
  allow_end_date: boolean;
  status?: string;
  absent_days?: number;
  leave_days_remaining?: number;
  created_at: string;
}

const base = () => `${getApiBaseUrl()}/api/hr/employees`;

async function reqData<T>(...args: Parameters<typeof fetch>): Promise<T> {
  const res = await fetch(...args);
  const body = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(String(body?.message || res.statusText));
  }
  return body as T;
}

export async function fetchEmployees() {
  return reqData<Employee[]>(base());
}

export async function fetchEmployee(id: string) {
  return reqData<Employee>(`${base()}/${encodeURIComponent(id)}`);
}

export async function createEmployee(payload: Partial<Employee>) {
  return reqData<Employee>(base(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateEmployee(id: string, payload: Partial<Employee>) {
  return reqData<Employee>(`${base()}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteEmployee(id: string) {
  const res = await fetch(`${base()}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
}
