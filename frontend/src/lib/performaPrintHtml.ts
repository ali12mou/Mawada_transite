import type { DocumentBranding } from '../types/documentBranding';
import { documentImageSrc } from './documentPrintImages';
import { fetchDocumentBranding } from './documentBranding';
import { STYLE_A4_SHEET, appendAutoPrintBeforeBodyClose } from './printA4';


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
  const primaryColor = branding.primaryColor || '#0F3C66';
  const secondaryColor = branding.secondaryColor || '#fbbf24';
  
  const logoSrc = documentImageSrc(branding.letterHeadUrl);
  const stampSrc = documentImageSrc(branding.signatureStampUrl);
  const watermarkImg = documentImageSrc(branding.letterHeadUrl);

  const totalUsd = items.reduce((s, it) => s + (Number(it.total_unit_price) || 0), 0);
  const words = totalUsd <= 0 ? 'N/A' : amountInWordsUsd(totalUsd);

  const rows = items.length > 0
    ? items.map((it, i) => `
      <tr>
        <td class="td-c">${i + 1}</td>
        <td class="td-desc">${esc(it.description_of_goods)}</td>
        <td class="td-c">${esc(it.origin)}</td>
        <td class="td-c">${esc(it.hs_code || 'N/A')}</td>
        <td class="td-c">${esc(String(it.quantity))}</td>
        <td class="td-num">$${fmtUsd(Number(it.unit_price) || 0)}</td>
        <td class="td-num">$${fmtUsd(Number(it.total_unit_price) || 0)}</td>
      </tr>`).join('')
    : `<tr><td colspan="7" style="text-align:center; height: 100px;">— No Items —</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>PROFORMA INVOICE — ${esc(p.performa_code || '')}</title>
  <style>
    ${STYLE_A4_SHEET}
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 10pt;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      background-color: #fff;
    }
    .page-container {
      width: 210mm;
      min-height: 297mm;
      margin: auto;
      position: relative;
      background: white;
      padding: 15mm 15mm 20mm 15mm;
      display: flex;
      flex-direction: column;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 70%;
      opacity: 0.05;
      z-index: 0;
      pointer-events: none;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      margin-bottom: 5px;
      position: relative;
      z-index: 1;
    }
    .logo { height: 75px; object-fit: contain; margin-right: 15px; }
    .company-name {
      font-size: 32pt;
      font-weight: 700;
      color: ${primaryColor};
      letter-spacing: -0.01em;
    }
    .header-underline {
      height: 2px;
      background-color: ${primaryColor};
      width: 100%;
      margin-bottom: 25px;
    }
    .invoice-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    .invoice-title {
      flex-grow: 1;
      text-align: center;
      font-size: 20pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .date-box { font-weight: 700; font-size: 10pt; }
    .details-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      position: relative;
      z-index: 1;
    }
    .details-box { width: 45%; line-height: 1.5; }
    .details-box strong { text-transform: uppercase; }
    .invoice-no-box {
      text-align: right;
      margin-top: 10px;
      font-weight: 700;
      font-size: 11pt;
    }
    .tbl {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    .tbl th {
      background-color: ${primaryColor};
      color: white;
      text-align: center;
      padding: 10px 5px;
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      border: 1px solid ${primaryColor};
    }
    .tbl td {
      border: 1px solid #d1d5db;
      padding: 8px 5px;
      font-size: 9.5pt;
    }
    .td-c { text-align: center; }
    .td-desc { text-align: left; padding-left: 10px !important; }
    .td-num { text-align: right; padding-right: 10px !important; font-variant-numeric: tabular-nums; }
    .total-label { font-weight: 700; text-align: right; padding-right: 15px; background: #f9fafb; }
    .total-value { font-weight: 700; text-align: right; padding-right: 10px; background: #f9fafb; font-size: 11pt; }
    .amount-words-row td { padding: 12px 10px; background: #fff; }
    .amount-words-label { font-weight: 700; text-transform: uppercase; font-size: 9pt; }
    
    .additional-info { margin-top: 20px; position: relative; z-index: 1; font-size: 9.5pt; line-height: 1.6; }
    .info-line { display: flex; margin-bottom: 4px; }
    .info-label { font-weight: 700; width: 160px; text-transform: uppercase; flex-shrink: 0; }
    
    .signature-section {
      margin-top: 60px;
      display: flex;
      align-items: flex-end;
      justify-content: flex-start;
      position: relative;
      z-index: 1;
    }
    .sig-line { border-bottom: 1px solid black; width: 120px; margin-right: 10px; margin-left: 5px; }
    .stamp-img { height: 100px; object-fit: contain; }
    
    .footer {
      margin-top: auto;
      position: relative;
      z-index: 1;
    }
    .footer-line { height: 5px; background-color: ${secondaryColor}; margin-bottom: 10px; }
    .footer-grid { display: flex; justify-content: space-between; font-size: 9.5pt; color: #374151; font-weight: 600; }
    .footer-left { text-align: left; }
    .footer-right { text-align: right; }
  </style>
</head>
<body>
  <div class="page-container">
    ${watermarkImg ? `<img src="${esc(watermarkImg)}" class="watermark" alt="" />` : ''}
    
    <div class="header">
      ${logoSrc ? `<img src="${esc(logoSrc)}" class="logo" alt="" />` : ''}
      <div class="company-name">${esc(branding.companyName || 'Hamilton International FZCO')}</div>
    </div>
    <div class="header-underline"></div>

    <div class="invoice-title-row">
      <div class="invoice-title">PROFORMA INVOICE</div>
      <div class="date-box">DATE: ${fmtDateDisplay(p.invoice_date)}</div>
    </div>

    <div class="details-row">
      <div class="details-box">
        <div><strong>SELLER:</strong> ${esc(p.vendor)}</div>
        <div>${esc(p.vendor_address)}</div>
        <div>TEL: ${esc(p.vendor_tel)}</div>
      </div>
      <div class="details-box" style="text-align: right;">
        <div style="text-align: left; display: inline-block; width: 100%;">
          <div><strong>BUYER:</strong> ${esc(p.buyer)}</div>
          <div>TIN NO: ${esc(p.buyer_tin)}</div>
          <div>TEL: ${esc(p.buyer_tel)}</div>
          <div class="invoice-no-box">PROFORMA INVOICE No: ${esc(p.performa_code)}</div>
        </div>
      </div>
    </div>

    <table class="tbl">
      <thead>
        <tr>
          <th style="width: 5%">#</th>
          <th style="width: 35%">DESCRIPTION OF GOODS</th>
          <th style="width: 12%">ORIGIN</th>
          <th style="width: 12%">SH CODE</th>
          <th style="width: 8%">QTY</th>
          <th style="width: 14%">UNIT PRICE</th>
          <th style="width: 14%">TOTAL AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr>
          <td colspan="6" class="total-label">Total Invoice Value Amount</td>
          <td class="total-value">$${fmtUsd(totalUsd)}</td>
        </tr>
        <tr class="amount-words-row">
          <td colspan="3" class="amount-words-label">AMOUNT IN WORD:</td>
          <td colspan="4" style="font-weight: 600;">${esc(words)}</td>
        </tr>
      </tbody>
    </table>

    <div class="additional-info">
      <div class="info-line"><span class="info-label">SHIPPING:</span> ${esc(p.expedition || 'N/A')}</div>
      <div class="info-line"><span class="info-label">SWIFTY CODE:</span> ${esc(p.swift_code || 'N/A')}</div>
      <div class="info-line"><span class="info-label">PORT OF LOADING:</span> ${esc(p.loading_port || 'N/A')}</div>
      <div class="info-line"><span class="info-label">FINAL DESTINATION:</span> ${esc(p.final_destination || 'N/A')}</div>
      <div class="info-line"><span class="info-label">PAYMENT:</span> ${esc(p.payment || 'N/A')}</div>
      <div class="info-line"><span class="info-label">BANK DETAILS:</span> ${esc(p.bank || 'N/A')}</div>
      ${p.fiscal_id_number ? `<div class="info-line" style="margin-top: 5px;"><span class="info-label">ACCOUNT INFO:</span> ${esc(p.fiscal_id_number)}</div>` : ''}
    </div>

    <div class="signature_div" style="flex-grow: 1;"></div>

    <div class="signature-section">
      <span style="font-weight: 700;">Signature:</span>
      <div class="sig-line"></div>
      ${stampSrc ? `<img src="${esc(stampSrc)}" class="stamp-img" alt="Stamp" />` : ''}
    </div>

    <div class="footer">
      <div class="footer-line"></div>
      <div class="footer-grid">
        <div class="footer-left">
          <div>Mob: ${esc(branding.companyPhone || '+253 77 86 22 08')}</div>
          <div>TEL : ${esc(branding.companyPhone || '+253 21 35 55 21')}</div>
        </div>
        <div class="footer-right">
          <div>Adresse: ${esc(branding.companyAddress || 'Salam Arica Bank //bureau 922')}</div>
          <div>Email : ${esc(branding.companyEmail || 'mahamedali11.mhd@gmail.com')}</div>
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


