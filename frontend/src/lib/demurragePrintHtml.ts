import type { DocumentBranding } from '../types/documentBranding';
import { buildLetterheadHtml, documentImageSrc } from './documentPrintImages';
import {
  buildDocWatermark,
  buildMawadaContactFooterHtml,
  letterheadBannerPrintCss,
  mawadaContactFooterPrintCss,
  watermarkPrintCss,
} from './chamberDocumentPrintShared';
import { fetchDocumentBranding } from './documentBranding';
import { STYLE_A4_SHEET, appendAutoPrintBeforeBodyClose } from './printA4';

function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtUsd(n: number | string): string {
  const val = typeof n === 'string' ? parseFloat(n) : n;
  if (!Number.isFinite(val)) return '0.00';
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export type DemurragePrintRecord = {
  client_name: string;
  bill_of_lading: string;
  container_count: number;
  expedition_demurrage: number;
  sgtd_demurrage: number;
  total: number;
  date?: string;
  location?: string;
};

export function buildDemurragePrintHtml(
  p: DemurragePrintRecord,
  branding: DocumentBranding
): string {
  const green = branding.primaryColor || '#00AA48';
  const letter = buildLetterheadHtml(branding);
  const footer = buildMawadaContactFooterHtml(branding);
  const wm = buildDocWatermark(branding);
  const stampSrc = documentImageSrc(branding.signatureStampUrl || branding.signatureUrl);

  const displayDate = p.date || new Date().toLocaleDateString('fr-FR');
  const displayLocation = p.location || 'Djibouti';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Facture de Service — ${esc(p.client_name)}</title>
  <style>
    ${STYLE_A4_SHEET}
    ${letterheadBannerPrintCss()}
    ${mawadaContactFooterPrintCss()}
    ${watermarkPrintCss()}
    @page { size: A4 portrait; margin: 12mm 14mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      color: #000;
      margin: 0;
      padding: 0;
      background-color: #fff;
    }
    .page-container {
      width: 210mm;
      min-height: 277mm;
      margin: auto;
      position: relative;
      background: white;
      display: flex;
      flex-direction: column;
    }
    .content { position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; }
    .title-section {
      text-align: center;
      margin: 18px 0 28px;
    }
    .invoice-title {
      font-size: 16pt;
      font-weight: 700;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .invoice-subtitle {
      font-size: 11pt;
      font-weight: 500;
      margin-bottom: 12px;
    }
    .client-line {
      font-size: 12pt;
      font-weight: 700;
    }
    .tbl {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    .tbl th {
      background-color: ${esc(green)};
      color: white;
      text-align: left;
      padding: 10px 12px;
      font-size: 10pt;
      font-weight: 700;
      border: 1px solid #ccc;
    }
    .tbl td {
      border: 1px solid #ccc;
      padding: 10px 12px;
      font-size: 10.5pt;
      color: #333;
    }
    .tbl tr.total-row { background-color: ${esc(green)}; }
    .tbl tr.total-row td { color: white; font-weight: 700; }
    .signature-area {
      margin-top: auto;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .sig-label { font-size: 11pt; font-weight: 500; }
    .sig-line { border-bottom: 1px solid #000; width: 80px; }
    .stamp-img { height: 72px; object-fit: contain; }
    .doc-footer { margin-top: 8px; }
    @media screen {
      body { background: #b8b8b8; padding: 16px 0; }
      .page-container {
        padding: 12mm 14mm;
        box-shadow: 0 4px 18px rgba(0,0,0,0.18);
      }
    }
  </style>
</head>
<body>
  <div class="page-container">
    ${wm}
    <div class="content">
      ${letter}

      <div class="title-section">
        <div class="invoice-title">Détails de Démurrage</div>
        <div class="invoice-subtitle">${esc(displayLocation)}, ${esc(displayDate)}</div>
        <div class="client-line">Client: ${esc(p.client_name)}</div>
      </div>

      <table class="tbl">
        <thead>
          <tr>
            <th>Details</th>
            <th>Values</th>
            <th>USD ($)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Customer</td>
            <td>${esc(p.client_name)}</td>
            <td></td>
          </tr>
          <tr>
            <td>Bill of Lading</td>
            <td>${esc(p.bill_of_lading)}</td>
            <td></td>
          </tr>
          <tr>
            <td>Number of Container</td>
            <td>${esc(String(p.container_count))}</td>
            <td></td>
          </tr>
          <tr>
            <td>Demurrage of Shipping</td>
            <td>Fdj ${fmtUsd(p.expedition_demurrage)}</td>
            <td>$ ${fmtUsd(p.expedition_demurrage / 177.7)}</td>
          </tr>
          <tr>
            <td>Demurrage of STGD</td>
            <td>Fdj ${fmtUsd(p.sgtd_demurrage)}</td>
            <td>$ ${fmtUsd(p.sgtd_demurrage / 177.7)}</td>
          </tr>
          <tr class="total-row">
            <td>Total</td>
            <td>Fdj ${fmtUsd(p.total)} container</td>
            <td>$ ${fmtUsd(p.total / 177.7)} container</td>
          </tr>
        </tbody>
      </table>

      <div class="signature-area">
        <span class="sig-label">Signature:</span>
        <div class="sig-line"></div>
        ${stampSrc ? `<img src="${esc(stampSrc)}" class="stamp-img" alt="" />` : ''}
      </div>

      <footer class="doc-footer">${footer}</footer>
    </div>
  </div>
</body>
</html>`;
}

export async function openDemurragePrintWindow(p: DemurragePrintRecord): Promise<void> {
  const branding = await fetchDocumentBranding();
  const html = buildDemurragePrintHtml(p, branding);
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up pour imprimer.');
    return;
  }
  w.document.open();
  w.document.write(appendAutoPrintBeforeBodyClose(html));
  w.document.close();
}
