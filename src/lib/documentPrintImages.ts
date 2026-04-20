import type { DocumentBranding } from '../types/documentBranding';
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
  if (!n) return { line1: 'GEOSOM', line2: 'TRANSIT' };
  const parts = n.split(/\s+/);
  if (parts.length === 1) return { line1: parts[0].toUpperCase(), line2: '' };
  return { line1: parts[0].toUpperCase(), line2: parts.slice(1).join(' ').toUpperCase() };
}

export type LetterheadOptions = {
  /** Classe du conteneur (ex. `doc-letterhead` pour le document n°9). */
  rootClass?: string;
  imgAlt?: string;
};

/**
 * Bloc d’en-tête imprimable : image configurée ou bandeau texte + icône (nom société depuis la config).
 */
export function buildLetterheadHtml(branding: DocumentBranding, options?: LetterheadOptions): string {
  const rootClass = options?.rootClass ?? 'letterhead';
  const imgAlt = options?.imgAlt ?? '';
  const src = documentImageSrc(branding.letterHeadUrl);
  if (src) {
    return `<div class="${escAttr(rootClass)}"><img src="${escAttr(src)}" alt="${escAttr(imgAlt)}" /></div>`;
  }
  const { line1, line2 } = splitBrandLines(branding.companyName || 'GEOSOM TRANSIT');
  return `<div class="${escAttr(rootClass)} letterhead-fallback" style="background:#1e3a5f;color:#fff;padding:12px 16px;border-radius:6px;text-align:center;margin-bottom:12px;">
  <div style="display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;">
    <div style="background:#fff;border-radius:8px;padding:6px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;" aria-hidden="true">🚚</div>
    <div style="text-align:left;">
      <div style="font-weight:800;font-size:14pt;letter-spacing:0.5px;line-height:1.15;">${escAttr(line1)}</div>
      ${line2 ? `<div style="font-weight:800;font-size:14pt;letter-spacing:0.5px;line-height:1.15;">${escAttr(line2)}</div>` : ''}
    </div>
  </div>
</div>`;
}
