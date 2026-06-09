import type { DocumentBranding } from '../types/documentBranding';
import { documentImageSrc } from './documentPrintImages';
import { fetchDocumentBranding } from './documentBranding';
import { docGreen, esc } from './chamberDocumentPrintShared';
import { STYLE_A4_SHEET, appendAutoPrintBeforeBodyClose } from './printA4';

function fmtDateDisplay(iso?: string): string {
  if (iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  }
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function v(val: string | undefined | null): string {
  const s = String(val ?? '').trim();
  return s ? esc(s) : 'N/A';
}

function cell(val: string | undefined | null, emptyWhenMissing = false): string {
  const s = String(val ?? '').trim();
  if (!s || s === 'N/A' || s === '—') return emptyWhenMissing ? '' : 'N/A';
  return esc(s);
}

function splitPhones(phone: string): { mob: string; tel: string } {
  const raw = (phone || '').trim();
  if (!raw) return { mob: '—', tel: '—' };
  const parts = raw
    .split(/\||\/|\n|;|(?:\s{2,})/)
    .map((s) => s.replace(/^(mob|tel|tél|phone)\s*:\s*/i, '').trim())
    .filter(Boolean);
  if (parts.length >= 2) return { mob: parts[0], tel: parts[1] };
  return { mob: raw, tel: raw };
}

export type CarrierPrintRecord = {
  carrier_name: string;
  carrier_type: string;
  capacity?: string;
  owner: string;
  mode: string;
  route: string;
  weight?: string;
  created_at?: string;
};

function carrierInfoLines(c: CarrierPrintRecord): string {
  return `
    <div class="info-line"><span class="lbl">Carrier Name:</span> ${v(c.carrier_name)}</div>
    <div class="info-line"><span class="lbl">Carrier Type:</span> ${v(c.carrier_type)}</div>
    <div class="info-line"><span class="lbl">Capacity:</span> ${v(c.capacity)}</div>
    <div class="info-line"><span class="lbl">Owner:</span> ${v(c.owner)}</div>
    <div class="info-line"><span class="lbl">Carrier Mode:</span> ${v(c.mode)}</div>
    <div class="info-line"><span class="lbl">Route:</span> ${v(c.route)}</div>
    <div class="info-line"><span class="lbl">Weight:</span> ${v(c.weight)}</div>`;
}

function carrierTableRow(c: CarrierPrintRecord, index: number, listMode = false): string {
  return `
    <tr>
      <td class="td-c">${index + 1}</td>
      <td class="td-left">${v(c.carrier_name)}</td>
      <td class="td-left">${v(c.carrier_type)}</td>
      <td class="td-c">${v(c.capacity)}</td>
      <td class="td-left">${v(c.owner)}</td>
      <td class="td-left">${v(c.mode)}</td>
      <td class="td-left">${cell(c.route, listMode)}</td>
      <td class="td-c">${cell(c.weight, listMode)}</td>
    </tr>`;
}

function buildCarrierPageStyles(green: string): string {
  return `
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
      display: flex;
      flex-direction: column;
    }
    .wm {
      position: absolute;
      left: 50%;
      top: 52%;
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
    .content {
      position: relative;
      z-index: 1;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .head-brand {
      display: flex;
      align-items: center;
      gap: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid #c5c5c5;
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
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .title-date {
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .report-title-section {
      text-align: center;
      margin: 12px 0 22px;
    }
    .report-title {
      font-size: 12pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .report-subtitle {
      font-size: 10pt;
      font-weight: 500;
    }
    .info-section { margin-bottom: 16px; }
    .info-title {
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 8px;
    }
    .info-line {
      margin: 4px 0;
      font-size: 9.5pt;
      line-height: 1.45;
    }
    .lbl { font-weight: 700; }
    .tbl {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-bottom: 20px;
    }
    .tbl th {
      background: ${green};
      color: #fff;
      font-weight: 700;
      text-transform: uppercase;
      padding: 7px 4px;
      border: 1px solid #b0b0b0;
      text-align: center;
      font-size: 7.5pt;
      letter-spacing: 0.02em;
    }
    .tbl td {
      border: 1px solid #b0b0b0;
      padding: 6px 4px;
      vertical-align: middle;
    }
    .td-c { text-align: center; }
    .td-left { text-align: left; }
    .total-row td {
      font-weight: 700;
      border-top: 1px solid #b0b0b0;
    }
    .td-total-label {
      text-align: right;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .bottom-block { margin-top: auto; }
    .signature-area {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 24px 0 28px;
      min-height: 72px;
    }
    .sig-label { font-size: 10pt; font-weight: 500; }
    .sig-line {
      width: 120px;
      border-bottom: 1px solid #111;
      height: 1px;
    }
    .stamp-img { max-height: 72px; max-width: 200px; object-fit: contain; }
    .footer {
      border-top: 3px solid ${green};
      padding-top: 12px;
    }
    .footer-content {
      display: table;
      width: 100%;
      font-size: 9.5pt;
      font-weight: 700;
    }
    .footer-content > div {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      line-height: 1.55;
    }
    .footer-right { text-align: right; }
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
  `;
}

function buildFooterBlock(branding: DocumentBranding): string {
  const { mob, tel } = splitPhones(branding.companyPhone || '');
  const addr = (branding.companyAddress || '').trim();
  const email = (branding.companyEmail || '').trim();
  const stampSrc = documentImageSrc(branding.signatureStampUrl || branding.signatureUrl);

  return `
    <div class="bottom-block">
      <div class="signature-area">
        <span class="sig-label">Signature:</span>
        <div class="sig-line"></div>
        ${stampSrc ? `<img src="${esc(stampSrc)}" class="stamp-img" alt="" />` : ''}
      </div>
      <div class="footer">
        <div class="footer-content">
          <div class="footer-left">
            <div>Mob: ${mob ? esc(mob) : '—'}</div>
            <div>TEL : ${tel ? esc(tel) : '—'}</div>
          </div>
          <div class="footer-right">
            <div>Adresse: ${addr ? esc(addr) : '—'}</div>
            <div>Email : ${email ? esc(email) : '—'}</div>
          </div>
        </div>
      </div>
    </div>`;
}

function buildWatermark(branding: DocumentBranding): string {
  const wmSrc = documentImageSrc(branding.footerLogoUrl || branding.letterHeadUrl);
  if (!wmSrc) return '';
  const safe = wmSrc.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `<div class="wm" style="background-image:url(&quot;${safe}&quot;)" aria-hidden="true"></div>`;
}

function buildLetterhead(branding: DocumentBranding): string {
  const logoSrc = documentImageSrc(branding.footerLogoUrl || branding.letterHeadUrl);
  const companyName = (branding.companyName || 'Hamilton International FZCO').trim();

  return `
    <header>
      <div class="head-brand">
        ${logoSrc ? `<img class="head-logo" src="${esc(logoSrc)}" alt="" />` : ''}
        <div class="head-name">${esc(companyName)}</div>
      </div>
    </header>`;
}

export function buildCarrierPrintHtml(
  carrier: CarrierPrintRecord,
  branding: DocumentBranding
): string {
  const green = docGreen(branding);
  const dateStr = fmtDateDisplay(carrier.created_at);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>CARRIER DETAILS — ${esc(carrier.carrier_name || '')}</title>
  <style>${buildCarrierPageStyles(green)}</style>
</head>
<body>
  <div class="page">
    ${buildWatermark(branding)}
    <div class="content">
      ${buildLetterhead(branding)}

      <div class="title-row">
        <div class="title-main">CARRIER DETAILS</div>
        <div class="title-date">DATE: ${esc(dateStr)}</div>
      </div>

      <div class="info-section">
        <div class="info-title">Carrier Information</div>
        ${carrierInfoLines(carrier)}
      </div>

      <table class="tbl">
        <thead>
          <tr>
            <th style="width:4%">#</th>
            <th style="width:16%">Carrier Name</th>
            <th style="width:10%">Type</th>
            <th style="width:8%">Capacity</th>
            <th style="width:16%">Owner</th>
            <th style="width:14%">Mode</th>
            <th style="width:18%">Route</th>
            <th style="width:8%">Weight</th>
          </tr>
        </thead>
        <tbody>
          ${carrierTableRow(carrier, 0)}
        </tbody>
      </table>

      ${buildFooterBlock(branding)}
    </div>
  </div>
</body>
</html>`;
}

function reportLocation(branding: DocumentBranding): string {
  const addr = (branding.companyAddress || '').trim();
  if (/djibouti/i.test(addr)) return 'Djibouti';
  return 'Djibouti';
}

export function buildCarriersListPrintHtml(
  carriers: CarrierPrintRecord[],
  branding: DocumentBranding
): string {
  const green = docGreen(branding);
  const dateStr = fmtDateDisplay();
  const location = reportLocation(branding);
  const rows = carriers.length
    ? carriers.map((c, i) => carrierTableRow(c, i, true)).join('')
    : `<tr><td colspan="8" class="td-c">—</td></tr>`;
  const totalRow = `
    <tr class="total-row">
      <td colspan="6"></td>
      <td class="td-total-label">TOTAL CARRIERS</td>
      <td class="td-c">${carriers.length}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>ALL CARRIERS REPORT</title>
  <style>${buildCarrierPageStyles(green)}</style>
</head>
<body>
  <div class="page">
    ${buildWatermark(branding)}
    <div class="content">
      ${buildLetterhead(branding)}

      <div class="report-title-section">
        <div class="report-title">ALL CARRIERS REPORT</div>
        <div class="report-subtitle">${esc(location)}, ${esc(dateStr)}</div>
      </div>

      <table class="tbl">
        <thead>
          <tr>
            <th style="width:4%">#</th>
            <th style="width:16%">Carrier Name</th>
            <th style="width:10%">Type</th>
            <th style="width:8%">Capacity</th>
            <th style="width:16%">Owner</th>
            <th style="width:14%">Mode</th>
            <th style="width:18%">Route</th>
            <th style="width:8%">Weight</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          ${totalRow}
        </tbody>
      </table>

      ${buildFooterBlock(branding)}
    </div>
  </div>
</body>
</html>`;
}

function openPrintHtml(html: string): void {
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up pour imprimer.');
    return;
  }
  w.document.open();
  w.document.write(appendAutoPrintBeforeBodyClose(html));
  w.document.close();
}

export async function openCarrierPrintWindow(carrier: CarrierPrintRecord): Promise<void> {
  const branding = await fetchDocumentBranding();
  openPrintHtml(buildCarrierPrintHtml(carrier, branding));
}

export async function openCarriersListPrintWindow(carriers: CarrierPrintRecord[]): Promise<void> {
  const branding = await fetchDocumentBranding();
  openPrintHtml(buildCarriersListPrintHtml(carriers, branding));
}
