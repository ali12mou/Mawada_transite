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
    ${stampHtml}
    <footer class="doc-footer">
      ${buildMawadaContactFooterHtml(branding)}
    </footer>`;
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

export function sharedPrintStyles(branding: DocumentBranding): string {
  const green = docGreen(branding);
  const navy = DEFAULT_DOC_NAVY;
  return `
    ${STYLE_A4_SHEET}
    ${letterheadBannerPrintCss()}
    @page { size: A4 portrait; margin: 10mm 12mm; }
    * { box-sizing: border-box; }
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
      min-height: 277mm;
      padding: 0;
      display: flex;
      flex-direction: column;
      background: #fff;
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
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 277mm;
      padding: 0 2mm;
    }
    h1.doc-title {
      text-align: center;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12pt;
      font-weight: 700;
      letter-spacing: 0.14em;
      margin: 10px 0 14px;
      text-transform: uppercase;
      color: #111;
    }
    .cols-2 { display: table; width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .cols-2 > .col { display: table-cell; width: 50%; vertical-align: top; padding: 0 10px 0 0; font-size: 8.5pt; }
    .cols-2 > .col + .col { padding: 0 0 0 10px; }
    .lbl {
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8pt;
      letter-spacing: 0.02em;
      color: #222;
    }
    .line { margin: 3px 0; font-size: 8.5pt; line-height: 1.45; }
    .cols-3 {
      display: table;
      width: 100%;
      margin: 8px 0 10px;
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .cols-3 > div { display: table-cell; width: 33.33%; padding: 4px 6px; }
    .tbl { width: 100%; border-collapse: collapse; font-size: 8pt; margin: 8px 0; }
    .tbl th {
      background: ${green};
      color: #fff;
      font-weight: 700;
      text-transform: uppercase;
      padding: 6px 4px;
      border: 1px solid ${navy};
      text-align: center;
      font-size: 7.5pt;
      letter-spacing: 0.03em;
    }
    .tbl td { border: 1px solid #333; padding: 5px 4px; vertical-align: top; font-size: 8pt; }
    .td-left { text-align: left; }
    .td-num { text-align: right; font-variant-numeric: tabular-nums; }
    .tbl tfoot td { font-weight: 700; }
    .terms { margin-top: 10px; font-size: 8pt; line-height: 1.5; }
    .terms .line { margin: 4px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
    .stamp-zone { margin-top: 16px; min-height: 70px; }
    .stamp-img { max-height: 72px; max-width: 200px; object-fit: contain; }
    .stamp-line .sig-line { width: 180px; border-bottom: 1px solid #333; margin-top: 40px; }
    .doc-footer { margin-top: auto; padding-top: 8px; }
    .foot-box {
      border: 1px solid #222;
      padding: 10px 14px;
      background: #fff;
    }
    .foot-rule { border: none; border-top: 1px solid ${green}; margin: 0 0 8px; }
    .foot-grid { display: table; width: 100%; font-size: 9pt; font-weight: 700; }
    .foot-grid > div { display: table-cell; width: 50%; vertical-align: top; line-height: 1.55; }
    .foot-right { text-align: left; padding-left: 12px; }
    .foot-left strong, .foot-right strong { margin-right: 4px; }
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
        width: auto;
        min-height: 0;
        height: auto;
        box-shadow: none;
        margin: 0;
      }
      .page-body { min-height: 0; }
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
