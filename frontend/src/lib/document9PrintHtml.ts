import type { Document9Record } from '../api/document9Api';
import type { DocumentBranding } from '../types/documentBranding';
import { fetchDocumentBranding } from './documentBranding';
import { appendAutoPrintBeforeBodyClose } from './printA4';

function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Affiche la valeur saisie, ou vide si absente (pas de tiret). */
function val(s: string | number | undefined | null): string {
  const t = String(s ?? '').trim();
  return t ? esc(t) : '';
}

function fmtDate(s: string | undefined | null): string {
  const raw = String(s ?? '').trim();
  if (!raw) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return esc(raw);
}

function fmtNumber(v: string | number | undefined | null): string {
  const raw = String(v ?? '').trim();
  if (!raw) return '';
  const compact = raw.replace(/\s/g, '').replace(',', '.');
  if (/^-?\d+(\.\d+)?$/.test(compact)) {
    const n = Number(compact);
    if (Number.isFinite(n)) return esc(n.toLocaleString('fr-FR'));
  }
  return esc(raw);
}

/** Poids avec unité sur 2 lignes si possible. */
function fmtWeight(v: string | undefined | null): string {
  const raw = String(v ?? '').trim();
  if (!raw) return '';
  const m = /^([\d\s.,]+)\s*(KG|KGS|kg|kgs)?$/i.exec(raw);
  if (m) {
    const num = fmtNumber(m[1]) || esc(m[1].trim());
    return `${num}<br/>KG`;
  }
  return esc(raw).replace(/\n/g, '<br/>');
}

/** Valeur déclarée + DJF sur 2 lignes. */
function fmtDeclaredValue(v: string | number | undefined | null): string {
  const raw = String(v ?? '').trim();
  if (!raw) return '';
  const cleaned = raw.replace(/\s*DJF\s*$/i, '').trim();
  const num = fmtNumber(cleaned) || esc(cleaned);
  return `${num}<br/>DJF`;
}

const TX_LEFT: { key: string; label: string }[] = [
  { key: 'import', label: 'Import' },
  { key: 'transbordement', label: 'Transbordement' },
  { key: 'admission_temporaire', label: 'Admission Temporaire' },
  { key: 'entrepot', label: 'Entrepôt' },
];

const TX_RIGHT: { key: string; label: string }[] = [
  { key: 'transit', label: 'Transit' },
  { key: 'exportation', label: 'Exportation' },
  { key: 'depot_fz', label: 'Décl. Ent. FZ/ZF' },
  { key: 'transfert', label: 'Transfert' },
];

const TR_MODES: { key: string; label: string }[] = [
  { key: 'camion', label: 'Camion' },
  { key: 'train', label: 'Train' },
  { key: 'avion', label: 'Avion' },
  { key: 'navire', label: 'Navire' },
  { key: 'boutre', label: 'Boutre' },
];

function chkMark(checked: boolean): string {
  return checked ? '☒' : '☐';
}

function buildTxCols(tt: string[]): string {
  const line = (item: { key: string; label: string }) =>
    `<div class="chk-line">${chkMark(tt.includes(item.key))} ${esc(item.label)}</div>`;
  return `<div class="chk-cols">
    <div class="chk-col">${TX_LEFT.map(line).join('')}</div>
    <div class="chk-col">${TX_RIGHT.map(line).join('')}</div>
  </div>`;
}

function buildTrRow(tm: string[]): string {
  return TR_MODES.map(
    (item) => `<span class="chk-item">${chkMark(tm.includes(item.key))} ${esc(item.label)}</span>`
  ).join('');
}

export type AvisLivraisonDocumentNumber = 4 | 9;

/**
 * Avis de livraison — gabarit transfert (parties 1 + marchandises + pied).
 * Utilisé pour Document N°9 (transfert) et Document N°4 (même mise en page, numéro 4).
 */
export function buildDocument9PrintHtml(
  doc: Document9Record,
  _branding?: DocumentBranding | null,
  options?: { documentNumber?: AvisLivraisonDocumentNumber }
): string {
  const documentNumber = options?.documentNumber ?? 9;
  const gross = doc.gross_weight?.trim() || doc.weight || '';
  const descHtml = val(doc.description).replace(/\n/g, '<br/>');
  const tt = Array.isArray(doc.transaction_types) ? doc.transaction_types : [];
  const tm = Array.isArray(doc.transport_modes) ? doc.transport_modes : [];
  const txHtml = buildTxCols(tt);
  const trHtml = buildTrRow(tm);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Avis de livraison — Document N°${documentNumber}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { size: A4 portrait; margin: 4mm 3mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
    }
    body.document9-a4 {
      font-family: 'Times New Roman', Times, serif;
      font-size: 8.5pt;
      color: #000;
      line-height: 1.2;
      width: 100%;
      background: #fff;
    }

    /* Page sans cadre global — deux cadres séparés */
    .page {
      width: 100%;
      background: #fff;
      position: relative;
      padding: 0.5mm 1mm 0.5mm 4.5mm;
      border: none;
    }

    .republique {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin: 0 0 1mm 0;
    }

    .side-note {
      position: absolute;
      left: 0.3mm;
      top: 14mm;
      height: 140mm;
      width: 4mm;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-family: 'Times New Roman', Times, serif;
      font-size: 5.5pt;
      text-align: center;
      line-height: 1.1;
      color: #000;
    }

    /* Cadre HAUT (épais) */
    .part-top {
      border: 2.5px solid #000;
      width: 100%;
      background: #fff;
    }

    /* Petit espace entre les deux cadres */
    .parts-gap {
      height: 3.5mm;
      background: #fff;
      border: none;
    }

    /* Cadre BAS (plus fin) */
    .part-bottom {
      border: 1.5px solid #000;
      width: 100%;
      background: #fff;
    }

    /* ——— En-tête ——— */
    .hdr {
      display: flex;
      align-items: stretch;
      justify-content: space-between;
      gap: 2mm;
      padding: 2mm 2mm 1.5mm;
    }
    .hdr-box {
      flex: 1 1 42%;
      border: 2px solid #000;
      border-radius: 10px;
      padding: 2.5mm 3mm;
      min-height: 17mm;
    }
    .hdr-left {
      text-align: center;
      font-family: 'Times New Roman', Times, serif;
      font-weight: 700;
      font-size: 12pt;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .hdr-left small {
      display: block;
      font-family: 'Times New Roman', Times, serif;
      font-weight: 400;
      font-size: 8pt;
      margin-top: 1mm;
    }
    .hdr-num {
      flex: 0 0 12mm;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Times New Roman', Times, serif;
      font-size: 34pt;
      font-weight: 700;
      line-height: 1;
    }
    .hdr-right {
      font-family: 'Times New Roman', Times, serif;
      font-size: 9pt;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 1.5mm;
    }

    /* ——— Bandeau ——— */
    .banner {
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      text-align: center;
      font-family: 'Comic Sans MS', 'Comic Sans', cursive;
      font-weight: 700;
      font-size: 9.5pt;
      padding: 1.5mm 2mm;
      text-decoration: underline;
    }

    /* ——— Ligne TRANSFER ——— */
    .transfer {
      display: flex;
      align-items: stretch;
      justify-content: space-between;
      gap: 2mm;
      padding: 2mm 2mm;
      border-bottom: 1px solid #000;
    }
    .tf-box {
      flex: 1 1 42%;
      border: 2px solid #000;
      border-radius: 10px;
      padding: 2.5mm 3mm;
      font-family: 'Times New Roman', Times, serif;
      font-size: 9pt;
      min-height: 20mm;
      line-height: 1.35;
    }
    .tf-mid {
      flex: 0 0 9mm;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Times New Roman', Times, serif;
      font-weight: 700;
      font-size: 11pt;
      letter-spacing: 0.08em;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
    }

    /* ——— Deux tableaux séparés (comme le modèle) ——— */
    .grids-wrap {
      display: flex;
      align-items: stretch;
      justify-content: space-between;
      gap: 3mm;
      padding: 1.5mm 2mm 1.5mm;
      background: #fff;
      border: none;
      border-bottom: none;
    }
    .grid-tbl {
      width: calc(50% - 1.5mm);
      border-collapse: collapse;
      table-layout: fixed;
      font-family: 'Times New Roman', Times, serif;
      font-size: 8.5pt;
      border: 1px solid #000;
    }
    .grid-tbl td {
      border: 1px solid #000;
      padding: 2.5mm 2mm;
      vertical-align: middle;
      height: 10mm;
      font-family: 'Times New Roman', Times, serif;
      font-size: 8.5pt;
      color: #000;
      line-height: 1.15;
    }
    .grid-tbl .lbl {
      font-family: 'Times New Roman', Times, serif;
      font-weight: 700;
      font-size: 8.5pt;
      background: #cfcfcf;
      width: 34%;
      white-space: normal;
      line-height: 1.15;
      word-wrap: break-word;
    }
    .grid-tbl .lbl-date {
      font-family: 'Times New Roman', Times, serif;
      font-weight: 700;
      font-size: 8.5pt;
      background: #cfcfcf;
      width: 11%;
      text-align: center;
    }
    .grid-tbl .lbl-narrow {
      font-family: 'Times New Roman', Times, serif;
      font-weight: 700;
      background: #cfcfcf;
      width: 11%;
      text-align: center;
      white-space: normal;
      line-height: 1.1;
      font-size: 8pt;
      padding: 2mm 1mm;
    }
    .grid-tbl .val {
      font-family: 'Times New Roman', Times, serif;
      background: #fff;
      font-weight: 400;
      font-size: 9.5pt;
    }
    .grid-tbl .val-wide { width: auto; }

    /* ——— Bloc marchandises ——— */
    .march-bar {
      border: 1px solid #000;
      margin: 1.5mm 0 0;
      text-align: center;
      font-family: 'Times New Roman', Times, serif;
      font-weight: 700;
      font-size: 10pt;
      text-transform: uppercase;
      padding: 1.2mm 2mm;
      background: #fff;
      letter-spacing: 0.02em;
    }
    .march-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-family: 'Times New Roman', Times, serif;
      border-top: none;
    }
    .march-table th,
    .march-table td {
      border: 1px solid #000;
      font-family: 'Times New Roman', Times, serif;
      color: #000;
      vertical-align: middle;
      word-wrap: break-word;
    }
    .march-table th {
      background: #cfcfcf;
      font-weight: 700;
      font-size: 8pt;
      text-align: center;
      padding: 2.5mm 1.5mm;
      line-height: 1.15;
    }
    .march-table th.vth {
      font-size: 7.5pt;
      line-height: 1.1;
      padding: 2mm 1mm;
    }
    .march-table td {
      font-size: 8.5pt;
      font-weight: 700;
      text-align: center;
      padding: 3mm 1.2mm;
      height: 40mm;
      min-height: 40mm;
      vertical-align: top;
      background: #fff;
    }
    .march-table td.desc {
      text-align: left;
      font-weight: 700;
      line-height: 1.35;
    }

    /* ——— Pied de page (structure exacte du modèle) ——— */
    .footer-gap {
      display: none;
    }
    .foot {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-family: 'Times New Roman', Times, serif;
      border: none;
    }
    .foot > tbody > tr > td {
      border: 1.5px solid #000;
      vertical-align: stretch;
      padding: 0;
    }
    .foot-left { width: 76%; }
    .foot-right { width: 24%; }

    .foot-inner {
      width: 100%;
      height: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .foot-inner td {
      border: 1px solid #000;
      font-family: 'Times New Roman', Times, serif;
      vertical-align: top;
    }

    .foot-chk {
      width: 62%;
      padding: 2.5mm 3mm;
      font-size: 8.5pt;
    }
    .foot-route {
      width: 38%;
      padding: 0 !important;
    }
    .chk-title {
      font-weight: 700;
      font-size: 9pt;
      margin-bottom: 1.5mm;
    }
    .chk-cols {
      display: flex;
      gap: 3mm;
    }
    .chk-col { flex: 1; }
    .chk-line {
      margin: 0.7mm 0;
      font-size: 8.5pt;
      line-height: 1.35;
      white-space: nowrap;
    }
    .chk-mode {
      font-weight: 700;
      font-size: 9pt;
      text-decoration: underline;
      margin: 2.5mm 0 1.5mm;
    }
    .chk-item {
      display: inline-block;
      margin: 0.5mm 3.5mm 0.5mm 0;
      white-space: nowrap;
      font-size: 8.5pt;
    }

    .route-grid {
      width: 100%;
      height: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .route-grid td {
      border: 1px solid #000;
      font-family: 'Times New Roman', Times, serif;
      padding: 2mm;
      text-align: center;
      vertical-align: middle;
    }
    .route-grid .route-lbl {
      font-weight: 700;
      font-size: 9pt;
      height: 7mm;
    }
    .route-grid .route-val {
      font-size: 10.5pt;
      font-weight: 700;
      height: 11mm;
      min-height: 11mm;
    }

    .foot-decl {
      text-align: center;
      font-size: 8pt;
      padding: 2.2mm 2.5mm;
      vertical-align: middle !important;
      line-height: 1.25;
    }
    .foot-sig {
      width: 50%;
      text-align: center;
      font-size: 8pt;
      padding: 2.5mm 2mm;
      height: 28mm;
      min-height: 28mm;
      vertical-align: top !important;
      line-height: 1.25;
    }

    .visa-bel {
      text-align: center;
      vertical-align: middle !important;
      font-weight: 700;
      font-size: 9.5pt;
      padding: 2.5mm 1.5mm;
      height: 38mm;
    }
    .visa-fz {
      text-align: center;
      vertical-align: middle !important;
      font-size: 8.5pt;
      padding: 2.5mm 2mm;
      line-height: 1.3;
      height: 38mm;
      min-height: 38mm;
    }

    @media screen {
      html { background: #b8b8b8; }
      body.document9-a4 {
        width: 210mm !important;
        max-width: 210mm;
        min-height: 297mm;
        margin: 14px auto !important;
        box-shadow: 0 3px 18px rgba(0,0,0,0.18);
        background: #fff !important;
        padding: 0 !important;
      }
    }
    @media print {
      @page { size: A4 portrait; margin: 4mm 3mm; }
      html, body.document9-a4 {
        width: 210mm !important;
        height: auto !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
      }
      .page {
        min-height: 0 !important;
        overflow: visible !important;
      }
      .part-top,
      .part-bottom {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .parts-gap {
        height: 2mm;
      }
    }
  </style>
</head>
<body class="document9-a4">
  <div class="page">
    <div class="republique">REPUBLIQUE DE DJIBOUTI</div>
    <div class="side-note">A compléter en caractères dactylographiés par l'opérateur de ZF/FZ/Entrepôt et approuvé par le propriétaire de la marchandise</div>

    <!-- CADRE HAUT -->
    <div class="part-top">
      <!-- PARTIE 1 : En-tête -->
      <div class="hdr">
        <div class="hdr-box hdr-left">
          AVIS DE LIVRAISON
          <small>Directeur des Douanes et des Droits Indirects</small>
        </div>
        <div class="hdr-num">${documentNumber}</div>
        <div class="hdr-box hdr-right">
          <div><strong>Code licence :</strong> ${val(doc.license_code)}</div>
          <div><strong>Nom de l'opérateur de /entrepôt</strong> ${val(doc.operator_name)}</div>
        </div>
      </div>

      <div class="banner">Veuillez autoriser la livraison des marchandises mentionnées ci-dessous</div>

      <!-- PARTIE 1 : Transfert -->
      <div class="transfer">
        <div class="tf-box">
          <div><strong>Nom du destinataire/déclarant :</strong> ${val(doc.declarant)}</div>
          <div style="margin-top:3mm"><strong>Code No :</strong> ${val(doc.declarant_nif)}</div>
        </div>
        <div class="tf-mid">TRANSFER</div>
        <div class="tf-box">
          <div><strong>NO :</strong> ${val(doc.actual_recipient_nif)}</div>
          <div style="margin-top:3mm"><strong>Nom de destinataire :</strong> ${val(doc.actual_recipient)}</div>
        </div>
      </div>

      <!-- PARTIE 1 : deux tableaux séparés -->
      <div class="grids-wrap">
        <table class="grid-tbl" cellspacing="0" cellpadding="0">
          <colgroup>
            <col style="width:34%" />
            <col style="width:28%" />
            <col style="width:12%" />
            <col style="width:26%" />
          </colgroup>
          <tr>
            <td class="lbl">Décl. Entrée<br/>ZF/FZ/Entrepôt</td>
            <td class="val">${val(doc.entry_doc_ref)}</td>
            <td class="lbl-date">Date</td>
            <td class="val">${fmtDate(doc.entry_date || doc.date)}</td>
          </tr>
          <tr>
            <td class="lbl">N° sommier/ répertoire :</td>
            <td class="val val-wide" colspan="3">${val(doc.sommier_ref)}</td>
          </tr>
          <tr>
            <td class="lbl">D/O N°</td>
            <td class="val">${val(doc.do_number)}</td>
            <td class="lbl-date">Date</td>
            <td class="val">${fmtDate(doc.do_date)}</td>
          </tr>
          <tr>
            <td class="lbl">Quantité Entrée:</td>
            <td class="val val-wide" colspan="3">${val(doc.quantity_entered)}</td>
          </tr>
        </table>

        <table class="grid-tbl" cellspacing="0" cellpadding="0">
          <colgroup>
            <col style="width:34%" />
            <col style="width:28%" />
            <col style="width:14%" />
            <col style="width:24%" />
          </colgroup>
          <tr>
            <td class="lbl">Nom du Bateau :</td>
            <td class="val val-wide" colspan="3">${val(doc.boat)}</td>
          </tr>
          <tr>
            <td class="lbl">Date d'arrivée :</td>
            <td class="val">${fmtDate(doc.arrival_date)}</td>
            <td class="lbl-narrow">N° Voy</td>
            <td class="val">${val(doc.trip_number)}</td>
          </tr>
          <tr>
            <td class="lbl">Connaissement n° :</td>
            <td class="val val-wide" colspan="3">${val(doc.bl_number)}</td>
          </tr>
          <tr>
            <td class="lbl">Pays d'Origine :</td>
            <td class="val">${val(doc.country_origin)}</td>
            <td class="lbl-narrow">Reg.<br/>fiscal</td>
            <td class="val">${val(doc.fiscal_reg)}</td>
          </tr>
        </table>
      </div>

      <!-- PARTIE 2 : Marchandises à livrer -->
      <div class="march-bar">INFORMATIONS SUR LES MARCHANDISES A LIVRER</div>
      <table class="march-table" cellspacing="0" cellpadding="0">
        <colgroup>
          <col style="width:10%" />
          <col style="width:9%" />
          <col style="width:26%" />
          <col style="width:10%" />
          <col style="width:7%" />
          <col style="width:7%" />
          <col style="width:10%" />
          <col style="width:5%" />
          <col style="width:10%" />
          <col style="width:6%" />
        </colgroup>
        <thead>
          <tr>
            <th>Code SH</th>
            <th>Qté Sortie</th>
            <th>Description de la Marchandise</th>
            <th>Conditionnement</th>
            <th class="vth">Qté<br/>Compl.</th>
            <th class="vth">Poids<br/>Net</th>
            <th>Poids Bruts</th>
            <th>Vol.</th>
            <th class="vth">Valeur<br/>déclarée</th>
            <th class="vth">Qté<br/>Restan<br/>te</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${val(doc.nomenclature)}</td>
            <td>${val(doc.quantity)}</td>
            <td class="desc">${descHtml}</td>
            <td>${val(doc.packaging)}</td>
            <td>${val(doc.qty_packages)}</td>
            <td>${val(doc.net_weight)}</td>
            <td>${fmtWeight(gross)}</td>
            <td>${val(doc.volume)}</td>
            <td>${fmtDeclaredValue(doc.value)}</td>
            <td>${val(doc.remaining_qty)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Petit espace entre cadre haut et cadre bas -->
    <div class="parts-gap"></div>

    <!-- CADRE BAS -->
    <div class="part-bottom">
      <table class="foot" cellspacing="0" cellpadding="0">
        <tr>
          <td class="foot-left">
            <table class="foot-inner" cellspacing="0" cellpadding="0">
              <tr>
                <td class="foot-chk">
                  <div class="chk-title">Cocher la case correspondante</div>
                  ${txHtml}
                  <div class="chk-mode">Mode Transport :</div>
                  <div>${trHtml}</div>
                </td>
                <td class="foot-route">
                  <table class="route-grid" cellspacing="0" cellpadding="0">
                    <tr><td class="route-lbl">Point Sortie</td></tr>
                    <tr><td class="route-val">${val(doc.exit_point)}</td></tr>
                    <tr><td class="route-lbl">Destination</td></tr>
                    <tr><td class="route-val">${val(doc.destination)}</td></tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="foot-decl" colspan="2">
                  Nous déclarons que les détails que nous avons fournis ci-dessous sont véritables et complets.
                </td>
              </tr>
              <tr>
                <td class="foot-sig">Cachet et signature de l'opérateur de FZ/Zone franche :</td>
                <td class="foot-sig">Cachet et signature du destinataire/déclarant :</td>
              </tr>
            </table>
          </td>
          <td class="foot-right">
            <table class="foot-inner" cellspacing="0" cellpadding="0" style="height:100%">
              <tr>
                <td class="visa-bel">Visa du Bureau BEL</td>
              </tr>
              <tr>
                <td class="visa-fz">Visa du Bureau FZ/<br/>des régimes suspensifs/<br/>bureau de free zone</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>`;
}

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
