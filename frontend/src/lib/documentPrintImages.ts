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

/** Logo par défaut (petit logo MGT) si non configuré en paramètres. */
export const DEFAULT_DOC_LOGO_PATH = '/branding/mawada-logo-mgt.png';

/** URL absolue d’un asset statique du frontend (pour fenêtre d’impression). */
export function staticAssetSrc(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${p}`;
  }
  return p;
}

/** Source du logo société (config → image publique par défaut). */
export function logoImageSrc(branding?: DocumentBranding | null): string {
  const fromFooter = documentImageSrc(branding?.footerLogoUrl);
  if (fromFooter) return fromFooter;
  const fromLetter = documentImageSrc(branding?.letterHeadUrl);
  if (fromLetter) return fromLetter;
  return staticAssetSrc(DEFAULT_DOC_LOGO_PATH);
}

/** Filigrane = même image que le logo (config ou logo MGT par défaut). */
export function watermarkImageSrc(branding?: DocumentBranding | null): string {
  return logoImageSrc(branding);
}

/** URL CSS `background-image` pour le filigrane. */
export function watermarkCssUrl(branding?: DocumentBranding | null): string {
  const src = watermarkImageSrc(branding);
  if (!src) return '';
  return src.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '');
}

/** Pour `style="background-image:url("…")"` — échappe les guillemets et antislashs. */
export function cssUrlForBackground(raw: string | undefined | null): string {
  const s = documentImageSrc(raw);
  if (!s) return '';
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '');
}

/**
 * Nom société en HTML : alternance vert / bleu mot par mot (séparés par espaces).
 * Ex. « MAWADA GENERAL TRADING FZCO » → vert, bleu, vert, bleu.
 */
export function buildAlternatingBrandNameHtml(name: string): string {
  const words = (name || DEFAULT_COMPANY_NAME).trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return '<span class="lh-brand-green">GEOSOM</span> <span class="lh-brand-blue">TECHNOLOGIE</span>';
  }
  return words
    .map((word, i) => {
      const cls = i % 2 === 0 ? 'lh-brand-green' : 'lh-brand-blue';
      const prefix = i > 0 ? ' ' : '';
      return `${prefix}<span class="${cls}">${escAttr(word.toUpperCase())}</span>`;
    })
    .join('');
}

/** Découpe le nom en 2 lignes (1er mot / reste) — affichage UI à 2 lignes. */
function splitBrandNameParts(name: string): { lead: string; rest: string } {
  const n = name.trim();
  if (!n) return { lead: 'GEOSOM', rest: 'TECHNOLOGIE' };
  const parts = n.split(/\s+/);
  if (parts.length === 1) return { lead: parts[0].toUpperCase(), rest: '' };
  return { lead: parts[0].toUpperCase(), rest: parts.slice(1).join(' ').toUpperCase() };
}

export function splitBrandLines(name: string): { line1: string; line2: string } {
  const { lead, rest } = splitBrandNameParts(name);
  return { line1: lead, line2: rest };
}

export type LetterheadOptions = {
  /** Classe du conteneur (ex. `doc-head` pour facture commerciale). */
  rootClass?: string;
  imgAlt?: string;
};

/**
 * En-tête imprimable style MAWADA :
 * logo à gauche + nom société (alternance vert/bleu par mot) souligné turquoise.
 * Si seul le letter head pleine largeur est configuré (sans logo pied), image pleine largeur.
 */
export function buildLetterheadHtml(branding: DocumentBranding, options?: LetterheadOptions): string {
  const rootClass = options?.rootClass ?? 'letterhead';
  const imgAlt = options?.imgAlt ?? '';
  const footerLogoSrc = documentImageSrc(branding.footerLogoUrl);
  const letterSrc = documentImageSrc(branding.letterHeadUrl);

  if (letterSrc && !footerLogoSrc) {
    return `<div class="${escAttr(rootClass)} letterhead-banner"><img class="lh-full-img" src="${escAttr(letterSrc)}" alt="${escAttr(imgAlt)}" /></div>`;
  }

  const logoSrc = footerLogoSrc || letterSrc;
  const brandNameHtml = buildAlternatingBrandNameHtml(branding.companyName || DEFAULT_COMPANY_NAME);
  const logoBoxHtml = logoSrc
    ? `<div class="lh-logo-box"><img src="${escAttr(logoSrc)}" alt="${escAttr(branding.companyName || 'Logo')}" class="lh-logo-img" /></div>`
    : `<div class="lh-logo-box lh-logo-ph" aria-hidden="true"></div>`;

  return `<header class="${escAttr(rootClass)} letterhead-banner">
  <div class="lh-banner-inner">
    ${logoBoxHtml}
    <div class="lh-brand-text">
      <div class="lh-brand-name">${brandNameHtml}</div>
    </div>
  </div>
  <div class="lh-rule" aria-hidden="true"></div>
</header>`;
}
