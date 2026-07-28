import type { DocumentBranding } from '../types/documentBranding';
import { fetchDocumentBranding } from './documentBranding';
import { buildLetterheadHtml, documentImageSrc } from './documentPrintImages';
import {
  buildDocWatermark,
  buildMawadaContactFooterHtml,
  letterheadBannerPrintCss,
  mawadaContactFooterPrintCss,
  pinnedDocFooterPrintCss,
  watermarkPrintCss,
} from './chamberDocumentPrintShared';
import { STYLE_A4_SHEET } from './printA4';
import { openHtmlPrintThenPdfInBrowser } from './htmlPrintPdf';

const TABLE_GREEN = '#00AA48';

export type ExpenseListPrintRow = {
  reference: string;
  expense_date: string;
  total: number;
  status: string;
};

export type ExpenseListPrintData = {
  generated_by: string;
  print_date?: string;
  rows: ExpenseListPrintRow[];
};

/** @deprecated kept for callers that still pass detail shape — mapped to list rows */
export type ExpensePrintRecord = {
  reference: string;
  expense_date: string;
  generated_by: string;
  status?: string;
  total_amount?: number;
  items?: { name: string; category_name: string; amount: number; quantity?: number }[];
};

function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtMoney(n: number): string {
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtFdj(n: number): string {
  return `Fdj${fmtMoney(n)}`;
}

function formatPrintDate(iso: string): string {
  const raw = String(iso || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  try {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${mo}-${day}`;
    }
  } catch {
    /* ignore */
  }
  return raw || new Date().toISOString().slice(0, 10);
}

function normalizeStatus(status: string): string {
  const s = String(status || '').trim();
  if (!s) return '—';
  if (/^approved$/i.test(s)) return 'Approved';
  if (/^pending$/i.test(s)) return 'Pending';
  return s;
}

export function buildExpenseServicePrintHtml(
  data: ExpenseListPrintData,
  branding: DocumentBranding
): string {
  const green = branding.primaryColor || TABLE_GREEN;
  const letter = buildLetterheadHtml(branding);
  const footer = buildMawadaContactFooterHtml(branding);
  const wm = buildDocWatermark(branding);
  const stampSrc = documentImageSrc(branding.signatureStampUrl || branding.signatureUrl);

  const printDate = formatPrintDate(data.print_date || new Date().toISOString());
  const rows = data.rows.length
    ? data.rows
    : [{ reference: '—', expense_date: '—', total: 0, status: '—' }];

  const bodyRows = rows
    .map((row, i) => {
      return `<tr>
        <td class="c">${i + 1}</td>
        <td>${esc(row.reference || '—')}</td>
        <td>${esc(formatPrintDate(row.expense_date))}</td>
        <td>${esc(fmtFdj(Number(row.total) || 0))}</td>
        <td>${esc(normalizeStatus(row.status))}</td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Détails des dépenses</title>
  <style>
    ${STYLE_A4_SHEET}
    ${letterheadBannerPrintCss()}
    ${mawadaContactFooterPrintCss()}
    ${pinnedDocFooterPrintCss('page-container')}
    ${watermarkPrintCss()}
    @page { size: A4 portrait; margin: 12mm 14mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      color: #111;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .page-container {
      position: relative;
      min-height: 260mm;
      display: flex;
      flex-direction: column;
    }
    .content {
      position: relative;
      z-index: 1;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .title-block {
      text-align: center;
      margin: 18px 0 22px;
    }
    .title-block h1 {
      margin: 0 0 10px;
      font-size: 18pt;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .title-block .meta {
      margin: 0 0 4px;
      font-size: 11pt;
      font-weight: 500;
    }
    .tbl {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    .tbl th {
      background: ${esc(green)};
      color: #fff;
      font-weight: 700;
      font-size: 10pt;
      text-align: left;
      padding: 10px 12px;
      border: 1px solid #c8c8c8;
    }
    .tbl td {
      border: 1px solid #c8c8c8;
      padding: 10px 12px;
      font-size: 10.5pt;
      color: #222;
      text-align: left;
      background: #fff;
    }
    .tbl td.c { text-align: center; width: 44px; }
    .signature-area {
      margin: 8px 0 18px;
      display: flex;
      align-items: flex-end;
      gap: 12px;
    }
    .sig-label { font-size: 11pt; font-weight: 600; }
    .sig-line {
      border-bottom: 1px solid #333;
      width: 160px;
      height: 28px;
    }
    .stamp-img {
      height: 72px;
      max-width: 180px;
      object-fit: contain;
    }
    .doc-footer { padding-top: 0; }
    .page-bottom { margin-top: auto; }
  </style>
</head>
<body>
  <div class="page-container">
    ${wm}
    <div class="content">
      ${letter}

      <div class="title-block">
        <h1>DÉTAILS DES DÉPENSES</h1>
        <p class="meta">Généré par: ${esc(data.generated_by || '—')}</p>
        <p class="meta">DATE: ${esc(printDate)}</p>
      </div>

      <table class="tbl">
        <thead>
          <tr>
            <th>#</th>
            <th>Reference</th>
            <th>Date de la Dépense</th>
            <th>Total</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>

      <div class="page-bottom">
        <div class="signature-area">
          <span class="sig-label">Signature:</span>
          <div class="sig-line"></div>
          ${stampSrc ? `<img src="${esc(stampSrc)}" class="stamp-img" alt="" />` : ''}
        </div>
        <footer class="doc-footer">${footer}</footer>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function toListData(
  input: ExpenseListPrintData | ExpensePrintRecord | ExpensePrintRecord[]
): ExpenseListPrintData {
  if (Array.isArray(input)) {
    const first = input[0];
    return {
      generated_by: first?.generated_by || '—',
      print_date: new Date().toISOString(),
      rows: input.map((r) => ({
        reference: r.reference,
        expense_date: r.expense_date,
        total:
          r.total_amount ??
          (r.items || []).reduce(
            (s, it) => s + (Number(it.amount) || 0) * (Number(it.quantity) || 1),
            0
          ),
        status: r.status || '—',
      })),
    };
  }
  if ('rows' in input) return input;
  return {
    generated_by: input.generated_by,
    print_date: new Date().toISOString(),
    rows: [
      {
        reference: input.reference,
        expense_date: input.expense_date,
        total:
          input.total_amount ??
          (input.items || []).reduce(
            (s, it) => s + (Number(it.amount) || 0) * (Number(it.quantity) || 1),
            0
          ),
        status: input.status || '—',
      },
    ],
  };
}

export async function openExpenseServicePrint(
  record: ExpenseListPrintData | ExpensePrintRecord
): Promise<void> {
  const branding = await fetchDocumentBranding();
  const data = toListData(record);
  const html = buildExpenseServicePrintHtml(data, branding);
  const safe = String(data.rows[0]?.reference || 'depense')
    .replace(/[^\w\-]+/g, '-')
    .slice(0, 40);
  await openHtmlPrintThenPdfInBrowser(html, `Details-Depenses-${safe}.pdf`);
}

/** Une ou plusieurs dépenses dans le même tableau. */
export async function openExpenseServicePrintMany(
  records: ExpensePrintRecord[] | ExpenseListPrintData
): Promise<void> {
  const branding = await fetchDocumentBranding();
  const data = Array.isArray(records)
    ? toListData(records)
    : records;
  if (!data.rows.length) return;
  const html = buildExpenseServicePrintHtml(data, branding);
  await openHtmlPrintThenPdfInBrowser(html, 'Details-Depenses.pdf');
}
