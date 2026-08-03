import type { DocumentBranding } from '../types/documentBranding';
import { fetchDocumentBranding } from './documentBranding';
import { buildLetterheadHtml } from './documentPrintImages';
import {
  buildDocWatermark,
  buildMawadaContactFooterHtml,
  docGreen,
  letterheadBannerPrintCss,
  mawadaContactFooterPrintCss,
  pinnedDocFooterPrintCss,
  watermarkPrintCss,
} from './chamberDocumentPrintShared';
import { STYLE_A4_SHEET } from './printA4';
import { openHtmlPrintThenPdfInBrowser } from './htmlPrintPdf';

export type PayrollLetterRow = {
  full_name: string;
  account_number: string;
  net_salary: number;
};

export type PayrollLetterInput = {
  periodMonthLabel: string;
  periodYear: string | number;
  rows: PayrollLetterRow[];
  companyBankAccount?: string;
  location?: string;
};

function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtFdj(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  return `Fdj ${v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtPlaceDate(location: string): string {
  const d = new Date();
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${location}, ${day}/${month}/${year}`;
}

function monthTitle(label: string, year: string | number): string {
  const raw = String(label || '').trim();
  const upper = raw
    ? raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
    : '';
  return upper ? `${upper}-${year}` : String(year);
}

export function buildPayrollLetterPrintHtml(
  input: PayrollLetterInput,
  branding: DocumentBranding
): string {
  const green = docGreen(branding);
  const letter = buildLetterheadHtml(branding);
  const footer = buildMawadaContactFooterHtml(branding);
  const wm = buildDocWatermark(branding);
  const company = branding.companyName || 'l\'entreprise';
  const location = (input.location || 'Djibouti').trim() || 'Djibouti';
  const period = monthTitle(input.periodMonthLabel, input.periodYear);
  const bank = String(input.companyBankAccount || '').trim();
  const bankText = bank
    ? `compte bancaire de l'entreprise ${esc(bank)}`
    : `compte bancaire de l'entreprise`;

  const totalNet = input.rows.reduce((s, r) => s + Number(r.net_salary || 0), 0);

  const bodyRows = input.rows
    .map(
      (r, i) => `<tr>
      <td class="c-no">${i + 1}</td>
      <td class="c-name">${esc(r.full_name)}</td>
      <td class="c-acc">${esc(r.account_number || '—')}</td>
      <td class="c-net">${esc(fmtFdj(Number(r.net_salary || 0)))}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Paiement des salaires — ${esc(period)}</title>
  <style>
    ${STYLE_A4_SHEET}
    ${letterheadBannerPrintCss()}
    ${mawadaContactFooterPrintCss()}
    ${pinnedDocFooterPrintCss('page')}
    ${watermarkPrintCss()}
    body {
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      font-size: 11pt;
      color: #1a1a1a;
    }
    .page {
      position: relative;
      min-height: 269mm;
      display: flex;
      flex-direction: column;
    }
    .page-main {
      flex: 1 1 auto;
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
    }
    .letterhead img { max-height: 92px; width: 100%; object-fit: contain; }
    .top-meta {
      text-align: right;
      font-size: 11pt;
      font-weight: 600;
      color: #222;
      margin: 6px 0 18px;
    }
    .doc-title {
      text-align: center;
      font-size: 13.5pt;
      font-weight: 800;
      margin: 8px 0 18px;
      color: #111;
      line-height: 1.35;
    }
    .intro {
      font-size: 10.5pt;
      line-height: 1.55;
      margin: 0 0 18px;
      text-align: left;
    }
    .pay-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5pt;
      position: relative;
      z-index: 1;
      margin-bottom: 18px;
    }
    .pay-table thead th {
      background: ${green};
      color: #fff;
      font-weight: 700;
      padding: 9px 10px;
      border: 1px solid ${green};
      text-align: left;
    }
    .pay-table thead th.c-no { width: 8%; text-align: center; }
    .pay-table thead th.c-acc { width: 22%; }
    .pay-table thead th.c-net { width: 22%; text-align: right; }
    .pay-table tbody td {
      padding: 8px 10px;
      border: 1px solid #cfcfcf;
      vertical-align: middle;
    }
    .pay-table tbody td.c-no { text-align: center; }
    .pay-table tbody td.c-net {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .pay-table tfoot td {
      padding: 9px 10px;
      border: 1px solid #cfcfcf;
      font-weight: 800;
    }
    .pay-table tfoot td.total-lbl {
      text-align: center;
      background: #fff;
      letter-spacing: 0.04em;
    }
    .pay-table tfoot td.total-val {
      text-align: right;
      background: ${green} !important;
      color: #fff !important;
      font-variant-numeric: tabular-nums;
    }
    .doc-footer { padding-top: 8px; }
  </style>
</head>
<body>
  <div class="page">
    ${wm}
    <div class="page-main">
      ${letter}
      <div class="top-meta">${esc(fmtPlaceDate(location))}</div>
      <h1 class="doc-title">Paiement des salaires des employés pour le mois de ${esc(period)}</h1>
      <p class="intro">
        La société ${esc(company)} certifie que les paiements des salaires indiqués ci-dessous seront effectués
        à partir du ${bankText} et seront directement transférés sur les comptes bancaires respectifs des employés mentionnés.
      </p>
      <table class="pay-table">
        <thead>
          <tr>
            <th class="c-no">N/O</th>
            <th class="c-name">Nom</th>
            <th class="c-acc">Numéro de compte</th>
            <th class="c-net">Salaire net</th>
          </tr>
        </thead>
        <tbody>
          ${
            bodyRows ||
            `<tr><td colspan="4" style="text-align:center;padding:24px;color:#666">Aucune donnée</td></tr>`
          }
        </tbody>
        ${
          input.rows.length > 0
            ? `<tfoot>
          <tr>
            <td class="total-lbl" colspan="3">TOTAL</td>
            <td class="total-val">${esc(fmtFdj(totalNet))}</td>
          </tr>
        </tfoot>`
            : ''
        }
      </table>
    </div>
    <div class="page-bottom">
      <footer class="doc-footer">${footer}</footer>
    </div>
  </div>
</body>
</html>`;
}

export async function openPayrollLetterPrint(input: PayrollLetterInput): Promise<void> {
  if (!input.rows.length) {
    alert('Aucune donnée de salaire à imprimer. Sélectionnez une période avec des données.');
    return;
  }
  const branding = await fetchDocumentBranding();
  const html = buildPayrollLetterPrintHtml(input, branding);
  const safePeriod = monthTitle(input.periodMonthLabel, input.periodYear).replace(/[^\w-]+/g, '_');
  await openHtmlPrintThenPdfInBrowser(html, `Lettre-Paie-${safePeriod || 'periode'}.pdf`);
}
