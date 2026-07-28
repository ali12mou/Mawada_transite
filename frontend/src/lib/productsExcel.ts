import * as XLSX from 'xlsx';

/** En-têtes du modèle Excel produits (ordre fixe). */
export const PRODUCT_EXCEL_HEADERS = ['name', 'description', 'unit_weight'] as const;

export const PRODUCT_EXCEL_HEADER_LABELS = {
  name: 'Nom du produit',
  description: 'Description',
  unit_weight: 'Poids unitaire',
} as const;

export type ProductExcelRow = {
  name: string;
  description: string;
  unit_weight: string;
};

const HEADER_ALIASES: Record<(typeof PRODUCT_EXCEL_HEADERS)[number], string[]> = {
  name: ['name', 'nom', 'nom du produit', 'nomproduit', 'product name', 'product_name'],
  description: ['description', 'desc', 'product description'],
  unit_weight: [
    'unit_weight',
    'unit weight',
    'poids unitaire',
    'poidsunitaire',
    'weight',
    'poids',
  ],
};

function normalizeHeader(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function mapHeaderKey(raw: unknown): (typeof PRODUCT_EXCEL_HEADERS)[number] | null {
  const n = normalizeHeader(raw);
  if (!n) return null;
  for (const key of PRODUCT_EXCEL_HEADERS) {
    if (HEADER_ALIASES[key].some((alias) => normalizeHeader(alias) === n)) return key;
  }
  // Labels FR du modèle
  if (n === normalizeHeader(PRODUCT_EXCEL_HEADER_LABELS.name)) return 'name';
  if (n === normalizeHeader(PRODUCT_EXCEL_HEADER_LABELS.description)) return 'description';
  if (n === normalizeHeader(PRODUCT_EXCEL_HEADER_LABELS.unit_weight)) return 'unit_weight';
  return null;
}

/** Télécharge un modèle Excel vide prêt à saisir. */
export function downloadProductsExcelTemplate(filename = 'modele-produits.xlsx'): void {
  const headerRow = PRODUCT_EXCEL_HEADERS.map((k) => PRODUCT_EXCEL_HEADER_LABELS[k]);
  // Lignes vides pour saisie + une ligne d'exemple commentée via valeurs indicatives
  const exampleRow = ['Exemple produit', 'Description exemple', '50 kg'];
  const blankRows = Array.from({ length: 10 }, () => ['', '', '']);

  const aoa = [headerRow, exampleRow, ...blankRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 28 }, { wch: 40 }, { wch: 18 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Produits');
  XLSX.writeFile(wb, filename);
}

function cellStr(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

/** Parse un fichier Excel / CSV et retourne les lignes produits valides. */
export async function parseProductsExcelFile(file: File): Promise<ProductExcelRow[]> {
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
  const colMap: Partial<Record<(typeof PRODUCT_EXCEL_HEADERS)[number], number>> = {};
  headerCells.forEach((cell, idx) => {
    const key = mapHeaderKey(cell);
    if (key && colMap[key] == null) colMap[key] = idx;
  });

  // Fallback: si pas d'en-têtes reconnus, considérer l'ordre fixe Nom / Description / Poids
  const hasMapped = Object.keys(colMap).length > 0;
  if (!hasMapped) {
    colMap.name = 0;
    colMap.description = 1;
    colMap.unit_weight = 2;
  }

  const nameIdx = colMap.name ?? 0;
  const descIdx = colMap.description ?? 1;
  const weightIdx = colMap.unit_weight ?? 2;

  const startRow = hasMapped ? 1 : 0;
  const result: ProductExcelRow[] = [];

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i] || [];
    const name = cellStr(row[nameIdx]);
    const description = cellStr(row[descIdx]);
    const unit_weight = cellStr(row[weightIdx]);
    if (!name) continue;
    // Ignorer la ligne d'exemple du modèle
    if (name.toLowerCase() === 'exemple produit') continue;
    result.push({ name, description, unit_weight });
  }

  return result;
}
