import type { LocalCompanyRecord } from '../api/localCompanyApi';
import type { ClientRecord } from '../api/clientsApi';
import type { DocumentBranding } from '../types/documentBranding';
import { formatClientLabel } from './clientLabel';
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
const TABLE_GREEN_DARK = '#008f3c';

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
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  try {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('fr-FR');
  } catch {
    /* ignore */
  }
  return esc(iso);
}

function num(v: unknown, def = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : def;
}

function valStr(v: string | number | undefined | null): string {
  const s = String(v ?? '').trim();
  return s || '—';
}

/**
 * Facture de service — entreprise locale (maquette tableau Details / Values / Amounts in USD).
 */
export function buildLocalCompanyServiceInvoiceHtml(
  record: LocalCompanyRecord,
  branding: DocumentBranding,
  djfPerOneUsd: number,
  clientDetail: ClientRecord | null = null
): string {
  const rate = djfPerOneUsd > 0 ? djfPerOneUsd : 177;
  const toUsd = (fdj: number) => (Number.isFinite(fdj) && rate > 0 ? fdj / rate : 0);

  const fileFee = num(record.file_fee);
  const serviceFee = num(record.service_fee);
  const transitFee = num(record.transit_fee);
  const escortFee = num(record.escort_fee);
  const declCancel = num(record.declaration_cancellation_price);
  const n4 = num(record.numero_4_price);
  const n9 = num(record.numero_9_price);
  const totalFdj = num(record.total);
  const tiFdj = num(parseFloat(String(record.ti_cancellation ?? '').replace(',', '.')) || 0);

  const letter = buildLetterheadHtml(branding);
  const wm = buildDocWatermark(branding);

  const stampSrc = documentImageSrc(branding.signatureStampUrl || branding.signatureUrl);
  const stamp = stampSrc ? `<img class="stamp-img" src="${esc(stampSrc)}" alt="" />` : '';

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

  const today = fmtDateFr(new Date().toISOString().split('T')[0]);
  const closure = record.closure_date ? fmtDateFr(record.closure_date) : '—';

  const clientDisplay = clientDetail
    ? formatClientLabel(clientDetail) || record.client_name || '—'
    : record.client_name || '—';

  const rowInfo = (detail: string, value: string) =>
    `<tr class="row-info">
      <td>${esc(detail)}</td>
      <td>${esc(value)}</td>
      <td class="usd"></td>
    </tr>`;

  const rowMoney = (detail: string, fdj: number, usd: number, highlight = false) => {
    const cls = highlight ? ' class="row-hl"' : '';
    return `<tr${cls}>
      <td>${esc(detail)}</td>
      <td>Fdj ${fmtMoney(fdj, 2)}</td>
      <td class="usd">$ ${fmtMoney(usd, 2)}</td>
    </tr>`;
  };

  const tableBody =
    rowInfo('Client', clientDisplay) +
    rowInfo('Source Destination', valStr(record.source_destination)) +
    rowInfo('Entreprise Vendeuse', valStr(record.vendor_company)) +
    rowInfo('Entreprise Acheteuse', valStr(record.purchasing_company)) +
    rowInfo('Description des Marchandises', valStr(record.goods_description)) +
    rowMoney('Frais de dossier', fileFee, toUsd(fileFee)) +
    rowMoney('Frais de Service', serviceFee, toUsd(serviceFee)) +
    rowMoney('Frais de Transit', transitFee, toUsd(transitFee)) +
    rowMoney('Annuler le Laissez-Passer', escortFee, toUsd(escortFee)) +
    rowMoney('Annulation du Prix de la Déclaration', declCancel, toUsd(declCancel)) +
    rowMoney('Canceling TI Price', tiFdj, toUsd(tiFdj)) +
    rowMoney('Prix Numéro 4', n4, toUsd(n4)) +
    rowMoney('Prix Numéro 9', n9, toUsd(n9), true) +
    rowMoney('Totals', totalFdj, toUsd(totalFdj), true);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Facture de Service — ${esc(clientDisplay)}</title>
  <style>
    ${STYLE_A4_SHEET}
    ${letterheadBannerPrintCss()}
    ${mawadaContactFooterPrintCss()}
    ${pinnedDocFooterPrintCss('page')}
    ${watermarkPrintCss()}
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #111; }
    .doc-head { position: relative; z-index: 1; margin: 12px 0 16px; text-align: center; }
    .doc-title { font-size: 22pt; font-weight: 700; margin: 0 0 8px; color: #111; }
    .doc-place-date { font-size: 12pt; font-weight: 700; margin-bottom: 10px; }
    .doc-client { font-size: 12.5pt; font-weight: 700; margin: 0; }
    .meta-grid {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin: 0 0 18px;
      font-size: 11pt;
      font-weight: 700;
      line-height: 1.55;
    }
    .meta-col { flex: 1; }
    .meta-col div { margin: 2px 0; }
    .fin-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11pt;
      margin: 0 0 24px;
      position: relative;
      z-index: 1;
    }
    .fin-table th,
    .fin-table td {
      border: 1px solid #ccc;
      padding: 8px 10px;
      vertical-align: middle;
    }
    .fin-table thead th {
      background: linear-gradient(180deg, ${TABLE_GREEN} 0%, ${TABLE_GREEN_DARK} 100%);
      color: #fff;
      font-weight: 700;
      text-align: left;
    }
    .fin-table thead th.usd { text-align: right; }
    .fin-table tbody td.usd { text-align: right; font-variant-numeric: tabular-nums; }
    .fin-table tbody tr.row-info td { font-weight: 400; }
    .fin-table tbody tr.row-hl td {
      background: linear-gradient(180deg, ${TABLE_GREEN} 0%, ${TABLE_GREEN_DARK} 100%) !important;
      color: #fff !important;
      font-weight: 700;
    }
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
    .doc-footer { padding-top: 0; }
  </style>
</head>
<body>
  <div class="page">
    ${wm}
    ${letter}

    <header class="doc-head">
      <h1 class="doc-title">Facture de Service</h1>
      <div class="doc-place-date">Djibouti, ${esc(today)}</div>
      <div class="doc-client">Client : ${esc(clientDisplay)}</div>
    </header>

    <div class="meta-grid">
      <div class="meta-col">
        <div>Quantité de Chargement du Camion : ${esc(valStr(record.truck_loading_quantity))}</div>
        <div>Déclaration E : ${esc(valStr(record.declaration_e))}</div>
        <div>Date de Clôture : ${esc(closure)}</div>
      </div>
      <div class="meta-col">
        <div>Déclaration S : ${esc(valStr(record.declaration_s))}</div>
        <div>Quantité : ${esc(valStr(record.quantity))}</div>
      </div>
    </div>

    <table class="fin-table">
      <thead>
        <tr>
          <th>Details</th>
          <th>Values</th>
          <th class="usd">Amounts in USD</th>
        </tr>
      </thead>
      <tbody>
        ${tableBody}
      </tbody>
    </table>

    <footer class="doc-footer page-bottom">
      ${footerBlock}
    </footer>
  </div>
</body>
</html>`;
}

export async function openLocalCompanyPrint(record: LocalCompanyRecord): Promise<void> {
  const { fetchDocumentBranding } = await import('./documentBranding');
  const { fetchAppConfig } = await import('../api/appConfigApi');
  const { fetchClient } = await import('../api/clientsApi');
  const branding = await fetchDocumentBranding();
  let rate = 177;
  try {
    const cfg = await fetchAppConfig();
    const r = parseFloat(String(cfg.djf_exchange_rate || '').replace(',', '.'));
    if (Number.isFinite(r) && r > 0) rate = r;
  } catch {
    /* défaut */
  }
  let clientDetail: ClientRecord | null = null;
  if (record.client_id) {
    try {
      clientDetail = await fetchClient(record.client_id);
    } catch {
      clientDetail = null;
    }
  }
  const html = buildLocalCompanyServiceInvoiceHtml(record, branding, rate, clientDetail);
  const safeName = (clientDetail ? formatClientLabel(clientDetail) : record.client_name || 'client')
    .replace(/[^\w\u00C0-\u024F\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);
  await openHtmlPrintThenPdfInBrowser(html, `Facture-Service-${safeName || 'document'}.pdf`);
}
