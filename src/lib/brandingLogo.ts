import type { AppConfigMap } from '../api/appConfigApi';
import { documentImageSrc } from './documentPrintImages';

/** Logo compact UI : préfère le logo pied de page, sinon l’en-tête lettre (Paramètres → Images des documents). */
export function getAppLogoSrcFromConfig(cfg: AppConfigMap): string {
  const footer = documentImageSrc(cfg.footer_logo_image);
  if (footer) return footer;
  return documentImageSrc(cfg.letter_head_image || '');
}
