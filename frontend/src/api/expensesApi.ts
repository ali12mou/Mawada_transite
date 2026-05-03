import { getApiBaseUrl } from '../lib/apiBase';

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface ExpenseItem {
  id?: string;
  expense_category_id: string;
  name: string;
  amount: number;
  description: string;
  check_number: string;
}

export interface Expense {
  id: string;
  reference_number: string;
  expense_date: string;
  initial_balance: number;
  total_amount: number;
  final_balance: number;
  status: string;
  created_at: string;
  items: ExpenseItem[];
}

const base = () => `${getApiBaseUrl()}/api/expenses`;

async function reqData<T>(...args: Parameters<typeof fetch>): Promise<T> {
  const res = await fetch(...args);
  const body = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(String(body?.message || res.statusText));
  }
  return body as T;
}

// Categories
export async function fetchCategories() {
  return reqData<ExpenseCategory[]>(`${base()}/categories`);
}

export async function createCategory(payload: Partial<ExpenseCategory>) {
  return reqData<ExpenseCategory>(`${base()}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(id: string, payload: Partial<ExpenseCategory>) {
  return reqData<ExpenseCategory>(`${base()}/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(id: string) {
  const res = await fetch(`${base()}/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
}

// Expenses
export async function fetchExpenses() {
  return reqData<Expense[]>(base());
}

export async function fetchExpense(id: string) {
  return reqData<Expense>(`${base()}/${encodeURIComponent(id)}`);
}

export async function createExpense(payload: Partial<Expense>) {
  return reqData<Expense>(base(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateExpense(id: string, payload: Partial<Expense>) {
  return reqData<Expense>(`${base()}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function approveExpense(id: string) {
  return reqData<Expense>(`${base()}/${encodeURIComponent(id)}/approve`, {
    method: 'PATCH',
  });
}

export async function deleteExpense(id: string) {
  const res = await fetch(`${base()}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
}
