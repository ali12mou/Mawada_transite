import type { DocumentBranding } from '../types/documentBranding';
import { documentImageSrc } from './documentPrintImages';
import { fetchDocumentBranding } from './documentBranding';
import { STYLE_A4_SHEET, appendAutoPrintBeforeBodyClose } from './printA4';

const COMMERCIAL_GREEN = '#00a651';

function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDateDisplay(iso: string): string {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return esc(iso);
}

function fmtUsd(n: number): string {
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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

export type PerformaPrintRecord = {
  vendor: string;
  vendor_address: string;
  vendor_tel: string;
  buyer: string;
  buyer_tin: string;
  buyer_tel: string;
  performa_code: string;
  invoice_date: string;
  expedition: string;
  swift_code: string;
  loading_port: string;
  final_destination: string;
  payment: string;
  bank: string;
  fiscal_id_number: string;
};

export type PerformaPrintItem = {
  description_of_goods: string;
  origin: string;
  hs_code: string;
  quantity: number;
  unit_price: number;
  total_unit_price: number;
};

export function buildPerformaPrintHtml(
  p: PerformaPrintRecord,
  items: PerformaPrintItem[],
  branding: DocumentBranding
): string {
  const wmSrc = documentImageSrc(branding.footerLogoUrl || branding.letterHeadUrl);
  const wm = wmSrc
    ? `<div class="wm" style="background-image:url('${wmSrc.replace(/'/g, "\\'")}')"></div>`
    : '<div class="wm wm-empty" aria-hidden="true"></div>';

  const totalUsd = items.reduce((s, it) => s + (Number(it.total_unit_price) || 0), 0);
  const words = totalUsd <= 0 ? 'N/A' : amountInWordsUsd(totalUsd);

  const footerLogoSrc = documentImageSrc(branding.footerLogoUrl);
  const footerImg = footerLogoSrc
    ? `<div class="footer-img"><img src="${esc(footerLogoSrc)}" alt="" /></div>`
    : '';

  const rows =
    items.length > 0
      ? items
          .map(
            (it, i) => `
    <tr>
      <td class="td-c">${i + 1}</td>
      <td class="td-desc">${esc(it.description_of_goods)}</td>
      <td>${esc(it.origin)}</td>
      <td>${esc(it.hs_code || 'N/A')}</td>
      <td class="td-num">${esc(String(it.quantity))}</td>
      <td class="td-num">$${fmtUsd(Number(it.unit_price) || 0)}</td>
      <td class="td-num">$${fmtUsd(Number(it.total_unit_price) || 0)}</td>
    </tr>`
          )
          .join('')
      : `<tr><td colspan="7" style="text-align:center">—</td></tr>`;

  const addr = (branding.companyAddress || '').trim();
  const phone = (branding.companyPhone || '').trim();
  const email = (branding.companyEmail || '').trim();
  const mob = phone;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>PERFORMA INVOICE — ${esc(p.performa_code || '')}</title>
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
    .page { position: relative; padding: 4mm 2mm; min-height: 270mm; }
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
    .content { position: relative; z-index: 1; }
    .ph-top {
      display: table;
      width: 100%;
      margin-bottom: 8px;
    }
    .ph-top > div { display: table-cell; vertical-align: top; width: 50%; padding: 4px 8px; }
    .ph-seller { font-size: 9.5pt; }
    .ph-seller strong { font-size: 11pt; }
    .ph-right { text-align: right; }
    .ph-date { font-size: 10pt; margin-bottom: 10px; font-weight: 600; }
    .ph-buyer { text-align: left; display: inline-block; font-size: 9.5pt; }
    h1 {
      text-align: center;
      font-size: 17pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      margin: 14px 0 16px;
    }
    .tbl {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin: 10px 0;
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
      padding: 6px 4px;
      vertical-align: top;
    }
    .td-desc { text-align: left; }
    .td-num { text-align: right; font-variant-numeric: tabular-nums; }
    .td-c { text-align: center; width: 4%; }
    .total-label { text-align: right; font-weight: 700; padding: 8px; }
    .total-val { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
    .words-row td { font-weight: 600; padding: 8px; }
    .terms { margin-top: 14px; font-size: 8.5pt; }
    .terms .line { margin: 5px 0; }
    .lbl { font-weight: 700; }
    .foot-bar {
      height: 4px;
      background: ${COMMERCIAL_GREEN};
      margin: 16px 0 8px;
    }
    .foot-grid {
      display: table;
      width: 100%;
      font-size: 8.5pt;
    }
    .foot-grid > div { display: table-cell; width: 50%; vertical-align: top; padding: 4px 6px; }
    .foot-right { text-align: right; }
    .footer-img img { max-height: 36px; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="page">
    ${wm}
    <div class="content">
      <div class="ph-top">
        <div class="ph-seller">
          <strong>${esc(p.vendor || '—')}</strong><br />
          ${p.vendor_address ? `${esc(p.vendor_address)}<br />` : ''}
          ${p.vendor_tel ? `<span class="lbl">Tel:</span> ${esc(p.vendor_tel)}` : ''}
        </div>
        <div class="ph-right">
          <div class="ph-date">Date: ${fmtDateDisplay(p.invoice_date)}</div>
          <div class="ph-buyer">
            <strong>${esc(p.buyer || '—')}</strong><br />
            <span class="lbl">TIN NO:</span> ${esc(p.buyer_tin || '—')}<br />
            ${p.buyer_tel ? `<span class="lbl">Tel:</span> ${esc(p.buyer_tel)}<br />` : ''}
            <span class="lbl">PERFORMA INVOICE No:</span> ${esc(p.performa_code || '—')}
          </div>
        </div>
      </div>

      <h1>PERFORMA INVOICE</h1>

      <table class="tbl">
        <thead>
          <tr>
            <th style="width:5%">#</th>
            <th style="width:30%">DESCRIPTION OF GOODS</th>
            <th style="width:11%">ORIGIN</th>
            <th style="width:11%">SH CODE</th>
            <th style="width:9%">QTY</th>
            <th style="width:16%">UNIT PRICE</th>
            <th style="width:18%">TOTAL AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr>
            <td colspan="5" class="total-label">Total Invoice Value Amount:</td>
            <td colspan="2" class="total-val">$${fmtUsd(totalUsd)}</td>
          </tr>
          <tr class="words-row">
            <td colspan="7"><span class="lbl">AMOUNT IN WORD:</span> ${esc(words)}</td>
          </tr>
        </tbody>
      </table>

      <div class="terms">
        <div class="line"><span class="lbl">SHIPPING:</span> ${esc(p.expedition)}</div>
        <div class="line"><span class="lbl">SWIFTY CODE (SWIFT):</span> ${esc(p.swift_code)}</div>
        <div class="line"><span class="lbl">PORT OF LOADING:</span> ${esc(p.loading_port)}</div>
        <div class="line"><span class="lbl">FINAL DESTINATION:</span> ${esc(p.final_destination)}</div>
        <div class="line"><span class="lbl">PAYMENT:</span> ${esc(p.payment)}</div>
        <div class="line"><span class="lbl">BANK DETAILS:</span> ${esc(p.bank)}</div>
        ${
          p.fiscal_id_number
            ? `<div class="line"><span class="lbl">Account Info:</span> ${esc(p.fiscal_id_number)}</div>`
            : ''
        }
      </div>

      <div class="foot-bar"></div>
      <div class="foot-grid">
        <div>
          <div>${mob ? `Mob: ${esc(mob)}` : '—'}</div>
          ${footerImg}
        </div>
        <div class="foot-right">
          <div>${addr ? esc(addr) : '—'}</div>
          <div>${email ? esc(email) : '—'}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function openPerformaPrintWindow(p: PerformaPrintRecord, items: PerformaPrintItem[]): Promise<void> {
  const branding = await fetchDocumentBranding();
  const html = buildPerformaPrintHtml(p, items, branding);
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up pour imprimer.');
    return;
  }
  w.document.open();
  w.document.write(appendAutoPrintBeforeBodyClose(html));
  w.document.close();
}
