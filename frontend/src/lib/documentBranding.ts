import { fetchAppConfig } from '../api/appConfigApi';
import { brandingFromConfig, type DocumentBranding } from '../types/documentBranding';

export async function fetchDocumentBranding(): Promise<DocumentBranding> {
  try {
    const cfg = await fetchAppConfig();
    return brandingFromConfig(cfg);
  } catch {
    return brandingFromConfig({});
  }
}

export type { DocumentBranding };


