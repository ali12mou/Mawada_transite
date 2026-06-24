import type { AppConfigMap } from '../api/appConfigApi';

/** Nom affiché sur les documents si `company_name` n'est pas configuré en base. */
export const DEFAULT_COMPANY_NAME = 'Geosom technologie';

export interface DocumentBranding {
  letterHeadUrl: string;
  footerLogoUrl: string;
  signatureUrl: string;
  signatureStampUrl: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  primaryColor: string;
  secondaryColor: string;
}

export function brandingFromConfig(cfg: AppConfigMap): DocumentBranding {
  return {
    letterHeadUrl: cfg.letter_head_image || '',
    footerLogoUrl: cfg.footer_logo_image || '',
    signatureUrl: cfg.signature_logo_image || '',
    signatureStampUrl: cfg.signature_stamp_image || cfg.signature_logo_image || '',
    companyName: (cfg.company_name || '').trim() || DEFAULT_COMPANY_NAME,
    companyAddress: cfg.company_address || '',
    companyPhone: cfg.company_phone || '',
    companyEmail: cfg.company_email || '',
    primaryColor: cfg.primary_color || '#00a651',
    secondaryColor: cfg.secondary_color || '#fbbf24',
  };
}
