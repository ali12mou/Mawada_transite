import type { DocumentBranding } from '../types/documentBranding';
import { buildLetterheadHtml, documentImageSrc } from './documentPrintImages';
import {
  buildDocWatermark,
  buildMawadaContactFooterHtml,
  docGreen,
  esc,
  letterheadBannerPrintCss,
  mawadaContactFooterPrintCss,
  watermarkPrintCss,
} from './chamberDocumentPrintShared';
import { fetchDocumentBranding } from './documentBranding';
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
    ${letterheadBannerPrintCss()}
    ${mawadaContactFooterPrintCss()}
    ${watermarkPrintCss()}
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
    .content {
      position: relative;
      z-index: 1;
      flex: 1;
      display: flex;
      flex-direction: column;
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
    .footer { padding-top: 4px; }
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
  const stampSrc = documentImageSrc(branding.signatureStampUrl || branding.signatureUrl);

  return `
    <div class="bottom-block">
      <div class="signature-area">
        <span class="sig-label">Signature:</span>
        <div class="sig-line"></div>
        ${stampSrc ? `<img src="${esc(stampSrc)}" class="stamp-img" alt="" />` : ''}
      </div>
      <div class="footer">
        ${buildMawadaContactFooterHtml(branding)}
      </div>
    </div>`;
}

function buildWatermark(branding: DocumentBranding): string {
  return buildDocWatermark(branding);
}

function buildLetterhead(branding: DocumentBranding): string {
  return buildLetterheadHtml(branding);
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
