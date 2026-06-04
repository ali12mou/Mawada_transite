import type { LocalCompanyRecord } from '../api/localCompanyApi';
import type { ClientRecord } from '../api/clientsApi';
import type { DocumentBranding } from '../types/documentBranding';
import { formatClientLabel } from './clientLabel';
import { buildLetterheadHtml, documentImageSrc } from './documentPrintImages';
import { letterheadBannerPrintCss } from './chamberDocumentPrintShared';
import { STYLE_A4_SHEET, appendAutoPrintBeforeBodyClose } from './printA4';

/** Thème facture « Transit » — vert professionnel (aligné maquette Facture de service). */
const GREEN = '#16a34a';
const GREEN_DARK = '#15803d';

function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtMoney(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtDateFr(iso: string): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  try {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('fr-FR');
  } catch {
    /* ignore */
  }
  return esc(iso);
}

function splitPhones(phone: string): { mob: string; tel: string } {
  const raw = (phone || '').trim();
  if (!raw) return { mob: '—', tel: '—' };
  const parts = raw
    .split(/\||\/|\n|;|(?:\s{2,})/)
    ?.map((s) => s.replace(/^(mob|tel|tél|phone)\s*:\s*/i, '').trim())
    .filter(Boolean);
  if (parts.length >= 2) return { mob: parts[0], tel: parts[1] };
  return { mob: raw, tel: '' };
}

function num(v: unknown, def = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : def;
}

/**
 * Facture de service — entreprise locale (A4, vert, en-tête / pied depuis la config).
 * @param clientDetail — Fiche `clients` liée par `client_id` (remplissage direct base clients).
 */
export function buildLocalCompanyServiceInvoiceHtml(
  record: LocalCompanyRecord,
  branding: DocumentBranding,
  djfPerOneUsd: number,
  clientDetail: ClientRecord | null = null
): string {
  const rate = djfPerOneUsd > 0 ? djfPerOneUsd : 177;
  const toUsd = (fdj: number) => (Number.isFinite(fdj) && rate > 0 ? fdj / rate : 0);

  const fileFee = num(record.file_fee);
  const serviceFee = num(record.service_fee);
  const transitFee = num(record.transit_fee);
  const escortFee = num(record.escort_fee);
  const declCancel = num(record.declaration_cancellation_price);
  const n4 = num(record.numero_4_price);
  const n9 = num(record.numero_9_price);
  const totalFdj = num(record.total);
  const tiFdj = num(parseFloat(String(record.ti_cancellation ?? '').replace(',', '.')) || 0);

  const letter = buildLetterheadHtml(branding);

  const footerSrc = documentImageSrc(branding.footerLogoUrl);
  const footerLogo = footerSrc
    ? `<div class="footer-logo"><img src="${esc(footerSrc)}" alt="" /></div>`
    : '';

  const sigSrc = documentImageSrc(branding.signatureUrl);
  const sig = sigSrc ? `<img class="sig-img" src="${esc(sigSrc)}" alt="" />` : '';

  const { mob, tel } = splitPhones(branding.companyPhone);
  const addr = (branding.companyAddress || '').trim();
  const em = (branding.companyEmail || '').trim();

  const footerBlock = `
    <div class="sig-block">
      <div class="sig-line">Signature : _________________________</div>
      ${sig}
    </div>
    <div class="footer-bar"></div>
    <div class="footer-grid">
      <div class="footer-left">
        <div class="footer-line"><span class="footer-label">Mob:</span> ${esc(mob)}</div>
        <div class="footer-line"><span class="footer-label">TEL:</span> ${tel ? esc(tel) : '—'}</div>
      </div>
      <div class="footer-right">
        <div class="footer-line"><span class="footer-label">Adresse:</span> ${addr ? esc(addr) : '—'}</div>
        <div class="footer-line"><span class="footer-label">Email:</span> ${em ? esc(em) : '—'}</div>
      </div>
      ${footerLogo}
    </div>`;

  const today = fmtDateFr(new Date().toISOString().split('T')[0]);
  const closure = record.closure_date ? fmtDateFr(record.closure_date) : '—';

  /** Lignes identification (même tableau vert que la maquette « Détails / Valeurs / USD »). */
  const rowInfoSpan = (label: string, value: string) =>
    `<tr class="info-span">
      <td><span class="info-label">${esc(label)}</span></td>
      <td colspan="2">${esc(value)}</td>
    </tr>`;

  const row3col = (
    detail: string,
    fdj: number,
    usd: number,
    mode: 'normal' | 'hl' | 'totals' = 'normal'
  ) => {
    const cls =
      mode === 'hl'
        ? ' class="fin-line hl"'
        : mode === 'totals'
          ? ' class="fin-line totals"'
          : ' class="fin-line"';
    return `<tr${cls}>
      <td>${esc(detail)}</td>
      <td class="num">Fdj ${fmtMoney(fdj, 2)}</td>
      <td class="num">$ ${fmtMoney(usd, 2)}</td>
    </tr>`;
  };

  const clientDisplay = clientDetail
    ? formatClientLabel(clientDetail) || record.client_name || '—'
    : record.client_name || '—';

  const clientFiche =
    clientDetail && (clientDetail.phone || clientDetail.email || clientDetail.address)
      ? `<div class="client-fiche">
          <span class="lbl">Fiche client (base données) :</span>
          ${clientDetail.phone ? `<span>Tél. ${esc(clientDetail.phone)}</span>` : ''}
          ${clientDetail.email ? `<span> · Email ${esc(clientDetail.email)}</span>` : ''}
          ${clientDetail.address ? `<span> · ${esc(clientDetail.address)}</span>` : ''}
        </div>`
      : '';

  const rowDossier = (label: string, value: string) =>
    `<tr>
      <td class="dossier-lab">${esc(label)}</td>
      <td class="dossier-val">${esc(value)}</td>
    </tr>`;

  /** Ordre identique au formulaire « Entreprise locale » — étape Informations (LocalCompany.tsx). */
  const dossierRows =
    rowDossier('Nom de l\'entreprise vendeuse', record.vendor_company || '—') +
    rowDossier('Entreprise acheteuse', record.purchasing_company || '—') +
    rowDossier('Description des marchandises', record.goods_description || '—') +
    rowDossier('Client', clientDisplay) +
    rowDossier('Source et destination', record.source_destination || '—') +
    rowDossier('Date de clôture', closure) +
    rowDossier('Bill of lading', record.bill_of_loading || '—') +
    rowDossier('Déclaration S', record.declaration_s || '—') +
    rowDossier('Déclaration E', record.declaration_e || '—') +
    rowDossier('Quantité', fmtMoney(num(record.quantity), 2)) +
    rowDossier('Quantité de chargement du camion', fmtMoney(num(record.truck_loading_quantity), 2)) +
    rowDossier('Frais de dossier (FDJ)', `Fdj ${fmtMoney(fileFee, 2)}`) +
    rowDossier('Frais de transit (FDJ)', `Fdj ${fmtMoney(transitFee, 2)}`) +
    rowDossier('Frais de service (FDJ)', `Fdj ${fmtMoney(serviceFee, 2)}`) +
    rowDossier('Frais d\'escorte (FDJ)', `Fdj ${fmtMoney(escortFee, 2)}`) +
    rowDossier('Total (FDJ) — saisi au formulaire', `Fdj ${fmtMoney(totalFdj, 2)}`);

  /** Compléments — étape Documents (références + libellés liés au même dossier). */
  const complRows =
    rowDossier('Réf. / libellé Prix n°4', record.numero_4 || '—') +
    rowDossier('Réf. / libellé Prix n°9', record.numero_9 || '—') +
    rowDossier('Annulation déclaration (mention)', record.declaration_cancellation || '—') +
    rowDossier('Transfert', record.transfer || '—') +
    rowDossier('TI / annulation (mention ou montant saisi)', String(record.ti_cancellation ?? '—'));

  /** Bloc tableau principal (maquette 2) — mêmes champs que la liste / base. */
  const identificationRowsFin =
    rowInfoSpan('Client', clientDisplay) +
    rowInfoSpan('Source Destination', record.source_destination || '—') +
    rowInfoSpan('Entreprise Vendeuse', record.vendor_company || '—') +
    rowInfoSpan('Entreprise Acheteuse', record.purchasing_company || '—') +
    rowInfoSpan('Description des Marchandises', record.goods_description || '—');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Facture de Service — ${esc(clientDisplay)}</title>
  <style>
    ${STYLE_A4_SHEET}
    ${letterheadBannerPrintCss()}
    body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 10.5pt; color: #1a1a1a; }
    .page { display: flex; flex-direction: column; min-height: 276mm; position: relative; }
    .letterhead img { max-height: 88px; width: 100%; object-fit: contain; }
    .doc-head { position: relative; z-index: 1; margin-bottom: 14px; }
    .doc-title { font-size: 18pt; font-weight: 700; margin: 0 0 8px; color: #111; }
    .doc-place-date { font-size: 10.5pt; font-weight: 700; margin-bottom: 10px; }
    .doc-client { font-size: 11pt; font-weight: 700; margin: 8px 0; }
    .doc-ref { font-size: 9pt; color: #555; margin: 4px 0 8px; }
    .client-fiche { font-size: 9pt; color: #333; margin: 0 0 14px; line-height: 1.45; text-align: center; }
    .client-fiche .lbl { font-weight: 700; color: #14532d; margin-right: 6px; }
    .meta-grid { display: flex; justify-content: space-between; gap: 24px; margin: 0 0 16px; position: relative; z-index: 1; text-align: left; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; background: #fafafa; }
    .meta-col { flex: 1; font-size: 10pt; line-height: 1.55; }
    .meta-col div { margin: 4px 0; }
    .meta-col .lbl { font-weight: 700; color: #14532d; }
    .dossier-section { position: relative; z-index: 1; margin: 0 0 14px; }
    .section-title { font-size: 11pt; font-weight: 700; color: #14532d; margin: 0 0 4px; }
    .section-hint { font-size: 8.5pt; color: #666; margin: 0 0 10px; line-height: 1.35; }
    .dossier-table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 4px; }
    .dossier-table td { border: 1px solid #e5e7eb; padding: 7px 10px; vertical-align: top; }
    .dossier-lab { width: 44%; font-weight: 700; background: #f0fdf4; color: #14532d; }
    .dossier-val { color: #111; }
    .fin-table { width: 100%; border-collapse: collapse; font-size: 10pt; margin: 10px 0 18px; position: relative; z-index: 1; }
    .fin-table thead th {
      background: linear-gradient(180deg, ${GREEN} 0%, ${GREEN_DARK} 100%);
      color: #fff; font-weight: 700; padding: 10px 12px; text-align: left; border: none;
    }
    .fin-table thead th.num { text-align: right; }
    .fin-table tbody td { padding: 8px 12px; border-bottom: 1px solid #e8e8e8; vertical-align: top; }
    .fin-table tbody td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .fin-table tbody tr.info-span { background: #fff; }
    .fin-table tbody tr.info-span td { border-bottom: 1px solid #e5e7eb; }
    .fin-table tbody tr.fin-line:nth-child(even) { background: #fafafa; }
    .fin-table tbody tr.hl td {
      background: linear-gradient(180deg, ${GREEN} 0%, ${GREEN_DARK} 100%) !important;
      color: #fff !important; font-weight: 700; border: none;
    }
    .fin-table tbody tr.totals td {
      background: #dcfce7 !important;
      color: #14532d !important;
      font-weight: 700;
      border-top: 2px solid ${GREEN};
    }
    .info-label { font-weight: 600; color: #333; }
    .doc-footer { margin-top: auto; }
    .sig-block { position: relative; z-index: 1; margin: 20px 0 8px; min-height: 56px; }
    .sig-line { font-size: 10.5pt; margin-bottom: 6px; }
    .sig-img { max-height: 48px; max-width: 180px; object-fit: contain; display: block; margin-top: 4px; }
    .footer-bar { height: 4px; background: ${GREEN}; margin-top: 10px; margin-bottom: 12px; border-radius: 1px; }
    .footer-grid { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px 24px; font-size: 9.5pt; color: #222; line-height: 1.5; position: relative; z-index: 1; }
    .footer-left, .footer-right { flex: 1; min-width: 200px; }
    .footer-line { margin: 3px 0; }
    .footer-label { font-weight: 700; color: #111; margin-right: 4px; }
    .footer-logo { flex-shrink: 0; }
    .footer-logo img { max-height: 52px; max-width: 160px; object-fit: contain; display: block; }
  </style>
</head>
<body>
  <div class="page">
    ${letter}

    <header class="doc-head">
      <h1 class="doc-title">Facture de Service</h1>
      <div class="doc-place-date">Djibouti, ${esc(today)}</div>
      <div class="doc-client">Client : ${esc(clientDisplay)}</div>
      <div class="doc-ref">Dossier entreprise locale · ID : ${esc(record.id)}${record.client_id ? ` · Réf. client : ${esc(record.client_id)}` : ''
    }</div>
      ${clientFiche}
    </header>

    <div class="meta-grid" aria-label="Récapitulatif (même lecture que tableau principal)">
      <div class="meta-col">
        <div><span class="lbl">Quantité de Chargement du Camion :</span> ${esc(fmtMoney(num(record.truck_loading_quantity), 2))}</div>
        <div><span class="lbl">Déclaration E :</span> ${esc(record.declaration_e || '—')}</div>
        <div><span class="lbl">Date de Clôture :</span> ${esc(closure)}</div>
      </div>
      <div class="meta-col">
        <div><span class="lbl">Déclaration S :</span> ${esc(record.declaration_s || '—')}</div>
        <div><span class="lbl">Quantité :</span> ${esc(fmtMoney(num(record.quantity), 2))}</div>
      </div>
    </div>

    <div class="dossier-section">
      <h2 class="section-title">Données du dossier</h2>
      <p class="section-hint">Contenu = données enregistrées pour ce dossier (formulaire Entreprise locale).</p>
      <table class="dossier-table" aria-label="Données formulaire">
        <tbody>${dossierRows}</tbody>
      </table>
    </div>

    <div class="dossier-section">
      <h2 class="section-title">Compléments (étape Documents)</h2>
      <p class="section-hint">Références et mentions saisies à l’étape Documents du même dossier.</p>
      <table class="dossier-table" aria-label="Compléments documents">
        <tbody>${complRows}</tbody>
      </table>
    </div>

    <h2 class="section-title">Détail des montants FDJ / USD</h2>
    <p class="section-hint">Conversion avec taux FDJ/USD : ${esc(fmtMoney(rate, 4))} (paramètre application).</p>

    <table class="fin-table">
      <thead>
        <tr>
          <th>Détails</th>
          <th class="num">Valeurs</th>
          <th class="num">Montants en USD</th>
        </tr>
      </thead>
      <tbody>
        ${identificationRowsFin}
        ${row3col('Frais de dossier', fileFee, toUsd(fileFee))}
        ${row3col('Frais de Service', serviceFee, toUsd(serviceFee))}
        ${row3col('Frais de Transit', transitFee, toUsd(transitFee))}
        ${row3col('Annuler le Laissez-Passer', escortFee, toUsd(escortFee))}
        ${row3col('Annulation du Prix de la Déclaration', declCancel, toUsd(declCancel))}
        ${row3col('Canceling TI Price', tiFdj, toUsd(tiFdj))}
        ${row3col('Prix Numéro 4', n4, toUsd(n4))}
        ${row3col('Prix Numéro 9', n9, toUsd(n9), 'hl')}
        ${row3col('Totals', totalFdj, toUsd(totalFdj), 'totals')}
      </tbody>
    </table>

    <div style="flex-grow: 1;"></div>
    <footer class="doc-footer">
      ${footerBlock}
    </footer>
  </div>
</body>
</html>`;
}

export async function openLocalCompanyPrint(record: LocalCompanyRecord): Promise<void> {
  const { fetchDocumentBranding } = await import('./documentBranding');
  const { fetchAppConfig } = await import('../api/appConfigApi');
  const { fetchClient } = await import('../api/clientsApi');
  const branding = await fetchDocumentBranding();
  let rate = 177;
  try {
    const cfg = await fetchAppConfig();
    const r = parseFloat(String(cfg.djf_exchange_rate || '').replace(',', '.'));
    if (Number.isFinite(r) && r > 0) rate = r;
  } catch {
    /* défaut */
  }
  let clientDetail: ClientRecord | null = null;
  if (record.client_id) {
    try {
      clientDetail = await fetchClient(record.client_id);
    } catch {
      clientDetail = null;
    }
  }
  const html = buildLocalCompanyServiceInvoiceHtml(record, branding, rate, clientDetail);
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up pour imprimer.');
    return;
  }
  w.document.open();
  w.document.write(appendAutoPrintBeforeBodyClose(html));
  w.document.close();
}


