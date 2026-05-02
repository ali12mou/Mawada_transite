import type { ClientRecord } from '../api/clientsApi';

/** Libellé unique pour lier les écrans métier à la table clients (nom + entreprise). */
export function formatClientLabel(c: ClientRecord): string {
  const name = (c.name || '').trim();
  const company = (c.company_name || '').trim();
  if (!name && !company) return '';
  return company ? `${name} — ${company}` : name;
}


