import type { DocumentBranding } from '../types/documentBranding';
import { documentImageSrc } from './documentPrintImages';
import { fetchDocumentBranding } from './documentBranding';
import { STYLE_A4_SHEET, appendAutoPrintBeforeBodyClose } from './printA4';

/** Vert type facture commerciale (en-tête tableau + barre pied de page). */
const COMMERCIAL_GREEN = '#00a651';

function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return esc(iso);
}

function fmtUsd(n: number): string {
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Montant en lettres (USD, anglais simplifié). */
function amountInWordsUsd(n: number): string {
  if (!Number.isFinite(n) || n < 0) return 'ZERO';
  const dollars = Math.floor(n);
  const cents = Math.round((n - dollars) * 100);
  const ones = [
    '',
    'ONE',
    'TWO',
    'THREE',
    'FOUR',
    'FIVE',
    'SIX',
    'SEVEN',
    'EIGHT',
    'NINE',
    'TEN',
    'ELEVEN',
    'TWELVE',
    'THIRTEEN',
    'FOURTEEN',
    'FIFTEEN',
    'SIXTEEN',
    'SEVENTEEN',
    'EIGHTEEN',
    'NINETEEN',
  ];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  function under1000(num: number): string {
    if (num < 20) return ones[num];
    if (num < 100) {
      const t = Math.floor(num / 10);
      const o = num % 10;
      return o ? `${tens[t]} ${ones[o]}` : tens[t];
    }
    const h = Math.floor(num / 100);
    const rest = num % 100;
    const head = `${ones[h]} HUNDRED`;
    return rest ? `${head} ${under1000(rest)}` : head;
  }

  function convert(num: number): string {
    if (num === 0) return 'ZERO';
    const bn = Math.floor(num / 1_000_000_000);
    const m = Math.floor((num % 1_000_000_000) / 1_000_000);
    const k = Math.floor((num % 1_000_000) / 1000);
    const r = num % 1000;
    const parts: string[] = [];
    if (bn) parts.push(`${under1000(bn)} BILLION`);
    if (m) parts.push(`${under1000(m)} MILLION`);
    if (k) parts.push(`${under1000(k)} THOUSAND`);
    if (r) parts.push(under1000(r));
    return parts.join(' ').trim() || 'ZERO';
  }

  const main = convert(dollars);
  const centStr = cents > 0 ? ` AND ${cents}/100` : '';
  return `${main} US DOLLARS${centStr}`;
}

export type ChamberInvoicePrintRecord = {
  consignee_name: string;
  tin: string;
  tel: string;
  source_destination: string;
  commercial_relation: string;
  consignment_location: string;
  invoice_number: string;
  invoice_date: string;
  sales_conditions: string;
  purchase_order: string;
  app_reference_number: string;
  payment_conditions: string;
  invoice_currency: string;
  expedition: string;
  swift_code: string;
  loading_port: string;
  final_destination: string;
  bank_details: string;
  bank_account: string;
  intermediate_bank: string;
  swift_code_2: string;
  currency: string;
};

export type ChamberInvoicePrintItem = {
  description_of_goods: string;
  origin: string;
  hs_code?: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
};

export function buildChamberInvoicePrintHtml(
  inv: ChamberInvoicePrintRecord,
  items: ChamberInvoicePrintItem[],
  branding: DocumentBranding
): string {
  const wmSrc = documentImageSrc(branding.footerLogoUrl || branding.letterHeadUrl);
  const wm = wmSrc
    ? `<div class="wm" style="background-image:url('${wmSrc.replace(/'/g, "\\'")}')"></div>`
    : '<div class="wm wm-empty" aria-hidden="true"></div>';

  const totalUsd = items.reduce((s, it) => s + (Number(it.total_amount) || 0), 0);
  const words = amountInWordsUsd(totalUsd);

  const footerLogoSrc = documentImageSrc(branding.footerLogoUrl);
  const footerImg = footerLogoSrc
    ? `<div class="footer-img"><img src="${esc(footerLogoSrc)}" alt="" /></div>`
    : '';

  const rows = items
    ?.map(
      (it, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="td-desc">${esc(it.description_of_goods)}</td>
      <td>${esc(it.origin)}</td>
      <td>${esc(it.hs_code || '')}</td>
      <td>${esc(it.unit)}</td>
      <td class="td-num">${esc(String(it.quantity))}</td>
      <td class="td-num">${fmtUsd(Number(it.unit_price) || 0)}</td>
      <td class="td-num">${fmtUsd(Number(it.total_amount) || 0)}</td>
    </tr>`
    )
    .join('');

  const addr = (branding.companyAddress || '').trim();
  const phone = (branding.companyPhone || '').trim();
  const email = (branding.companyEmail || '').trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>COMMERCIAL INVOICE — ${esc(inv.invoice_number || '')}</title>
  <style>
    ${STYLE_A4_SHEET}
    @page { size: A4 portrait; margin: 10mm 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9.5pt;
      color: #111;
      margin: 0;
      line-height: 1.35;
    }
    .page { display: flex; flex-direction: column; min-height: 276mm; position: relative; padding: 4mm 2mm; }
    .wm {
      position: fixed;
      left: 50%;
      top: 46%;
      transform: translate(-50%, -50%);
      width: 420px;
      height: 420px;
      opacity: 0.07;
      pointer-events: none;
      z-index: 0;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      filter: grayscale(20%);
    }
    .wm-empty { display: none; }
    .content { position: relative; z-index: 1; display: flex; flex-direction: column; flex-grow: 1; }
    h1 {
      text-align: center;
      font-size: 18pt;
      font-weight: 700;
      letter-spacing: 0.06em;
      margin: 0 0 14px;
    }
    .top-grid {
      display: table;
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .top-grid > div {
      display: table-cell;
      vertical-align: top;
      width: 50%;
      padding: 8px 10px;
    }
    .top-left { border-right: 1px solid #bbb; }
    .lbl { font-weight: 700; display: inline-block; min-width: 7.5em; }
    .line { margin: 3px 0; font-size: 9pt; }
    .tbl {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin: 12px 0;
    }
    .tbl th {
      background: ${COMMERCIAL_GREEN};
      color: #fff;
      font-weight: 700;
      text-transform: uppercase;
      padding: 8px 4px;
      border: 1px solid #000;
      text-align: center;
    }
    .tbl td {
      border: 1px solid #000;
      padding: 5px 4px;
      vertical-align: top;
    }
    .td-desc { text-align: left; }
    .td-num { text-align: right; font-variant-numeric: tabular-nums; }
    .total-row td { font-weight: 700; }
    .words-row td { font-weight: 600; text-align: left; padding: 8px; }
    .terms { margin-top: 12px; font-size: 8.5pt; }
    .terms .line { margin: 4px 0; }
    .doc-footer { margin-top: auto; }
    .foot-bar {
      height: 4px;
      background: ${COMMERCIAL_GREEN};
      margin: 14px 0 8px;
    }
    .foot-grid {
      display: table;
      width: 100%;
      font-size: 8.5pt;
    }
    .foot-grid > div { display: table-cell; width: 50%; vertical-align: top; padding: 4px 6px; }
    .foot-right { text-align: right; }
    .footer-img img { max-height: 36px; margin-top: 6px; }
    @media print {
      .wm-empty { display: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    ${wm}
    <div class="content">
      <h1>COMMERCIAL INVOICE</h1>

      <div class="top-grid">
        <div class="top-left">
          <div class="line"><span class="lbl">CONSIGNEE:</span> ${esc(inv.consignee_name)}</div>
          <div class="line"><span class="lbl">TIN:</span> ${esc(inv.tin)}</div>
          <div class="line"><span class="lbl">TEL:</span> ${esc(inv.tel)}</div>
          <div class="line"><span class="lbl">ADDRESS / SOURCE:</span> ${esc(inv.source_destination)}</div>
          <div class="line"><span class="lbl">Trader Relationship:</span> ${esc(inv.commercial_relation)}</div>
          <div class="line"><span class="lbl">Place of Consignment:</span> ${esc(inv.consignment_location)}</div>
        </div>
        <div class="top-right">
          <div class="line"><span class="lbl">Pro-forma / Date:</span> —</div>
          <div class="line"><span class="lbl">Invoice No. / Date:</span> ${esc(inv.invoice_number)} / ${fmtDate(inv.invoice_date)}</div>
          <div class="line"><span class="lbl">Purchase Order:</span> ${esc(inv.purchase_order)}</div>
          <div class="line"><span class="lbl">Terms of Sale (Incoterm):</span> ${esc(inv.sales_conditions)}</div>
          <div class="line"><span class="lbl">App Ref No:</span> ${esc(inv.app_reference_number)}</div>
          <div class="line"><span class="lbl">Terms of Payment:</span> ${esc(inv.payment_conditions)}</div>
          <div class="line"><span class="lbl">Invoice Currency:</span> ${esc(inv.invoice_currency || inv.currency)}</div>
          <div class="line"><span class="lbl">Final Destination:</span> ${esc(inv.final_destination)}</div>
        </div>
      </div>

      <table class="tbl">
        <thead>
          <tr>
            <th style="width:4%">SR.<br/>NO</th>
            <th style="width:28%">DESCRIPTIONS OF GOOD</th>
            <th style="width:9%">ORIGIN</th>
            <th style="width:9%">HS Code</th>
            <th style="width:7%">UNIT</th>
            <th style="width:7%">QT</th>
            <th style="width:12%">UNIT PRICE<br/>USD($)</th>
            <th style="width:12%">TOTAL UNIT<br/>PRICE</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="8" style="text-align:center">—</td></tr>`}
          <tr class="total-row">
            <td colspan="5" style="border:1px solid #000"></td>
            <td colspan="2" style="text-align:right;font-weight:700;border:1px solid #000">TOTAL USD</td>
            <td class="td-num" style="border:1px solid #000">${fmtUsd(totalUsd)}</td>
          </tr>
          <tr class="words-row">
            <td colspan="8"><span class="lbl">AMOUNT IN WORDS:</span> ${esc(words)}</td>
          </tr>
        </tbody>
      </table>

      <div class="terms">
        <div class="line"><span class="lbl">PAYMENT:</span> ${esc(inv.payment_conditions)}</div>
        <div class="line"><span class="lbl">NOTE:</span> Bank charges are on the applicant's account unless otherwise agreed.</div>
        <div class="line"><span class="lbl">SHIPPING:</span> ${esc(inv.expedition)}</div>
        <div class="line"><span class="lbl">SWIFT CODE:</span> ${esc(inv.swift_code)}</div>
        <div class="line"><span class="lbl">PORT OF LOADING:</span> ${esc(inv.loading_port)}</div>
        <div class="line"><span class="lbl">FINAL DESTINATION:</span> ${esc(inv.final_destination)}</div>
        <div class="line"><span class="lbl">BANK DETAILS:</span> ${esc(inv.bank_details)} ${esc(inv.bank_account)}</div>
        <div class="line"><span class="lbl">INTERMEDIATE BANK:</span> ${esc(inv.intermediate_bank)}</div>
        <div class="line"><span class="lbl">SWIFT (interm.):</span> ${esc(inv.swift_code_2)}</div>
      </div>

      <div style="flex-grow: 1;"></div>
      <div class="doc-footer">
        <div class="foot-bar"></div>
        <div class="foot-grid">
          <div>
            <div>${phone ? `TEL: ${esc(phone)}` : '—'}</div>
            ${footerImg}
          </div>
          <div class="foot-right">
            <div>${addr ? esc(addr) : '—'}</div>
            <div>${email ? esc(email) : '—'}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
export async function openChamberInvoicePrintWindow(
  inv: ChamberInvoicePrintRecord,
  items: ChamberInvoicePrintItem[]
): Promise<void> {
  const branding = await fetchDocumentBranding();
  const html = buildChamberInvoicePrintHtml(inv, items, branding);
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up pour imprimer.');
    return;
  }
  w.document.open();
  w.document.write(appendAutoPrintBeforeBodyClose(html));
  w.document.close();
}

export async function openChamberInvoiceViewWindow(
  inv: ChamberInvoicePrintRecord,
  items: ChamberInvoicePrintItem[]
): Promise<void> {
  const branding = await fetchDocumentBranding();
  const html = buildChamberInvoicePrintHtml(inv, items, branding);
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}


