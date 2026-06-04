import type { DocumentBranding } from '../types/documentBranding';
import { fetchDocumentBranding } from './documentBranding';
import { documentImageSrc } from './documentPrintImages';
import { STYLE_A4_SHEET, appendAutoPrintBeforeBodyClose } from './printA4';

function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDateTime(iso: string): string {
  if (!iso) {
    const now = new Date();
    return now.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return esc(iso);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export type CertificateOriginPrintRecord = {
  certificate_number?: string;
  customer?: string;
  destination?: string;
  destination_to?: string;
  tin_number?: string;
  tax_id_nif?: string;
  telephone?: string;
  description?: string;
  hs_code?: string;
  mt?: string | number;
  gross_weight?: string | number;
  transport_type?: string;
  loaded_by?: string;
  origin_product?: string;
  declaration_form?: string;
  created_at?: string;
};

export function buildCertificateOriginPrintHtml(
  record: CertificateOriginPrintRecord,
  branding: DocumentBranding
): string {
  const logoSrc = documentImageSrc(branding.footerLogoUrl) || documentImageSrc(branding.letterHeadUrl);
  const logoHtml = logoSrc
    ? `<img src="${esc(logoSrc)}" alt="Logo" class="logo-img" />`
    : `<div class="logo-fallback" aria-hidden="true">CC</div>`;

  const certNo = (record.certificate_number || '—').trim();
  const tin = record.tin_number || record.tax_id_nif || '—';
  const loadedBy = record.loaded_by || record.transport_type || '—';
  const destination = record.destination_to || record.destination || '—';
  const origin = record.origin_product || '—';
  const declaration = record.declaration_form || '—';
  const printedAt = fmtDateTime(record.created_at || '');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Certificat d'Origine — ${esc(record.customer || certNo)}</title>
  <style>
    ${STYLE_A4_SHEET}
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      color: #111;
      line-height: 1.25;
    }
    .page { position: relative; min-height: 277mm; }
    .header {
      display: grid;
      grid-template-columns: 1fr 92px 1fr;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .header-left {
      font-weight: 700;
      font-size: 11pt;
      line-height: 1.15;
      text-transform: uppercase;
    }
    .header-center { text-align: center; }
    .logo-img {
      width: 78px;
      height: 78px;
      object-fit: contain;
    }
    .logo-fallback {
      width: 78px;
      height: 78px;
      margin: 0 auto;
      border: 2px solid #c9a227;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: #c9a227;
      font-size: 18pt;
      background: #fff9e6;
    }
    .header-right {
      text-align: right;
      font-size: 11pt;
      font-weight: 700;
      direction: rtl;
      line-height: 1.3;
    }
    .cert-no {
      text-align: right;
      font-size: 11pt;
      margin: 2px 0 10px;
    }
    .cert-no .num { color: #c0392b; font-weight: 700; }
    .title-block { text-align: center; margin: 8px 0 10px; }
    .title-main { font-size: 18pt; font-weight: 700; margin: 0; }
    .title-sub { font-size: 11pt; margin: 2px 0; }
    .title-ar { direction: rtl; font-size: 11pt; margin-top: 2px; }
    .intro {
      font-size: 9pt;
      margin: 8px 0 12px;
      line-height: 1.35;
    }
    .intro p { margin: 0 0 4px; }
    .intro .ar { direction: rtl; text-align: right; }
    .main-box {
      border: 1.5px solid #111;
      display: grid;
      grid-template-columns: 1.05fr 1fr 0.55fr;
      min-height: 150px;
      margin-bottom: 14px;
    }
    .col {
      border-right: 1.5px solid #111;
      padding: 8px 10px;
    }
    .col:last-child { border-right: none; }
    .field { margin-bottom: 10px; }
    .field-label {
      font-size: 8.5pt;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .field-value {
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      min-height: 16px;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px 24px;
      font-size: 9pt;
    }
    .footer-item { margin-bottom: 10px; }
    .footer-label { margin-bottom: 2px; line-height: 1.3; }
    .footer-label .ar { direction: rtl; display: block; text-align: right; font-size: 8.5pt; }
    .footer-value {
      display: inline-block;
      min-width: 120px;
      border-bottom: 1px solid #111;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0 4px 1px;
    }
    .signature {
      margin-top: 18px;
      text-align: right;
      font-size: 9pt;
      line-height: 1.35;
    }
    .signature .ar { direction: rtl; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-left">CHAMBRE DE COMMERCE<br />DE DJIBOUTI</div>
      <div class="header-center">${logoHtml}</div>
      <div class="header-right">غرفة التجارة<br />بجيبوتي</div>
    </div>

    <div class="cert-no">N° <span class="num">${esc(certNo)}</span></div>

    <div class="title-block">
      <h1 class="title-main">Certificat d'Origine</h1>
      <div class="title-sub">Certificate of Origin</div>
      <div class="title-ar">شهادة منشأ</div>
    </div>

    <div class="intro">
      <p>Nous certifions d'après les connaissances et autres documents qui nous ont été présentés que les marchandises désignées ci-dessous :</p>
      <p>This is to certify according to bills of ladings and other documents produced that the following goods, viz :</p>
      <p class="ar">نشهد بأن البضائع المذكورة أدناه هي من أصل البلد المذكور وفقا للمستندات المقدمة لنا :</p>
    </div>

    <div class="main-box">
      <div class="col">
        <div class="field">
          <div class="field-label">Customer</div>
          <div class="field-value">${esc(record.customer || '—')}</div>
        </div>
        <div class="field">
          <div class="field-label">Destination</div>
          <div class="field-value">${esc(record.destination || '—')}</div>
        </div>
        <div class="field">
          <div class="field-label">TIN No</div>
          <div class="field-value">${esc(tin)}</div>
        </div>
        <div class="field">
          <div class="field-label">Tel</div>
          <div class="field-value">${esc(record.telephone || '—')}</div>
        </div>
      </div>
      <div class="col">
        <div class="field">
          <div class="field-label">Description</div>
          <div class="field-value">${esc(record.description || '—')}</div>
        </div>
        <div class="field">
          <div class="field-label">HS Code</div>
          <div class="field-value">${esc(record.hs_code || '—')}</div>
        </div>
        <div class="field">
          <div class="field-label">MT</div>
          <div class="field-value">${esc(record.mt ?? '—')}</div>
        </div>
      </div>
      <div class="col">
        <div class="field">
          <div class="field-label">Gross WT</div>
          <div class="field-value">${esc(record.gross_weight ?? '—')}</div>
        </div>
      </div>
    </div>

    <div class="footer-grid">
      <div>
        <div class="footer-item">
          <div class="footer-label">
            Chargées par / Loaded by
            <span class="ar">تم شحنها بواسطة</span>
          </div>
          <span class="footer-value">${esc(loadedBy)}</span>
        </div>
        <div class="footer-item">
          <div class="footer-label">
            Sont bien réellement d'ORIGINE / Are really PRODUCT OF
            <span class="ar">هي في الواقع من أصل</span>
          </div>
          <span class="footer-value">${esc(origin)}</span>
        </div>
        <div class="footer-item">
          <div class="footer-label">
            Vu : Déclaration de Sortie N° / Declaration form
            <span class="ar">رقم تصريح الخروج</span>
          </div>
          <span class="footer-value">${esc(declaration)}</span>
        </div>
      </div>
      <div>
        <div class="footer-item">
          <div class="footer-label">
            A destination de / Destination
            <span class="ar">الوجهة</span>
          </div>
          <span class="footer-value">${esc(destination)}</span>
        </div>
        <div class="footer-item">
          <div class="footer-label">Djibouti, le</div>
          <span class="footer-value">${esc(printedAt)}</span>
        </div>
      </div>
    </div>

    <div class="signature">
      Pour le Président de la Chambre de Commerce / For Chairman of the Chamber of Commerce
      <div class="ar">رئيس غرفة التجارة</div>
    </div>
  </div>
</body>
</html>`;
}

export async function openCertificateOriginPrint(
  record: CertificateOriginPrintRecord
): Promise<void> {
  const branding = await fetchDocumentBranding();
  const html = buildCertificateOriginPrintHtml(record, branding);
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up pour imprimer.');
    return;
  }
  w.document.open();
  w.document.write(appendAutoPrintBeforeBodyClose(html));
  w.document.close();
}
