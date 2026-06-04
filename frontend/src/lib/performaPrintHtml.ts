import type { DocumentBranding } from '../types/documentBranding';
import { documentImageSrc } from './documentPrintImages';
import { fetchDocumentBranding } from './documentBranding';
import {
  buildDocFooter,
  buildDocWatermark,
  docGreen,
  esc,
  fmtNum,
  letterheadBannerPrintCss,
} from './chamberDocumentPrintShared';
import { STYLE_A4_SHEET, appendAutoPrintBeforeBodyClose } from './printA4';

function fmtDateDisplay(iso: string): string {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return esc(iso);
}

function amountInWordsUsd(n: number): string {
  if (!Number.isFinite(n) || n < 0) return 'ZERO';
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
    return parts.join(' ').trim() || 'ZERO';
  }

  return `${convert(dollars)} DOLLARS`;
}

function v(val: string | undefined | null): string {
  const s = String(val ?? '').trim();
  return s ? esc(s) : 'N/A';
}

function buildPerformaClassicLetterhead(branding: DocumentBranding): string {
  const green = docGreen(branding);
  const logoSrc = documentImageSrc(branding.footerLogoUrl || branding.letterHeadUrl);
  const name = (branding.companyName || 'GEOSOM TRANSIT').trim();
  const logoHtml = logoSrc
    ? `<img class="perf-logo" src="${esc(logoSrc)}" alt="" />`
    : `<div class="perf-logo perf-logo-ph" aria-hidden="true"></div>`;

  return `
    <header class="perf-head">
      <div class="perf-head-row">
        ${logoHtml}
        <div class="perf-company-name" style="color:${esc(green)}">${esc(name)}</div>
      </div>
      <hr class="perf-head-rule" style="border-color:${esc(green)}" />
    </header>`;
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
  const green = docGreen(branding);
  const wm = buildDocWatermark(branding);
  const head = buildPerformaClassicLetterhead(branding);
  const foot = buildDocFooter(branding);

  const totalUsd = items.reduce((s, it) => s + (Number(it.total_unit_price) || 0), 0);
  const words = totalUsd <= 0 ? 'N/A' : amountInWordsUsd(totalUsd);

  const rows = items.length > 0
    ? items
        .map(
          (it, i) => `
      <tr>
        <td class="td-c">${i + 1}</td>
        <td class="td-desc">${esc(it.description_of_goods)}</td>
        <td class="td-c">${esc(it.origin || 'N/A')}</td>
        <td class="td-c">${esc(it.hs_code || 'N/A')}</td>
        <td class="td-c">${esc(String(it.quantity))}</td>
        <td class="td-num">$${fmtNum(Number(it.unit_price) || 0)}</td>
        <td class="td-num">$${fmtNum(Number(it.total_unit_price) || 0)}</td>
      </tr>`
        )
        .join('')
    : `<tr><td colspan="7" class="td-c">—</td></tr>`;

  const bankLine2 = p.bank && p.fiscal_id_number
    ? `<div class="info-line">${v(p.bank)} ACCOUNT USD: ${v(p.fiscal_id_number)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>PROFORMA INVOICE — ${esc(p.performa_code || '')}</title>
  <style>
    ${STYLE_A4_SHEET}
    ${letterheadBannerPrintCss()}
    @page { size: A4 portrait; margin: 10mm 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9.5pt;
      color: #111;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .print-page {
      position: relative;
      width: 210mm;
      min-height: 277mm;
      margin: 0 auto;
      padding: 0 2mm;
      display: flex;
      flex-direction: column;
    }
    .wm {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 380px;
      height: 380px;
      opacity: 0.08;
      pointer-events: none;
      z-index: 0;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
    .page-body {
      position: relative;
      z-index: 1;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .perf-head { margin-bottom: 10px; }
    .perf-head-row { display: flex; align-items: center; gap: 14px; }
    .perf-logo { width: 56px; height: 56px; object-fit: contain; flex-shrink: 0; }
    .perf-logo-ph {
      width: 56px; height: 56px; border-radius: 50%;
      border: 2px solid ${green}; background: #f5f5f5;
    }
    .perf-company-name {
      font-family: Georgia, 'Times New Roman', Times, serif;
      font-size: 22pt;
      font-weight: 400;
      letter-spacing: 0.02em;
      line-height: 1.15;
    }
    .perf-head-rule { border: none; border-top: 2px solid ${green}; margin: 8px 0 0; }
    .title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 12px 0 16px;
      gap: 12px;
    }
    .doc-title {
      flex: 1;
      text-align: center;
      font-size: 13pt;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .doc-date {
      font-weight: 700;
      font-size: 9.5pt;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .title-spacer { width: 90px; flex-shrink: 0; }
    .cols-2 { display: table; width: 100%; margin-bottom: 14px; }
    .cols-2 > .col { display: table-cell; width: 50%; vertical-align: top; font-size: 9pt; line-height: 1.45; }
    .cols-2 > .col + .col { padding-left: 16px; }
    .lbl { font-weight: 700; text-transform: uppercase; }
    .inv-no { margin-top: 8px; font-weight: 700; text-transform: uppercase; }
    .tbl { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin: 8px 0 12px; }
    .tbl th {
      background: ${green};
      color: #fff;
      font-weight: 700;
      text-transform: uppercase;
      padding: 7px 4px;
      border: 1px solid #000;
      text-align: center;
      font-size: 8pt;
    }
    .tbl td { border: 1px solid #000; padding: 5px 4px; vertical-align: top; }
    .td-c { text-align: center; }
    .td-desc { text-align: left; }
    .td-num { text-align: right; font-variant-numeric: tabular-nums; }
    .terms { margin-top: 10px; font-size: 8.5pt; font-weight: 700; text-transform: uppercase; line-height: 1.5; }
    .terms .info-line { margin: 3px 0; }
    .stamp-zone { margin-top: 20px; min-height: 70px; }
    .stamp-img { max-height: 72px; max-width: 200px; object-fit: contain; }
    .doc-footer { margin-top: auto; padding-top: 8px; }
    @media screen {
      body { background: #b8b8b8; padding: 16px 0; }
      .print-page { background: #fff; box-shadow: 0 4px 18px rgba(0,0,0,0.2); min-height: 297mm; }
    }
    @media print {
      body { background: #fff; }
      .print-page { width: auto; min-height: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <section class="print-page">
    ${wm}
    <div class="page-body">
      ${head}

      <div class="title-row">
        <div class="title-spacer" aria-hidden="true"></div>
        <div class="doc-title">PROFORMA INVOICE</div>
        <div class="doc-date">DATE: ${fmtDateDisplay(p.invoice_date)}</div>
      </div>

      <div class="cols-2">
        <div class="col">
          <div><span class="lbl">SELLER:</span> ${v(p.vendor)}</div>
          <div>${v(p.vendor_address)}</div>
          <div>TEL: ${v(p.vendor_tel)}</div>
        </div>
        <div class="col">
          <div><span class="lbl">BUYER:</span> ${v(p.buyer)}</div>
          <div>TIN NO: ${v(p.buyer_tin || p.fiscal_id_number)}</div>
          <div>TEL: ${v(p.buyer_tel)}</div>
          <div class="inv-no">PROFORMA INVOICE No: ${v(p.performa_code)}</div>
        </div>
      </div>

      <table class="tbl">
        <thead>
          <tr>
            <th style="width:4%">#</th>
            <th style="width:30%">DESCRIPTION OF GOODS</th>
            <th style="width:10%">ORIGIN</th>
            <th style="width:10%">SH CODE</th>
            <th style="width:8%">QTY</th>
            <th style="width:14%">UNIT PRICE</th>
            <th style="width:14%">TOTAL AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr>
            <td colspan="6" class="td-num" style="font-weight:700">Total Invoice Value Amount</td>
            <td class="td-num" style="font-weight:700">$${fmtNum(totalUsd)}</td>
          </tr>
          <tr>
            <td colspan="7" style="font-weight:700">AMOUNT IN WORD: ${esc(words)}</td>
          </tr>
        </tbody>
      </table>

      <div class="terms">
        <div class="info-line">SHIPPING: ${v(p.expedition)}</div>
        <div class="info-line">SWIFTY CODE: ${v(p.swift_code)}</div>
        <div class="info-line">PORT OF LOADING: ${v(p.loading_port)}</div>
        <div class="info-line">FINAL DESTINATION: ${v(p.final_destination)}</div>
        <div class="info-line">PAYMENT: ${v(p.payment)}</div>
        <div class="info-line">BANK DETAILS: ${v(p.bank)}</div>
        ${bankLine2}
      </div>

      ${foot}
    </div>
  </section>
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
