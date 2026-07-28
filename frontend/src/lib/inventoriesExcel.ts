import * as XLSX from 'xlsx';

export const INVENTORY_EXCEL_HEADERS = ['product', 'warehouse', 'quantity'] as const;

export const INVENTORY_EXCEL_HEADER_LABELS = {
  product: 'Produit',
  warehouse: 'Entrepôt',
  quantity: 'Quantité',
} as const;

export type InventoryExcelRow = {
  product: string;
  warehouse: string;
  quantity: string;
};

const HEADER_ALIASES: Record<(typeof INVENTORY_EXCEL_HEADERS)[number], string[]> = {
  product: ['product', 'produit', 'product name', 'nom produit', 'product_name'],
  warehouse: ['warehouse', 'entrepot', 'entrepôt', 'warehouse name', 'nom entrepot'],
  quantity: ['quantity', 'quantite', 'quantité', 'qty', 'qte', 'stock'],
};

function normalizeHeader(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function mapHeaderKey(raw: unknown): (typeof INVENTORY_EXCEL_HEADERS)[number] | null {
  const n = normalizeHeader(raw);
  if (!n) return null;
  for (const key of INVENTORY_EXCEL_HEADERS) {
    if (HEADER_ALIASES[key].some((alias) => normalizeHeader(alias) === n)) return key;
  }
  if (n === normalizeHeader(INVENTORY_EXCEL_HEADER_LABELS.product)) return 'product';
  if (n === normalizeHeader(INVENTORY_EXCEL_HEADER_LABELS.warehouse)) return 'warehouse';
  if (n === normalizeHeader(INVENTORY_EXCEL_HEADER_LABELS.quantity)) return 'quantity';
  return null;
}

function cellStr(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

export function downloadInventoriesExcelTemplate(filename = 'modele-inventaire.xlsx'): void {
  const headerRow = INVENTORY_EXCEL_HEADERS.map((k) => INVENTORY_EXCEL_HEADER_LABELS[k]);
  const exampleRow = ['Exemple produit', 'Entrepôt principal', '100'];
  const blankRows = Array.from({ length: 10 }, () => ['', '', '']);
  const ws = XLSX.utils.aoa_to_sheet([headerRow, exampleRow, ...blankRows]);
  ws['!cols'] = [{ wch: 28 }, { wch: 28 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventaire');
  XLSX.writeFile(wb, filename);
}

export async function parseInventoriesExcelFile(file: File): Promise<InventoryExcelRow[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];

  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as unknown[][];

  if (!rows.length) return [];

  const headerCells = (rows[0] || []) as unknown[];
  const colMap: Partial<Record<(typeof INVENTORY_EXCEL_HEADERS)[number], number>> = {};
  headerCells.forEach((cell, idx) => {
    const key = mapHeaderKey(cell);
    if (key && colMap[key] == null) colMap[key] = idx;
  });

  const hasMapped = Object.keys(colMap).length > 0;
  if (!hasMapped) {
    colMap.product = 0;
    colMap.warehouse = 1;
    colMap.quantity = 2;
  }

  const pIdx = colMap.product ?? 0;
  const wIdx = colMap.warehouse ?? 1;
  const qIdx = colMap.quantity ?? 2;
  const startRow = hasMapped ? 1 : 0;
  const result: InventoryExcelRow[] = [];

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i] || [];
    const product = cellStr(row[pIdx]);
    const warehouse = cellStr(row[wIdx]);
    const quantity = cellStr(row[qIdx]);
    if (!product && !warehouse) continue;
    if (
      product === 'Exemple produit' &&
      warehouse === 'Entrepôt principal' &&
      quantity === '100'
    ) {
      continue;
    }
    if (!product || !warehouse) continue;
    result.push({ product, warehouse, quantity });
  }

  return result;
}

/** Résout un libellé vers un id produit/entrepôt (correspondance exacte puis insensible à la casse). */
export function resolveNamedId(
  label: string,
  items: { id: string; _id?: string; name?: string }[]
): string {
  const needle = label.trim();
  if (!needle) return '';
  const exact = items.find((x) => (x.name || '').trim() === needle);
  if (exact) return exact._id || exact.id;
  const lower = needle.toLowerCase();
  const soft = items.find((x) => (x.name || '').trim().toLowerCase() === lower);
  return soft ? soft._id || soft.id : '';
}
