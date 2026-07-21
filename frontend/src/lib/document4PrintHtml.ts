import type { Document9Record } from '../api/document9Api';
import type { DocumentBranding } from '../types/documentBranding';
import { fetchDocumentBranding } from './documentBranding';
import { buildDocument9PrintHtml } from './document9PrintHtml';
import { appendAutoPrintBeforeBodyClose } from './printA4';

export interface Document4Record {
  id?: string;
  license_code?: string;
  operator?: string;
  recipient_declarant_name?: string;
  code_no?: string;
  declarant_nif_code?: string;
  recipient_name?: string;
  recipient_nif_code?: string;
  fz_warehouse_declaration?: string;
  quantity_entered?: string;
  boat_name?: string;
  arrival_date?: string;
  trip_number?: string;
  bill_of_lading_number?: string;
  country_origin?: string;
  sh_code?: string;
  exit_qty?: string;
  merchandise_description?: string;
  gross_weight?: string;
  declared_value?: string;
  exit_point?: string;
  destination?: string;
  created_at?: string;
}

/** Mappe les champs Document 4 vers le gabarit Avis de livraison (transfert Doc 9). */
function mapDocument4ToPrintDoc(doc: Document4Record): Document9Record {
  const arrival = String(doc.arrival_date ?? '').trim();
  const gross = String(doc.gross_weight ?? '').trim();
  return {
    id: String(doc.id ?? ''),
    sqn: 0,
    date: arrival,
    actual_recipient: String(doc.recipient_name ?? ''),
    actual_recipient_nif: String(doc.recipient_nif_code ?? ''),
    declarant: String(doc.recipient_declarant_name ?? ''),
    declarant_nif: String(doc.code_no ?? doc.declarant_nif_code ?? ''),
    do_number: '',
    container_number: '',
    boat: String(doc.boat_name ?? ''),
    trip_number: String(doc.trip_number ?? ''),
    bl_number: String(doc.bill_of_lading_number ?? ''),
    invoice_count: '',
    nomenclature: String(doc.sh_code ?? ''),
    quantity: String(doc.exit_qty ?? ''),
    weight: gross,
    value: String(doc.declared_value ?? ''),
    exit_point: String(doc.exit_point ?? ''),
    destination: String(doc.destination ?? ''),
    description: String(doc.merchandise_description ?? ''),
    license_code: String(doc.license_code ?? ''),
    operator_name: String(doc.operator ?? ''),
    entry_doc_ref: String(doc.fz_warehouse_declaration ?? ''),
    entry_date: arrival,
    sommier_ref: '',
    do_date: '',
    quantity_entered: String(doc.quantity_entered ?? ''),
    arrival_date: arrival,
    country_origin: String(doc.country_origin ?? ''),
    fiscal_reg: '',
    packaging: '',
    qty_packages: '',
    net_weight: '',
    gross_weight: gross,
    volume: '',
    remaining_qty: '',
    transaction_types: [],
    transport_modes: [],
  };
}

/**
 * Gabarit « AVIS DE LIVRAISON » n° 4 — même mise en page que Transfert Document 9.
 */
export function buildDocument4PrintHtml(
  doc: Document4Record,
  branding?: DocumentBranding | null
): string {
  return buildDocument9PrintHtml(mapDocument4ToPrintDoc(doc), branding, { documentNumber: 4 });
}

/** Avis seul dans un onglet (lecture, sans ouverture automatique de la boîte d'impression). */
export async function openDocument4ViewDocumentWindow(doc: Document4Record): Promise<void> {
  const branding = await fetchDocumentBranding();
  const html = buildDocument4PrintHtml(doc, branding);
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up pour afficher le document.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

/** Impression / enregistrement PDF via le navigateur. */
export async function openDocument4PrintWindow(doc: Document4Record): Promise<void> {
  const branding = await fetchDocumentBranding();
  const html = buildDocument4PrintHtml(doc, branding);
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up pour imprimer.');
    return;
  }
  w.document.open();
  w.document.write(appendAutoPrintBeforeBodyClose(html));
  w.document.close();
}
