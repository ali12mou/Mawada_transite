import type { Document9Record } from '../api/document9Api';

export type Transfer9DetailRow = { label: string; value: string };

function displayValue(v: unknown): string {
  const s = String(v ?? '').trim();
  return s || '—';
}

function displayDate(v: string | undefined): string {
  const s = String(v ?? '').trim();
  if (!s) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return s;
}

/** Lignes « Details / Values » pour l’aperçu transfert document n° 9. */
export function buildTransfer9DetailRows(
  doc: Document9Record,
  t: (key: string) => string
): Transfer9DetailRow[] {
  return [
    { label: 'ID', value: displayValue(doc.sqn) },
    { label: t('transfer9.recipientName'), value: displayValue(doc.declarant) },
    { label: t('transfer9.codeNo'), value: displayValue(doc.declarant_nif) },
    { label: t('transfer9.noCode'), value: displayValue(doc.actual_recipient_nif) },
    { label: t('transfer9.tableRecipient'), value: displayValue(doc.actual_recipient) },
    { label: t('transfer9.licenseCode'), value: displayValue(doc.license_code) },
    { label: t('transfer9.fzOperatorName'), value: displayValue(doc.operator_name) },
    { label: t('transfer9.declarationEntry'), value: displayValue(doc.entry_doc_ref) },
    { label: t('transfer9.entryDate'), value: displayDate(doc.entry_date) },
    { label: t('transfer9.summitNumber'), value: displayValue(doc.sommier_ref) },
    { label: t('transfer9.doNumber'), value: displayValue(doc.do_number) },
    { label: t('transfer9.entryQuantity'), value: displayValue(doc.quantity_entered) },
    { label: t('transfer9.vesselName'), value: displayValue(doc.boat) },
    { label: t('transfer9.arrivalDate'), value: displayDate(doc.arrival_date) },
    { label: t('transfer9.shippingNumber'), value: displayValue(doc.bl_number) },
    { label: t('transfer9.originCountry'), value: displayValue(doc.country_origin) },
    { label: t('transfer9.voyageNumber'), value: displayValue(doc.trip_number) },
    { label: t('transfer9.fiscalReg'), value: displayValue(doc.fiscal_reg) },
    { label: t('transfer9.hsCode'), value: displayValue(doc.nomenclature) },
    { label: t('transfer9.exitQuantity'), value: displayValue(doc.quantity) },
    { label: t('transfer9.goodsDescription'), value: displayValue(doc.description) },
    { label: t('transfer9.grossWeight'), value: displayValue(doc.gross_weight) },
    { label: t('transfer9.declaredValue'), value: displayValue(doc.value) },
    { label: t('transfer9.exitPoint'), value: displayValue(doc.exit_point) },
    { label: t('transfer9.destination'), value: displayValue(doc.destination) },
    { label: t('transfer9.sellerCompany'), value: displayValue(doc.seller_company) },
    { label: t('transfer9.buyerCompany'), value: displayValue(doc.buyer_company) },
    { label: t('transfer9.clientName'), value: displayValue(doc.client_name) },
    { label: t('transfer9.sourceDestination'), value: displayValue(doc.source_destination_label) },
    { label: t('transfer9.closingDate'), value: displayDate(doc.closing_date) },
    { label: t('transfer9.billOfLoading'), value: displayValue(doc.bill_of_loading) },
    { label: t('transfer9.declarationS'), value: displayValue(doc.declaration_s) },
    { label: t('transfer9.declarationE'), value: displayValue(doc.declaration_e) },
    { label: t('transfer9.dossierFee'), value: displayValue(doc.dossier_fee) },
    { label: t('transfer9.truckLoadQty'), value: displayValue(doc.truck_load_quantity) },
    { label: t('transfer9.transitFee'), value: displayValue(doc.transit_fee) },
    { label: t('transfer9.serviceFee'), value: displayValue(doc.service_fee) },
    { label: t('transfer9.passCancelFee'), value: displayValue(doc.pass_cancel_fee) },
    { label: t('transfer9.transferTotal'), value: displayValue(doc.transfer_total) },
    { label: t('transfer9.docSydonia'), value: displayValue(doc.doc_sydonia) },
    { label: t('transfer9.docDeliveryOrder'), value: displayValue(doc.doc_delivery_order) },
    { label: t('transfer9.docCommercial'), value: displayValue(doc.doc_commercial) },
    { label: t('transfer9.docPackingList'), value: displayValue(doc.doc_packing_list) },
    { label: t('transfer9.docTransferDeclarationS'), value: displayValue(doc.doc_transfer_declaration_s) },
    { label: t('transfer9.docFullScan'), value: displayValue(doc.doc_full_scan) },
    { label: t('transfer9.docNumber9'), value: displayValue(doc.doc_number_9_file) },
    { label: t('transfer9.priceNumber9'), value: displayValue(doc.price_number_9) },
    { label: t('transfer9.docNumber4'), value: displayValue(doc.doc_number_4_file) },
    { label: t('transfer9.priceNumber4'), value: displayValue(doc.price_number_4) },
    { label: t('transfer9.docTiCancel'), value: displayValue(doc.doc_ti_cancel_file) },
    { label: t('transfer9.priceTiCancel'), value: displayValue(doc.price_ti_cancel) },
    {
      label: t('transfer9.docDeclarationSeCancel'),
      value: displayValue(doc.doc_declaration_se_cancel_file),
    },
    {
      label: t('transfer9.priceDeclarationSeCancel'),
      value: displayValue(doc.price_declaration_se_cancel),
    },
  ];
}
