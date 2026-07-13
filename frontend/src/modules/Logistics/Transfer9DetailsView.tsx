import type { Document9Record } from '../../api/document9Api';
import { buildTransfer9DetailRows } from '../../lib/document9TransferDetails';

type Props = {
  doc: Document9Record;
  t: (key: string) => string;
};

export function Transfer9DetailsView({ doc, t }: Props) {
  const rows = buildTransfer9DetailRows(doc, t);

  return (
    <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-gray-50">
          <tr className="border-b border-gray-200">
            <th className="w-1/2 px-4 py-3 text-left text-sm font-semibold text-gray-800">
              {t('transfer9.detailsColumn')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">
              {t('transfer9.valuesColumn')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-gray-100 last:border-b-0">
              <td className="px-4 py-3 align-top font-medium text-gray-800">{row.label}</td>
              <td className="px-4 py-3 align-top text-gray-700 break-words">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
