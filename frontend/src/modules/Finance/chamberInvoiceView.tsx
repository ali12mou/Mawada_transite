import { ArrowLeft, Printer } from 'lucide-react';
import type { ChamberInvoicePrintItem } from '../../lib/chamberInvoicePrintHtml';
import type { WaybillLineItem } from './chamberInvoiceWaybillFields';
import { DocumentBrandBanner } from '../Shared/DocumentBrandBanner';

export type ChamberInvoiceViewData = {
  header: Record<string, string>;
  items: ChamberInvoicePrintItem[];
  packing: Record<string, unknown> | null;
  letter: Record<string, unknown> | null;
  packingItems: WaybillLineItem[];
  letterItems: WaybillLineItem[];
};

function displayVal(val: unknown): string {
  if (val == null) return '';
  const s = String(val).trim();
  return s;
}

function DetailSection({
  title,
  rows,
  detailsLabel,
  valuesLabel,
}: {
  title: string;
  rows: [string, string][];
  detailsLabel: string;
  valuesLabel: string;
}) {
  return (
    <div className="mb-6 overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-[#c5d9eb] bg-[#D9EAF7] px-4 py-2.5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#003366]">{title}</h3>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="w-[38%] border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-800">
              {detailsLabel}
            </th>
            <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-800">
              {valuesLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value], index) => (
            <tr
              key={`${title}-${label}-${index}`}
              className={index % 2 === 1 ? 'bg-gray-50/90' : 'bg-white'}
            >
              <td className="border-b border-gray-100 px-4 py-2.5 font-medium text-gray-800">
                {label}
              </td>
              <td className="border-b border-gray-100 px-4 py-2.5 text-gray-900">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function mapWaybillItems(
  items: WaybillLineItem[],
  t: (key: string) => string
): [string, string][] {
  const rows: [string, string][] = [];
  items.forEach((item, index) => {
    const prefix = items.length > 1 ? ` (${index + 1})` : '';
    rows.push(
      [t('chamberInvoice.goodsDescription') + prefix, displayVal(item.description_of_goods)],
      [t('chamberInvoice.origin') + prefix, displayVal(item.origin)],
      [t('chamberInvoice.unit') + prefix, displayVal(item.unit)],
      [t('chamberInvoice.qty') + prefix, displayVal(item.quantity)],
      [t('chamberInvoice.netWeight') + prefix, displayVal(item.net_weight)],
      [t('chamberInvoice.grossWeight') + prefix, displayVal(item.gross_weight)],
      [t('chamberInvoice.totalAmount') + prefix, displayVal(item.total)]
    );
  });
  return rows;
}

function mapInvoiceItems(
  items: ChamberInvoicePrintItem[],
  t: (key: string) => string
): [string, string][] {
  const rows: [string, string][] = [];
  items.forEach((item, index) => {
    const prefix = items.length > 1 ? ` (${index + 1})` : '';
    rows.push(
      [t('chamberInvoice.goodsDescription') + prefix, displayVal(item.description_of_goods)],
      [t('chamberInvoice.origin') + prefix, displayVal(item.origin)],
      [t('chamberInvoice.unit') + prefix, displayVal(item.unit)],
      [t('chamberInvoice.qty') + prefix, displayVal(item.quantity)],
      [t('chamberInvoice.unitPrice') + prefix, displayVal(item.unit_price)],
      [t('chamberInvoice.totalAmount') + prefix, displayVal(item.total_amount)]
    );
  });
  return rows;
}

export function ChamberInvoiceViewScreen({
  data,
  t,
  onBack,
  onPrint,
}: {
  data: ChamberInvoiceViewData;
  t: (key: string) => string;
  onBack: () => void;
  onPrint: () => void;
}) {
  const h = data.header;
  const p = data.packing || {};
  const l = data.letter || {};

  const commercialRows1: [string, string][] = [
    [t('chamberInvoice.consignee'), displayVal(h.consignee_name)],
    [t('chamberInvoice.tin'), displayVal(h.tin)],
    [t('chamberInvoice.viewTelephone'), displayVal(h.tel)],
    [t('chamberInvoice.viewAddress'), displayVal(h.source_destination)],
    [t('chamberInvoice.viewRelationship'), displayVal(h.commercial_relation)],
    [t('chamberInvoice.viewPlaceOfConsignment'), displayVal(h.consignment_location)],
    [t('chamberInvoice.invoiceNumber'), displayVal(h.invoice_number)],
    [t('chamberInvoice.invoiceDate'), displayVal(h.invoice_date)],
    [t('chamberInvoice.purchaseOrder'), displayVal(h.purchase_order)],
    [t('chamberInvoice.proformaInvoice'), displayVal(h.proforma_invoice)],
    [t('chamberInvoice.proformaDate'), displayVal(h.proforma_date)],
    [t('chamberInvoice.viewTermsOfSale'), displayVal(h.sales_conditions)],
    [t('chamberInvoice.purchaseOrderDate'), displayVal(h.purchase_order_date)],
    [t('chamberInvoice.appReferenceNumber'), displayVal(h.app_reference_number)],
    [t('chamberInvoice.viewTermsOfPayment'), displayVal(h.payment_conditions)],
  ];

  const commercialRows2: [string, string][] = [
    [t('chamberInvoice.appReferenceNumber'), displayVal(h.app_reference_number)],
    [t('chamberInvoice.viewTermsOfPayment'), displayVal(h.payment_conditions)],
    [t('chamberInvoice.invoiceCurrency'), displayVal(h.invoice_currency || h.currency)],
    [t('chamberInvoice.finalDestination'), displayVal(h.final_destination)],
    [t('chamberInvoice.viewShipping'), displayVal(h.expedition)],
    [t('chamberInvoice.swiftCode'), displayVal(h.swift_code)],
    [t('chamberInvoice.loadingPort'), displayVal(h.loading_port)],
    [t('chamberInvoice.bankDetails'), displayVal(h.bank_details)],
    [t('chamberInvoice.bankAccount'), displayVal(h.bank_account)],
    [t('chamberInvoice.intermediateBank'), displayVal(h.intermediate_bank)],
    [t('chamberInvoice.viewIntermediateSwift'), displayVal(h.swift_code_2)],
    ...mapInvoiceItems(data.items, t),
  ];

  const packingRows1: [string, string][] = [
    [t('chamberInvoice.consignee'), displayVal(p.consignee_name)],
    [t('chamberInvoice.tin'), displayVal(p.consignee_tin)],
    [t('chamberInvoice.viewTelephone'), displayVal(p.consignee_tel)],
    [t('chamberInvoice.viewAddress'), displayVal(p.consignee_source_destination)],
    [t('chamberInvoice.viewShipperSeller'), displayVal(p.shipper_name)],
    [t('chamberInvoice.mob'), displayVal(p.shipper_mob)],
    [t('chamberInvoice.viewTelephone'), displayVal(p.shipper_tel)],
    [t('chamberInvoice.viewAddress'), displayVal(p.shipper_source_destination)],
    [t('chamberInvoice.packingReference'), displayVal(p.reference)],
    [t('chamberInvoice.referenceDate'), displayVal(p.reference_date)],
    [t('chamberInvoice.invoiceNumber'), displayVal(p.invoice_number)],
    [t('chamberInvoice.viewAltConsignee'), displayVal(p.notify_party)],
    [t('chamberInvoice.viewAltTin'), displayVal(p.notify_party_tin)],
    [t('chamberInvoice.viewAltTelephone'), displayVal(p.notify_party_tel)],
  ];

  const packingRows2: [string, string][] = [
    [t('chamberInvoice.viewAltAddress'), displayVal(p.notify_party_source_destination)],
    [t('chamberInvoice.notifyParty'), displayVal(p.notify_party)],
    [t('chamberInvoice.tin'), displayVal(p.notify_party_tin)],
    [t('chamberInvoice.viewTelephone'), displayVal(p.notify_party_tel)],
    [t('chamberInvoice.viewAddress'), displayVal(p.notify_party_source_destination)],
    [t('chamberInvoice.viewPlaceOfLoading'), displayVal(p.loading_location)],
    [t('chamberInvoice.viewTransportationDetail'), displayVal(p.transport_details)],
    [t('chamberInvoice.viewPlaceOfDestination'), displayVal(p.destination_location)],
    ...mapWaybillItems(data.packingItems, t),
    [t('chamberInvoice.packingPurchaseOrder'), displayVal(p.packing_purchase_order)],
  ];

  const letterRows1: [string, string][] = [
    [t('chamberInvoice.consignee'), displayVal(l.consignee_name)],
    [t('chamberInvoice.tin'), displayVal(l.consignee_tin)],
    [t('chamberInvoice.viewTelephone'), displayVal(l.consignee_tel)],
    [t('chamberInvoice.viewAddress'), displayVal(l.consignee_source_destination)],
    [t('chamberInvoice.viewShipperSeller'), displayVal(l.shipper_name)],
    [t('chamberInvoice.mob'), displayVal(l.shipper_mob)],
    [t('chamberInvoice.viewTelephone'), displayVal(l.shipper_tel)],
    [t('chamberInvoice.viewAddress'), displayVal(l.shipper_source_destination)],
    [t('chamberInvoice.packingReference'), displayVal(l.reference)],
    [t('chamberInvoice.referenceDate'), displayVal(l.reference_date)],
    [t('chamberInvoice.invoiceNumber'), displayVal(l.invoice_number)],
    [t('chamberInvoice.viewAltConsignee'), displayVal(l.notify_party)],
    [t('chamberInvoice.viewAltTin'), displayVal(l.notify_party_tin)],
    [t('chamberInvoice.viewAltTelephone'), displayVal(l.notify_party_tel)],
    [t('chamberInvoice.viewAltAddress'), displayVal(l.notify_party_source_destination)],
    [t('chamberInvoice.notifyParty'), displayVal(l.notify_party)],
    [t('chamberInvoice.tin'), displayVal(l.notify_party_tin)],
    [t('chamberInvoice.viewTelephone'), displayVal(l.notify_party_tel)],
    [t('chamberInvoice.viewAddress'), displayVal(l.notify_party_source_destination)],
    [t('chamberInvoice.viewPlaceOfLoading'), displayVal(l.loading_location)],
    [t('chamberInvoice.viewTransportationDetail'), displayVal(l.transport_details)],
    [t('chamberInvoice.viewPlaceOfDestination'), displayVal(l.destination_location)],
    ...mapWaybillItems(data.letterItems, t),
    [t('chamberInvoice.otbPurchaseOrder'), displayVal(l.otb_purchase_order)],
  ];

  const colDetails = t('chamberInvoice.viewDetailsCol');
  const colValues = t('chamberInvoice.viewValuesCol');

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-800">{t('menu.chamber-invoice')}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg bg-[#003366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004080]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-2 rounded-lg bg-[#003366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004080]"
          >
            <Printer className="h-4 w-4" />
            {t('chamberInvoice.printInvoice')}
          </button>
        </div>
      </div>

      <DocumentBrandBanner className="mb-2" />

      <DetailSection
        title={t('chamberInvoice.viewCommercialDetails')}
        rows={commercialRows1}
        detailsLabel={colDetails}
        valuesLabel={colValues}
      />
      <DetailSection
        title={t('chamberInvoice.viewCommercialDetailsContinued')}
        rows={commercialRows2}
        detailsLabel={colDetails}
        valuesLabel={colValues}
      />
      <DetailSection
        title={t('chamberInvoice.viewPackingListDetails')}
        rows={packingRows1}
        detailsLabel={colDetails}
        valuesLabel={colValues}
      />
      <DetailSection
        title={t('chamberInvoice.viewPackingListContinued')}
        rows={packingRows2}
        detailsLabel={colDetails}
        valuesLabel={colValues}
      />
      <DetailSection
        title={t('chamberInvoice.viewOriginalTruckwayBill')}
        rows={letterRows1}
        detailsLabel={colDetails}
        valuesLabel={colValues}
      />
    </div>
  );
}
