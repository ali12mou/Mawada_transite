import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import type { ClientRecord } from '../../api/clientsApi';

export interface WaybillLineItem {
  description_of_goods: string;
  origin: string;
  unit: string;
  quantity: number;
  net_weight: number;
  gross_weight: number;
  total: number;
}

export function emptyWaybillForm() {
  return {
    consignee_name: '',
    consignee_tin: '',
    consignee_tel: '',
    consignee_source_destination: '',
    shipper_name: '',
    shipper_mob: '',
    shipper_tel: '',
    shipper_source_destination: '',
    reference: '',
    reference_date: '',
    invoice_number: '',
    notify_party: '',
    notify_party_tin: '',
    notify_party_tel: '',
    notify_party_source_destination: '',
    packing_purchase_order: '',
    otb_purchase_order: '',
    loading_location: '',
    transport_details: '',
    destination_location: '',
  };
}

export type WaybillFormData = ReturnType<typeof emptyWaybillForm>;

export function emptyWaybillLineItem(): WaybillLineItem {
  return {
    description_of_goods: '',
    origin: '',
    unit: '',
    quantity: 0,
    net_weight: 0,
    gross_weight: 0,
    total: 0,
  };
}

const labelClass = 'mb-1 block text-sm font-bold text-gray-800';
const inputClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]/30';
const selectClass = inputClass;
const grid3 = 'grid grid-cols-1 gap-4 md:grid-cols-3';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function ColumnCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h4 className="mb-3 text-sm font-bold text-gray-900">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function WaybillFormFields({
  idPrefix,
  data,
  onChange,
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  purchaseOrderMode,
  clientsList,
  locationsList,
  goodsCategories,
  t,
}: {
  idPrefix: string;
  data: WaybillFormData;
  onChange: (next: WaybillFormData) => void;
  items: WaybillLineItem[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof WaybillLineItem, value: unknown) => void;
  purchaseOrderMode: 'packing' | 'otb';
  clientsList: ClientRecord[];
  locationsList: { id?: string; _id?: string; name: string }[];
  goodsCategories: { id?: string; _id?: string; name: string }[];
  t: (key: string) => string;
}) {
  const poLabel =
    purchaseOrderMode === 'packing'
      ? t('chamberInvoice.packingPurchaseOrder')
      : t('chamberInvoice.otbPurchaseOrder');
  const poValue =
    purchaseOrderMode === 'packing' ? data.packing_purchase_order : data.otb_purchase_order;
  const setPo = (v: string) =>
    onChange(
      purchaseOrderMode === 'packing'
        ? { ...data, packing_purchase_order: v }
        : { ...data, otb_purchase_order: v }
    );

  const pickClient = (name: string, role: 'consignee' | 'notify') => {
    const client = clientsList.find((c) => c.name === name);
    if (role === 'consignee') {
      onChange({
        ...data,
        consignee_name: name,
        consignee_tel: client?.phone ?? data.consignee_tel,
      });
    } else {
      onChange({
        ...data,
        notify_party: name,
        notify_party_tel: client?.phone ?? data.notify_party_tel,
      });
    }
  };

  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ColumnCard title={t('chamberInvoice.packingConsignee')}>
          <Field label={t('chamberInvoice.consignee')}>
            <select
              value={data.consignee_name}
              onChange={(e) => pickClient(e.target.value, 'consignee')}
              className={selectClass}
            >
              <option value="">{t('chamberInvoice.select')}</option>
              {clientsList.map((c) => (
                <option key={`${idPrefix}-cons-${c.id}`} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('chamberInvoice.tin')}>
            <input
              type="text"
              value={data.consignee_tin}
              onChange={(e) => onChange({ ...data, consignee_tin: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label={t('chamberInvoice.tel')}>
            <input
              type="text"
              value={data.consignee_tel}
              onChange={(e) => onChange({ ...data, consignee_tel: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label={t('chamberInvoice.sourceDestination')}>
            <select
              value={data.consignee_source_destination}
              onChange={(e) => onChange({ ...data, consignee_source_destination: e.target.value })}
              className={selectClass}
            >
              <option value="">{t('chamberInvoice.select')}</option>
              {locationsList.map((l) => (
                <option key={`${idPrefix}-csd-${l.id || l._id}`} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
        </ColumnCard>

        <ColumnCard title={t('chamberInvoice.packingShipper')}>
          <Field label={t('chamberInvoice.shipperName')}>
            <input
              type="text"
              value={data.shipper_name}
              onChange={(e) => onChange({ ...data, shipper_name: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label={t('chamberInvoice.mob')}>
            <input
              type="text"
              value={data.shipper_mob}
              onChange={(e) => onChange({ ...data, shipper_mob: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label={t('chamberInvoice.tel')}>
            <input
              type="text"
              value={data.shipper_tel}
              onChange={(e) => onChange({ ...data, shipper_tel: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label={t('chamberInvoice.sourceDestination')}>
            <select
              value={data.shipper_source_destination}
              onChange={(e) => onChange({ ...data, shipper_source_destination: e.target.value })}
              className={selectClass}
            >
              <option value="">{t('chamberInvoice.select')}</option>
              {locationsList.map((l) => (
                <option key={`${idPrefix}-ssd-${l.id || l._id}`} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
        </ColumnCard>

        <ColumnCard title={t('chamberInvoice.packingReference')}>
          <Field label={t('chamberInvoice.packingReference')}>
            <input
              type="text"
              value={data.reference}
              onChange={(e) => onChange({ ...data, reference: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label={t('chamberInvoice.referenceDate')}>
            <input
              type="date"
              value={data.reference_date}
              onChange={(e) => onChange({ ...data, reference_date: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label={t('chamberInvoice.invoiceNumber')}>
            <input
              type="text"
              value={data.invoice_number}
              onChange={(e) => onChange({ ...data, invoice_number: e.target.value })}
              className={inputClass}
            />
          </Field>
        </ColumnCard>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <ColumnCard title={t('chamberInvoice.packingConsignee')}>
          <Field label={t('chamberInvoice.toLabel')}>
            <select
              value={data.consignee_name}
              onChange={(e) => pickClient(e.target.value, 'consignee')}
              className={selectClass}
            >
              <option value="">{t('chamberInvoice.select')}</option>
              {clientsList.map((c) => (
                <option key={`${idPrefix}-to-${c.id}`} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('chamberInvoice.tin')}>
            <input
              type="text"
              value={data.consignee_tin}
              onChange={(e) => onChange({ ...data, consignee_tin: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label={t('chamberInvoice.tel')}>
            <input
              type="text"
              value={data.consignee_tel}
              onChange={(e) => onChange({ ...data, consignee_tel: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label={t('chamberInvoice.sourceDestination')}>
            <select
              value={data.consignee_source_destination}
              onChange={(e) => onChange({ ...data, consignee_source_destination: e.target.value })}
              className={selectClass}
            >
              <option value="">{t('chamberInvoice.select')}</option>
              {locationsList.map((l) => (
                <option key={`${idPrefix}-to-sd-${l.id || l._id}`} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
        </ColumnCard>

        <ColumnCard title={t('chamberInvoice.notifyParty')}>
          <Field label={t('chamberInvoice.notifyParty')}>
            <select
              value={data.notify_party}
              onChange={(e) => pickClient(e.target.value, 'notify')}
              className={selectClass}
            >
              <option value="">{t('chamberInvoice.select')}</option>
              {clientsList.map((c) => (
                <option key={`${idPrefix}-notify-${c.id}`} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('chamberInvoice.tin')}>
            <input
              type="text"
              value={data.notify_party_tin}
              onChange={(e) => onChange({ ...data, notify_party_tin: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label={t('chamberInvoice.tel')}>
            <input
              type="text"
              value={data.notify_party_tel}
              onChange={(e) => onChange({ ...data, notify_party_tel: e.target.value })}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('chamberInvoice.sourceDestination')}>
              <select
                value={data.notify_party_source_destination}
                onChange={(e) =>
                  onChange({ ...data, notify_party_source_destination: e.target.value })
                }
                className={selectClass}
              >
                <option value="">{t('chamberInvoice.select')}</option>
                {locationsList.map((l) => (
                  <option key={`${idPrefix}-np-sd-${l.id || l._id}`} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={poLabel}>
              <input type="text" value={poValue} onChange={(e) => setPo(e.target.value)} className={inputClass} />
            </Field>
          </div>
        </ColumnCard>
      </div>

      <div className={`${grid3} mb-4`}>
        <Field label={t('chamberInvoice.loadingPlace')}>
          <input
            type="text"
            value={data.loading_location}
            onChange={(e) => onChange({ ...data, loading_location: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label={t('chamberInvoice.transportDetails')}>
          <input
            type="text"
            value={data.transport_details}
            onChange={(e) => onChange({ ...data, transport_details: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label={t('chamberInvoice.destinationPlace')}>
          <select
            value={data.destination_location}
            onChange={(e) => onChange({ ...data, destination_location: e.target.value })}
            className={selectClass}
          >
            <option value="">{t('chamberInvoice.select')}</option>
            {locationsList.map((l) => (
              <option key={`${idPrefix}-dest-${l.id || l._id}`} value={l.name}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-xs font-bold uppercase text-gray-800">
              <th className="w-10 border border-gray-200 px-2 py-2 text-center">
                {t('chamberInvoice.colNumber')}
              </th>
              <th className="min-w-[180px] border border-gray-200 px-2 py-2">
                {t('chamberInvoice.goodsDescription')}
              </th>
              <th className="border border-gray-200 px-2 py-2">{t('chamberInvoice.origin')}</th>
              <th className="border border-gray-200 px-2 py-2">{t('chamberInvoice.unit')}</th>
              <th className="border border-gray-200 px-2 py-2">{t('chamberInvoice.qty')}</th>
              <th className="border border-gray-200 px-2 py-2">{t('chamberInvoice.netWeight')}</th>
              <th className="border border-gray-200 px-2 py-2">{t('chamberInvoice.grossWeight')}</th>
              <th className="border border-gray-200 px-2 py-2">{t('chamberInvoice.totalAmount')}</th>
              <th className="w-14 border border-gray-200 px-2 py-2 text-center">
                {t('chamberInvoice.colAction')}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${idPrefix}-row-${index}`} className="bg-white">
                <td className="border border-gray-200 px-2 py-2 text-center font-medium text-gray-600">
                  {index + 1}
                </td>
                <td className="border border-gray-200 px-2 py-2">
                  <select
                    value={item.description_of_goods}
                    onChange={(e) => onUpdateItem(index, 'description_of_goods', e.target.value)}
                    className={selectClass}
                  >
                    <option value="">{t('chamberInvoice.selectDescription')}</option>
                    {goodsCategories.map((c) => (
                      <option key={`${idPrefix}-g-${c.id || c._id}-${index}`} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="border border-gray-200 px-1 py-1">
                  <input
                    type="text"
                    value={item.origin}
                    onChange={(e) => onUpdateItem(index, 'origin', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="border border-gray-200 px-1 py-1">
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => onUpdateItem(index, 'unit', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="border border-gray-200 px-1 py-1">
                  <input
                    type="number"
                    step="0.01"
                    value={item.quantity || ''}
                    onChange={(e) => onUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className={inputClass}
                  />
                </td>
                <td className="border border-gray-200 px-1 py-1">
                  <input
                    type="number"
                    step="0.01"
                    value={item.net_weight || ''}
                    onChange={(e) => onUpdateItem(index, 'net_weight', parseFloat(e.target.value) || 0)}
                    className={inputClass}
                  />
                </td>
                <td className="border border-gray-200 px-1 py-1">
                  <input
                    type="number"
                    step="0.01"
                    value={item.gross_weight || ''}
                    onChange={(e) => onUpdateItem(index, 'gross_weight', parseFloat(e.target.value) || 0)}
                    className={inputClass}
                  />
                </td>
                <td className="border border-gray-200 px-1 py-1">
                  <input
                    type="number"
                    step="0.01"
                    value={item.total || ''}
                    onChange={(e) => onUpdateItem(index, 'total', parseFloat(e.target.value) || 0)}
                    className={inputClass}
                  />
                </td>
                <td className="border border-gray-200 px-2 py-2 text-center">
                  {index === items.length - 1 ? (
                    <button
                      type="button"
                      onClick={onAddItem}
                      title={t('chamberInvoice.addRow')}
                      className="inline-flex h-8 w-8 items-center justify-center rounded bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRemoveItem(index)}
                      className="text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
