import { DEFAULT_COMPANY_NAME, type DocumentBranding } from '../types/documentBranding';
import { getApiBaseUrl } from './apiBase';

function escAttr(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Résout une URL d’image issue de la config (Paramètres → Images des documents) pour l’impression :
 * data URLs, http(s), chemins absolus commençant par `/` (préfixe API).
 */
export function documentImageSrc(raw: string | undefined | null): string {
  const u = String(raw ?? '').trim();
  if (!u) return '';
  if (u.startsWith('data:image/')) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('blob:')) return u;
  if (u.startsWith('/')) return `${getApiBaseUrl()}${u}`;
  return u;
}

/** Pour `style="background-image:url("…")"` — échappe les guillemets et antislashs. */
export function cssUrlForBackground(raw: string | undefined | null): string {
  const s = documentImageSrc(raw);
  if (!s) return '';
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '');
}

function splitBrandLines(name: string): { line1: string; line2: string } {
  const n = name.trim();
  if (!n) return { line1: 'GEOSOM', line2: 'TECHNOLOGIE' };
  const parts = n.split(/\s+/);
  if (parts.length === 1) return { line1: parts[0].toUpperCase(), line2: '' };
  return { line1: parts[0].toUpperCase(), line2: parts.slice(1).join(' ').toUpperCase() };
}

export { splitBrandLines };

export type LetterheadOptions = {
  /** Classe du conteneur (ex. `doc-letterhead` pour le document n°9). */
  rootClass?: string;
  imgAlt?: string;
};

/**
 * Bloc d’en-tête imprimable : bandeau logo + nom société (logo pied de page prioritaire),
 * ou image d’en-tête pleine largeur si seul le letter head est configuré.
 */
export function buildLetterheadHtml(branding: DocumentBranding, options?: LetterheadOptions): string {
  const rootClass = options?.rootClass ?? 'letterhead';
  const imgAlt = options?.imgAlt ?? '';
  const footerLogoSrc = documentImageSrc(branding.footerLogoUrl);
  const letterSrc = documentImageSrc(branding.letterHeadUrl);

  if (letterSrc && !footerLogoSrc) {
    return `<div class="${escAttr(rootClass)}"><img src="${escAttr(letterSrc)}" alt="${escAttr(imgAlt)}" /></div>`;
  }

  const logoSrc = footerLogoSrc || letterSrc;
  const { line1, line2 } = splitBrandLines(branding.companyName || DEFAULT_COMPANY_NAME);
  const logoBoxHtml = logoSrc
    ? `<div class="lh-logo-box"><img src="${escAttr(logoSrc)}" alt="${escAttr(branding.companyName || 'Logo')}" class="lh-logo-img" /></div>`
    : `<div class="lh-logo-box lh-logo-ph" aria-hidden="true"></div>`;

  const line2Html = line2
    ? `<div class="lh-brand-line2">${escAttr(line2)}</div>`
    : '';

  return `<header class="${escAttr(rootClass)} letterhead-banner">
  <div class="lh-banner-inner">
    ${logoBoxHtml}
    <div class="lh-brand-text">
      <div class="lh-brand-line1">${escAttr(line1)}</div>
      ${line2Html}
    </div>
  </div>
</header>`;
}


