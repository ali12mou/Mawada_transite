import type { LocalCompanyRecord } from '../api/localCompanyApi';
import type { ClientRecord } from '../api/clientsApi';
import type { DocumentBranding } from '../types/documentBranding';
import { formatClientLabel } from './clientLabel';
import { buildLetterheadHtml, documentImageSrc } from './documentPrintImages';
import {
  buildDocWatermark,
  buildMawadaContactFooterHtml,
  docGreen,
  letterheadBannerPrintCss,
  mawadaContactFooterPrintCss,
  pinnedDocFooterPrintCss,
  watermarkPrintCss,
} from './chamberDocumentPrintShared';
import { STYLE_A4_SHEET } from './printA4';
import { openHtmlPrintThenPdfInBrowser } from './htmlPrintPdf';

function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtMoney(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtFdj(n: number): string {
  return `Fdj ${fmtMoney(n, 2)}`;
}

/** Format maquette : Djibouti, 3/8/2026 */
function fmtPlaceDate(iso?: string, location = 'Djibouti'): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return `${location}, ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
  }
  return `${location}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function num(v: unknown, def = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : def;
}

function valStr(v: string | number | undefined | null): string {
  const s = String(v ?? '').trim();
  return s;
}

function servicesReference(record: LocalCompanyRecord): string {
  const fromBl = valStr(record.bill_of_loading).replace(/\D/g, '');
  if (fromBl) return fromBl.padStart(4, '0').slice(-4);
  const fromId = String(record.id || '')
    .replace(/\D/g, '')
    .slice(-4);
  if (fromId) return fromId.padStart(4, '0');
  return '0001';
}

/**
 * LOCAL SERVICES REPORT — maquette Company Details + Financial Details
 * avec letterhead, footer et signature de la configuration.
 */
export function buildLocalCompanyServiceInvoiceHtml(
  record: LocalCompanyRecord,
  branding: DocumentBranding,
  _djfPerOneUsd: number,
  clientDetail: ClientRecord | null = null
): string {
  const green = docGreen(branding) || '#00AA48';
  const letter = buildLetterheadHtml(branding);
  const wm = buildDocWatermark(branding);
  const stampSrc = documentImageSrc(branding.signatureStampUrl || branding.signatureUrl);
  const stamp = stampSrc ? `<img class="stamp-img" src="${esc(stampSrc)}" alt="" />` : '';

  const clientDisplay = clientDetail
    ? formatClientLabel(clientDetail) || record.client_name || ''
    : record.client_name || '';

  const fileFee = num(record.file_fee);
  const quantity = valStr(record.quantity);
  const truckQty = valStr(record.truck_loading_quantity);
  const truckQtyN = num(record.truck_loading_quantity, 0);
  const transitFee = num(record.transit_fee);
  const serviceFee = num(record.service_fee);
  const escortFee = num(record.escort_fee);
  const n4 = num(record.numero_4_price);
  const n9 = num(record.numero_9_price);
  const tiFdj = num(parseFloat(String(record.ti_cancellation ?? '').replace(',', '.')) || 0);
  const declCancel = num(record.declaration_cancellation_price);

  const totalFdj =
    Number(record.total) > 0
      ? num(record.total)
      : fileFee +
        serviceFee * (truckQtyN || 1) +
        transitFee +
        escortFee +
        declCancel +
        tiFdj +
        n4 +
        n9;

  const placeDate = fmtPlaceDate(record.closure_date || record.createdAt || undefined);
  const ref = servicesReference(record);

  const companyRows: Array<[string, string]> = [
    ['Customer', clientDisplay],
    ['Source & Destination', valStr(record.source_destination)],
    ['Seller Company', valStr(record.vendor_company)],
    ['Buyer Company', valStr(record.purchasing_company)],
    ['Description of Goods', valStr(record.goods_description)],
    ['Declaration Start', valStr(record.declaration_s)],
    ['Declaration End', valStr(record.declaration_e)],
    ['Closed Date', valStr(record.closure_date)],
  ];

  const financialRows: Array<[string, string, boolean]> = [
    ['File Fee', fileFee ? fmtFdj(fileFee) : '', false],
    ['Quantity', quantity, false],
    ['Truck Loading Quantity', truckQty, false],
    ['Transit Charges', transitFee ? fmtFdj(transitFee) : '', false],
    ['Service Charges', serviceFee ? fmtFdj(serviceFee) : '', false],
    ['Cancel Gate Pass', escortFee ? fmtFdj(escortFee) : '', false],
    ['Number 4 Price', n4 ? fmtFdj(n4) : '', false],
    ['Number 9 Price', n9 ? fmtFdj(n9) : '', false],
    ['Canceling TI Price', tiFdj ? fmtFdj(tiFdj) : '', false],
    ['Canceling Declaration Price', declCancel ? fmtFdj(declCancel) : '', false],
    ['Total Charges', fmtFdj(totalFdj), true],
  ];

  const companyBody = companyRows
    .map(
      ([label, value]) => `
      <tr>
        <td class="label">${esc(label)}</td>
        <td class="value">${esc(value)}</td>
      </tr>`
    )
    .join('');

  const financialBody = financialRows
    .map(
      ([label, value, bold]) => `
      <tr class="${bold ? 'row-total' : ''}">
        <td class="label">${esc(label)}</td>
        <td class="value amount">${esc(value)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>LOCAL SERVICES REPORT — #${esc(ref)}</title>
  <style>
    ${STYLE_A4_SHEET}
    ${letterheadBannerPrintCss()}
    ${mawadaContactFooterPrintCss()}
    ${pinnedDocFooterPrintCss('page')}
    ${watermarkPrintCss()}
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #111; }
    .doc-head-block {
      position: relative;
      z-index: 1;
      text-align: center;
      margin: 8px 0 22px;
    }
    .doc-title {
      margin: 0 0 6px;
      font-size: 20pt;
      font-weight: 800;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: #111;
    }
    .doc-ref {
      margin: 0 0 4px;
      font-size: 11.5pt;
      font-weight: 400;
      color: #222;
    }
    .doc-place {
      margin: 0;
      font-size: 11.5pt;
      color: #222;
    }
    .section {
      position: relative;
      z-index: 1;
      margin: 0 0 22px;
    }
    .section-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: ${green};
      color: #fff;
      font-weight: 700;
      font-size: 12pt;
      padding: 8px 12px;
      margin: 0;
    }
    .section-bar .bar-right {
      font-weight: 700;
    }
    .detail-table {
      width: 100%;
      border-collapse: collapse;
      margin: 0;
    }
    .detail-table td {
      padding: 9px 4px;
      border-bottom: 1px solid #d9d9d9;
      vertical-align: top;
      font-size: 11pt;
    }
    .detail-table td.label {
      width: 42%;
      color: #222;
      font-weight: 400;
    }
    .detail-table td.value {
      width: 58%;
      color: #111;
      text-align: left;
    }
    .detail-table td.amount {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .detail-table tr.row-total td {
      font-weight: 700;
      border-bottom: none;
      padding-top: 12px;
    }
    .sig-block {
      position: relative;
      z-index: 1;
      margin: 36px 0 16px;
    }
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
      width: 160px;
      height: 90px;
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
      max-height: 88px;
      max-width: 280px;
      width: auto;
      object-fit: contain;
      pointer-events: none;
    }
    .doc-footer { padding-top: 0; }
  </style>
</head>
<body>
  <div class="page">
    ${wm}
    ${letter}

    <header class="doc-head-block">
      <h1 class="doc-title">LOCAL SERVICES REPORT</h1>
      <div class="doc-ref">Services Reference #${esc(ref)}</div>
      <div class="doc-place">${esc(placeDate)}</div>
    </header>

    <section class="section">
      <div class="section-bar">Company Details</div>
      <table class="detail-table">
        <tbody>
          ${companyBody}
        </tbody>
      </table>
    </section>

    <section class="section">
      <div class="section-bar">
        <span>Financial Details</span>
        <span class="bar-right">Amount</span>
      </div>
      <table class="detail-table">
        <tbody>
          ${financialBody}
        </tbody>
      </table>
    </section>

    <footer class="doc-footer page-bottom">
      <div class="sig-block">
        <div class="sig-row">
          <strong>Signature :</strong>
          <span class="sig-line-wrap">
            <span class="sig-underline" aria-hidden="true"></span>
            ${stamp}
          </span>
        </div>
      </div>
      ${buildMawadaContactFooterHtml(branding)}
    </footer>
  </div>
</body>
</html>`;
}

export async function openLocalCompanyPrint(record: LocalCompanyRecord): Promise<void> {
  const { fetchDocumentBranding } = await import('./documentBranding');
  const { fetchClient } = await import('../api/clientsApi');
  const branding = await fetchDocumentBranding();
  let clientDetail: ClientRecord | null = null;
  if (record.client_id) {
    try {
      clientDetail = await fetchClient(record.client_id);
    } catch {
      clientDetail = null;
    }
  }
  const html = buildLocalCompanyServiceInvoiceHtml(record, branding, 178, clientDetail);
  const safeName = (clientDetail ? formatClientLabel(clientDetail) : record.client_name || 'client')
    .replace(/[^\w\u00C0-\u024F\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);
  await openHtmlPrintThenPdfInBrowser(
    html,
    `Local-Services-Report-${safeName || 'document'}.pdf`
  );
}
