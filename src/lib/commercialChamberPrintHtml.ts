import type { CommercialChamberRecord } from '../api/commercialChamberApi';
import type { DocumentBranding } from '../types/documentBranding';
import { buildLetterheadHtml, cssUrlForBackground, documentImageSrc } from './documentPrintImages';
import { STYLE_A4_SHEET, appendAutoPrintBeforeBodyClose } from './printA4';

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
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('fr-FR');
    }
  } catch {
    /* ignore */
  }
  return esc(iso);
}

const ORANGE = '#e67e22';
const ORANGE_DARK = '#d35400';

/** Deux lignes Mob / TEL depuis le champ téléphone (séparateurs | / ; saut de ligne). */
function splitPhones(phone: string): { mob: string; tel: string } {
  const raw = (phone || '').trim();
  if (!raw) return { mob: '—', tel: '—' };
  const parts = raw
    .split(/\||\/|\n|;|(?:\s{2,})/)
    .map((s) => s.replace(/^(mob|tel|tél|phone)\s*:\s*/i, '').trim())
    .filter(Boolean);
  if (parts.length >= 2) return { mob: parts[0], tel: parts[1] };
  return { mob: raw, tel: '' };
}

/** Détail commercial — design aligné sur le modèle « Commercial Detail » (A4, orange #e67e22). */
export function buildCommercialDetailPrintHtml(
  record: CommercialChamberRecord,
  branding: DocumentBranding,
  djfPerOneUsd: number
): string {
  const rate = djfPerOneUsd > 0 ? djfPerOneUsd : 177;
  const toUsd = (fdj: number) => (Number.isFinite(fdj) && rate > 0 ? fdj / rate : 0);

  const chamber = record.chamber_service_amount ?? 0;
  const service = record.service_charge ?? 0;
  const bank = record.bank_commission_fee ?? 0;
  const transport = record.transport_dhl ?? 0;
  const cert = record.certificate_fee ?? 0;
  const totalFdj = record.total ?? chamber + service + bank + transport + cert;

  const letter = buildLetterheadHtml(branding);

  const footerSrc = documentImageSrc(branding.footerLogoUrl);
  const footerLogo = footerSrc
    ? `<div class="footer-logo"><img src="${esc(footerSrc)}" alt="" /></div>`
    : '';

  const { mob, tel } = splitPhones(branding.companyPhone);
  const addr = (branding.companyAddress || '').trim();
  const em = (branding.companyEmail || '').trim();

  const footerBlock = `
    <div class="footer-bar"></div>
    <div class="footer-grid">
      <div class="footer-left">
        <div class="footer-line"><span class="footer-label">Mob:</span> ${esc(mob)}</div>
        <div class="footer-line"><span class="footer-label">TEL:</span> ${tel ? esc(tel) : esc('—')}</div>
      </div>
      <div class="footer-right">
        <div class="footer-line"><span class="footer-label">Adresse:</span> ${addr ? esc(addr) : '—'}</div>
        <div class="footer-line"><span class="footer-label">Email:</span> ${em ? esc(em) : '—'}</div>
      </div>
      ${footerLogo}
    </div>`;

  const today = fmtDateFr(new Date().toISOString().split('T')[0]);

  const wmCss = cssUrlForBackground(branding.footerLogoUrl);
  const wm = wmCss
    ? `<div class="watermark" style="background-image:url(\"${wmCss}\")"></div>`
    : `<div class="watermark" aria-hidden="true"></div>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Commercial Detail — ${esc(record.commercial_no)}</title>
  <style>
    ${STYLE_A4_SHEET}
    body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 10.5pt; color: #1a1a1a; }
    .page { max-width: 100%; margin: 0 auto; position: relative; }
    .letterhead { text-align: center; margin-bottom: 14px; }
    .letterhead img { max-height: 92px; width: 100%; object-fit: contain; }
    .watermark {
      position: fixed; left: 50%; top: 48%; transform: translate(-50%, -50%);
      width: 380px; height: 380px; opacity: 0.06; pointer-events: none; z-index: 0;
      background-size: contain; background-repeat: no-repeat; background-position: center;
      filter: grayscale(30%);
    }
    .doc-head { position: relative; z-index: 1; text-align: center; margin-bottom: 18px; }
    .doc-title { font-size: 20pt; font-weight: 700; margin: 0 0 6px; letter-spacing: 0.02em; color: #111; }
    .doc-place-date { font-size: 10.5pt; color: #444; margin-bottom: 14px; }
    .doc-client { font-size: 11pt; font-weight: 700; margin: 6px 0; line-height: 1.35; }
    .doc-client span { font-weight: 600; }
    .doc-resp { font-size: 11pt; font-weight: 700; margin: 4px 0 0; }
    .info-wrap { position: relative; z-index: 1; display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin: 18px 0 22px; min-height: 100px; }
    .info-left { flex: 1; min-width: 0; }
    .info-row { margin: 5px 0; font-size: 10pt; line-height: 1.45; text-align: left; }
    .info-row .lbl { font-weight: 600; color: #222; }
    .pct-box { flex-shrink: 0; align-self: center; text-align: right; padding: 8px 4px 8px 16px; max-width: 38%; }
    .pct-box .pct-line { font-size: 20pt; font-weight: 800; color: #111; line-height: 1.15; letter-spacing: 0.02em; }
    .pct-box .pct-line .num { font-size: 26pt; }
    .fin-table { width: 100%; border-collapse: collapse; font-size: 10pt; margin: 8px 0 20px; position: relative; z-index: 1; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .fin-table thead th {
      background: linear-gradient(180deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%);
      color: #fff; font-weight: 700; padding: 10px 12px; text-align: left;
      border: none;
    }
    .fin-table thead th.num { text-align: right; width: 24%; }
    .fin-table tbody td {
      padding: 9px 12px; border-bottom: 1px solid #e8e8e8; vertical-align: middle;
    }
    .fin-table tbody td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .fin-table tbody tr:nth-child(even) { background: #fafafa; }
    .fin-table tbody tr.total-row td {
      background: linear-gradient(180deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%) !important;
      color: #fff !important; font-weight: 700; border: none; padding: 11px 12px;
    }
    .footer-bar { height: 4px; background: ${ORANGE}; margin-top: 8px; margin-bottom: 12px; border-radius: 1px; }
    .footer-grid { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px 24px; font-size: 9.5pt; color: #222; line-height: 1.5; position: relative; z-index: 1; }
    .footer-left, .footer-right { flex: 1; min-width: 200px; }
    .footer-line { margin: 3px 0; }
    .footer-label { font-weight: 700; color: #111; margin-right: 4px; }
    .footer-logo { flex-shrink: 0; }
    .footer-logo img { max-height: 52px; max-width: 160px; object-fit: contain; display: block; }
    .ref-note { font-size: 8.5pt; color: #666; margin-top: 10px; text-align: center; }
  </style>
</head>
<body>
  <div class="page">
    ${letter}
    ${wm}

    <header class="doc-head">
      <h1 class="doc-title">Commercial Detail</h1>
      <div class="doc-place-date">Djibouti, ${esc(today)}</div>
      <div class="doc-client"><span>Client:</span> ${esc(record.client_name)}</div>
      <div class="doc-resp"><span>Responsible:</span> ${esc(record.responsible || 'N/A')}</div>
    </header>

    <div class="info-wrap">
      <div class="info-left">
        <div class="info-row"><span class="lbl">Description of goods:</span> ${esc(record.goods_description || '—')}</div>
        <div class="info-row"><span class="lbl">Quantity:</span> ${esc(fmtMoney(record.quantity ?? 0, 2))}</div>
        <div class="info-row"><span class="lbl">Tell (Phone):</span> ${esc(record.tell || '—')}</div>
        <div class="info-row"><span class="lbl">Unit Price Commercial Invoice:</span> ${fmtMoney(record.unit_price ?? 0, 2)} Fdj</div>
        <div class="info-row"><span class="lbl">Tim NO:</span> ${esc(record.timno || '—')}</div>
        <div class="info-row"><span class="lbl">Commercial Invoice No:</span> ${esc(record.commercial_invoice_no || 'N/A')}</div>
        <div class="info-row"><span class="lbl">Commercial Invoice Date:</span> ${esc(record.commercial_invoice_date ? fmtDateFr(record.commercial_invoice_date) : 'N/A')}</div>
        <div class="info-row"><span class="lbl">Purchase Order No:</span> ${esc(record.purchase_order_no || 'N/A')}</div>
        <div class="info-row"><span class="lbl">Purchase Order Date:</span> ${esc(record.purchase_order_date ? fmtDateFr(record.purchase_order_date) : 'N/A')}</div>
      </div>
      <div class="pct-box">
        <div class="pct-line">Percentage <span class="num">${esc(fmtMoney(record.percentage ?? 0, 0))}%</span></div>
      </div>
    </div>

    <table class="fin-table">
      <thead>
        <tr>
          <th>Details</th>
          <th class="num">DJF</th>
          <th class="num">USD</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Chamber amount</td>
          <td class="num">${fmtMoney(chamber, 2)} Fdj</td>
          <td class="num">$${fmtMoney(toUsd(chamber), 2)}</td>
        </tr>
        <tr>
          <td>Service fee or charge</td>
          <td class="num">${fmtMoney(service, 2)} Fdj</td>
          <td class="num">$${fmtMoney(toUsd(service), 2)}</td>
        </tr>
        <tr>
          <td>Bank commission fee</td>
          <td class="num">${fmtMoney(bank, 2)} Fdj</td>
          <td class="num">$${fmtMoney(toUsd(bank), 2)}</td>
        </tr>
        <tr>
          <td>DHL TRANSPORT</td>
          <td class="num">${fmtMoney(transport, 2)} Fdj</td>
          <td class="num">$${fmtMoney(toUsd(transport), 2)}</td>
        </tr>
        <tr>
          <td>Original Certificate Fee</td>
          <td class="num">${fmtMoney(cert, 2)} Fdj</td>
          <td class="num">$${fmtMoney(toUsd(cert), 2)}</td>
        </tr>
        <tr class="total-row">
          <td>Total amount DJF/USD</td>
          <td class="num">${fmtMoney(totalFdj, 2)} Fdj</td>
          <td class="num">$${fmtMoney(toUsd(totalFdj), 2)}</td>
        </tr>
      </tbody>
    </table>

    ${footerBlock}
    <p class="ref-note">Réf. dossier : ${esc(record.commercial_no)}</p>
  </div>
</body>
</html>`;
}

export async function openCommercialDetailPrint(record: CommercialChamberRecord): Promise<void> {
  const { fetchDocumentBranding } = await import('./documentBranding');
  const { fetchAppConfig } = await import('../api/appConfigApi');
  const branding = await fetchDocumentBranding();
  let rate = 177;
  try {
    const cfg = await fetchAppConfig();
    const r = parseFloat(String(cfg.djf_exchange_rate || '').replace(',', '.'));
    if (Number.isFinite(r) && r > 0) rate = r;
  } catch {
    /* défaut */
  }
  const html = buildCommercialDetailPrintHtml(record, branding, rate);
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up pour imprimer.');
    return;
  }
  w.document.open();
  w.document.write(appendAutoPrintBeforeBodyClose(html));
  w.document.close();
}

export function buildCommercialListPrintHtml(
  rows: CommercialChamberRecord[],
  branding: DocumentBranding
): string {
  const letter = buildLetterheadHtml(branding);
  const lines = [branding.companyName, branding.companyPhone, branding.companyEmail].filter(Boolean);
  const head = lines.join(' · ');
  const rowHtml = rows
    .map(
      (r) =>
        `<tr>
      <td>${esc(r.commercial_no)}</td>
      <td>${esc(r.client_name)}</td>
      <td>${esc(r.goods_description || '')}</td>
      <td style="text-align:right">${esc(String(r.total ?? 0))}</td>
    </tr>`
    )
    .join('');
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Liste commerciaux</title>
  <style>
    ${STYLE_A4_SHEET}
    body{font-family:Arial,sans-serif;font-size:11pt}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #ccc;padding:6px 8px}
    th{background:linear-gradient(180deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%);color:#fff;text-align:left;font-weight:700}
    .letterhead{text-align:center;margin-bottom:12px}
    .letterhead img{max-height:80px;width:100%;object-fit:contain}
    .sub{font-size:10pt;color:#444;margin:8px 0 16px}
  </style></head><body>
  ${letter}
  <h2>Liste des dossiers commerciaux</h2>
  <p class="sub">${esc(head)}</p>
  <table><thead><tr><th>Réf.</th><th>Client</th><th>Marchandises</th><th>Total (FDJ)</th></tr></thead>
  <tbody>${rowHtml}</tbody></table>
  </body></html>`;
}

export async function openCommercialListPrint(rows: CommercialChamberRecord[]): Promise<void> {
  const { fetchDocumentBranding } = await import('./documentBranding');
  const branding = await fetchDocumentBranding();
  const html = buildCommercialListPrintHtml(rows, branding);
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up pour imprimer.');
    return;
  }
  w.document.open();
  w.document.write(appendAutoPrintBeforeBodyClose(html));
  w.document.close();
}
