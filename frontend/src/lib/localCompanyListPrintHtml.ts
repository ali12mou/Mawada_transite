import type { LocalCompanyRecord } from '../api/localCompanyApi';
import type { DocumentBranding } from '../types/documentBranding';
import { buildLetterheadHtml, documentImageSrc } from './documentPrintImages';
import {
  buildDocWatermark,
  buildMawadaContactFooterHtml,
  letterheadBannerPrintCss,
  mawadaContactFooterPrintCss,
  watermarkPrintCss,
} from './chamberDocumentPrintShared';
import { STYLE_A4_SHEET } from './printA4';
import { openHtmlPrintThenPdfInBrowser } from './htmlPrintPdf';

const TABLE_GREEN = '#00AA48';
const TABLE_GREEN_DARK = '#008f3c';

function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDateFr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return iso;
}

function cellUpper(v: string | undefined | null): string {
  const s = String(v ?? '').trim();
  return s ? esc(s.toUpperCase()) : '—';
}

function formatClientCell(record: LocalCompanyRecord): string {
  const client = String(record.client_name || '').trim().toUpperCase();
  const vendor = String(record.vendor_company || '').trim().toUpperCase();
  if (client && vendor) return esc(`${client} - ${vendor}`);
  return client ? esc(client) : vendor ? esc(vendor) : '—';
}

function parseQuantity(v: string | undefined | null): number {
  const n = parseFloat(String(v ?? '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

function fmtQty(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function buildLocalCompanyServiceReportHtml(
  records: LocalCompanyRecord[],
  branding: DocumentBranding
): string {
  const letter = buildLetterheadHtml(branding);
  const wm = buildDocWatermark(branding);
  const today = fmtDateFr(new Date().toISOString().split('T')[0]);

  const stampSrc = documentImageSrc(branding.signatureStampUrl || branding.signatureUrl);
  const stamp = stampSrc ? `<img class="stamp-img" src="${esc(stampSrc)}" alt="" />` : '';

  let totalQty = 0;
  const rows = records
    .map((record, index) => {
      const qty = parseQuantity(record.quantity);
      totalQty += qty;
      return `<tr>
        <td class="num">${index + 1}</td>
        <td>${formatClientCell(record)}</td>
        <td>${cellUpper(record.source_destination)}</td>
        <td>${cellUpper(record.vendor_company)}</td>
        <td>${cellUpper(record.goods_description)}</td>
        <td>${cellUpper(record.purchasing_company)}</td>
        <td class="qty">${esc(fmtQty(qty))}</td>
      </tr>`;
    })
    .join('');

  const tableBody =
    rows ||
    `<tr><td colspan="7" class="empty">Aucune entreprise locale enregistrée.</td></tr>`;

  const totalRow =
    records.length > 0
      ? `<tr class="total-row">
          <td colspan="5"></td>
          <td class="total-label">TOTAL QUANTITY</td>
          <td class="total-value">${esc(fmtQty(totalQty))}</td>
        </tr>`
      : '';

  const footerBlock = `
    <div class="sig-block">
      <div class="sig-row">
        <strong>Signature :</strong>
        <span class="sig-line-wrap">
          <span class="sig-underline" aria-hidden="true"></span>
          ${stamp}
        </span>
      </div>
    </div>
    ${buildMawadaContactFooterHtml(branding)}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Rapport de Service — Entreprises locales</title>
  <style>
    ${STYLE_A4_SHEET}
    ${letterheadBannerPrintCss()}
    ${mawadaContactFooterPrintCss()}
    ${watermarkPrintCss()}
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #111; }
    .page { display: flex; flex-direction: column; min-height: 276mm; position: relative; }
    .doc-head { position: relative; z-index: 1; margin: 10px 0 18px; text-align: center; }
    .doc-title { font-size: 22pt; font-weight: 700; margin: 0 0 8px; color: #111; }
    .doc-place-date { font-size: 12pt; font-weight: 700; margin: 0; }
    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin: 0 0 0;
      position: relative;
      z-index: 1;
      table-layout: fixed;
    }
    .report-table th,
    .report-table td {
      border: 1px solid #ccc;
      padding: 7px 6px;
      vertical-align: middle;
      word-wrap: break-word;
    }
    .report-table thead th {
      background: linear-gradient(180deg, ${TABLE_GREEN} 0%, ${TABLE_GREEN_DARK} 100%);
      color: #fff;
      font-weight: 700;
      text-align: left;
      font-size: 9pt;
    }
    .report-table tbody td { font-weight: 400; }
    .report-table tbody td.num,
    .report-table tbody td.qty { text-align: right; font-variant-numeric: tabular-nums; }
    .report-table tbody td.empty { text-align: center; padding: 18px; color: #666; }
    .report-table tr.total-row td {
      border: 1px solid #ccc;
      padding: 0;
      background: transparent;
    }
    .report-table tr.total-row td.total-label,
    .report-table tr.total-row td.total-value {
      background: linear-gradient(180deg, ${TABLE_GREEN} 0%, ${TABLE_GREEN_DARK} 100%) !important;
      color: #fff !important;
      font-weight: 700;
      padding: 10px 8px;
      font-size: 10pt;
    }
    .report-table tr.total-row td.total-value { text-align: right; }
    .sig-block { position: relative; z-index: 1; margin: 28px 0 12px; }
    .sig-row {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      font-size: 11pt;
      font-weight: 700;
    }
    .sig-line-wrap {
      position: relative;
      display: inline-block;
      flex: 0 0 auto;
      width: 130px;
      height: 88px;
    }
    .sig-underline {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 10px;
      border-bottom: 1px solid #111;
      height: 0;
    }
    .stamp-img {
      position: absolute;
      left: 8px;
      bottom: 0;
      max-height: 86px;
      max-width: 300px;
      width: auto;
      object-fit: contain;
      pointer-events: none;
    }
    .doc-footer { margin-top: auto; position: relative; z-index: 1; }
    @media print {
      html, body {
        width: 210mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
      }
      body { box-shadow: none !important; }
      .page {
        width: 210mm !important;
        min-height: 297mm !important;
        margin: 0 !important;
        padding: 12mm 14mm !important;
        box-sizing: border-box !important;
        background: #fff !important;
        box-shadow: none !important;
      }
    }
    @media screen {
      body { background: #b8b8b8; padding: 16px 0; }
      .page {
        width: 210mm;
        margin: 0 auto;
        padding: 12mm 14mm;
        background: #fff;
        box-shadow: 0 4px 18px rgba(0,0,0,0.18);
      }
    }
  </style>
</head>
<body>
  <div class="page">
    ${wm}
    ${letter}

    <header class="doc-head">
      <h1 class="doc-title">Rapport de Service</h1>
      <div class="doc-place-date">Djibouti, ${esc(today)}</div>
    </header>

    <table class="report-table">
      <thead>
        <tr>
          <th style="width:4%">#</th>
          <th style="width:20%">Client</th>
          <th style="width:18%">Location</th>
          <th style="width:16%">Seller</th>
          <th style="width:18%">Category</th>
          <th style="width:16%">Buyer</th>
          <th style="width:8%">Quantity</th>
        </tr>
      </thead>
      <tbody>
        ${tableBody}
        ${totalRow}
      </tbody>
    </table>

    <div style="flex-grow: 1;"></div>
    <footer class="doc-footer">
      ${footerBlock}
    </footer>
  </div>
</body>
</html>`;
}

export async function openLocalCompanyListPrint(records: LocalCompanyRecord[]): Promise<void> {
  const { fetchDocumentBranding } = await import('./documentBranding');
  const branding = await fetchDocumentBranding();
  const html = buildLocalCompanyServiceReportHtml(records, branding);
  const today = fmtDateFr(new Date().toISOString().split('T')[0]).replace(/\//g, '-');
  await openHtmlPrintThenPdfInBrowser(html, `Rapport-Service-${today}.pdf`);
}
