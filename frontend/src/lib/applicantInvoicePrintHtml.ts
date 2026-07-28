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
import { parseLocalizedNumber } from './commercialChamberCalculations';

const TABLE_GREEN = '#00AA48';
const TABLE_GREEN_DARK = '#008f3c';

export type ApplicantInvoicePrintData = {
  invoice_no?: string;
  invoice_date?: string;
  seller?: string;
  buyer?: string;
  phone?: string;
  address?: string;
  description_of_goods?: string;
  hs_code?: string;
  origin?: string;
  quantity?: string | number;
  unit_price_djf?: string | number;
  total_djf?: string | number;
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

/**
 * Facture Applicant — gabarit type Hamilton (INVOICE / APPLICANT).
 * Header branding + footer contact du projet.
 */
export function buildApplicantInvoicePrintHtml(
  invoice: ApplicantInvoicePrintData,
  branding: DocumentBranding
): string {
  const letter = buildLetterheadHtml(branding);
  const wm = buildDocWatermark(branding);
  const stampSrc = documentImageSrc(branding.signatureStampUrl || branding.signatureUrl);
  const stamp = stampSrc ? `<img class="stamp-img" src="${esc(stampSrc)}" alt="" />` : '';

  const qty = String(invoice.quantity ?? '').trim();
  const unitPrice = parseLocalizedNumber(invoice.unit_price_djf);
  const total =
    parseLocalizedNumber(invoice.total_djf) ||
    (unitPrice && parseLocalizedNumber(qty)
      ? Math.round(unitPrice * parseLocalizedNumber(qty) * 100) / 100
      : 0);

  const unitPriceLabel = unitPrice
    ? `${fmtMoney(unitPrice, unitPrice % 1 === 0 ? 0 : 2)} DJF`
    : '';
  const totalLabel = total ? `${fmtMoney(total, total % 1 === 0 ? 0 : 2)} DJF` : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Invoice Applicant — ${esc(invoice.invoice_no || '')}</title>
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
      min-height: 277mm;
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
      padding-top: 8px;
    }
    .doc-head {
      text-align: center;
      margin: 4px 0 14px;
    }
    .doc-title {
      font-size: 22pt;
      font-weight: 800;
      margin: 0;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .doc-subtitle {
      font-size: 14pt;
      font-weight: 800;
      text-align: left;
      margin: 10px 0 8px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .meta-block {
      font-size: 11pt;
      font-weight: 700;
      line-height: 1.55;
      margin: 0 0 16px;
    }
    .meta-block div { margin: 2px 0; }
    .inv-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 9.5pt;
      margin: 0;
      background: #fff;
    }
    .inv-table th,
    .inv-table td {
      border: 1px solid #000 !important;
      padding: 6px 5px;
      vertical-align: middle;
    }
    .inv-table thead th {
      background: linear-gradient(180deg, ${TABLE_GREEN} 0%, ${TABLE_GREEN_DARK} 100%) !important;
      color: #fff !important;
      font-weight: 700;
      text-align: center;
      font-size: 8.5pt;
      text-transform: uppercase;
    }
    .inv-table td.c { text-align: center; }
    .inv-table td.l { text-align: left; }
    .inv-table td.r { text-align: right; font-variant-numeric: tabular-nums; }
    .inv-table tfoot td {
      font-weight: 800;
      background: #fff;
    }
    .total-label { text-align: right; padding-right: 8px; text-transform: uppercase; }
    .sig-block {
      display: flex;
      align-items: center;
      gap: 14px;
      margin: 0 0 14px;
      font-size: 11pt;
      font-weight: 700;
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
      max-width: 160px;
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
      .page-bottom { margin-top: auto !important; }
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
        <h1 class="doc-title">Invoice</h1>
      </header>

      <div class="doc-subtitle">Applicant</div>

      <div class="meta-block">
        <div><strong>SELLER:</strong> ${esc(invoice.seller || '')}</div>
        <div><strong>BUYER:</strong> ${esc(invoice.buyer || '')}</div>
        <div><strong>Date:</strong> ${esc(fmtDate(invoice.invoice_date))}</div>
      </div>

      <table class="inv-table" cellspacing="0" cellpadding="0">
        <colgroup>
          <col style="width:6%" />
          <col style="width:28%" />
          <col style="width:12%" />
          <col style="width:12%" />
          <col style="width:8%" />
          <col style="width:17%" />
          <col style="width:17%" />
        </colgroup>
        <thead>
          <tr>
            <th>NO</th>
            <th>DESCRIPTION OF GOODS</th>
            <th>HS CODE</th>
            <th>ORIGINE</th>
            <th>QTY</th>
            <th>UNIT PRICE DJF</th>
            <th>TOTAL DJF</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="c">1</td>
            <td class="l">${esc(invoice.description_of_goods || '')}</td>
            <td class="c">${esc(invoice.hs_code || '')}</td>
            <td class="c">${esc(invoice.origin || '')}</td>
            <td class="c">${esc(qty)}</td>
            <td class="r">${esc(unitPriceLabel)}</td>
            <td class="r">${esc(totalLabel)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5"></td>
            <td class="total-label">TOTAL AMOUNT IN DJF</td>
            <td class="r">${esc(totalLabel)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="page-bottom">
      <div class="sig-block">
        <span>Signature:</span>
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

export async function openApplicantInvoicePrint(
  invoice: ApplicantInvoicePrintData
): Promise<void> {
  const branding = await fetchDocumentBranding();
  const html = buildApplicantInvoicePrintHtml(invoice, branding);
  const safeNo = String(invoice.invoice_no || 'applicant').replace(/[^\w/-]+/g, '-').slice(0, 40);
  await openHtmlPrintThenPdfInBrowser(html, `Applicant-Invoice-${safeNo}.pdf`);
}
