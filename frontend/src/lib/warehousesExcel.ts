import * as XLSX from 'xlsx';

export const WAREHOUSE_EXCEL_HEADERS = ['name', 'location', 'description'] as const;

export const WAREHOUSE_EXCEL_HEADER_LABELS = {
  name: 'Nom entrepôt',
  location: 'Emplacement',
  description: 'Description',
} as const;

export type WarehouseExcelRow = {
  name: string;
  location: string;
  description: string;
};

const HEADER_ALIASES: Record<(typeof WAREHOUSE_EXCEL_HEADERS)[number], string[]> = {
  name: ['name', 'nom', 'nom entrepot', 'nom entrepôt', 'warehouse name', 'warehouse_name'],
  location: ['location', 'emplacement', 'lieu', 'adresse', 'address'],
  description: ['description', 'desc', 'capacity', 'capacite', 'capacité'],
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

function mapHeaderKey(raw: unknown): (typeof WAREHOUSE_EXCEL_HEADERS)[number] | null {
  const n = normalizeHeader(raw);
  if (!n) return null;
  for (const key of WAREHOUSE_EXCEL_HEADERS) {
    if (HEADER_ALIASES[key].some((alias) => normalizeHeader(alias) === n)) return key;
  }
  if (n === normalizeHeader(WAREHOUSE_EXCEL_HEADER_LABELS.name)) return 'name';
  if (n === normalizeHeader(WAREHOUSE_EXCEL_HEADER_LABELS.location)) return 'location';
  if (n === normalizeHeader(WAREHOUSE_EXCEL_HEADER_LABELS.description)) return 'description';
  return null;
}

function cellStr(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

export function downloadWarehousesExcelTemplate(filename = 'modele-entrepots.xlsx'): void {
  const headerRow = WAREHOUSE_EXCEL_HEADERS.map((k) => WAREHOUSE_EXCEL_HEADER_LABELS[k]);
  const exampleRow = ['Entrepôt principal', 'Djibouti', 'Stock général'];
  const blankRows = Array.from({ length: 10 }, () => ['', '', '']);
  const ws = XLSX.utils.aoa_to_sheet([headerRow, exampleRow, ...blankRows]);
  ws['!cols'] = [{ wch: 28 }, { wch: 28 }, { wch: 40 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Entrepots');
  XLSX.writeFile(wb, filename);
}

export async function parseWarehousesExcelFile(file: File): Promise<WarehouseExcelRow[]> {
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
  const colMap: Partial<Record<(typeof WAREHOUSE_EXCEL_HEADERS)[number], number>> = {};
  headerCells.forEach((cell, idx) => {
    const key = mapHeaderKey(cell);
    if (key && colMap[key] == null) colMap[key] = idx;
  });

  const hasMapped = Object.keys(colMap).length > 0;
  if (!hasMapped) {
    colMap.name = 0;
    colMap.location = 1;
    colMap.description = 2;
  }

  const nameIdx = colMap.name ?? 0;
  const locIdx = colMap.location ?? 1;
  const descIdx = colMap.description ?? 2;
  const startRow = hasMapped ? 1 : 0;
  const result: WarehouseExcelRow[] = [];

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i] || [];
    const name = cellStr(row[nameIdx]);
    const location = cellStr(row[locIdx]);
    const description = cellStr(row[descIdx]);
    if (!name) continue;
    if (normalizeHeader(name) === normalizeHeader('Entrepôt principal') && i === startRow) {
      // garder l'exemple si l'utilisateur le remplit vraiment ; on ignore seulement s'il est inchangé?
      // Comme produits: ignorer la ligne d'exemple exacte
    }
    if (name === 'Entrepôt principal' && location === 'Djibouti' && description === 'Stock général') {
      continue;
    }
    result.push({ name, location, description });
  }

  return result;
}
