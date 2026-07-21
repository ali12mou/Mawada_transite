import type { DocumentBranding } from '../types/documentBranding';
import { fetchDocumentBranding } from './documentBranding';
import { buildLetterheadHtml } from './documentPrintImages';
import {
  buildDocWatermark,
  buildMawadaContactFooterHtml,
  letterheadBannerPrintCss,
  mawadaContactFooterPrintCss,
  pinnedDocFooterPrintCss,
  watermarkPrintCss,
} from './chamberDocumentPrintShared';
import { STYLE_A4_SHEET, appendAutoPrintBeforeBodyClose } from './printA4';

function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtFdj(n: number): string {
  if (!Number.isFinite(n)) return 'Fdj0.00';
  return `Fdj${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPrintDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function displayStatus(status: string): string {
  const s = String(status ?? '').trim();
  if (!s) return '—';
  const lower = s.toLowerCase();
  if (lower === 'checked' || lower === 'approved') return 'Checked';
  if (lower === 'pending') return 'Pending';
  if (lower === 'completed') return 'Completed';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export type OrderPrintRow = {
  order_number: string;
  client_name: string;
  source_destination: string;
  total: number;
  status: string;
};

export type OrdersPrintOptions = {
  generatedBy: string;
  printDate?: Date;
  location?: string;
};

export function buildOrdersPrintHtml(
  rows: OrderPrintRow[],
  branding: DocumentBranding,
  options: OrdersPrintOptions
): string {
  const generatedBy = (options.generatedBy || '—').trim();
  const when = options.printDate ?? new Date();
  const location =
    (options.location || branding.companyAddress || 'Djibouti').split(',')[0].trim() || 'Djibouti';
  const grandTotal = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);
  const letter = buildLetterheadHtml(branding);
  const footer = buildMawadaContactFooterHtml(branding);
  const wm = buildDocWatermark(branding);

  const bodyRows = rows.length
    ? rows
        .map(
          (r) => `
      <tr>
        <td class="td-ref">${esc(r.order_number)}</td>
        <td class="td-client">${esc(r.client_name)}</td>
        <td class="td-source">${esc(r.source_destination || '—')}</td>
        <td class="td-total">${esc(fmtFdj(Number(r.total) || 0))}</td>
        <td class="td-status">${esc(displayStatus(r.status))}</td>
      </tr>`
        )
        .join('')
    : `<tr><td colspan="5" class="td-empty">—</td></tr>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>DÉTAILS DE LA COMMANDE</title>
  <style>
    ${STYLE_A4_SHEET}
    ${letterheadBannerPrintCss()}
    ${mawadaContactFooterPrintCss()}
    ${pinnedDocFooterPrintCss('sheet')}
    ${watermarkPrintCss()}
    @page { size: A4 portrait; margin: 14mm 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      color: #111;
      margin: 0;
      padding: 0;
      line-height: 1.35;
    }
    h1 {
      text-align: center;
      font-size: 16pt;
      font-weight: 700;
      margin: 10px 0 14px;
      letter-spacing: 0.02em;
    }
    .meta {
      margin-bottom: 12px;
      font-size: 10pt;
    }
    .meta-line { margin: 2px 0; }
    .tbl {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-top: 4px;
    }
    .tbl thead th {
      border: 1px solid #333;
      padding: 7px 6px;
      text-align: left;
      font-weight: 700;
      background: #fff;
    }
    .tbl td {
      border: 1px solid #333;
      padding: 6px;
      vertical-align: top;
    }
    .td-ref { width: 14%; white-space: nowrap; }
    .td-client { width: 28%; }
    .td-source { width: 28%; }
    .td-total { width: 16%; white-space: nowrap; }
    .td-status { width: 14%; }
    .td-empty { text-align: center; padding: 20px; }
    .total-row td {
      font-weight: 700;
      border: 1px solid #333;
      padding: 8px 6px;
    }
    .total-label { text-align: right; }
    .signature {
      margin-top: 28px;
      font-size: 10pt;
      font-weight: 600;
    }
    .sig-line {
      display: inline-block;
      min-width: 220px;
      border-bottom: 1px solid #111;
      margin-left: 6px;
      vertical-align: bottom;
      height: 14px;
    }
    .doc-footer { padding-top: 20px; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; break-inside: avoid; }
  </style>
</head>
<body>
  <div class="sheet">
    ${wm}
    ${letter}
    <h1>DÉTAILS DE LA COMMANDE</h1>
    <div class="meta">
      <div class="meta-line">Généré par: ${esc(generatedBy)}</div>
      <div class="meta-line">${esc(location)}, ${esc(fmtPrintDate(when))}</div>
    </div>

    <table class="tbl">
      <thead>
        <tr>
          <th>Référence</th>
          <th>Client</th>
          <th>Source</th>
          <th>Total (Fdj)</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        ${bodyRows}
        <tr class="total-row">
          <td colspan="3" class="total-label">TOTAL</td>
          <td>${esc(fmtFdj(grandTotal))}</td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <div class="page-bottom">
      <div class="signature">
        Signature:<span class="sig-line"></span>
      </div>

      <footer class="doc-footer">${footer}</footer>
    </div>
  </div>
</body>
</html>`;
}

export async function openOrdersPrintWindow(
  rows: OrderPrintRow[],
  generatedBy: string,
  options?: Partial<OrdersPrintOptions>
): Promise<void> {
  const branding = await fetchDocumentBranding();
  const html = buildOrdersPrintHtml(rows, branding, {
    generatedBy,
    printDate: options?.printDate,
    location: options?.location,
  });
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up pour imprimer.');
    return;
  }
  w.document.open();
  w.document.write(appendAutoPrintBeforeBodyClose(html));
  w.document.close();
}

export function orderToPrintRow(order: {
  order_number: string;
  client_name: string;
  source_destination?: string;
  total?: number;
  status?: string;
}): OrderPrintRow {
  return {
    order_number: order.order_number,
    client_name: order.client_name,
    source_destination: order.source_destination || '',
    total: Number(order.total) || 0,
    status: order.status || 'PENDING',
  };
}
