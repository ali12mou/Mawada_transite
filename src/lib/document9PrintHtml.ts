import type { Document9Record } from '../api/document9Api';
import type { DocumentBranding } from '../types/documentBranding';
import { documentImageSrc } from './documentPrintImages';
import { fetchDocumentBranding } from './documentBranding';
import { STYLE_A4_SHEET, appendAutoPrintBeforeBodyClose } from './printA4';

function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(s: string): string {
  if (!s) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s.trim());
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return esc(s);
}

function fmtValue(n: number): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return esc(n.toLocaleString('fr-FR'));
}

const TX_LABELS: Record<string, string> = {
  import: 'Import',
  transit: 'Transit',
  transbordement: 'Transbordement',
  exportation: 'Exportation',
  admission_temporaire: 'Admission temporaire',
  depot_fz: 'Dépôt FZ/ZF',
  entrepot: 'Entrepôt',
  transfert: 'Transfert',
};

const TR_LABELS: Record<string, string> = {
  camion: 'Camion',
  train: 'Train',
  avion: 'Avion',
  navire: 'Navire',
  boutre: 'Boutre',
};

const TX_KEYS = Object.keys(TX_LABELS);
const TR_KEYS = Object.keys(TR_LABELS);

function box(checked: boolean): string {
  return checked ? '☑' : '☐';
}

/**
 * Gabarit « AVIS DE LIVRAISON » (document n° 9) — feuille type douanes
 * (sans en-tête République / logo : bloc titre + 9 + licence dès le haut).
 */
export function buildDocument9PrintHtml(
  doc: Document9Record,
  branding?: DocumentBranding | null
): string {
  const tt = Array.isArray(doc.transaction_types) ? doc.transaction_types : [];
  const tm = Array.isArray(doc.transport_modes) ? doc.transport_modes : [];
  const gross = doc.gross_weight?.trim() || doc.weight || '';
  const net = doc.net_weight?.trim() || '';

  const txRow = TX_KEYS.map(
    (k) => `<span class="chk-item">${box(tt.includes(k))} ${esc(TX_LABELS[k])}</span>`
  ).join('');

  const trRow = TR_KEYS.map(
    (k) => `<span class="chk-item">${box(tm.includes(k))} ${esc(TR_LABELS[k])}</span>`
  ).join('');

  const b = branding || null;
  const sigSrc = b ? documentImageSrc(b.signatureUrl) : '';
  const sig = sigSrc ? `<img class="sig-img" src="${esc(sigSrc)}" alt="" />` : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Avis de livraison — SQN ${esc(doc.sqn)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    ${STYLE_A4_SHEET}
    /* Transferts Document N°9 : une feuille A4 pleine (zone utile maximisée) */
    @page {
      size: A4 portrait;
      margin: 7mm 9mm;
    }
    * { box-sizing: border-box; }
    body.document9-a4 {
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
      padding: 2mm 3mm 4mm 11mm;
      min-height: 283mm;
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
    .bd { border: 2px solid #000; }
    .bd-thin { border: 1px solid #000; }
    .hdr-main { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    .hdr-main td { border: 2px solid #000; padding: 6px 8px; vertical-align: middle; }
    .hdr-left { width: 38%; font-weight: bold; font-size: 11pt; text-align: center; line-height: 1.15; }
    .hdr-left small { font-weight: normal; font-size: 8.5pt; display: block; margin-top: 4px; }
    .hdr-mid {
      width: 22%;
      text-align: center;
      font-size: 26pt;
      font-weight: bold;
      line-height: 1;
      padding: 6px !important;
    }
    .hdr-mid-inner {
      display: inline-block;
      min-width: 1.1em;
      padding: 4px 10px;
      border: 2px solid #000;
    }
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
      width: 38%;
      vertical-align: top;
      font-size: 8.5pt;
    }
    .tf-mid {
      border: none !important;
      width: 14%;
      text-align: center;
      font-weight: bold;
      font-size: 13pt;
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
    .march-table { width: 100%; border-collapse: collapse; font-size: 7pt; table-layout: fixed; }
    .march-table th, .march-table td { border: 1px solid #000; padding: 3px 2px; word-wrap: break-word; }
    .march-table th { background: #e0e0e0; font-weight: bold; text-align: center; }
    .march-table td { text-align: center; }
    .march-table td.desc-cell { text-align: left; }
    .footer-grid { width: 100%; border-collapse: collapse; margin-top: 0; font-size: 8pt; border: 2px solid #000; border-top: 1px solid #000; }
    .footer-grid > tbody > tr > td { border-right: 1px solid #000; padding: 6px; vertical-align: top; }
    .footer-grid > tbody > tr > td:last-child { border-right: none; }
    .chk-title { font-weight: bold; margin-bottom: 4px; font-size: 8pt; }
    .chk-item { display: inline-block; margin: 2px 10px 2px 0; white-space: nowrap; }
    .visa-bel {
      min-height: 72px;
      text-align: center;
      font-weight: bold;
      font-size: 9pt;
      padding-top: 8px;
      border: 1px solid #000;
    }
    .route-line { margin-top: 6px; font-size: 8.5pt; }
    .route-line strong { display: inline-block; min-width: 8em; }
    .decl {
      font-size: 8pt;
      margin: 8px 0 0;
      text-align: center;
      border: 2px solid #000;
      border-top: 1px solid #000;
      padding: 6px;
    }
    .sign { width: 100%; border-collapse: collapse; margin-top: 0; font-size: 7.5pt; }
    .sign td { border: 2px solid #000; border-top: 1px solid #000; padding: 10px 6px; min-height: 56px; vertical-align: bottom; text-align: center; width: 33.33%; }
    .sig-img { max-height: 44px; max-width: 100%; object-fit: contain; display: block; margin: 4px auto 0; }
    @media screen {
      html {
        background: #b8b8b8;
      }
      body.document9-a4 {
        width: 210mm !important;
        min-height: 297mm !important;
        max-width: 210mm;
        margin: 14px auto !important;
        padding: 0 !important;
        box-shadow: 0 3px 18px rgba(0, 0, 0, 0.18);
        background: #fff !important;
      }
      .sheet-wrap {
        min-height: 297mm;
      }
    }
    @media print {
      .no-print { display: none !important; }
      html,
      body.document9-a4 {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .sheet-wrap {
        min-height: calc(297mm - 14mm);
        width: 100%;
        padding: 1mm 2mm 3mm 10mm;
      }
    }
  </style>
</head>
<body class="document9-a4">
  <div class="sheet-wrap">
    <div class="side-note">A compléter en caractères dactylographiés par l'opérateur de ZF/FZ/Entrepôt et approuvé par le propriétaire de la marchandise</div>

    <table class="hdr-main" cellspacing="0" cellpadding="0">
      <tr>
        <td class="hdr-left">
          AVIS DE LIVRAISON
          <small>Directeur des Douanes et des Droits Indirects</small>
        </td>
        <td class="hdr-mid"><span class="hdr-mid-inner">9</span></td>
        <td class="hdr-right">
          <div><strong>Code licence :</strong> ${esc(doc.license_code) || '—'}</div>
          <div style="margin-top:6px"><strong>Nom de l'opérateur de FZ / entrepôt :</strong><br/>${esc(doc.operator_name) || '—'}</div>
        </td>
      </tr>
    </table>

    <div class="banner">Veuillez autoriser la livraison des marchandises mentionnées ci-dessous</div>

    <table class="transfert-wrap" cellspacing="0" cellpadding="0">
      <tr>
        <td class="tf-box">
          <strong>Nom du destinataire / déclarant :</strong><br/>
          ${esc(doc.declarant) || '—'}<br/><br/>
          <strong>Code No.</strong> ${esc(doc.declarant_nif) || '—'}
        </td>
        <td class="tf-mid">TRANSFERT</td>
        <td class="tf-box">
          <strong>Code NIF :</strong> ${esc(doc.actual_recipient_nif) || '—'}<br/><br/>
          <strong>Nom du destinataire :</strong><br/>
          ${esc(doc.actual_recipient) || '—'}
        </td>
      </tr>
    </table>

    <table class="log-grid" cellspacing="0" cellpadding="0">
      <tr>
        <td>
          <table class="inner" cellspacing="0" cellpadding="0">
            <tr>
              <td class="lbl">Décl. Entrée ZF/FZ/Entrepôt</td>
              <td>${esc(doc.entry_doc_ref) || '—'}</td>
              <td class="lbl" style="width:16%">Date</td>
              <td>${fmtDate(doc.entry_date || doc.date)}</td>
            </tr>
            <tr>
              <td class="lbl">N° sommier / répertoire</td>
              <td colspan="3">${esc(doc.sommier_ref) || '—'}</td>
            </tr>
            <tr>
              <td class="lbl">D/O N°</td>
              <td>${esc(doc.do_number) || '—'}</td>
              <td class="lbl">Date</td>
              <td>${fmtDate(doc.do_date)}</td>
            </tr>
            <tr>
              <td class="lbl">Quantité Entrée</td>
              <td colspan="3">${esc(doc.quantity_entered) || '—'}</td>
            </tr>
          </table>
        </td>
        <td>
          <table class="inner" cellspacing="0" cellpadding="0">
            <tr>
              <td class="lbl">Nom du Bateau</td>
              <td colspan="3">${esc(doc.boat) || '—'}</td>
            </tr>
            <tr>
              <td class="lbl">Date d'arrivée</td>
              <td>${fmtDate(doc.arrival_date)}</td>
              <td class="lbl" style="width:16%">N° Voy</td>
              <td>${esc(doc.trip_number) || '—'}</td>
            </tr>
            <tr>
              <td class="lbl">Connaissement n°</td>
              <td colspan="3">${esc(doc.bl_number) || '—'}</td>
            </tr>
            <tr>
              <td class="lbl">Pays d'Origine</td>
              <td>${esc(doc.country_origin) || '—'}</td>
              <td class="lbl">Reg. fiscal</td>
              <td>${esc(doc.fiscal_reg) || '—'}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div class="section-bar">AUTRE SECTION OU SOUS-TITRE</div>

    <table class="march-table">
      <thead>
        <tr>
          <th style="width:9%">Code SH</th>
          <th style="width:8%">Qté Sortie</th>
          <th style="width:22%">Description de la Marchandise</th>
          <th style="width:8%">Conditionnement</th>
          <th style="width:7%">Qté Cumulée</th>
          <th style="width:8%">Poids Net</th>
          <th style="width:8%">Poids Bruts</th>
          <th style="width:6%">Vol.</th>
          <th style="width:10%">Valeur déclarée</th>
          <th style="width:8%">Qté Restante</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${esc(doc.nomenclature) || '—'}</td>
          <td>${esc(doc.quantity) || '—'}</td>
          <td class="desc-cell">${esc(doc.description) || '—'}</td>
          <td>${esc(doc.packaging) || '—'}</td>
          <td>${esc(doc.qty_packages) || '—'}</td>
          <td>${esc(net) || '—'}</td>
          <td>${esc(gross) || '—'}</td>
          <td>${esc(doc.volume) || '—'}</td>
          <td>${fmtValue(doc.value)} FDJ</td>
          <td>${esc(doc.remaining_qty) || '—'}</td>
        </tr>
      </tbody>
    </table>
    <p style="font-size:7.5pt;margin:4px 0 0 2px">Réf. SQN : ${esc(doc.sqn)} — Conteneur / factures : ${esc(doc.container_number) || '—'} — Nombre de factures : ${esc(doc.invoice_count)}</p>

    <table class="footer-grid" cellspacing="0" cellpadding="0">
      <tr>
        <td style="width:52%">
          <div class="chk-title">Cocher la case correspondante</div>
          <div>${txRow}</div>
          <div style="margin-top:8px" class="chk-title">Mode de transport</div>
          <div>${trRow}</div>
        </td>
        <td style="width:28%">
          <div class="route-line"><strong>Point Sortie</strong><br/>${esc(doc.exit_point) || '—'}</div>
          <div class="route-line" style="margin-top:8px"><strong>Destination</strong><br/>${esc(doc.destination) || '—'}</div>
        </td>
        <td style="width:20%">
          <div class="visa-bel">Visa du Bureau BEL</div>
        </td>
      </tr>
    </table>

    <p class="decl">Nous déclarons que les données que nous avons fournies ci-dessous sont véritables et complets.</p>

    <table class="sign" cellspacing="0" cellpadding="0">
      <tr>
        <td>Cachet et signature de l'opérateur de FZ / Zone franche<br/>${sig}</td>
        <td>Cachet et signature du destinataire / déclarant</td>
        <td>Visa du Bureau FZ des régimes suspensifs / bureau de free zone</td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

/** Avis seul dans un onglet (lecture, sans ouverture automatique de la boîte d’impression). */
export async function openDocument9ViewDocumentWindow(doc: Document9Record): Promise<void> {
  const branding = await fetchDocumentBranding();
  const html = buildDocument9PrintHtml(doc, branding);
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up pour afficher le document.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

/** Impression / enregistrement PDF via le navigateur (avis officiel une page). */
export async function openDocument9PrintWindow(doc: Document9Record): Promise<void> {
  const branding = await fetchDocumentBranding();
  const html = buildDocument9PrintHtml(doc, branding);
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up pour imprimer.');
    return;
  }
  w.document.open();
  w.document.write(appendAutoPrintBeforeBodyClose(html));
  w.document.close();
}
