import type { DocumentBranding } from '../types/documentBranding';
import { fetchDocumentBranding } from './documentBranding';
import { buildLetterheadHtml } from './documentPrintImages';
import {
  buildDocWatermark,
  letterheadBannerPrintCss,
  watermarkPrintCss,
} from './chamberDocumentPrintShared';
import { STYLE_A4_SHEET, appendAutoPrintBeforeBodyClose } from './printA4';

const TABLE_GREEN = '#00AA48';
const USD_RATE = 178;

function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function num(v: unknown, def = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : def;
}

function fmtMoney(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return (0).toFixed(decimals);
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function toUsd(fdj: number): number {
  return Number.isFinite(fdj) && USD_RATE > 0 ? fdj / USD_RATE : 0;
}

function fmtDateFr(iso: string | undefined | null): string {
  const raw = String(iso ?? '').trim();
  if (!raw) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  try {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('fr-FR');
  } catch {
    /* ignore */
  }
  return esc(raw);
}

/** Données nécessaires pour la facture commande (gabarit Hamilton). */
export type OrderInvoicePrintData = {
  order_number?: string;
  bl_number?: string;
  client_name?: string;
  source_destination?: string;
  item_price?: string;
  amount_djf?: number;
  quantity?: number | string;
  recharge_amount?: number;
  maritime_line_fees?: number;
  sgtd_wharfage?: number;
  document_9?: number;
  document_4?: number;
  port_handling?: number;
  port_passage?: number;
  file_fees?: number;
  escort_fees?: number;
  transport?: number;
  elevator_cart?: number;
  ctn?: number;
  chamber?: number;
  exit?: number;
  transit?: number;
  total_services?: number;
  total_item_price?: number;
  profit_amount?: number;
  total?: number;
  ci_amount?: number;
  order_date?: string;
  status?: string;
};

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

function rowMoney(label: string, fdj: number, bold = false): string {
  const usd = toUsd(fdj);
  const cls = bold ? ' class="row-item"' : '';
  return `<tr${cls}>
    <td>${esc(label)}</td>
    <td class="num">${fmtMoney(fdj)} ${bold ? 'Fdj' : 'FDJ'}</td>
    <td class="num">$ ${fmtMoney(usd)}</td>
  </tr>`;
}

function rowHighlight(label: string, fdj: number): string {
  return `<tr class="row-hl">
    <td>${esc(label)}</td>
    <td class="num">${fmtMoney(fdj)} Fdj</td>
    <td class="num">$ ${fmtMoney(toUsd(fdj))}</td>
  </tr>`;
}

function buildSingleOrderInvoiceHtml(order: OrderInvoicePrintData, branding: DocumentBranding): string {
  const letter = buildLetterheadHtml(branding);
  const wm = buildDocWatermark(branding);

  const qty = String(order.quantity ?? '').trim() || '1';
  const itemPrice = String(order.item_price ?? '').trim();
  const itemFdj =
    num(order.total_item_price) ||
    num(order.amount_djf) * num(order.quantity, 1) ||
    num(order.ci_amount) * USD_RATE;
  const itemUsd = toUsd(itemFdj);
  const itemUsdLabel = fmtMoney(itemUsd, itemUsd % 1 === 0 ? 0 : 2);
  const itemDesc = `${itemUsdLabel} x ${qty}${itemPrice ? ` ${itemPrice}` : ''}`.trim();

  const maritime = num(order.maritime_line_fees);
  const sgtd = num(order.sgtd_wharfage);
  const doc9 = num(order.document_9);
  const doc4 = num(order.document_4);
  const loading = num(order.port_handling);
  const gate = num(order.port_passage);
  const fileFee = num(order.file_fees);
  const escort = num(order.escort_fees);
  const transport = num(order.transport);
  const forklift = num(order.elevator_cart);
  const ctn = num(order.ctn);
  const chamber = num(order.chamber);
  const exitFee = num(order.exit);
  const transit = num(order.transit);

  const servicesFdj =
    num(order.total_services) ||
    maritime +
      sgtd +
      doc9 +
      doc4 +
      loading +
      gate +
      fileFee +
      escort +
      transport +
      forklift +
      ctn +
      chamber +
      exitFee +
      transit;

  const profitFdj =
    num(order.profit_amount) || itemFdj + num(order.recharge_amount) - servicesFdj;

  const bl = String(order.bl_number ?? '').trim() || '—';
  const dateStr = fmtDateFr(order.order_date);
  const clientName = String(order.client_name ?? '').trim() || '—';
  const orderRef = String(order.order_number ?? '').trim();
  const bannerTitle = itemPrice || 'Expédition de conteneurs';

  const midRows =
    rowMoney(itemDesc, itemFdj, true) +
    rowMoney('Frais de Ligne Maritime', maritime) +
    rowMoney('Frais de Quai SGTD', sgtd) +
    rowMoney('DOCUMENT NO 9', doc9) +
    rowMoney('DOCUMENT NO 4', doc4) +
    rowMoney('Loading or Labour', loading) +
    rowMoney('GATE PASSE', gate) +
    rowMoney('File Fee', fileFee) +
    rowMoney('FRAIS D ESCORTE', escort) +
    rowMoney('TRANSPORT', transport) +
    rowMoney('FORCLIFTE', forklift) +
    rowMoney('CTN', ctn) +
    rowMoney('CHAMBER', chamber) +
    rowMoney('EXITA', exitFee) +
    rowMoney('TRANSIT', transit) +
    rowHighlight('MONTANT TOTAL', servicesFdj) +
    rowHighlight('FRAIS DE SERVICE', profitFdj);

  return `
  <div class="page">
    ${wm}
    ${letter}

    <div class="doc-info">
      <h1 class="doc-info-title">FACTURE DE COMMANDE</h1>
      ${orderRef ? `<div class="doc-info-line">Réf. de Commande: <strong>#${esc(orderRef)}</strong></div>` : ''}
      <div class="doc-info-line">Djibouti, ${esc(dateStr)}</div>
      <div class="doc-info-line">Client: <strong>${esc(clientName)}</strong></div>
    </div>

    <table class="invoice-table" cellspacing="0" cellpadding="0">
      <colgroup>
        <col style="width:34%" />
        <col style="width:33%" />
        <col style="width:33%" />
      </colgroup>
      <tbody>
        <tr class="hdr-row">
          <td class="hdr-span" colspan="3">CONTAINER</td>
        </tr>
        <tr class="hdr-row">
          <td class="hdr-lbl-cell">BL Number</td>
          <td class="hdr-val-cell">${esc(bl)}</td>
          <td class="hdr-empty-cell"></td>
        </tr>
        <tr class="hdr-row">
          <td class="hdr-lbl-cell">DATE //</td>
          <td class="hdr-val-cell">${esc(dateStr)}</td>
          <td class="hdr-empty-cell"></td>
        </tr>
        <tr class="hdr-row">
          <td class="hdr-span hdr-goods" colspan="3">${esc(bannerTitle)}</td>
        </tr>
        <tr class="col-head">
          <td>DESCRIPTION</td>
          <td class="num">Montant DJF</td>
          <td class="num">Montant USD</td>
        </tr>
        ${midRows}
      </tbody>
    </table>
  </div>`;
}

/**
 * Facture commande — gabarit type Hamilton (DESCRIPTION / DJF / USD).
 */
export function buildOrdersPrintHtml(
  orders: OrderInvoicePrintData[],
  branding: DocumentBranding,
  _options?: OrdersPrintOptions
): string {
  const pages = (orders.length ? orders : [{}]).map((o) => buildSingleOrderInvoiceHtml(o, branding)).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Facture Commande</title>
  <style>
    ${STYLE_A4_SHEET}
    ${letterheadBannerPrintCss()}
    ${watermarkPrintCss()}
    @page { size: A4 portrait; margin: 12mm 10mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10.5pt;
      color: #111;
      margin: 0;
      padding: 0;
      background: #fff;
      height: auto !important;
      overflow: visible !important;
    }
    .page {
      position: relative;
      width: 100%;
      padding: 4mm 3mm 6mm;
      page-break-after: always;
      break-after: page;
      overflow: visible;
      height: auto;
      min-height: 0;
    }
    .page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .doc-info {
      position: relative;
      z-index: 1;
      text-align: center;
      margin: 6px 0 10px;
    }
    .doc-info-title {
      font-size: 14pt;
      font-weight: 700;
      margin: 0 0 3px;
    }
    .doc-info-line {
      font-size: 10.5pt;
      margin: 1px 0;
    }
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      position: relative;
      z-index: 1;
      margin: 0;
      font-size: 10.5pt;
      background: #fff;
    }
    .invoice-table td {
      padding: 2.6mm 3.5mm;
      vertical-align: middle;
      line-height: 1.2;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .invoice-table tr.hdr-row td {
      background: ${TABLE_GREEN} !important;
      color: #fff !important;
      font-weight: 700;
      border: 1px solid #fff;
    }
    .invoice-table .hdr-span {
      text-align: left;
      letter-spacing: 0.04em;
    }
    .invoice-table .hdr-lbl-cell { white-space: nowrap; }
    .invoice-table .hdr-val-cell { font-weight: 600; }
    .invoice-table .hdr-goods {
      text-transform: uppercase;
      letter-spacing: 0.02em;
      font-size: 11pt;
    }
    .invoice-table tr.col-head td {
      background: #fff !important;
      color: #111 !important;
      font-weight: 700;
      border: 1px solid #bdbdbd;
      padding: 2.8mm 3.5mm;
    }
    .invoice-table tr.col-head td.num,
    .invoice-table td.num {
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .invoice-table tbody tr:not(.hdr-row):not(.col-head):not(.row-hl) td {
      background: #fff !important;
      color: #111 !important;
      border: 1px solid #c8c8c8;
    }
    .invoice-table tbody tr.row-item td { font-weight: 700; }
    .invoice-table tbody tr.row-hl td {
      background: ${TABLE_GREEN} !important;
      color: #fff !important;
      font-weight: 700;
      border: 1px solid #fff;
    }
    @media print {
      html, body {
        width: auto !important;
        height: auto !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .page {
        overflow: visible !important;
        height: auto !important;
        min-height: 0 !important;
        page-break-inside: auto;
      }
      .invoice-table { page-break-inside: auto; }
      .invoice-table tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .invoice-table tr.hdr-row td,
      .invoice-table tr.row-hl td {
        background: ${TABLE_GREEN} !important;
        color: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  ${pages}
</body>
</html>`;
}

export async function openOrdersPrintWindow(
  orders: OrderInvoicePrintData[],
  generatedBy: string,
  options?: Partial<OrdersPrintOptions>
): Promise<void> {
  const branding = await fetchDocumentBranding();
  const html = buildOrdersPrintHtml(orders, branding, {
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

/** @deprecated Conservé pour compatibilité — préférer passer l’ordre complet. */
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
