import type { DocumentBranding } from '../types/documentBranding';
import { documentImageSrc } from './documentPrintImages';
import { fetchDocumentBranding } from './documentBranding';
import { buildDocWatermark, docGreen, esc, fmtNum } from './chamberDocumentPrintShared';
import { STYLE_A4_SHEET, appendAutoPrintBeforeBodyClose } from './printA4';

function fmtDateDisplay(iso: string): string {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return esc(iso);
}

function amountInWordsUsd(n: number): string {
  if (!Number.isFinite(n) || n < 0) return 'ZERO DOLLARS';
  const dollars = Math.floor(n);
  const ones = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
    'SEVENTEEN', 'EIGHTEEN', 'NINETEEN',
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
    const m = Math.floor(num / 1_000_000);
    const k = Math.floor((num % 1_000_000) / 1000);
    const r = num % 1000;
    const parts: string[] = [];
    if (m) parts.push(`${under1000(m)} MILLION`);
    if (k) parts.push(`${under1000(k)} THOUSAND`);
    if (r) parts.push(under1000(r));
    return parts.join(', ').trim() || 'ZERO';
  }

  return `${convert(dollars)} DOLLARS`;
}

function v(val: string | undefined | null): string {
  const s = String(val ?? '').trim();
  return s ? esc(s) : 'N/A';
}

function fmtQty(qty: number, unit?: string): string {
  const n = Number(qty);
  if (!Number.isFinite(n)) return '0';
  const base = Number.isInteger(n) ? String(n) : String(n);
  const u = String(unit ?? '').trim().toUpperCase();
  return u ? `${base}${u}` : base;
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
  source_destination?: string;
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
  unit?: string;
  quantity: number;
  unit_price: number;
  total_unit_price: number;
};

function sellerBlock(p: PerformaPrintRecord, branding: DocumentBranding): string {
  const name = (p.vendor || branding.companyName || 'HAMILTON INTERNATIONAL FZCO').trim().toUpperCase();
  const addr = (p.vendor_address || branding.companyAddress || '').trim().toUpperCase();
  const tel = (p.vendor_tel || branding.companyPhone || '').trim();
  return `
    <div class="block-line"><span class="lbl">SELLER:</span> ${esc(name)}</div>
    ${addr ? `<div class="block-line">${esc(addr)}</div>` : ''}
    <div class="block-line">TEL: ${tel ? esc(tel) : 'N/A'}</div>`;
}

function buyerBlock(p: PerformaPrintRecord): string {
  const dest = (p.source_destination || p.final_destination || '').trim().toUpperCase();
  return `
    <div class="block-line"><span class="lbl">BUYER:</span> ${v(p.buyer)}</div>
    <div class="block-line">TIN NO: ${v(p.buyer_tin || p.fiscal_id_number)}</div>
    <div class="block-line">TEL: ${v(p.buyer_tel)}</div>
    ${dest ? `<div class="block-line">${esc(dest)}</div>` : ''}
    <div class="block-line inv-no-line"><span class="lbl">PERFORMA INVOICE No:</span> ${v(p.performa_code)}</div>`;
}

export function buildPerformaPrintHtml(
  p: PerformaPrintRecord,
  items: PerformaPrintItem[],
  branding: DocumentBranding
): string {
  const green = docGreen(branding);
  const logoSrc = documentImageSrc(branding.footerLogoUrl || branding.letterHeadUrl);
  const companyName = (branding.companyName || p.vendor || 'Hamilton International FZCO').trim();
  const wm = buildDocWatermark(branding);

  const totalUsd = items.reduce((s, it) => s + (Number(it.total_unit_price) || 0), 0);
  const words = totalUsd <= 0 ? 'N/A' : amountInWordsUsd(totalUsd);

  const rows = items.length
    ? items
        .map(
          (it, i) => `
      <tr>
        <td class="td-c">${i + 1}</td>
        <td class="td-desc">${esc(it.description_of_goods)}</td>
        <td class="td-c">${esc(it.origin || 'N/A')}</td>
        <td class="td-c">${esc(it.hs_code || 'N/A')}</td>
        <td class="td-c">${esc(fmtQty(it.quantity, it.unit))}</td>
        <td class="td-num">$${fmtNum(Number(it.unit_price) || 0)}</td>
        <td class="td-num">$${fmtNum(Number(it.total_unit_price) || 0)}</td>
      </tr>`
        )
        .join('')
    : `<tr><td colspan="7" class="td-c">—</td></tr>`;

  const bankMain = (p.bank || '').trim();
  const accountUsd = (p.fiscal_id_number || '').trim();
  const bankLine2 =
    bankMain && accountUsd
      ? `<div class="terms-line">${esc(bankMain)} ACCOUNT USD: ${esc(accountUsd)}</div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>PERFORMA INVOICE — ${esc(p.performa_code || '')}</title>
  <style>
    ${STYLE_A4_SHEET}
    @page { size: A4 portrait; margin: 12mm 14mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      color: #111;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .page {
      position: relative;
      width: 100%;
      min-height: 270mm;
    }
    .wm {
      position: absolute;
      left: 50%;
      top: 58%;
      transform: translate(-50%, -50%);
      width: 420px;
      height: 420px;
      opacity: 0.07;
      pointer-events: none;
      z-index: 0;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
    .content { position: relative; z-index: 1; }
    .head-brand {
      display: flex;
      align-items: center;
      gap: 14px;
      padding-bottom: 6px;
      border-bottom: 2px solid ${green};
      margin-bottom: 14px;
    }
    .head-logo {
      width: 58px;
      height: 58px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .head-name {
      font-family: Georgia, 'Times New Roman', Times, serif;
      font-size: 22pt;
      font-weight: 400;
      color: ${green};
      line-height: 1.15;
    }
    .title-row {
      position: relative;
      display: flex;
      justify-content: flex-end;
      align-items: baseline;
      min-height: 22px;
      margin: 10px 0 18px;
    }
    .title-main {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12pt;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .title-date {
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .party-grid {
      display: table;
      width: 100%;
      margin-bottom: 14px;
    }
    .party-grid > div { display: table-cell; width: 50%; vertical-align: top; }
    .party-grid > div + div { padding-left: 24px; }
    .block-line { margin: 3px 0; line-height: 1.45; font-size: 9.5pt; }
    .lbl { font-weight: 700; text-transform: uppercase; }
    .inv-no-line { margin-top: 6px; }
    .tbl {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-bottom: 12px;
    }
    .tbl th {
      background: ${green};
      color: #fff;
      font-weight: 700;
      text-transform: uppercase;
      padding: 8px 5px;
      border: 1px solid #b0b0b0;
      text-align: center;
      font-size: 8pt;
      letter-spacing: 0.02em;
    }
    .tbl td {
      border: 1px solid #b0b0b0;
      padding: 6px 5px;
      vertical-align: middle;
    }
    .td-c { text-align: center; }
    .td-desc { text-align: left; }
    .td-num { text-align: right; font-variant-numeric: tabular-nums; }
    .total-row td { font-weight: 700; border-top: 1px solid #b0b0b0; }
    .total-row td.empty { border-left: 1px solid #b0b0b0; border-right: 1px solid #b0b0b0; }
    .words-row td { font-weight: 700; font-size: 9pt; text-transform: uppercase; }
    .terms { margin-top: 10px; font-size: 9.5pt; line-height: 1.6; }
    .terms-line { margin: 1px 0; font-weight: 700; text-transform: uppercase; }
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
    <div class="content">
      <header>
        <div class="head-brand">
          ${logoSrc ? `<img class="head-logo" src="${esc(logoSrc)}" alt="" />` : ''}
          <div class="head-name">${esc(companyName)}</div>
        </div>
      </header>

      <div class="title-row">
        <div class="title-main">PERFORMA INVOICE</div>
        <div class="title-date">DATE: ${fmtDateDisplay(p.invoice_date)}</div>
      </div>

      <div class="party-grid">
        <div>${sellerBlock(p, branding)}</div>
        <div>${buyerBlock(p)}</div>
      </div>

      <table class="tbl">
        <thead>
          <tr>
            <th style="width:4%">#</th>
            <th style="width:32%">DESCRIPTION OF GOODS</th>
            <th style="width:9%">ORIGIN</th>
            <th style="width:10%">SH CODE</th>
            <th style="width:10%">QTY</th>
            <th style="width:12%">UNIT PRICE</th>
            <th style="width:13%">TOTAL AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td class="empty"></td>
            <td class="empty"></td>
            <td class="empty"></td>
            <td class="empty"></td>
            <td class="empty"></td>
            <td class="td-num">Total Invoice Value Amount</td>
            <td class="td-num">$${fmtNum(totalUsd)}</td>
          </tr>
          <tr class="words-row">
            <td></td>
            <td>AMOUNT IN WORD:</td>
            <td colspan="5">${esc(words)}</td>
          </tr>
        </tbody>
      </table>

      <div class="terms">
        <div class="terms-line">SHIPPING: ${v(p.expedition)}</div>
        <div class="terms-line">SWIFTY CODE: ${v(p.swift_code)}</div>
        <div class="terms-line">PORT OF LOADING: ${v(p.loading_port)}</div>
        <div class="terms-line">FINAL DESTINATION: ${v(p.final_destination)}</div>
        <div class="terms-line">PAYMENT: ${v(p.payment)}</div>
        <div class="terms-line">BANK DETAILS: ${v(p.bank)}</div>
        ${bankLine2}
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
