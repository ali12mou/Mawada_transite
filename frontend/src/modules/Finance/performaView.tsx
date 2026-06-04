import { Printer, X } from 'lucide-react';
import type { PerformaPrintItem } from '../../lib/performaPrintHtml';

export type PerformaViewData = {
  record: Record<string, unknown>;
  items: PerformaPrintItem[];
};

function displayVal(val: unknown): string {
  if (val == null) return '';
  return String(val).trim();
}

function fmtViewDate(iso: unknown): string {
  const s = displayVal(iso);
  if (!s) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return s;
}

function extractAccountUsd(bank: string, fiscalId: string): string {
  if (fiscalId) return fiscalId;
  const m = /USD\s*(\d+)/i.exec(bank);
  return m ? m[1] : '';
}

function buildBuyerDisplay(row: Record<string, unknown>): string {
  const buyer = displayVal(row.buyer);
  const tin = displayVal(row.buyer_tin ?? row.fiscal_id_number);
  const vendor = displayVal(row.vendor);
  const parts = [buyer, tin, vendor].filter(Boolean);
  return parts.join(' - ');
}

export function PerformaViewModal({
  data,
  t,
  onClose,
  onPrint,
}: {
  data: PerformaViewData;
  t: (key: string) => string;
  onClose: () => void;
  onPrint: () => void;
}) {
  const r = data.record;
  const bank = displayVal(r.bank);
  const fiscalId = displayVal(r.fiscal_id_number ?? r.buyer_tin);

  const detailRows: [string, string][] = [
    [t('performa.viewSeller'), displayVal(r.vendor)],
    [t('performa.viewBuyer'), buildBuyerDisplay(r)],
    [t('performa.viewSourceDestination'), displayVal(r.source_destination)],
    [t('performa.origin'), displayVal(r.origin)],
    [t('performa.viewShipping'), displayVal(r.expedition)],
    [t('performa.viewSwiftyCode'), displayVal(r.swift_code)],
    [t('performa.viewPortOfLoading'), displayVal(r.loading_port)],
    [t('performa.finalDestination'), displayVal(r.final_destination)],
    [t('performa.payment'), displayVal(r.payment)],
    [t('performa.bank'), bank],
    [t('performa.viewAccountUsd'), extractAccountUsd(bank, fiscalId)],
    [t('performa.tinNo'), displayVal(r.buyer_tin ?? r.fiscal_id_number)],
    [t('performa.viewActionDate'), fmtViewDate(r.invoice_date ?? r.updated_at ?? r.created_at)],
    [t('performa.viewCreatedBy'), displayVal(r.created_by ?? r.createdBy ?? '')],
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">{t('performa.viewDetailsTitle')}</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0F3C66] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#152a44]"
            >
              <Printer className="h-4 w-4" />
              {t('performa.print')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-gray-500 hover:bg-gray-100"
              aria-label={t('common.cancel')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <table className="mb-5 w-full border-collapse text-sm">
            <tbody>
              {detailRows.map(([label, value], index) => (
                <tr key={`${label}-${index}`} className="border-b border-gray-200">
                  <td className="w-[42%] px-0 py-2.5 pr-4 align-top font-semibold text-gray-800">
                    {label}
                  </td>
                  <td className="py-2.5 text-gray-900">{value || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="overflow-x-auto rounded-md border border-gray-200">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-gray-100 text-left">
                  <th className="px-3 py-2.5 font-semibold text-[#0F3C66]">#</th>
                  <th className="px-3 py-2.5 font-semibold text-[#0F3C66]">
                    {t('performa.viewDescriptionOfGoods')}
                  </th>
                  <th className="px-3 py-2.5 font-semibold text-[#0F3C66]">{t('performa.viewShCode')}</th>
                  <th className="px-3 py-2.5 font-semibold text-[#0F3C66]">{t('performa.viewQuantity')}</th>
                  <th className="px-3 py-2.5 font-semibold text-[#0F3C66]">{t('performa.unitPrice')}</th>
                  <th className="px-3 py-2.5 font-semibold text-[#0F3C66]">{t('performa.totalUnitPrice')}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  data.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="px-3 py-2.5 text-gray-600">{index + 1}</td>
                      <td className="px-3 py-2.5">{displayVal(item.description_of_goods)}</td>
                      <td className="px-3 py-2.5">{displayVal(item.hs_code)}</td>
                      <td className="px-3 py-2.5">{displayVal(item.quantity)}</td>
                      <td className="px-3 py-2.5">{displayVal(item.unit_price)}</td>
                      <td className="px-3 py-2.5">{displayVal(item.total_unit_price)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
