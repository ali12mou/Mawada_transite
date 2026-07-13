import type { DocumentBranding } from '../types/documentBranding';
import { documentImageSrc } from './documentPrintImages';
import { fetchDocumentBranding } from './documentBranding';
import { STYLE_A4_SHEET, appendAutoPrintBeforeBodyClose } from './printA4';

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

function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(s: string | undefined | null): string {
  const raw = String(s ?? '').trim();
  if (!raw) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return esc(raw);
}

function fmtValue(v: string | number | undefined | null): string {
  const raw = String(v ?? '').trim();
  if (!raw) return '—';
  const compact = raw.replace(/\s/g, '');
  if (/^-?\d+([.,]\d+)?$/.test(compact)) {
    const n = Number(compact.replace(',', '.'));
    if (Number.isFinite(n)) return esc(n.toLocaleString('fr-FR'));
  }
  return esc(raw);
}

/**
 * Gabarit « AVIS DE LIVRAISON » (document n° 4 — Importations).
 */
export function buildDocument4PrintHtml(
  doc: Document4Record,
  branding?: DocumentBranding | null
): string {
  const b = branding || null;
  const sigSrc = b ? documentImageSrc(b.signatureUrl) : '';
  const sig = sigSrc ? `<img class="sig-img" src="${esc(sigSrc)}" alt="" />` : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Avis de livraison — Document N°4 ${esc(doc.recipient_declarant_name)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    ${STYLE_A4_SHEET}
    @page { size: A4 portrait; margin: 7mm 9mm; }
    * { box-sizing: border-box; }
    body.document4-a4 {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      color: #000;
      line-height: 1.2;
      margin: 0;
      padding: 0;
      width: 100%;
    }
    .sheet-wrap {
      position: relative;
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      padding: 2mm 3mm 3mm 11mm;
      box-sizing: border-box;
    }
    .side-note {
      position: absolute;
      left: 2mm;
      top: 10mm;
      bottom: 10mm;
      width: 10px;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-size: 6.5pt;
      color: #222;
      text-align: center;
      letter-spacing: 0.02em;
    }
    .hdr-main { width: 100%; border-collapse: collapse; margin-bottom: 0; margin-top: 12mm; }
    .hdr-main td { border: 2px solid #000; padding: 6px 8px; vertical-align: middle; }
    .hdr-left { width: 38%; font-weight: bold; font-size: 11pt; text-align: center; line-height: 1.15; }
    .hdr-left small { font-weight: normal; font-size: 8.5pt; display: block; margin-top: 4px; }
    .hdr-mid { width: 22%; text-align: center; font-size: 26pt; font-weight: bold; line-height: 1; padding: 6px !important; }
    .hdr-mid-inner { display: inline-block; min-width: 1.1em; padding: 4px 10px; border: 2px solid #000; }
    .hdr-right { width: 38%; font-size: 8.5pt; line-height: 1.35; }
    .hdr-right strong { display: inline-block; min-width: 7em; }
    .banner {
      border: 2px solid #000;
      border-top: 0;
      text-align: center;
      font-weight: bold;
      font-size: 9pt;
      padding: 6px 8px;
      margin-bottom: 0;
    }
    .transfert-wrap { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 0; }
    .transfert-wrap td { vertical-align: middle; }
    .tf-box {
      border: 2px solid #000;
      border-top: 1px solid #000;
      padding: 8px;
      width: 43%;
      vertical-align: top;
      font-size: 8.5pt;
    }
    .tf-mid {
      border: none !important;
      width: 14%;
      text-align: center;
      font-weight: bold;
      font-size: 12pt;
      padding: 8px 6px;
      vertical-align: middle !important;
    }
    .log-grid { width: 100%; border-collapse: collapse; margin-top: 0; }
    .log-grid > tbody > tr > td { border: 2px solid #000; border-top: 1px solid #000; padding: 0; vertical-align: top; width: 50%; }
    .log-grid table.inner { width: 100%; border-collapse: collapse; font-size: 8pt; }
    .log-grid table.inner td { border: 1px solid #000; padding: 3px 4px; vertical-align: middle; }
    .log-grid table.inner td.lbl { font-weight: bold; background: #e0e0e0; width: 40%; }
    .section-bar {
      border: 2px solid #000;
      border-top: 1px solid #000;
      text-align: center;
      font-weight: bold;
      font-size: 9pt;
      padding: 5px;
      background: #e0e0e0;
    }
    .march-table { width: 100%; border-collapse: collapse; font-size: 8pt; table-layout: fixed; }
    .march-table th, .march-table td { border: 1px solid #000; padding: 4px 3px; word-wrap: break-word; }
    .march-table th { background: #e0e0e0; font-weight: bold; text-align: center; }
    .march-table td { text-align: center; }
    .march-table td.desc-cell { text-align: left; }
    .footer-grid { width: 100%; border-collapse: collapse; margin-top: 0; font-size: 8pt; border: 2px solid #000; border-top: 1px solid #000; }
    .footer-grid > tbody > tr > td { border-right: 1px solid #000; padding: 6px 8px; vertical-align: top; }
    .footer-grid > tbody > tr > td:last-child { border-right: none; }
    .route-line { font-size: 8.5pt; }
    .route-line strong { display: inline-block; min-width: 8em; }
    .visa-bel {
      min-height: 58px;
      text-align: center;
      font-weight: bold;
      font-size: 9pt;
      padding-top: 6px;
      border: 1px solid #000;
    }
    .decl {
      font-size: 8pt;
      margin: 0;
      text-align: center;
      border: 2px solid #000;
      border-top: 1px solid #000;
      padding: 5px 6px;
    }
    .sign { width: 100%; border-collapse: collapse; margin-top: 0; font-size: 7.5pt; }
    .sign td { border: 2px solid #000; border-top: 1px solid #000; padding: 6px 5px; min-height: 42px; vertical-align: bottom; text-align: center; width: 33.33%; }
    .sig-img { max-height: 44px; max-width: 100%; object-fit: contain; display: block; margin: 4px auto 0; }
    .banner u { text-decoration: underline; }
    @media screen {
      html { background: #b8b8b8; }
      body.document4-a4 {
        width: 210mm !important;
        max-width: 210mm;
        margin: 14px auto !important;
        padding: 0 !important;
        box-shadow: 0 3px 18px rgba(0, 0, 0, 0.18);
        background: #fff !important;
      }
    }
    @media print {
      .no-print { display: none !important; }
      html, body.document4-a4 {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .sheet-wrap { width: 100%; padding: 1mm 2mm 2mm 10mm; }
    }
  </style>
</head>
<body class="document4-a4">
  <div class="sheet-wrap">
    <div class="side-note">A compléter en caractères dactylographiés par l'opérateur de ZF/FZ/Entrepôt et approuvé par le propriétaire de la marchandise</div>

    <table class="hdr-main" cellspacing="0" cellpadding="0">
      <tr>
        <td class="hdr-left">
          AVIS DE LIVRAISON
          <small>Directeur des Douanes et des Droits Indirects</small>
        </td>
        <td class="hdr-mid"><span class="hdr-mid-inner">4</span></td>
        <td class="hdr-right">
          <div><strong>Code licence :</strong> ${esc(doc.license_code) || '—'}</div>
          <div style="margin-top:6px"><strong>Opérateur :</strong><br/>${esc(doc.operator) || '—'}</div>
        </td>
      </tr>
    </table>

    <div class="banner"><u>Veuillez autoriser la livraison des marchandises mentionnées ci-dessous</u></div>

    <table class="transfert-wrap" cellspacing="0" cellpadding="0">
      <tr>
        <td class="tf-box">
          <strong>Nom du destinataire / déclarant :</strong><br/>
          ${esc(doc.recipient_declarant_name) || '—'}<br/><br/>
          <strong>Code No.</strong> ${esc(doc.code_no) || '—'}<br/>
          <strong>Code NIF déclarant :</strong> ${esc(doc.declarant_nif_code) || '—'}
        </td>
        <td class="tf-mid">IMPORT</td>
        <td class="tf-box">
          <strong>Nom du destinataire :</strong><br/>
          ${esc(doc.recipient_name) || '—'}<br/><br/>
          <strong>Code NIF :</strong> ${esc(doc.recipient_nif_code) || '—'}
        </td>
      </tr>
    </table>

    <table class="log-grid" cellspacing="0" cellpadding="0">
      <tr>
        <td>
          <table class="inner" cellspacing="0" cellpadding="0">
            <tr>
              <td class="lbl">Décl. Entrepôt ZF/FZ</td>
              <td>${esc(doc.fz_warehouse_declaration) || '—'}</td>
            </tr>
            <tr>
              <td class="lbl">Quantité Entrée</td>
              <td>${esc(doc.quantity_entered) || '—'}</td>
            </tr>
            <tr>
              <td class="lbl">Nom du Bateau</td>
              <td>${esc(doc.boat_name) || '—'}</td>
            </tr>
            <tr>
              <td class="lbl">Date d'arrivée</td>
              <td>${fmtDate(doc.arrival_date)}</td>
            </tr>
          </table>
        </td>
        <td>
          <table class="inner" cellspacing="0" cellpadding="0">
            <tr>
              <td class="lbl">N° Voyage</td>
              <td>${esc(doc.trip_number) || '—'}</td>
            </tr>
            <tr>
              <td class="lbl">Connaissement n°</td>
              <td>${esc(doc.bill_of_lading_number) || '—'}</td>
            </tr>
            <tr>
              <td class="lbl">Pays d'Origine</td>
              <td>${esc(doc.country_origin) || '—'}</td>
            </tr>
            <tr>
              <td class="lbl">Code SH</td>
              <td>${esc(doc.sh_code) || '—'}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div class="section-bar">MARCHANDISE</div>

    <table class="march-table">
      <thead>
        <tr>
          <th style="width:12%">Code SH</th>
          <th style="width:10%">Qté Sortie</th>
          <th style="width:36%">Description de la Marchandise</th>
          <th style="width:16%">Poids Bruts</th>
          <th style="width:26%">Valeur déclarée</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${esc(doc.sh_code) || '—'}</td>
          <td>${esc(doc.exit_qty) || '—'}</td>
          <td class="desc-cell">${esc(doc.merchandise_description) || '—'}</td>
          <td>${esc(doc.gross_weight) || '—'}</td>
          <td>${fmtValue(doc.declared_value)}</td>
        </tr>
      </tbody>
    </table>

    <table class="footer-grid" cellspacing="0" cellpadding="0">
      <tr>
        <td style="width:40%">
          <div class="route-line"><strong>Point de Sortie</strong><br/>${esc(doc.exit_point) || '—'}</div>
        </td>
        <td style="width:40%">
          <div class="route-line"><strong>Destination</strong><br/>${esc(doc.destination) || '—'}</div>
        </td>
        <td style="width:20%">
          <div class="visa-bel">Visa du Bureau BEL</div>
        </td>
      </tr>
    </table>

    <p class="decl">Nous déclarons que les détails que nous avons fournis ci-dessus sont vérifiables et complets.</p>

    <table class="sign" cellspacing="0" cellpadding="0">
      <tr>
        <td>Cachet et signature de l'opérateur de FZ / Zone franche :<br/>${sig}</td>
        <td>Cachet et signature du destinataire / déclarant :</td>
        <td>Visa du Bureau FZ des régimes suspensifs / bureau de free zone</td>
      </tr>
    </table>
  </div>
</body>
</html>`;
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
