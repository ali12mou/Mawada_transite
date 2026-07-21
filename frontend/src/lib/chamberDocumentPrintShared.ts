import type { DocumentBranding } from '../types/documentBranding';
import { cssUrlForBackground, documentImageSrc, buildLetterheadHtml, watermarkCssUrl } from './documentPrintImages';
import { STYLE_A4_SHEET } from './printA4';

/** Vert MAWADA (premier mot du nom). */
export const DEFAULT_DOC_GREEN = '#00AA48';
/** Bleu MAWADA (reste du nom / accents). */
export const DEFAULT_DOC_NAVY = '#2F5496';
/** Trait souligné turquoise (modèle Word MAWADA). */
export const DEFAULT_DOC_TEAL = '#00B0F0';

/** Styles CSS en-tête style MAWADA (logo + nom vert/bleu + filet turquoise). */
export function letterheadBannerPrintCss(): string {
  return `
    .letterhead-banner { margin-bottom: 14px; }
    .lh-banner-inner {
      display: flex;
      align-items: center;
      gap: 12px;
      background: transparent;
      padding: 2px 0 2px;
    }
    .lh-full-img {
      display: block;
      width: 100%;
      max-height: 92px;
      object-fit: contain;
    }
    .lh-logo-box {
      flex-shrink: 0;
      width: 58px;
      height: 58px;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .lh-logo-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .lh-logo-ph {
      border: 1px dashed #c5c5c5;
      border-radius: 6px;
      background: #fafafa;
    }
    .lh-brand-text { text-align: left; flex: 1; min-width: 0; }
    .lh-brand-name {
      font-family: Calibri, 'Segoe UI', Arial, sans-serif;
      font-weight: 700;
      font-size: 26pt;
      letter-spacing: 0.02em;
      line-height: 1;
      text-transform: uppercase;
      white-space: nowrap;
      margin: 0;
      padding: 0;
    }
    .lh-brand-green { color: ${DEFAULT_DOC_GREEN}; }
    .lh-brand-blue { color: ${DEFAULT_DOC_NAVY}; }
    .lh-rule {
      height: 0;
      border: none;
      border-bottom: 2.5px solid ${DEFAULT_DOC_TEAL};
      margin: 2px 0 0;
      width: 100%;
    }
  `;
}

export function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function fmtDate(iso: string): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return esc(iso);
}

export function fmtNum(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return decimals > 0 ? '0.00' : '0';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function docGreen(branding: DocumentBranding): string {
  const c = (branding.primaryColor || '').trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : DEFAULT_DOC_GREEN;
}

export function buildDocWatermark(branding?: DocumentBranding): string {
  const src = watermarkCssUrl(branding);
  if (!src) return '';
  return `<div class="wm" style="background-image:url(&quot;${src}&quot;)" aria-hidden="true"></div>`;
}

/** Styles CSS du filigrane centré (classe .wm ou .watermark). */
export function watermarkPrintCss(): string {
  return `
    .wm,
    .watermark {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 420px;
      height: 420px;
      opacity: 0.1;
      pointer-events: none;
      z-index: 0;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
  `;
}

/** Bandeau logo + nom société (2 lignes) sur fond bleu marine. */
export function buildDocLetterhead(branding: DocumentBranding): string {
  return buildLetterheadHtml(branding, { rootClass: 'doc-head' });
}

export function buildDocFooter(branding: DocumentBranding): string {
  const stampSrc = documentImageSrc(branding.signatureStampUrl || branding.signatureUrl);

  const stampHtml = stampSrc
    ? `<div class="stamp-zone"><img class="stamp-img" src="${esc(stampSrc)}" alt="" /></div>`
    : `<div class="stamp-zone stamp-line"><div class="sig-line"></div></div>`;

  return `
    <div class="page-bottom">
      ${stampHtml}
      <footer class="doc-footer">
        ${buildMawadaContactFooterHtml(branding)}
      </footer>
    </div>`;
}

/**
 * Pied de page contact style MAWADA (cadre + 2 colonnes MOB / Address+Email).
 * Réutilisable hors bundle facture commerciale.
 */
export function buildMawadaContactFooterHtml(branding: DocumentBranding): string {
  const addr = (branding.companyAddress || '').trim();
  const phone = (branding.companyPhone || '').trim();
  const email = (branding.companyEmail || '').trim();

  const phones = phone
    .split(/\||\/|\n|;|(?:\s{2,})/)
    .map((s) => s.replace(/^(mob|tel|tél|phone)\s*:\s*/i, '').trim())
    .filter(Boolean);
  const mob1 = phones[0] || phone || '—';
  const mob2 = phones[1] || '';

  return `
      <div class="foot-box">
        <div class="foot-grid">
          <div class="foot-left">
            <div><strong>MOB:</strong> ${esc(mob1)}</div>
            ${mob2 ? `<div><strong>Mob:</strong> ${esc(mob2)}</div>` : `<div><strong>TEL:</strong> ${esc(mob1)}</div>`}
          </div>
          <div class="foot-right">
            <div><strong>Address:</strong> ${addr ? esc(addr) : '—'}</div>
            <div><strong>Email:</strong> ${email ? esc(email) : '—'}</div>
          </div>
        </div>
      </div>`;
}

/** CSS minimal pour le pied MAWADA (si le document n’utilise pas sharedPrintStyles). */
export function mawadaContactFooterPrintCss(): string {
  return `
    .foot-box {
      border: 1px solid #222;
      padding: 10px 14px;
      background: #fff;
    }
    .foot-grid { display: table; width: 100%; font-size: 9pt; font-weight: 700; }
    .foot-grid > div { display: table-cell; width: 50%; vertical-align: top; line-height: 1.55; }
    .foot-right { text-align: left; padding-left: 12px; }
    .foot-left strong, .foot-right strong { margin-right: 4px; }
  `;
}

/**
 * Mise en page A4 : pied de page contact MAWADA forcé en bas de feuille (écran + impression).
 * Utiliser sur le conteneur page (.page, .a4-page, .sheet, .print-page, …).
 */
export function pinnedDocFooterPrintCss(pageClass = 'a4-page'): string {
  const pageSelectors = [
    `.${pageClass}`,
    '.print-page',
    '.page',
    '.page-container',
    '.sheet',
  ].join(',\n    ');

  const bodySelectors = [
    `.${pageClass} > .a4-page-body`,
    `.${pageClass} > .page-main`,
    `.${pageClass} > .content`,
    `.print-page > .page-body`,
    '.page-container > .content',
    '.page > .content',
    '.sheet > .sheet-body',
  ].join(',\n    ');

  return `
    ${pageSelectors} {
      display: flex;
      flex-direction: column;
      position: relative;
      box-sizing: border-box;
      width: 210mm;
      min-height: 297mm;
    }
    ${bodySelectors} {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 1;
      min-height: 0;
    }
    .page-bottom,
    .bottom-block {
      margin-top: auto;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }
    .print-page > .doc-footer,
    .page > .doc-footer,
    .page-container > .doc-footer,
    .sheet > .doc-footer {
      margin-top: auto;
      flex-shrink: 0;
    }
    .doc-footer {
      flex-shrink: 0;
      padding-top: 12px;
    }
    @media print {
      html, body {
        width: 210mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
      }
      body { box-shadow: none !important; }
      ${pageSelectors} {
        display: flex !important;
        flex-direction: column !important;
        width: 210mm !important;
        min-height: 297mm !important;
        margin: 0 !important;
        padding: 12mm 14mm !important;
        box-sizing: border-box !important;
        background: #fff !important;
        box-shadow: none !important;
      }
      .page-bottom,
      .bottom-block,
      .print-page > .doc-footer,
      .page > .doc-footer,
      .page-container > .doc-footer,
      .sheet > .doc-footer {
        margin-top: auto !important;
        flex-shrink: 0 !important;
      }
    }
    @media screen {
      body { background: #b8b8b8; padding: 16px 0; }
      ${pageSelectors} {
        margin: 0 auto;
        padding: 12mm 14mm;
        background: #fff;
        box-shadow: 0 4px 18px rgba(0,0,0,0.18);
      }
    }
  `;
}

export function sharedPrintStyles(branding: DocumentBranding): string {
  const green = docGreen(branding);
  const navy = DEFAULT_DOC_NAVY;
  return `
    ${STYLE_A4_SHEET}
    ${letterheadBannerPrintCss()}
    ${pinnedDocFooterPrintCss('print-page')}
    @page { size: A4 portrait; margin: 8mm 10mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      line-height: 1.4;
      background: #fff;
    }
    .print-bundle {
      width: 210mm;
      margin: 0 auto;
    }
    .print-page {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      padding: 10mm 12mm;
      display: flex;
      flex-direction: column;
      background: #fff;
      box-sizing: border-box;
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid-page;
    }
    .print-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .print-page + .print-page {
      page-break-before: always;
      break-before: page;
    }
    ${watermarkPrintCss()}
    .page-body {
      position: relative;
      z-index: 1;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding: 0 1mm;
    }
    .page-bottom {
      margin-top: auto;
      flex-shrink: 0;
    }
    .letterhead-banner { margin-bottom: 10px; }
    h1.doc-title {
      text-align: center;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12pt;
      font-weight: 700;
      letter-spacing: 0.12em;
      margin: 6px 0 12px;
      text-transform: uppercase;
      color: #111;
    }
    .cols-2 { display: table; width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .cols-2 > .col { display: table-cell; width: 50%; vertical-align: top; padding: 0 8px 0 0; font-size: 9pt; }
    .cols-2 > .col + .col { padding: 0 0 0 8px; }
    .lbl {
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8pt;
      letter-spacing: 0.02em;
      color: #222;
    }
    .line { margin: 2px 0; font-size: 9pt; line-height: 1.4; }
    .cols-3 {
      display: table;
      width: 100%;
      margin: 6px 0 8px;
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .cols-3 > div { display: table-cell; width: 33.33%; padding: 3px 5px; }
    .tbl { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin: 6px 0 8px; table-layout: fixed; }
    .tbl th {
      background: ${green};
      color: #fff;
      font-weight: 700;
      text-transform: uppercase;
      padding: 7px 5px;
      border: 1px solid ${navy};
      text-align: center;
      font-size: 7.5pt;
      letter-spacing: 0.03em;
      vertical-align: middle;
    }
    .tbl td {
      border: 1px solid #b0b0b0;
      padding: 6px 5px;
      vertical-align: middle;
      font-size: 8.5pt;
      word-wrap: break-word;
    }
    .td-left { text-align: left; }
    .td-num { text-align: right; font-variant-numeric: tabular-nums; }
    .tbl tfoot td, .total-row td { font-weight: 700; }
    .words-row td { font-weight: 700; font-size: 8.5pt; text-transform: uppercase; }
    .terms { margin-top: 8px; font-size: 8.5pt; line-height: 1.45; }
    .terms .line { margin: 3px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
    .stamp-zone { margin-top: 12px; min-height: 62px; }
    .stamp-img { max-height: 68px; max-width: 190px; object-fit: contain; }
    .stamp-line .sig-line { width: 180px; border-bottom: 1px solid #333; margin-top: 36px; }
    .doc-footer { padding-top: 6px; }
    .foot-box {
      border: 1px solid #222;
      padding: 8px 12px;
      background: #fff;
    }
    .foot-rule { border: none; border-top: 1px solid ${green}; margin: 0 0 8px; }
    .foot-grid { display: table; width: 100%; font-size: 8.5pt; font-weight: 700; }
    .foot-grid > div { display: table-cell; width: 50%; vertical-align: top; line-height: 1.5; }
    .foot-right { text-align: left; padding-left: 12px; }
    .foot-left strong, .foot-right strong { margin-right: 4px; }
    .ci-commercial-page .cols-2 { margin-bottom: 6px; }
    .ci-commercial-page .terms { margin-top: 6px; }
    @media screen {
      body { background: #b8b8b8; }
      .print-bundle {
        padding: 16px 0 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 18px;
      }
      .print-page {
        min-height: 297mm;
        padding: 10mm 12mm;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.2);
        page-break-after: unset;
        break-after: unset;
        page-break-before: unset;
        break-before: unset;
      }
      .print-page + .print-page { page-break-before: unset; break-before: unset; }
    }
    @media print {
      html, body {
        width: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
      }
      .print-bundle { width: 100%; padding: 0; gap: 0; }
      .print-page {
        width: 210mm !important;
        min-height: 297mm !important;
        height: auto;
        box-shadow: none;
        margin: 0 !important;
        padding: 10mm 12mm !important;
        box-sizing: border-box !important;
        display: flex !important;
        flex-direction: column !important;
      }
      .page-body {
        flex: 1 1 auto !important;
        display: flex !important;
        flex-direction: column !important;
        min-height: 0 !important;
      }
      .page-bottom {
        margin-top: auto !important;
        flex-shrink: 0 !important;
      }
      .doc-footer {
        flex-shrink: 0 !important;
      }
      .print-page { page-break-after: always; break-after: page; }
      .print-page:last-child { page-break-after: auto; break-after: auto; }
      .print-page + .print-page { page-break-before: always; break-before: page; }
    }
  `;
}

/** Enveloppe les pages A4 dans un seul document imprimable (3 pages qui se suivent). */
export function wrapPrintBundle(
  title: string,
  pagesHtml: string[],
  branding: DocumentBranding
): string {
  const body = `<div class="print-bundle">${pagesHtml.join('')}</div>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <style>${sharedPrintStyles(branding)}</style>
</head>
<body>${body}</body>
</html>`;
}
