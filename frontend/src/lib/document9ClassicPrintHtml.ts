import type { Document9Record } from '../api/document9Api';
import { appendAutoPrintBeforeBodyClose } from './printA4';
import { DOUANES_DJIBOUTI_LOGO_DATA_URI } from './douanesDjiboutiLogo';

function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

function fmtNum(v: string | number | undefined | null): string {
  const raw = String(v ?? '').trim();
  if (!raw) return '';
  const compact = raw.replace(/\s/g, '').replace(',', '.');
  if (/^-?\d+(\.\d+)?$/.test(compact)) {
    const n = Number(compact);
    if (Number.isFinite(n)) return esc(n.toLocaleString('fr-FR'));
  }
  return esc(raw);
}

/**
 * Document N° 9 (Imports) — gabarit officiel (parties 1 à 3).
 */
export function buildDocument9ClassicPrintHtml(doc: Document9Record): string {
  const weightRaw = (doc.gross_weight?.trim() || doc.weight || '').replace(/\s*(KGS|KG)\s*$/i, '').trim();
  const weightHtml = weightRaw ? `${fmtNum(weightRaw) || val(weightRaw)} KGS` : '';
  const valueRaw = String(doc.value ?? '').replace(/\s*DJF\s*$/i, '').trim();
  const valueHtml = valueRaw ? `${fmtNum(valueRaw) || val(valueRaw)} DJF` : '';
  const descHtml = val(doc.description).replace(/\n/g, '<br/>');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Document N°9</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { size: A4 portrait; margin: 8mm 10mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body.doc9-classic {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      color: #000;
      line-height: 1.2;
      width: 100%;
      background: #fff;
    }
    .sheet {
      width: 100%;
      min-height: 277mm;
      background: #fff;
    }

    /* ——— PARTIE 1 : En-tête 3 colonnes ——— */
    .hdr-gov {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 2mm;
      width: 100%;
    }
    .hdr-fr, .hdr-ar {
      flex: 1 1 34%;
      text-align: center;
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      line-height: 1.3;
      padding-top: 1mm;
    }
    .hdr-ar {
      direction: rtl;
      font-size: 12pt;
      line-height: 1.4;
    }
    .hdr-fr .rep, .hdr-ar .rep {
      font-weight: 700;
      font-size: 11.5pt;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .hdr-ar .rep {
      font-size: 13pt;
      text-transform: none;
    }
    .hdr-fr .motto, .hdr-ar .motto {
      font-weight: 400;
      font-size: 9.5pt;
      margin-top: 0.5mm;
    }
    .hdr-ar .motto {
      font-size: 11pt;
      font-weight: 700;
    }
    .dash {
      display: block;
      margin: 1.8mm auto;
      width: 42%;
      border: none;
      border-top: 1.5px dashed #000;
    }
    .hdr-fr .blk, .hdr-ar .blk {
      font-weight: 700;
      font-size: 10pt;
      line-height: 1.25;
    }
    .hdr-ar .blk {
      font-size: 11.5pt;
    }
    .hdr-fr .blk-lines, .hdr-ar .blk-lines {
      font-weight: 700;
      font-size: 9.5pt;
      line-height: 1.25;
    }
    .hdr-ar .blk-lines {
      font-size: 11pt;
    }

    .hdr-mid {
      flex: 0 0 28%;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .logo {
      width: 32mm;
      height: 32mm;
      object-fit: contain;
      display: block;
      margin: 0 auto;
      border: none;
      outline: none;
      box-shadow: none;
      background: transparent;
    }
    .s-box {
      margin-top: 2.5mm;
      border: none;
      outline: none;
      padding: 1.2mm 2mm;
      min-width: 24mm;
      font-family: Arial, Helvetica, sans-serif;
      font-weight: 700;
      font-size: 12pt;
      text-align: center;
      line-height: 1.1;
      background: transparent;
    }
    .big-9 {
      margin-top: 1mm;
      font-family: Arial Black, Arial, Helvetica, sans-serif;
      font-size: 56pt;
      font-weight: 900;
      line-height: 0.85;
      color: #000;
      text-shadow: 2px 2px 0 #9a9a9a;
      letter-spacing: -0.02em;
    }

    /* ——— Cases Numéro Déclaration / Enregistrement ——— */
    .num-row {
      display: flex;
      justify-content: space-between;
      gap: 8mm;
      margin-top: 1mm;
      align-items: flex-start;
    }
    .num-box {
      flex: 0 0 42%;
      border: 1.5px solid #000;
      padding: 2.2mm 3mm 3mm;
      min-height: 15mm;
      font-family: 'Times New Roman', Times, serif;
      font-size: 10.5pt;
      background: #fff;
    }
    .num-box .lbl {
      font-weight: 400;
      margin-bottom: 3mm;
    }
    .num-box .date-line {
      font-weight: 700;
    }
    .num-box .date-line .lbl-d {
      font-weight: 700;
    }
    .num-box .date-line .val-d {
      font-weight: 700;
    }

    /* ——— PARTIE 2 : infos + cases inspection ——— */
    .info-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 6mm;
      margin-top: 4mm;
      font-family: 'Times New Roman', Times, serif;
    }
    .info-left {
      flex: 1 1 58%;
      font-size: 11pt;
      line-height: 1.55;
    }
    .info-left table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-left td {
      padding: 0.6mm 0;
      vertical-align: baseline;
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      font-weight: 700;
    }
    .info-left td.k {
      width: 38%;
      white-space: nowrap;
      padding-right: 2mm;
    }
    .info-left td.k::after {
      content: ' :';
    }
    .info-left td.v {
      width: 62%;
      font-weight: 700;
    }
    .info-right {
      flex: 0 0 34%;
      display: flex;
      flex-direction: column;
      gap: 4.5mm;
      padding-top: 1mm;
    }
    .chk-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4mm;
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      font-weight: 700;
    }
    .sq {
      width: 6.5mm;
      height: 6.5mm;
      border: 1.5px solid #000;
      flex-shrink: 0;
      display: inline-block;
      background: #fff;
    }

    /* ——— PARTIE 3 : tableau marchandises ——— */
    .goods {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin-top: 4mm;
      font-family: Arial, Helvetica, sans-serif;
    }
    .goods th, .goods td {
      border: 1.2px solid #000;
      padding: 1.8mm 1.5mm;
      vertical-align: middle;
      text-align: center;
    }
    .goods th {
      font-weight: 700;
      font-size: 9.5pt;
      text-transform: uppercase;
      line-height: 1.1;
      background: #fff;
      font-family: Arial, Helvetica, sans-serif;
    }
    .goods td {
      font-weight: 700;
      font-size: 10pt;
      height: 10mm;
      background: #fff;
      font-family: Arial, Helvetica, sans-serif;
    }
    .goods td.desc {
      text-align: center;
      line-height: 1.2;
      font-size: 9.5pt;
      font-weight: 700;
    }
    .goods tr.empty td {
      height: 8mm;
      font-weight: 400;
    }

    /* ——— PARTIE 3 : pied cases / sortie ——— */
    .foot {
      width: 100%;
      border-collapse: collapse;
      margin-top: 3mm;
      table-layout: fixed;
      border: 1px solid #000;
      height: auto;
    }
    .foot > tbody > tr > td {
      border: 1px solid #000;
      vertical-align: top;
      padding: 0;
      height: 1px;
    }
    .foot-side {
      width: 5mm;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-family: 'Times New Roman', Times, serif;
      font-size: 6.5pt;
      font-weight: 700;
      text-align: center;
      padding: 1mm 0.3mm;
      line-height: 1.05;
    }
    .foot-chk {
      width: 52%;
      padding: 1.4mm 2.2mm 1.6mm;
      font-family: 'Times New Roman', Times, serif;
      font-size: 8pt;
    }
    .foot-chk .title {
      font-weight: 400;
      margin: 0 0 0.8mm;
      font-size: 8pt;
      line-height: 1.15;
    }
    .foot-chk-cols {
      display: flex;
      gap: 3mm;
    }
    .foot-chk-cols .col { flex: 1; }
    .foot-chk-cols .item {
      margin: 0.25mm 0;
      padding: 0;
      white-space: nowrap;
      font-size: 8pt;
      line-height: 1.25;
      font-weight: 400;
    }
    .foot-route {
      width: 40%;
      padding: 0;
      vertical-align: top !important;
    }
    .route-inner {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .route-inner td {
      border: 1px solid #000;
      border-top: none;
      border-right: none;
      height: 7mm;
      padding: 0.8mm 2.2mm;
      font-family: 'Times New Roman', Times, serif;
      font-size: 8.5pt;
      font-weight: 700;
      vertical-align: middle;
      line-height: 1.15;
    }
    .route-inner tr:first-child td { border-top: none; }
    .route-inner .rk { font-weight: 700; }
    .route-inner .rv { font-weight: 700; }

    /* ——— Signatures ——— */
    .signs {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 2.5mm;
      padding: 0 1mm;
      font-family: 'Times New Roman', Times, serif;
      font-weight: 700;
      font-size: 10.5pt;
    }
    .signs .left {
      flex: 0 0 28%;
      text-align: left;
      line-height: 1.2;
    }
    .signs .left .q {
      display: block;
      font-size: 12pt;
      margin-bottom: 0.5mm;
    }
    .signs .mid {
      flex: 1;
      text-align: center;
      line-height: 1.25;
    }
    .signs .right {
      flex: 0 0 22%;
      text-align: right;
    }

    @media screen {
      html { background: #b8b8b8; }
      body.doc9-classic {
        width: 210mm;
        max-width: 210mm;
        margin: 14px auto !important;
        padding: 8mm 10mm !important;
        box-shadow: 0 3px 18px rgba(0,0,0,0.18);
        background: #fff !important;
      }
    }
    @media print {
      html, body.doc9-classic {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    }
  </style>
</head>
<body class="doc9-classic">
  <div class="sheet">
    <!-- PARTIE 1 -->
    <div class="hdr-gov">
      <div class="hdr-fr">
        <div class="rep">REPUBLIQUE DE DJIBOUTI</div>
        <div class="motto">Unité - Egalité - Paix</div>
        <hr class="dash" />
        <div class="blk">Ministère du Budget</div>
        <hr class="dash" />
        <div class="blk-lines">Direction des Douanes et<br/>Des Droits Indirects</div>
        <hr class="dash" />
        <div class="blk-lines">Bureau des Régimes suspensifs et<br/>Entrepôts</div>
      </div>

      <div class="hdr-mid">
        <img class="logo" src="${DOUANES_DJIBOUTI_LOGO_DATA_URI}" alt="Douanes Djibouti" />
        <div class="s-box">${val(doc.entry_doc_ref)}</div>
        <div class="big-9">9</div>
      </div>

      <div class="hdr-ar">
        <div class="rep">جمهورية جيبوتي</div>
        <div class="motto">وحدة - مساواة - سلام</div>
        <hr class="dash" />
        <div class="blk">وزارة الميزانية</div>
        <hr class="dash" />
        <div class="blk-lines">إدارة الجمارك و<br/>الرسوم غير المباشرة</div>
        <hr class="dash" />
        <div class="blk-lines">مكتب الأنظمة المعلقة و<br/>المستودعات</div>
      </div>
    </div>

    <div class="num-row">
      <div class="num-box">
        <div class="lbl">Numéro Déclaration</div>
        <div class="date-line"><span class="lbl-d">Date :</span> <span class="val-d">${fmtDate(doc.date || doc.entry_date)}</span></div>
      </div>
      <div class="num-box">
        <div class="lbl">Numéro d'enregistrement</div>
        <div class="date-line"><span class="lbl-d">Date :</span></div>
      </div>
    </div>

    <!-- PARTIE 2 -->
    <div class="info-row">
      <div class="info-left">
        <table cellspacing="0" cellpadding="0">
          <tr><td class="k">Destinataire réel</td><td class="v">${val(doc.actual_recipient)}</td></tr>
          <tr><td class="k">Déclarant</td><td class="v">${val(doc.declarant)}</td></tr>
          <tr><td class="k">Code NIF</td><td class="v">${val(doc.declarant_nif)}</td></tr>
          <tr><td class="k">N° D/O</td><td class="v"></td></tr>
          <tr><td class="k">N° Conteneur</td><td class="v">${val(doc.container_number) || '0'}</td></tr>
          <tr><td class="k">Bateau</td><td class="v">${val(doc.boat)}</td></tr>
          <tr><td class="k">N° voyage</td><td class="v">${val(doc.trip_number)}</td></tr>
          <tr><td class="k">No BL</td><td class="v">${val(doc.bl_number)}</td></tr>
          <tr><td class="k">Nombre de facture</td><td class="v"></td></tr>
        </table>
      </div>
      <div class="info-right">
        <div class="chk-line"><span>Inspection</span><span class="sq"></span></div>
        <div class="chk-line"><span>Admis conforme sur</span><span class="sq"></span></div>
        <div class="chk-line"><span>Régime Fiscal</span><span class="sq"></span></div>
      </div>
    </div>

    <!-- PARTIE 3 : marchandises -->
    <table class="goods" cellspacing="0" cellpadding="0">
      <colgroup>
        <col style="width:18%" />
        <col style="width:34%" />
        <col style="width:14%" />
        <col style="width:16%" />
        <col style="width:18%" />
      </colgroup>
      <thead>
        <tr>
          <th>NOMENCLATURE SH</th>
          <th>DESCRIPTION</th>
          <th>QUANTITE</th>
          <th>POIDS</th>
          <th>VALEUR</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${val(doc.nomenclature)}</td>
          <td class="desc">${descHtml}</td>
          <td>${val(doc.quantity)}</td>
          <td>${weightHtml}</td>
          <td>${valueHtml}</td>
        </tr>
        <tr class="empty"><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
        <tr class="empty"><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
        <tr class="empty"><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
      </tbody>
    </table>

    <table class="foot" cellspacing="0" cellpadding="0">
      <tr>
        <td class="foot-side">A compléter par le propriétaire de la marchandises</td>
        <td class="foot-chk">
          <div class="title">Cocher la case correspondante</div>
          <div class="foot-chk-cols">
            <div class="col">
              <div class="item">☐ Import</div>
              <div class="item">☐ Transbordement</div>
              <div class="item">☐ Admission Temporaire</div>
              <div class="item">☐ Décl. d'Entrée FZ</div>
            </div>
            <div class="col">
              <div class="item">☐ Transit</div>
              <div class="item">☐ Exportation</div>
              <div class="item">☐ Entrepôt</div>
            </div>
          </div>
        </td>
        <td class="foot-route">
          <table class="route-inner" cellspacing="0" cellpadding="0">
            <tr><td><span class="rk">Point Sortie :</span> <span class="rv">${val(doc.exit_point)}</span></td></tr>
            <tr><td>&nbsp;</td></tr>
            <tr><td><span class="rk">Destination :</span> <span class="rv">${val(doc.destination)}</span></td></tr>
            <tr><td>&nbsp;</td></tr>
          </table>
        </td>
      </tr>
    </table>

    <div class="signs">
      <div class="left">
        <span class="q">Q</span>
        Cachet Douane
      </div>
      <div class="mid">
        Nom du représentant<br/>Du déclarant
      </div>
      <div class="right">Déclarant</div>
    </div>
  </div>
</body>
</html>`;
}

export async function openDocument9ClassicPrintWindow(doc: Document9Record): Promise<void> {
  const html = buildDocument9ClassicPrintHtml(doc);
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up pour imprimer.');
    return;
  }
  w.document.open();
  w.document.write(appendAutoPrintBeforeBodyClose(html));
  w.document.close();
}
