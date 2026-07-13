import type { CommercialChamberRecord } from '../api/commercialChamberApi';
import type { DocumentBranding } from '../types/documentBranding';
import { buildLetterheadHtml } from './documentPrintImages';
import {
  buildDocWatermark,
  buildMawadaContactFooterHtml,
  letterheadBannerPrintCss,
  mawadaContactFooterPrintCss,
  watermarkPrintCss,
} from './chamberDocumentPrintShared';
import { STYLE_A4_SHEET } from './printA4';
import { openHtmlPrintThenPdfInBrowser } from './htmlPrintPdf';
import {
  computeServiceChargeUsd,
  DEFAULT_COMMERCIAL_PERCENTAGE,
  getCommercialChamberDjfRate,
} from './commercialChamberCalculations';

function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtMoney(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtDateFr(iso: string): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  try {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('fr-FR');
    }
  } catch {
    /* ignore */
  }
  return esc(iso);
}

const GREEN = '#00AA48';
const GREEN_DARK = '#008f3c';

/** Détail commercial — design aligné sur le modèle MAWADA (A4). */
export function buildCommercialDetailPrintHtml(
  record: CommercialChamberRecord,
  branding: DocumentBranding
): string {
  const rate = getCommercialChamberDjfRate();
  const toUsd = (fdj: number) => (Number.isFinite(fdj) && rate > 0 ? fdj / rate : 0);

  const chamber = record.chamber_service_amount ?? 0;
  const percentage = record.percentage > 0 ? record.percentage : DEFAULT_COMMERCIAL_PERCENTAGE;
  const unitPriceUsd = record.unit_price ?? 0;
  const serviceUsd = computeServiceChargeUsd(unitPriceUsd, percentage);
  const service = record.service_charge ?? serviceUsd * rate;
  const bank = record.bank_commission_fee ?? 0;
  const transport = record.transport_dhl ?? 0;
  const cert = record.certificate_fee ?? 0;
  const totalFdj = chamber + service + bank + transport + cert;
  const totalUsd = toUsd(chamber) + serviceUsd + toUsd(bank) + toUsd(transport) + toUsd(cert);

  const letter = buildLetterheadHtml(branding);
  const footerBlock = buildMawadaContactFooterHtml(branding);
  const wm = buildDocWatermark(branding);

  const today = fmtDateFr(new Date().toISOString().split('T')[0]);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Commercial Detail — ${esc(record.commercial_no)}</title>
  <style>
    ${STYLE_A4_SHEET}
    ${letterheadBannerPrintCss()}
    ${mawadaContactFooterPrintCss()}
    ${watermarkPrintCss()}
    body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 11pt; color: #1a1a1a; }
    .page {
      display: flex;
      flex-direction: column;
      min-height: 297mm;
      width: 210mm;
      position: relative;
      box-sizing: border-box;
    }
    .page-main { flex: 1 1 auto; position: relative; z-index: 1; display: flex; flex-direction: column; }
    .letterhead img { max-height: 92px; width: 100%; object-fit: contain; }
    .doc-head { position: relative; z-index: 1; margin-bottom: 18px; text-align: center; }
    .doc-title { font-size: 22pt; font-weight: 700; margin: 0 0 8px; letter-spacing: 0.02em; color: #111; }
    .doc-place-date { font-size: 12pt; font-weight: 700; color: #444; margin-bottom: 14px; }
    .doc-client { font-size: 12.5pt; font-weight: 700; margin: 6px 0; line-height: 1.35; }
    .doc-client span { font-weight: 600; }
    .doc-resp { font-size: 12.5pt; font-weight: 700; margin: 4px 0 0; }
    .info-wrap { position: relative; z-index: 1; display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin: 18px 0 22px; min-height: 100px; }
    .info-left { flex: 1; min-width: 0; }
    .info-row { margin: 5px 0; font-size: 10.5pt; line-height: 1.45; text-align: left; font-weight: 700; }
    .info-row .lbl { font-weight: 700; color: #222; }
    .pct-box { flex-shrink: 0; align-self: center; text-align: right; padding: 8px 4px 8px 16px; max-width: 38%; }
    .pct-box .pct-line { font-size: 20pt; font-weight: 800; color: #111; line-height: 1.15; letter-spacing: 0.02em; }
    .pct-box .pct-line .num { font-size: 26pt; }
    .fin-table { width: 100%; border-collapse: collapse; font-size: 10.5pt; margin: 8px 0 20px; position: relative; z-index: 1; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .fin-table thead th {
      background: linear-gradient(180deg, ${GREEN} 0%, ${GREEN_DARK} 100%);
      color: #fff; font-weight: 700; padding: 10px 12px; text-align: left;
      border: none;
    }
    .fin-table thead th.num { text-align: right; width: 24%; }
    .fin-table tbody td {
      padding: 9px 12px; border-bottom: 1px solid #e8e8e8; vertical-align: middle;
    }
    .fin-table tbody td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .fin-table tbody tr:nth-child(even) { background: #fafafa; }
    .fin-table tbody tr.total-row td {
      background: linear-gradient(180deg, ${GREEN} 0%, ${GREEN_DARK} 100%) !important;
      color: #fff !important; font-weight: 700; border: none; padding: 11px 12px;
    }
    .doc-footer { margin-top: auto; flex-shrink: 0; position: relative; z-index: 1; padding-top: 12px; }
    .ref-note { font-size: 8.5pt; color: #666; margin-top: 8px; text-align: center; }
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
        box-shadow: none !important;
        background: #fff !important;
      }
    }
    @media screen {
      body { background: #b8b8b8; padding: 16px 0; }
      .page {
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
    <div class="page-main">
    ${letter}

    <header class="doc-head">
      <h1 class="doc-title">Commercial Detail</h1>
      <div class="doc-place-date">Djibouti, ${esc(today)}</div>
      <div class="doc-client"><span>Client:</span> ${esc(record.client_name)}</div>
      <div class="doc-resp"><span>Responsible:</span> ${esc(record.responsible || 'N/A')}</div>
    </header>

    <div class="info-wrap">
      <div class="info-left">
        <div class="info-row"><span class="lbl">Description of goods:</span> ${esc(record.goods_description || '—')}</div>
        <div class="info-row"><span class="lbl">Quantity:</span> ${esc(record.quantity || '—')}</div>
        <div class="info-row"><span class="lbl">Tell (Phone):</span> ${esc(record.tell || '—')}</div>
        <div class="info-row"><span class="lbl">Unit Price Commercial Invoice:</span> $ ${fmtMoney(unitPriceUsd, 2)}</div>
        <div class="info-row"><span class="lbl">Tim NO:</span> ${esc(record.timno || '—')}</div>
        <div class="info-row"><span class="lbl">Commercial Invoice No:</span> ${esc(record.commercial_invoice_no || 'N/A')}</div>
        <div class="info-row"><span class="lbl">Commercial Invoice Date:</span> ${esc(record.commercial_invoice_date ? fmtDateFr(record.commercial_invoice_date) : 'N/A')}</div>
        <div class="info-row"><span class="lbl">Purchase Order No:</span> ${esc(record.purchase_order_no || 'N/A')}</div>
        <div class="info-row"><span class="lbl">Purchase Order Date:</span> ${esc(record.purchase_order_date ? fmtDateFr(record.purchase_order_date) : 'N/A')}</div>
      </div>
      <div class="pct-box">
        <div class="pct-line">Percentage <span class="num">${esc(String(percentage))}%</span></div>
      </div>
    </div>

    <table class="fin-table">
      <thead>
        <tr>
          <th>Details</th>
          <th class="num">DJF</th>
          <th class="num">USD</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Chamber amount</td>
          <td class="num">${fmtMoney(chamber, 2)} Fdj</td>
          <td class="num">$${fmtMoney(toUsd(chamber), 2)}</td>
        </tr>
        <tr>
          <td>Service fee or charge</td>
          <td class="num">${fmtMoney(service, 2)} Fdj</td>
          <td class="num">$${fmtMoney(serviceUsd, 2)}</td>
        </tr>
        <tr>
          <td>Bank commission fee</td>
          <td class="num">${fmtMoney(bank, 2)} Fdj</td>
          <td class="num">$${fmtMoney(toUsd(bank), 2)}</td>
        </tr>
        <tr>
          <td>DHL TRANSPORT</td>
          <td class="num">${fmtMoney(transport, 2)} Fdj</td>
          <td class="num">$${fmtMoney(toUsd(transport), 2)}</td>
        </tr>
        <tr>
          <td>Original Certificate Fee</td>
          <td class="num">${fmtMoney(cert, 2)} Fdj</td>
          <td class="num">$${fmtMoney(toUsd(cert), 2)}</td>
        </tr>
        <tr class="total-row">
          <td>Total amount DJF/USD</td>
          <td class="num">${fmtMoney(totalFdj, 2)} Fdj</td>
          <td class="num">$${fmtMoney(totalUsd, 2)}</td>
        </tr>
      </tbody>
    </table>
    </div>

    <footer class="doc-footer">
      ${footerBlock}
      <p class="ref-note">Réf. dossier : ${esc(record.commercial_no)}</p>
    </footer>
  </div>
</body>
</html>`;
}

export async function openCommercialDetailPrint(record: CommercialChamberRecord): Promise<void> {
  const { fetchDocumentBranding } = await import('./documentBranding');
  const branding = await fetchDocumentBranding();
  const html = buildCommercialDetailPrintHtml(record, branding);
  const safeNo = String(record.commercial_no || 'dossier').replace(/[^\w-]+/g, '-');
  await openHtmlPrintThenPdfInBrowser(html, `Commercial-Detail-${safeNo}.pdf`);
}

export function buildCommercialListPrintHtml(
  rows: CommercialChamberRecord[],
  branding: DocumentBranding
): string {
  const letter = buildLetterheadHtml(branding);
  const lines = [branding.companyName, branding.companyPhone, branding.companyEmail].filter(Boolean);
  const head = lines.join(' · ');
  const rowHtml = rows
    ?.map(
      (r) =>
        `<tr>
      <td>${esc(r.commercial_no)}</td>
      <td>${esc(r.client_name)}</td>
      <td>${esc(r.goods_description || '')}</td>
      <td style="text-align:right">${esc(String(r.total ?? 0))}</td>
    </tr>`
    )
    .join('');
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Liste commerciaux</title>
  <style>
    ${STYLE_A4_SHEET}
    ${letterheadBannerPrintCss()}
    body{font-family:Arial,sans-serif;font-size:11pt}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #ccc;padding:6px 8px}
    th{background:linear-gradient(180deg, ${GREEN} 0%, ${GREEN_DARK} 100%);color:#fff;text-align:left;font-weight:700}
  </style></head><body>
  ${letter}
  <h2>Liste des dossiers commerciaux</h2>
  <p class="sub">${esc(head)}</p>
  <table><thead><tr><th>Réf.</th><th>Client</th><th>Marchandises</th><th>Total (FDJ)</th></tr></thead>
  <tbody>${rowHtml}</tbody></table>
  </body></html>`;
}

export async function openCommercialListPrint(rows: CommercialChamberRecord[]): Promise<void> {
  const { fetchDocumentBranding } = await import('./documentBranding');
  const branding = await fetchDocumentBranding();
  const html = buildCommercialListPrintHtml(rows, branding);
  const today = new Date().toISOString().split('T')[0];
  await openHtmlPrintThenPdfInBrowser(html, `Liste-Commerciaux-${today}.pdf`);
}


