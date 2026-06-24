import { DEFAULT_COMPANY_NAME, type DocumentBranding } from '../types/documentBranding';
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
  const primaryColor = branding.primaryColor || '#0F3C66';
  
  const logoSrc = documentImageSrc(branding.letterHeadUrl);
  const stampSrc = documentImageSrc(branding.signatureStampUrl);
  const watermarkImg = documentImageSrc(branding.letterHeadUrl);

  const displayDate = p.date || new Date().toLocaleDateString('fr-FR');
  const displayLocation = p.location || 'Djibouti';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Facture de Service — ${esc(p.client_name)}</title>
  <style>
    ${STYLE_A4_SHEET}
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      color: #000;
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
      padding: 10mm 15mm 20mm 15mm;
      display: flex;
      flex-direction: column;
    }
    .top-double-lines {
      border-top: 1px solid #333;
      border-bottom: 3.5px solid #333;
      height: 6px;
      width: 100%;
      margin-bottom: 25px;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 70%;
      opacity: 0.08;
      z-index: 0;
      pointer-events: none;
    }
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 40px;
      position: relative;
      z-index: 1;
    }
    .logo { height: 70px; object-fit: contain; margin-right: 15px; }
    .company-name {
      font-size: 32pt;
      font-weight: 500;
      color: ${primaryColor};
      font-family: 'Times New Roman', serif;
    }
    .title-section {
      text-align: center;
      margin-bottom: 40px;
      position: relative;
      z-index: 1;
    }
    .invoice-title {
      font-size: 18pt;
      font-weight: 700;
      margin-bottom: 5px;
    }
    .invoice-subtitle {
      font-size: 16pt;
      font-weight: 500;
      margin-bottom: 15px;
    }
    .client-line {
      font-size: 16pt;
      font-weight: 700;
    }

    .tbl {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 40px;
      position: relative;
      z-index: 1;
    }
    .tbl th {
      background-color: ${primaryColor};
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
    .tbl tr.total-row {
      background-color: ${primaryColor};
    }
    .tbl tr.total-row td {
      color: white;
      font-weight: 700;
    }
    .td-details { width: 35%; }
    .td-values { width: 45%; }
    .td-usd { width: 20%; text-align: left; }
    
    .signature-area {
      margin-top: auto;
      margin-bottom: 40px;
      display: flex;
      align-items: center;
      gap: 10px;
      position: relative;
      z-index: 1;
    }
    .sig-label { font-size: 12pt; font-weight: 500; }
    .sig-line { border-bottom: 1px solid #000; width: 80px; }
    .stamp-img { height: 75px; object-fit: contain; }

    .footer {
      border-top: 4px solid ${primaryColor};
      padding-top: 15px;
      position: relative;
      z-index: 1;
    }
    .footer-content { 
      display: flex;
      justify-content: space-between;
      font-size: 12pt;
      font-weight: 700;
      color: #000;
      line-height: 1.4;
    }
    .footer-left { text-align: left; }
    .footer-right { text-align: left; width: 50%; }
    .footer-item span { font-weight: 700; }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="top-double-lines"></div>
    ${watermarkImg ? `<img src="${esc(watermarkImg)}" class="watermark" alt="" />` : ''}
    
    <div class="header">
        ${logoSrc ? `<img src="${esc(logoSrc)}" class="logo" alt="" />` : ''}
        <div class="company-name">${esc(branding.companyName || DEFAULT_COMPANY_NAME)}</div>
    </div>

    <div class="title-section">
      <div class="invoice-title">Détails de Démurrage</div>
      <div class="invoice-subtitle">${esc(displayLocation)}, ${esc(displayDate)}</div>
      <div class="client-line">Client: ${esc(p.client_name)} -</div>
    </div>

    <table class="tbl">
      <thead>
        <tr>
          <th class="td-details">Details</th>
          <th class="td-values">Values</th>
          <th class="td-usd">USD ($)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Customer</td>
          <td>${esc(p.client_name)} -</td>
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
      ${stampSrc ? `<img src="${esc(stampSrc)}" class="stamp-img" alt="Cachet" />` : ''}
    </div>

    <div class="footer">
      <div class="footer-content">
        <div class="footer-left">
          <div class="footer-item">Mob: ${esc(branding.companyPhone || '+ 253 77 86 22 08')}</div>
          <div class="footer-item">TEL : ${esc(branding.companyPhone || '+ 253 21 35 55 21')}</div>
        </div>
        <div class="footer-right">
          <div class="footer-item">Adresse: ${esc(branding.companyAddress || 'Salam Arica Bank //bureau 922')}</div>
          <div class="footer-item">Email : ${esc(branding.companyEmail || 'mahamedali11.mhd@gmail.com')}</div>
        </div>
      </div>
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
