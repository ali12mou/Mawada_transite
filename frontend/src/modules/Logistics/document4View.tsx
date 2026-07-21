export type Document4ViewDoc = {
  id: string;
  license_code?: string;
  operator?: string;
  recipient_declarant_name?: string;
  code_no?: string;
  declarant_nif_code?: string;
  recipient_name?: string;
  recipient_nif_code?: string;
  fz_warehouse_declaration?: string;
  quantity_entered?: string;
  boat_name?: string;
  arrival_date?: string;
  trip_number?: string;
  bill_of_lading_number?: string;
  country_origin?: string;
  sh_code?: string;
  exit_qty?: string;
  merchandise_description?: string;
  gross_weight?: string;
  declared_value?: string;
  exit_point?: string;
  destination?: string;
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

export function buildDocument4DetailRows(
  doc: Document4ViewDoc,
  t: (key: string) => string,
  rowNumber?: number
): { label: string; value: string }[] {
  const v = (key: keyof Document4ViewDoc, formatter?: (raw: unknown) => string) => {
    const raw = doc[key];
    if (formatter) return formatter(raw);
    return displayVal(raw);
  };

  return [
    { label: t('document4.documentId'), value: rowNumber != null ? String(rowNumber) : displayVal(doc.id) },
    { label: t('document4.recipientDeclarantName'), value: v('recipient_declarant_name') },
    { label: t('document4.declarantNifCode'), value: v('declarant_nif_code') },
    { label: t('document4.recipientNifCode'), value: v('recipient_nif_code') },
    { label: t('document4.recipientName'), value: v('recipient_name') },
    { label: t('document4.fieldS'), value: v('fz_warehouse_declaration') },
    { label: t('document4.quantityEntered'), value: v('quantity_entered') },
    { label: t('document4.boatName'), value: v('boat_name') },
    { label: t('document4.arrivalDate'), value: fmtViewDate(doc.arrival_date) },
    { label: t('document4.billOfLadingNumber'), value: v('bill_of_lading_number') },
    { label: t('document4.countryOrigin'), value: v('country_origin') },
    { label: t('document4.shCode'), value: v('sh_code') },
    { label: t('document4.exitQty'), value: v('exit_qty') },
    { label: t('document4.grossWeight'), value: v('gross_weight') },
    { label: t('document4.declaredValue'), value: v('declared_value') },
    { label: t('document4.exitPoint'), value: v('exit_point') },
    { label: t('document4.destination'), value: v('destination') },
    { label: t('document4.merchandiseDescription'), value: v('merchandise_description') },
    { label: t('document4.operator'), value: v('operator') },
    { label: t('document4.licenseCode'), value: v('license_code') },
    { label: t('document4.codeNo'), value: v('code_no') },
    { label: t('document4.tripNumber'), value: v('trip_number') },
  ];
}

export function Document4DetailsView({
  doc,
  t,
  rowNumber,
}: {
  doc: Document4ViewDoc;
  t: (key: string) => string;
  rowNumber?: number;
}) {
  const rows = buildDocument4DetailRows(doc, t, rowNumber);

  return (
    <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-gray-50">
          <tr className="border-b border-gray-200">
            <th className="w-1/2 px-4 py-3 text-left text-sm font-semibold text-gray-800">
              {t('document4.documentColumn')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.label}-${index}`} className="border-b border-gray-100 last:border-b-0">
              <td className="px-4 py-3 align-top font-medium text-gray-800">{row.label}</td>
              <td className="px-4 py-3 align-top break-words text-gray-700">{row.value || '\u00a0'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
