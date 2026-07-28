import type { DocumentBranding } from '../types/documentBranding';
import { fetchDocumentBranding } from './documentBranding';
import { buildLetterheadHtml, documentImageSrc } from './documentPrintImages';
import {
  buildDocWatermark,
  buildMawadaContactFooterHtml,
  letterheadBannerPrintCss,
  mawadaContactFooterPrintCss,
  watermarkPrintCss,
} from './chamberDocumentPrintShared';
import { openHtmlPrintThenPdfInBrowser } from './htmlPrintPdf';
import { COMMERCIAL_CHAMBER_DJF_RATE, parseLocalizedNumber } from './commercialChamberCalculations';

const TABLE_GREEN = '#00AA48';
const TABLE_GREEN_DARK = '#008f3c';

export type InvoiceReportPrintItem = {
  description?: string;
  quantity?: string | number;
  unit?: string;
  amount?: string | number;
  amount_usd?: string | number;
};

export type InvoiceReportPrintData = {
  invoice_no?: string;
  operation_no?: string;
  consignee?: string;
  invoice_date?: string;
  freight_forwarder?: string;
  status?: string;
  responsible?: string;
  total_amount?: number | string;
  total_amount_usd?: number | string;
  items?: InvoiceReportPrintItem[];
};

function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtMoney(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return (0).toFixed(decimals);
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtDate(iso: string | undefined | null): string {
  const raw = String(iso ?? '').trim();
  if (!raw) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  try {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch {
    /* ignore */
  }
  return raw;
}

function statusLabel(status: string | undefined | null): string {
  const s = String(status ?? '').trim().toLowerCase();
  if (s === 'paid') return 'Payé';
  if (s === 'partial') return 'Partiel';
  if (s === 'posted') return 'Posté';
  if (s === 'unpaid') return 'Impayé';
  return String(status ?? '').trim();
}

function toUsdFromFdj(fdj: number): number {
  return Number.isFinite(fdj) && COMMERCIAL_CHAMBER_DJF_RATE > 0
    ? Math.round((fdj / COMMERCIAL_CHAMBER_DJF_RATE) * 100) / 100
    : 0;
}

/**
 * Rapport de facture — gabarit type Hamilton (Invoice Report).
 * En-tête branding + tableau vert S/N / Description / Qty / Unit / FDJ / USD.
 */
export function buildInvoiceReportPrintHtml(
  invoice: InvoiceReportPrintData,
  branding: DocumentBranding
): string {
  const letter = buildLetterheadHtml(branding);
  const wm = buildDocWatermark(branding);
  const stampSrc = documentImageSrc(branding.signatureStampUrl || branding.signatureUrl);
  const stamp = stampSrc ? `<img class="stamp-img" src="${esc(stampSrc)}" alt="" />` : '';

  const items = Array.isArray(invoice.items) ? invoice.items : [];

  const normalized = items.map((item) => {
    const fdj = parseLocalizedNumber(item.amount);
    let usd = parseLocalizedNumber(item.amount_usd);
    if (!usd && fdj) usd = toUsdFromFdj(fdj);
    return {
      description: item.description || '',
      quantity: item.quantity ?? '',
      unit: item.unit || '',
      fdj,
      usd,
    };
  });

  const sumFdj = normalized.reduce((s, it) => s + it.fdj, 0);
  const sumUsd = normalized.reduce((s, it) => s + it.usd, 0);
  const totalFdj = parseLocalizedNumber(invoice.total_amount) || sumFdj;
  const totalUsd =
    parseLocalizedNumber(invoice.total_amount_usd) || sumUsd || toUsdFromFdj(totalFdj);

  const bodyRows = normalized
    .map(
      (item, idx) => `<tr>
        <td class="c">${idx + 1}</td>
        <td class="l">${esc(item.description)}</td>
        <td class="c">${esc(item.quantity)}</td>
        <td class="c">${esc(item.unit)}</td>
        <td class="r">${esc(fmtMoney(item.fdj, item.fdj % 1 === 0 ? 0 : 2))}</td>
        <td class="r">${esc(fmtMoney(item.usd, 2))}</td>
      </tr>`
    )
    .join('');

  const preparedBy = String(invoice.responsible ?? '').trim();

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Invoice Report — ${esc(invoice.invoice_no || '')}</title>
  <style>
    ${letterheadBannerPrintCss()}
    ${mawadaContactFooterPrintCss()}
    ${watermarkPrintCss()}
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10.5pt;
      color: #111;
    }
    .page {
      display: flex;
      flex-direction: column;
      position: relative;
      box-sizing: border-box;
      width: 210mm;
      min-height: 277mm; /* A4 moins marges @page */
      height: 277mm;
      max-height: 277mm;
      overflow: hidden;
      background: #fff;
    }
    .page-main {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 1;
      min-height: 0;
    }
    .page-bottom {
      margin-top: auto;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
      padding-top: 6px;
    }
    .doc-head {
      text-align: center;
      margin: 2px 0 10px;
    }
    .doc-title {
      font-size: 18pt;
      font-weight: 800;
      margin: 0;
      color: #111;
      letter-spacing: 0.01em;
    }
    .meta-grid {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin: 0 0 10px;
      font-size: 10pt;
      font-weight: 700;
      line-height: 1.45;
    }
    .meta-col { flex: 1; }
    .meta-col div { margin: 1px 0; }
    .meta-label { font-weight: 700; }
    .inv-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 9.5pt;
      margin: 0 0 8px;
      background: #fff;
    }
    .inv-table th,
    .inv-table td {
      border: 1px solid #000 !important;
      padding: 4px 5px;
      vertical-align: middle;
    }
    .inv-table thead th {
      background: linear-gradient(180deg, ${TABLE_GREEN} 0%, ${TABLE_GREEN_DARK} 100%) !important;
      color: #fff !important;
      font-weight: 700;
      text-align: center;
      font-size: 9pt;
    }
    .inv-table td.c { text-align: center; }
    .inv-table td.l { text-align: left; }
    .inv-table td.r { text-align: right; font-variant-numeric: tabular-nums; }
    .inv-table tfoot td {
      font-weight: 800;
      background: #fff;
    }
    .total-label { text-align: right; padding-right: 10px; }
    .approvals {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin: 48px 0 0;
      padding-top: 12px;
      font-size: 10.5pt;
      font-weight: 700;
    }
    .approvals > div { flex: 1; }
    .sig-block {
      display: flex;
      align-items: center;
      gap: 14px;
      margin: 0 0 14px;
      font-size: 11pt;
      font-weight: 700;
    }
    .sig-label {
      flex-shrink: 0;
    }
    .sig-line {
      display: inline-block;
      width: 150px;
      border-bottom: 1.5px solid #111;
      height: 0;
      margin: 0 4px 4px 0;
      vertical-align: middle;
    }
    .stamp-img {
      display: block;
      max-height: 78px;
      max-width: 130px;
      width: auto;
      object-fit: contain;
      pointer-events: none;
    }
    .doc-footer { padding-top: 0; }
    .foot-box {
      border: 1px solid #111 !important;
      padding: 10px 14px !important;
      background: #fff;
    }
    .foot-grid {
      font-size: 9.5pt;
      font-weight: 700;
    }
    @media print {
      html, body {
        width: 210mm !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
      }
      .page {
        width: 100% !important;
        min-height: 277mm !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
      }
      .page-bottom {
        margin-top: auto !important;
      }
    }
    @media screen {
      html { background: #d8d8d8; }
      body {
        background: transparent;
        padding: 16px 0;
        min-height: 0 !important;
        width: auto !important;
        box-shadow: none !important;
      }
      .page {
        margin: 0 auto;
        padding: 8mm 10mm;
        box-shadow: 0 4px 18px rgba(0,0,0,0.18);
      }
    }
  </style>
</head>
<body>
  <div class="page">
    ${wm}
    <div class="page-main">
      ${letter}

      <header class="doc-head">
        <h1 class="doc-title">Invoice Report</h1>
      </header>

      <div class="meta-grid">
        <div class="meta-col">
          <div><span class="meta-label">Invoice No:</span> ${esc(invoice.invoice_no || '')}</div>
          <div><span class="meta-label">Operation No:</span> ${esc(invoice.operation_no || '')}</div>
          <div><span class="meta-label">Consigné:</span> ${esc(invoice.consignee || '')}</div>
        </div>
        <div class="meta-col">
          <div><span class="meta-label">Date:</span> ${esc(fmtDate(invoice.invoice_date))}</div>
          <div><span class="meta-label">Freight Forwarder:</span> ${esc(invoice.freight_forwarder || '')}</div>
          <div><span class="meta-label">Statut:</span> ${esc(statusLabel(invoice.status))}</div>
        </div>
      </div>

      <table class="inv-table" cellspacing="0" cellpadding="0">
        <colgroup>
          <col style="width:7%" />
          <col style="width:38%" />
          <col style="width:12%" />
          <col style="width:10%" />
          <col style="width:16.5%" />
          <col style="width:16.5%" />
        </colgroup>
        <thead>
          <tr>
            <th>S/N</th>
            <th>Description of Goods</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Amount (FDJ)</th>
            <th>Amount (USD)</th>
          </tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" class="total-label">TOTAL AMOUNT:</td>
            <td class="r">FDJ ${esc(fmtMoney(totalFdj, 2))}</td>
            <td class="r">$ ${esc(fmtMoney(totalUsd, 2))}</td>
          </tr>
        </tfoot>
      </table>

      <div class="approvals">
        <div>Prepared By: ${esc(preparedBy)}</div>
        <div>Approved By:</div>
        <div>Received By:</div>
      </div>
    </div>

    <div class="page-bottom">
      <div class="sig-block">
        <span class="sig-label">Signature:</span>
        <span class="sig-line" aria-hidden="true"></span>
        ${stamp}
      </div>
      <footer class="doc-footer">
        ${buildMawadaContactFooterHtml(branding)}
      </footer>
    </div>
  </div>
</body>
</html>`;
}

export async function openInvoiceReportPrint(invoice: InvoiceReportPrintData): Promise<void> {
  const branding = await fetchDocumentBranding();
  const html = buildInvoiceReportPrintHtml(invoice, branding);
  const safeNo = String(invoice.invoice_no || 'report').replace(/[^\w/-]+/g, '-').slice(0, 40);
  await openHtmlPrintThenPdfInBrowser(html, `Invoice-Report-${safeNo}.pdf`);
}
