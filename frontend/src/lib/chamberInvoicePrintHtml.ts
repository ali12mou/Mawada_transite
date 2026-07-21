import type { DocumentBranding } from '../types/documentBranding';
import { fetchDocumentBranding } from './documentBranding';
import {
  buildDocFooter,
  buildDocLetterhead,
  buildDocWatermark,
  esc,
  fmtDate,
  fmtNum,
  sharedPrintStyles,
  wrapPrintBundle,
} from './chamberDocumentPrintShared';
import { appendAutoPrintBeforeBodyClose } from './printA4';

export type ChamberInvoicePrintRecord = {
  consignee_name: string;
  tin: string;
  tel: string;
  source_destination: string;
  commercial_relation: string;
  consignment_location: string;
  invoice_number: string;
  invoice_date: string;
  sales_conditions: string;
  purchase_order: string;
  purchase_order_date?: string;
  proforma_invoice?: string;
  proforma_date?: string;
  app_reference_number: string;
  payment_conditions: string;
  invoice_currency: string;
  expedition: string;
  swift_code: string;
  loading_port: string;
  final_destination: string;
  bank_details: string;
  bank_account: string;
  intermediate_bank: string;
  swift_code_2: string;
  currency: string;
};

export type ChamberInvoicePrintItem = {
  description_of_goods: string;
  origin: string;
  hs_code?: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
};

export type WaybillPrintData = {
  consignee_name?: string;
  consignee_tin?: string;
  consignee_tel?: string;
  consignee_source_destination?: string;
  shipper_name?: string;
  shipper_mob?: string;
  shipper_tel?: string;
  shipper_source_destination?: string;
  reference?: string;
  reference_date?: string;
  invoice_number?: string;
  notify_party?: string;
  notify_party_tin?: string;
  notify_party_tel?: string;
  notify_party_source_destination?: string;
  packing_purchase_order?: string;
  otb_purchase_order?: string;
  loading_location?: string;
  transport_details?: string;
  destination_location?: string;
};

export type WaybillPrintItem = {
  description_of_goods: string;
  origin: string;
  unit: string;
  quantity: number;
  net_weight: number;
  gross_weight: number;
};

function amountInWordsUsd(n: number): string {
  if (!Number.isFinite(n) || n < 0) return 'ZERO';
  const dollars = Math.floor(n);
  const ones = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
    'SEVENTEEN', 'EIGHTEEN', 'NINETEEN',
  ];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  function under1000(num: number): string {
    if (num < 20) return ones[num];
    if (num < 100) {
      const t = Math.floor(num / 10);
      const o = num % 10;
      return o ? `${tens[t]} ${ones[o]}` : tens[t];
    }
    const h = Math.floor(num / 100);
    const rest = num % 100;
    return rest ? `${ones[h]} HUNDRED ${under1000(rest)}` : `${ones[h]} HUNDRED`;
  }

  function convert(num: number): string {
    if (num === 0) return 'ZERO';
    const m = Math.floor(num / 1_000_000);
    const k = Math.floor((num % 1_000_000) / 1000);
    const r = num % 1000;
    const parts: string[] = [];
    if (m) parts.push(`${under1000(m)} MILLION`);
    if (k) parts.push(`${under1000(k)} THOUSAND`);
    if (r) parts.push(under1000(r));
    return parts.join(' ').trim() || 'ZERO';
  }

  return convert(dollars);
}

function v(val: string | undefined | null): string {
  const s = String(val ?? '').trim();
  return s ? esc(s) : '';
}

function waybillFromRecord(raw: Record<string, unknown> | null | undefined): WaybillPrintData {
  if (!raw) return {};
  const s = (k: string) => String(raw[k] ?? '');
  return {
    consignee_name: s('consignee_name'),
    consignee_tin: s('consignee_tin'),
    consignee_tel: s('consignee_tel'),
    consignee_source_destination: s('consignee_source_destination'),
    shipper_name: s('shipper_name'),
    shipper_mob: s('shipper_mob'),
    shipper_tel: s('shipper_tel'),
    shipper_source_destination: s('shipper_source_destination'),
    reference: s('reference'),
    reference_date: s('reference_date'),
    invoice_number: s('invoice_number'),
    notify_party: s('notify_party'),
    notify_party_tin: s('notify_party_tin'),
    notify_party_tel: s('notify_party_tel'),
    notify_party_source_destination: s('notify_party_source_destination'),
    packing_purchase_order: s('packing_purchase_order'),
    otb_purchase_order: s('otb_purchase_order'),
    loading_location: s('loading_location'),
    transport_details: s('transport_details'),
    destination_location: s('destination_location'),
  };
}

function mapWaybillItems(raw: unknown): WaybillPrintItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((it: Record<string, unknown>) => ({
    description_of_goods: String(it.description_of_goods ?? ''),
    origin: String(it.origin ?? ''),
    unit: String(it.unit ?? ''),
    quantity: Number(it.quantity) || 0,
    net_weight: Number(it.net_weight) || 0,
    gross_weight: Number(it.gross_weight) || 0,
  }));
}

function buildCommercialInvoicePageHtml(
  inv: ChamberInvoicePrintRecord,
  items: ChamberInvoicePrintItem[],
  branding: DocumentBranding
): string {
  const wm = buildDocWatermark(branding);
  const head = buildDocLetterhead(branding);
  const foot = buildDocFooter(branding);
  const totalUsd = items.reduce((s, it) => s + (Number(it.total_amount) || 0), 0);
  const words = amountInWordsUsd(totalUsd);
  const addrDisplay = v(inv.source_destination) || ',';

  const rows = items
    .map(
      (it, i) => `
    <tr>
      <td class="td-num">${i + 1}</td>
      <td class="td-left">${esc(it.description_of_goods)}</td>
      <td>${esc(it.origin)}</td>
      <td>${esc(it.hs_code || '')}</td>
      <td>${esc(it.unit)}</td>
      <td class="td-num">${esc(String(it.quantity))}</td>
      <td class="td-num">${fmtNum(Number(it.unit_price) || 0)}</td>
      <td class="td-num">${fmtNum(Number(it.total_amount) || 0)}</td>
    </tr>`
    )
    .join('');

  const page = `
    <section class="print-page ci-commercial-page">
      ${wm}
      <div class="page-body">
        ${head}
        <h1 class="doc-title">COMMERCIAL INVOICE</h1>
        <div class="cols-2">
          <div class="col">
            <div class="line"><span class="lbl">CONSIGNEE:</span> ${v(inv.consignee_name)}</div>
            <div class="line"><span class="lbl">TIN:</span> ${v(inv.tin)}</div>
            <div class="line"><span class="lbl">TEL:</span> ${v(inv.tel)}</div>
            <div class="line"><span class="lbl">ADDRESS:</span> ${addrDisplay}</div>
            <div class="line"><span class="lbl">Trader(Buyer and Seller) Relationship:</span> ${v(inv.commercial_relation)}</div>
            <div class="line"><span class="lbl">Place of Consignment:</span> ${v(inv.consignment_location)}</div>
          </div>
          <div class="col">
            <div class="line"><span class="lbl">Pro-format invoice:</span> ${v(inv.proforma_invoice)}</div>
            <div class="line"><span class="lbl">Pro-format date:</span> ${fmtDate(inv.proforma_date || '')}</div>
            <div class="line"><span class="lbl">Invoice No.:</span> ${v(inv.invoice_number)}</div>
            <div class="line"><span class="lbl">Invoice Date:</span> ${fmtDate(inv.invoice_date)}</div>
            <div class="line"><span class="lbl">PURCHASE ORDER:</span> ${v(inv.purchase_order)}</div>
            <div class="line"><span class="lbl">PURCHASE ORDER DATE:</span> ${fmtDate(inv.purchase_order_date || '')}</div>
            <div class="line"><span class="lbl">TERMS OF SALE (INCOTERM):</span> ${v(inv.sales_conditions)}</div>
            <div class="line"><span class="lbl">APP.REF.NO:</span> ${v(inv.app_reference_number)}</div>
            <div class="line"><span class="lbl">TERMS OF PAYMENT:</span> ${v(inv.payment_conditions)}</div>
            <div class="line"><span class="lbl">Invoice Currency:</span> ${v(inv.invoice_currency || inv.currency)}</div>
            <div class="line"><span class="lbl">Final Destination:</span> ${v(inv.final_destination) || 'N/A'}</div>
          </div>
        </div>
        <table class="tbl">
          <thead>
            <tr>
              <th style="width:5%">SR. NO</th>
              <th style="width:28%">DESCRIPTIONS OF GOOD</th>
              <th style="width:9%">ORIGIN</th>
              <th style="width:10%">HS Code</th>
              <th style="width:8%">UNIT</th>
              <th style="width:7%">QT</th>
              <th style="width:13%">UNIT PRICE USD($)</th>
              <th style="width:13%">TOTAL UNIT PRICE</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="8" class="td-left">—</td></tr>'}
            <tr class="total-row">
              <td colspan="6"></td>
              <td class="td-num">TOTAL</td>
              <td class="td-num">${fmtNum(totalUsd)}</td>
            </tr>
            <tr class="words-row">
              <td colspan="8" class="td-left">AMOUNT IN WORDS: ${esc(words)}</td>
            </tr>
          </tbody>
        </table>
        <div class="terms">
          <div class="line">PAYMENT: ${v(inv.payment_conditions)}</div>
          <div class="line">NOTE: ALL THE BANK CHARGES INSIDE OUTSIDE OF DJIBOUTI WILL COME TO BUYERS ACCOUNT.</div>
          <div class="line">SHIPPING: ${v(inv.expedition)}</div>
          <div class="line">SWIFT CODE: ${v(inv.swift_code)}</div>
          <div class="line">PORT OF LOADING: ${v(inv.loading_port)}</div>
          <div class="line">FINAL DESTINATION: ${v(inv.final_destination) || 'N/A'}</div>
          <div class="line">BANK DETAILS: ${v(inv.bank_details)}</div>
          <div class="line">ACCOUNT: ${v(inv.bank_account)}</div>
          <div class="line">INTERMEDIATE BANK: ${v(inv.intermediate_bank)}</div>
          <div class="line">SWIFT CODE: ${v(inv.swift_code_2)}</div>
        </div>
        ${foot}
      </div>
    </section>`;

  return page;
}

export function buildChamberInvoicePrintHtml(
  inv: ChamberInvoicePrintRecord,
  items: ChamberInvoicePrintItem[],
  branding: DocumentBranding
): string {
  return wrapPrintDocument(
    'COMMERCIAL INVOICE',
    buildCommercialInvoicePageHtml(inv, items, branding),
    branding
  );
}

function buildPackingListPageHtml(
  data: WaybillPrintData,
  items: WaybillPrintItem[],
  branding: DocumentBranding
): string {
  const wm = buildDocWatermark(branding);
  const head = buildDocLetterhead(branding);
  const foot = buildDocFooter(branding);
  const d = data;
  const totalQty = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
  const totalNet = items.reduce((s, it) => s + (Number(it.net_weight) || 0), 0);
  const totalGross = items.reduce((s, it) => s + (Number(it.gross_weight) || 0), 0);

  const rows = items
    .map(
      (it, i) => `
    <tr>
      <td class="td-num">${i + 1}</td>
      <td class="td-left">${esc(it.description_of_goods)}</td>
      <td>${esc(it.origin)}</td>
      <td>${esc(it.unit)}</td>
      <td class="td-num">${esc(String(it.quantity))}</td>
      <td class="td-num">${fmtNum(Number(it.net_weight) || 0, 0)}</td>
      <td class="td-num">${fmtNum(Number(it.gross_weight) || 0, 0)}</td>
    </tr>`
    )
    .join('');

  const page = `
    <section class="print-page">
      ${wm}
      <div class="page-body">
        ${head}
        <h1 class="doc-title">PACKING LIST</h1>
        <div class="cols-2">
          <div class="col">
            <div class="line"><span class="lbl">CONSIGNEE:</span> ${v(d.consignee_name)}</div>
            <div class="line"><span class="lbl">TIN:</span> ${v(d.consignee_tin)}</div>
            <div class="line"><span class="lbl">TEL:</span> ${v(d.consignee_tel)}</div>
            <div class="line"><span class="lbl">ADDRESS:</span> ${v(d.consignee_source_destination) || ','}</div>
            <div class="line" style="margin-top:8px"><span class="lbl">SHIPPER/SELLER:</span> ${v(d.shipper_name)}</div>
            <div class="line"><span class="lbl">MOB:</span> ${v(d.shipper_mob)}</div>
            <div class="line"><span class="lbl">TEL:</span> ${v(d.shipper_tel)}</div>
            <div class="line"><span class="lbl">ADDRESS:</span> ${v(d.shipper_source_destination)}</div>
            <div class="line" style="margin-top:8px"><span class="lbl">CONSIGNEE:</span></div>
            <div class="line"><span class="lbl">TO:</span> ${v(d.consignee_name)}</div>
            <div class="line"><span class="lbl">TIN:</span> ${v(d.consignee_tin)}</div>
            <div class="line"><span class="lbl">TEL:</span> ${v(d.consignee_tel)}</div>
          </div>
          <div class="col">
            <div class="line"><span class="lbl">REFERENCE:</span></div>
            <div class="line"><span class="lbl">No.:</span> ${v(d.reference)}</div>
            <div class="line"><span class="lbl">Date:</span> ${fmtDate(d.reference_date || '')}</div>
            <div class="line"><span class="lbl">Invoice No.:</span> ${v(d.invoice_number)}</div>
            <div class="line"><span class="lbl">Purchase Order:</span> ${v(d.packing_purchase_order)}</div>
            <div class="line" style="margin-top:8px"><span class="lbl">NOTIFY PARTY:</span></div>
            <div class="line"><span class="lbl">TO:</span> ${v(d.notify_party)}</div>
            <div class="line"><span class="lbl">TIN:</span> ${v(d.notify_party_tin)}</div>
            <div class="line"><span class="lbl">TEL:</span> ${v(d.notify_party_tel)}</div>
          </div>
        </div>
        <div class="cols-3">
          <div>PLACE OF LOADING: ${v(d.loading_location)}</div>
          <div>TRANSPORT: ${v(d.transport_details)}</div>
          <div>PLACE OF DESTINATION: ${v(d.destination_location) || 'N/A'}</div>
        </div>
        <table class="tbl">
          <thead>
            <tr>
              <th style="width:5%">No</th>
              <th style="width:38%">GOODS DESCRIPTION</th>
              <th style="width:10%">ORIGIN</th>
              <th style="width:8%">UNIT</th>
              <th style="width:8%">QT</th>
              <th style="width:12%">N/WEIGHT</th>
              <th style="width:12%">G/WEIGHT</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="7">—</td></tr>'}
            <tr>
              <td colspan="4" class="td-num" style="font-weight:700">TOTAL:</td>
              <td class="td-num">${fmtNum(totalQty, 0)}</td>
              <td class="td-num">${fmtNum(totalNet, 0)}</td>
              <td class="td-num">${fmtNum(totalGross, 0)}</td>
            </tr>
          </tbody>
        </table>
        ${foot}
      </div>
    </section>`;

  return page;
}

export function buildPackingListPrintHtml(
  data: WaybillPrintData,
  items: WaybillPrintItem[],
  branding: DocumentBranding
): string {
  return wrapPrintDocument('PACKING LIST', buildPackingListPageHtml(data, items, branding), branding);
}

function buildOriginalTruckwayBillPageHtml(
  data: WaybillPrintData,
  items: WaybillPrintItem[],
  branding: DocumentBranding
): string {
  const wm = buildDocWatermark(branding);
  const head = buildDocLetterhead(branding);
  const foot = buildDocFooter(branding);
  const d = data;
  const totalQty = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
  const totalNet = items.reduce((s, it) => s + (Number(it.net_weight) || 0), 0);
  const totalGross = items.reduce((s, it) => s + (Number(it.gross_weight) || 0), 0);

  const rows = items
    .map(
      (it, i) => `
    <tr>
      <td class="td-num">${i + 1}</td>
      <td class="td-left">${esc(it.description_of_goods)}</td>
      <td>${esc(it.origin)}</td>
      <td>${esc(it.unit)}</td>
      <td class="td-num">${esc(String(it.quantity))}</td>
      <td class="td-num">${fmtNum(Number(it.net_weight) || 0, 0)}</td>
      <td class="td-num">${fmtNum(Number(it.gross_weight) || 0, 0)}</td>
    </tr>`
    )
    .join('');

  const page = `
    <section class="print-page">
      ${wm}
      <div class="page-body">
        ${head}
        <h1 class="doc-title">ORIGINAL TRUCKWAY BILL</h1>
        <div class="line" style="margin-bottom:6px"><span class="lbl">Consignee:</span> ${v(d.consignee_name)}</div>
        <div class="line"><span class="lbl">TIN:</span> ${v(d.consignee_tin)}</div>
        <div class="line"><span class="lbl">TEL:</span> ${v(d.consignee_tel)}</div>
        <div class="line"><span class="lbl">ADDRESS:</span> ${v(d.consignee_source_destination) || ','}</div>
        <div class="cols-2" style="margin-top:8px">
          <div class="col">
            <div class="line"><span class="lbl">SHIPPER/SELLER:</span> ${v(d.shipper_name)}</div>
            <div class="line"><span class="lbl">MOB:</span> ${v(d.shipper_mob)}</div>
            <div class="line"><span class="lbl">TEL:</span> ${v(d.shipper_tel)}</div>
            <div class="line"><span class="lbl">ADDRESS:</span> ${v(d.shipper_source_destination)}</div>
            <div class="line" style="margin-top:6px"><span class="lbl">CONSIGNEE:</span></div>
            <div class="line"><span class="lbl">TO:</span> ${v(d.consignee_name)}</div>
            <div class="line"><span class="lbl">TIN:</span> ${v(d.consignee_tin)}</div>
            <div class="line"><span class="lbl">TEL:</span> ${v(d.consignee_tel)}</div>
          </div>
          <div class="col">
            <div class="line"><span class="lbl">REFERENCE:</span></div>
            <div class="line"><span class="lbl">No.:</span> ${v(d.reference)}</div>
            <div class="line"><span class="lbl">Date:</span> ${fmtDate(d.reference_date || '')}</div>
            <div class="line"><span class="lbl">Invoice No.:</span> ${v(d.invoice_number)}</div>
            <div class="line"><span class="lbl">Purchase Order:</span> ${v(d.otb_purchase_order)}</div>
            <div class="line" style="margin-top:6px"><span class="lbl">NOTIFY PARTY:</span></div>
            <div class="line"><span class="lbl">TO:</span> ${v(d.notify_party)}</div>
            <div class="line"><span class="lbl">TIN:</span> ${v(d.notify_party_tin)}</div>
            <div class="line"><span class="lbl">TEL:</span> ${v(d.notify_party_tel)}</div>
          </div>
        </div>
        <div class="cols-3">
          <div>PLACE OF LOADING: ${v(d.loading_location)}</div>
          <div>TRANSPORT: ${v(d.transport_details)}</div>
          <div>PLACE OF DESTINATION: ${v(d.destination_location) || 'N/A'}</div>
        </div>
        <table class="tbl">
          <thead>
            <tr>
              <th style="width:5%">No</th>
              <th style="width:38%">GOODS DESCRIPTION</th>
              <th style="width:10%">ORIGIN</th>
              <th style="width:8%">UNIT</th>
              <th style="width:8%">QT</th>
              <th style="width:12%">N/WEIGHT</th>
              <th style="width:12%">G/WEIGHT</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="7">—</td></tr>'}
            <tr>
              <td colspan="4" class="td-num" style="font-weight:700">TOTAL:</td>
              <td class="td-num">${fmtNum(totalQty, 0)}</td>
              <td class="td-num">${fmtNum(totalNet, 0)}</td>
              <td class="td-num">${fmtNum(totalGross, 0)}</td>
            </tr>
          </tbody>
        </table>
        ${foot}
      </div>
    </section>`;

  return page;
}

export function buildOriginalTruckwayBillPrintHtml(
  data: WaybillPrintData,
  items: WaybillPrintItem[],
  branding: DocumentBranding
): string {
  return wrapPrintDocument(
    'ORIGINAL TRUCKWAY BILL',
    buildOriginalTruckwayBillPageHtml(data, items, branding),
    branding
  );
}

function wrapPrintDocument(title: string, bodyPages: string, branding: DocumentBranding): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <style>${sharedPrintStyles(branding)}</style>
</head>
<body>${bodyPages}</body>
</html>`;
}

export function buildChamberInvoiceFullPrintHtml(
  inv: ChamberInvoicePrintRecord,
  items: ChamberInvoicePrintItem[],
  packing: WaybillPrintData | null,
  packingItems: WaybillPrintItem[],
  letter: WaybillPrintData | null,
  letterItems: WaybillPrintItem[],
  branding: DocumentBranding
): string {
  return wrapPrintBundle(
    'Commercial documents — page 1/3',
    [
      buildCommercialInvoicePageHtml(inv, items, branding),
      buildPackingListPageHtml(packing || {}, packingItems, branding),
      buildOriginalTruckwayBillPageHtml(letter || {}, letterItems, branding),
    ],
    branding
  );
}

export type ChamberInvoiceFullPrintPayload = {
  inv: ChamberInvoicePrintRecord;
  items: ChamberInvoicePrintItem[];
  packing?: Record<string, unknown> | null;
  packingItems?: unknown;
  letter?: Record<string, unknown> | null;
  letterItems?: unknown;
};

export async function openChamberInvoicePrintWindow(
  inv: ChamberInvoicePrintRecord,
  items: ChamberInvoicePrintItem[]
): Promise<void> {
  await openChamberInvoiceFullPrint({ inv, items });
}

export async function openChamberInvoiceFullPrint(
  payload: ChamberInvoiceFullPrintPayload
): Promise<void> {
  const branding = await fetchDocumentBranding();
  const packing = waybillFromRecord(payload.packing);
  const letter = waybillFromRecord(payload.letter);
  const html = buildChamberInvoiceFullPrintHtml(
    payload.inv,
    payload.items,
    packing,
    mapWaybillItems(payload.packingItems),
    letter,
    mapWaybillItems(payload.letterItems),
    branding
  );
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up pour imprimer.');
    return;
  }
  w.document.open();
  w.document.write(appendAutoPrintBeforeBodyClose(html));
  w.document.close();
}

export async function openChamberInvoiceViewWindow(
  inv: ChamberInvoicePrintRecord,
  items: ChamberInvoicePrintItem[]
): Promise<void> {
  const branding = await fetchDocumentBranding();
  const html = buildChamberInvoicePrintHtml(inv, items, branding);
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export { waybillFromRecord, mapWaybillItems };
