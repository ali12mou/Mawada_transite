import { useState, useEffect, useMemo } from 'react';
import { Building2, Info, Printer, DollarSign, X, Eye } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { fetchLocalCompanies, type LocalCompanyRecord } from '../../api/localCompanyApi';
import { fetchCommercialChambers, type CommercialChamberRecord } from '../../api/commercialChamberApi';
import { openLocalCompanyPrint } from '../../lib/localCompanyPrintHtml';
import { openCommercialDetailPrint } from '../../lib/commercialChamberPrintHtml';
import { DateRangePicker } from '../../components/DateRangePicker';

function formatFdj(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  const formatted = (Number.isFinite(n) ? n : 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Fdj ${formatted}`;
}

function formatFdjOrEmpty(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n) || n === 0) return '';
  return formatFdj(n);
}

function formatDateOnly(value?: string | Date | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const s = String(value);
    return s.length >= 10 ? s.slice(0, 10) : s;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function chamberDisplayId(record: CommercialChamberRecord): string {
  if (record.commercial_no?.trim()) return record.commercial_no.trim();
  const fromId = String(record.id || '').replace(/\D/g, '');
  return fromId.slice(-5) || record.id || '—';
}

function DetailRows({
  rows,
  amountRight = false,
}: {
  rows: Array<[string, string]>;
  amountRight?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map(([label, value], idx) => (
            <tr key={`${label}-${idx}`} className="border-b border-gray-200 last:border-b-0">
              <td className="w-[42%] px-4 py-3 font-semibold text-gray-700">{label}</td>
              <td
                className={`px-4 py-3 text-gray-600 ${
                  amountRight ? 'text-right tabular-nums' : 'text-left'
                }`}
              >
                {value || '\u00A0'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChamberDetailPanel({
  sections,
}: {
  sections: Array<{ title?: string; rows: Array<[string, string]> }>;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {sections.map((section, sIdx) => (
            <FragmentSection key={section.title || `section-${sIdx}`} section={section} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FragmentSection({
  section,
}: {
  section: { title?: string; rows: Array<[string, string]> };
}) {
  return (
    <>
      {section.title ? (
        <tr className="bg-[#EEF1F4]">
          <td colSpan={2} className="px-4 py-2.5 text-sm font-bold text-gray-800">
            {section.title}
          </td>
        </tr>
      ) : null}
      {section.rows.map(([label, value], idx) => (
        <tr key={`${section.title || 'top'}-${label}-${idx}`} className="border-b border-gray-200">
          <td className="w-[48%] px-4 py-3 font-medium text-gray-700">{label}</td>
          <td className="px-4 py-3 text-right tabular-nums text-gray-600">{value || '\u00A0'}</td>
        </tr>
      ))}
    </>
  );
}

export function ServicesReports() {
  const { t } = useLanguage();
  const [currentView, setCurrentView] = useState<'main' | 'localCompany' | 'chamber'>('main');
  const [localCompanies, setLocalCompanies] = useState<LocalCompanyRecord[]>([]);
  const [chamberServices, setChamberServices] = useState<CommercialChamberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingCompany, setViewingCompany] = useState<LocalCompanyRecord | null>(null);
  const [viewingChamber, setViewingChamber] = useState<CommercialChamberRecord | null>(null);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedSource, setSelectedSource] = useState('All');
  const [selectedSeller, setSelectedSeller] = useState('All');
  const [selectedClient, setSelectedClient] = useState('All');
  const [chamberSearch, setChamberSearch] = useState('');
  const [chamberDateFrom, setChamberDateFrom] = useState('');
  const [chamberDateTo, setChamberDateTo] = useState('');

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [localData, chamberData] = await Promise.all([
        fetchLocalCompanies().catch(() => [] as LocalCompanyRecord[]),
        fetchCommercialChambers().catch(() => [] as CommercialChamberRecord[]),
      ]);
      setLocalCompanies(localData || []);
      setChamberServices(chamberData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sellerOptions = useMemo(() => {
    const set = new Set<string>();
    localCompanies.forEach((c) => {
      if (c.vendor_company?.trim()) set.add(c.vendor_company.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [localCompanies]);

  const sourceOptions = useMemo(() => {
    const set = new Set<string>();
    localCompanies.forEach((c) => {
      if (c.source_destination?.trim()) set.add(c.source_destination.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [localCompanies]);

  const chamberClientOptions = useMemo(() => {
    const set = new Set<string>();
    chamberServices.forEach((c) => {
      if (c.client_name?.trim()) set.add(c.client_name.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [chamberServices]);

  const filteredLocalCompanies = useMemo(() => {
    return localCompanies.filter((company) => {
      const raw = company.closure_date || company.createdAt || '';
      const date = raw ? String(raw).slice(0, 10) : '';
      if (dateFrom && date && date < dateFrom) return false;
      if (dateTo && date && date > dateTo) return false;
      if (selectedSeller !== 'All' && (company.vendor_company || '') !== selectedSeller) return false;
      if (selectedSource !== 'All' && (company.source_destination || '') !== selectedSource) {
        return false;
      }
      return true;
    });
  }, [localCompanies, dateFrom, dateTo, selectedSeller, selectedSource]);

  const localCompanyTotals = useMemo(() => {
    return filteredLocalCompanies.reduce(
      (acc, company) => {
        acc.fileFee += Number(company.file_fee) || 0;
        acc.serviceFee += Number(company.service_fee) || 0;
        acc.truckQty += Number(company.truck_loading_quantity) || 0;
        acc.totalProfit += Number(company.total) || 0;
        return acc;
      },
      { fileFee: 0, serviceFee: 0, truckQty: 0, totalProfit: 0 }
    );
  }, [filteredLocalCompanies]);

  const filteredChamberServices = useMemo(() => {
    const q = chamberSearch.trim().toLowerCase();
    return chamberServices.filter((row) => {
      const raw = row.created_at || row.commercial_invoice_date || '';
      const date = raw ? String(raw).slice(0, 10) : '';
      if (chamberDateFrom && date && date < chamberDateFrom) return false;
      if (chamberDateTo && date && date > chamberDateTo) return false;
      if (selectedClient !== 'All' && (row.client_name || '') !== selectedClient) return false;
      if (q) {
        const hay = [
          row.commercial_no,
          row.client_name,
          row.tell,
          row.goods_description,
          row.responsible,
        ]
          .map((v) => String(v || '').toLowerCase())
          .join(' ');
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [chamberServices, chamberDateFrom, chamberDateTo, selectedClient, chamberSearch]);

  const chamberServiceFeeTotal = useMemo(
    () =>
      filteredChamberServices.reduce((sum, row) => sum + (Number(row.service_charge) || 0), 0),
    [filteredChamberServices]
  );

  const filterFieldClass =
    'w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]';

  if (loading && currentView === 'main') {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (currentView === 'main') {
    const reportCards: {
      id: 'localCompany' | 'chamber';
      title: string;
      subtitle: string;
    }[] = [
      {
        id: 'localCompany',
        title: t('services.localCompanyReport'),
        subtitle: t('services.localCompanyDesc'),
      },
      {
        id: 'chamber',
        title: t('services.ordersReport'),
        subtitle: t('services.chamberServicesDesc'),
      },
    ];

    return (
      <div className="p-6">
        <div className="mb-8">
          <p className="text-base text-gray-500">{t('services.subtitle')}</p>
        </div>

        <div className="grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          {reportCards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setSelectedSeller('All');
                setSelectedSource('All');
                setChamberDateFrom('');
                setChamberDateTo('');
                setSelectedClient('All');
                setChamberSearch('');
                setViewingChamber(null);
                setCurrentView(card.id);
              }}
              className="rounded-2xl bg-[#F3F4F6] p-8 text-left transition hover:bg-[#EBECEF] hover:shadow-sm"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                <Building2 className="h-7 w-7 text-[#0F3C66]" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-[#0F3C66]">{card.title}</h2>
              <p className="text-sm text-gray-500">{card.subtitle}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (currentView === 'localCompany') {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() => setCurrentView('main')}
          className="mb-4 flex items-center gap-2 text-sm text-[#0F3C66] hover:underline"
        >
          {t('services.backToReports')}
        </button>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-700">{t('services.localCompanyTitle')}</h1>
          <div className="rounded bg-[#EE964C]/10 px-2 py-1 text-xs font-bold uppercase tracking-widest text-[#EE964C]">
            {t('common.version')}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('services.dateRange')}
              </label>
              <DateRangePicker
                value={{ start: dateFrom, end: dateTo }}
                onChange={({ start, end }) => {
                  setDateFrom(start);
                  setDateTo(end);
                }}
                placeholder="YYYY-MM-DD - YYYY-MM-DD"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('services.sellingCompany')}
              </label>
              <select
                value={selectedSeller}
                onChange={(e) => setSelectedSeller(e.target.value)}
                className={filterFieldClass}
              >
                <option value="All">{t('financial.all')}</option>
                {sellerOptions.map((seller) => (
                  <option key={seller} value={seller}>
                    {seller}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('services.sourceDestination')}
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className={filterFieldClass}
              >
                <option value="All">{t('financial.all')}</option>
                {sourceOptions.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-3 text-left text-sm font-bold text-[#0F3C66]">#</th>
                  <th className="px-3 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('services.client')}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('services.sourceDestination')}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('services.sellingCompany')}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('services.descriptionOfGoods')}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('services.fileFee')}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('services.serviceFee')}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('services.truckQuantity')}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('services.totalProfit')}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('services.action')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLocalCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center text-gray-500">
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  filteredLocalCompanies.map((company, index) => (
                    <tr
                      key={company.id}
                      className={index % 2 === 1 ? 'bg-gray-50/70' : 'bg-white'}
                    >
                      <td className="border-t border-gray-100 px-3 py-3 text-gray-700">
                        {index + 1}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-3 text-gray-800">
                        {company.client_name || '—'}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-3 text-gray-700">
                        {company.source_destination || '—'}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-3 text-gray-700">
                        {company.vendor_company || '—'}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-3 text-gray-700">
                        {company.goods_description || '—'}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-3 text-gray-700">
                        {formatFdj(company.file_fee)}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-3 text-gray-700">
                        {formatFdj(company.service_fee)}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-3 text-gray-700">
                        {company.truck_loading_quantity || '0'}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-3 font-medium text-gray-800">
                        {formatFdj(company.total)}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-3">
                        <div className="flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingCompany(company)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded bg-[#0F3C66] text-white hover:bg-[#154b8a]"
                            title={t('common.view')}
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void openLocalCompanyPrint(company)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded bg-[#0F3C66] text-white hover:bg-[#154b8a]"
                            title={t('financial.print')}
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredLocalCompanies.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-100">
                    <td
                      colSpan={5}
                      className="px-3 py-3 text-sm font-bold text-[#0F3C66]"
                    >
                      {t('services.total')}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-[#0F3C66]">
                      {formatFdj(localCompanyTotals.fileFee)}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-[#0F3C66]">
                      {formatFdj(localCompanyTotals.serviceFee)}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-[#0F3C66]">
                      {localCompanyTotals.truckQty}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-[#0F3C66]">
                      {formatFdj(localCompanyTotals.totalProfit)}
                    </td>
                    <td className="px-3 py-3" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {viewingCompany && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-100/95 p-4 sm:p-6">
            <div className="w-full max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setViewingCompany(null)}
                  className="inline-flex items-center gap-2 text-sm text-[#0F3C66] hover:underline"
                >
                  ← {t('common.back')}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void openLocalCompanyPrint(viewingCompany)}
                    className="inline-flex items-center gap-2 rounded-md bg-[#0F3C66] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#154b8a]"
                  >
                    <Printer className="h-4 w-4" />
                    {t('services.printCompanyDetails')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingCompany(null)}
                    className="rounded-md p-2 text-gray-500 hover:bg-white"
                    aria-label={t('common.close')}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <section>
                  <div className="mb-3 flex items-center gap-2 text-[#0F3C66]">
                    <Info className="h-5 w-5" />
                    <h2 className="text-lg font-semibold text-gray-700">
                      {t('services.companyDetails')}
                    </h2>
                  </div>
                  <DetailRows
                    rows={[
                      [t('services.detailCustomer'), viewingCompany.client_name || ''],
                      [
                        t('services.detailSourceDestination'),
                        viewingCompany.source_destination || '',
                      ],
                      [t('services.detailSellerCompany'), viewingCompany.vendor_company || ''],
                      [
                        t('services.detailBuyerCompany'),
                        viewingCompany.purchasing_company || '',
                      ],
                      [
                        t('services.detailDescriptionOfGoods'),
                        viewingCompany.goods_description || '',
                      ],
                      [
                        t('services.detailDeclarationStart'),
                        viewingCompany.declaration_s || '',
                      ],
                      [t('services.detailDeclarationEnd'), viewingCompany.declaration_e || ''],
                      [t('services.detailClosedDate'), viewingCompany.closure_date || ''],
                    ]}
                  />
                </section>

                <section>
                  <div className="mb-3 flex items-center gap-2 text-[#0F3C66]">
                    <DollarSign className="h-5 w-5" />
                    <h2 className="text-lg font-semibold text-gray-700">
                      {t('services.financialDetails')}
                    </h2>
                  </div>
                  <DetailRows
                    amountRight
                    rows={[
                      [t('services.detailFileFee'), formatFdjOrEmpty(viewingCompany.file_fee)],
                      [t('services.detailQuantity'), viewingCompany.quantity || ''],
                      [
                        t('services.detailTruckLoadingQuantity'),
                        viewingCompany.truck_loading_quantity || '',
                      ],
                      [
                        t('services.detailTransitCharges'),
                        formatFdjOrEmpty(viewingCompany.transit_fee),
                      ],
                      [
                        t('services.detailServiceCharges'),
                        formatFdjOrEmpty(viewingCompany.service_fee),
                      ],
                      [
                        t('services.detailCancelGatePass'),
                        formatFdjOrEmpty(viewingCompany.escort_fee),
                      ],
                      [
                        t('services.detailNumber4Price'),
                        formatFdjOrEmpty(viewingCompany.numero_4_price),
                      ],
                      [
                        t('services.detailNumber9Price'),
                        formatFdjOrEmpty(viewingCompany.numero_9_price),
                      ],
                      [
                        t('services.detailCancelingTiPrice'),
                        viewingCompany.ti_cancellation
                          ? formatFdjOrEmpty(viewingCompany.ti_cancellation)
                          : '',
                      ],
                      [
                        t('services.detailCancelingDeclarationPrice'),
                        formatFdjOrEmpty(viewingCompany.declaration_cancellation_price),
                      ],
                      [
                        t('services.detailTotalCharges'),
                        formatFdj(viewingCompany.total || 0),
                      ],
                    ]}
                  />
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentView === 'chamber') {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() => {
            setViewingChamber(null);
            setCurrentView('main');
          }}
          className="mb-4 flex items-center gap-2 text-sm text-[#0F3C66] hover:underline"
        >
          {t('services.backToReports')}
        </button>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-700">{t('services.ordersReport')}</h1>
          <div className="rounded bg-[#EE964C]/10 px-2 py-1 text-xs font-bold uppercase tracking-widest text-[#EE964C]">
            {t('common.version')}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('services.dateRange')}
              </label>
              <DateRangePicker
                value={{ start: chamberDateFrom, end: chamberDateTo }}
                onChange={({ start, end }) => {
                  setChamberDateFrom(start);
                  setChamberDateTo(end);
                }}
                placeholder="YYYY-MM-DD - YYYY-MM-DD"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('services.client')}
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className={filterFieldClass}
              >
                <option value="All">{t('financial.all')}</option>
                {chamberClientOptions.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('services.search')}
              </label>
              <input
                type="text"
                value={chamberSearch}
                onChange={(e) => setChamberSearch(e.target.value)}
                className={filterFieldClass}
                placeholder={t('services.search')}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('services.ref')}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('services.client')}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('services.mobile')}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('services.goodsDescription')}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('services.serviceFee')}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('services.creationDate')}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('services.createdBy')}
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('services.action')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredChamberServices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-gray-500">
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  filteredChamberServices.map((row, index) => (
                    <tr key={row.id} className={index % 2 === 1 ? 'bg-gray-50/70' : 'bg-white'}>
                      <td className="border-t border-gray-100 px-3 py-3 font-medium text-gray-800">
                        {row.commercial_no || '—'}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-3 text-gray-800">
                        {row.client_name || '—'}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-3 text-gray-700">
                        {row.tell || '—'}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-3 text-gray-700">
                        {row.goods_description || '—'}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-3 text-gray-700">
                        {formatFdj(row.service_charge)}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-3 text-gray-700">
                        {formatDateOnly(row.created_at || row.commercial_invoice_date)}
                      </td>
                      <td className="border-t border-gray-100 px-3 py-3">
                        <span className="font-medium text-[#0F3C66]">
                          {row.responsible || '—'}
                        </span>
                      </td>
                      <td className="border-t border-gray-100 px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setViewingChamber(row)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded bg-[#0F3C66] text-white hover:bg-[#154b8a]"
                          title={t('common.view')}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredChamberServices.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-100">
                    <td colSpan={4} className="px-3 py-3 text-sm font-bold text-[#0F3C66]">
                      {t('services.total')}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-[#0F3C66]">
                      {formatFdj(chamberServiceFeeTotal)}
                    </td>
                    <td colSpan={3} className="px-3 py-3" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {viewingChamber && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-100/95 p-4 sm:p-6">
            <div className="w-full max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setViewingChamber(null)}
                  className="inline-flex items-center gap-2 text-sm text-[#0F3C66] hover:underline"
                >
                  ← {t('common.back')}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void openCommercialDetailPrint(viewingChamber)}
                    className="inline-flex items-center gap-2 rounded-md bg-[#0F3C66] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#154b8a]"
                  >
                    <Printer className="h-4 w-4" />
                    {t('commercial.print')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingChamber(null)}
                    className="rounded-md p-2 text-gray-500 hover:bg-white"
                    aria-label={t('common.close')}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <ChamberDetailPanel
                sections={[
                  {
                    rows: [
                      [
                        t('services.totalChamberService'),
                        formatFdj(viewingChamber.chamber_service_amount),
                      ],
                      [t('commercial.total'), formatFdj(viewingChamber.total)],
                    ],
                  },
                  {
                    title: t('services.chamberInfoDetails'),
                    rows: [
                      [
                        t('commercial.commercialInvoiceNo'),
                        viewingChamber.commercial_invoice_no || '',
                      ],
                      [
                        t('commercial.commercialInvoiceDate'),
                        formatDateOnly(viewingChamber.commercial_invoice_date),
                      ],
                      [
                        t('commercial.purchaseOrderNo'),
                        viewingChamber.purchase_order_no || '',
                      ],
                      [
                        t('commercial.purchaseOrderDate'),
                        formatDateOnly(viewingChamber.purchase_order_date),
                      ],
                      [t('services.timNo'), viewingChamber.timno || ''],
                    ],
                  },
                  {
                    title: t('services.chargesInformation'),
                    rows: [
                      [
                        t('services.serviceCharges'),
                        formatFdj(viewingChamber.service_charge),
                      ],
                      [
                        t('commercial.chamberServiceAmount'),
                        formatFdj(viewingChamber.chamber_service_amount),
                      ],
                      [
                        t('services.qtyServiceNumber'),
                        viewingChamber.quantity || '0',
                      ],
                      [
                        t('services.transportDhl'),
                        formatFdj(viewingChamber.transport_dhl),
                      ],
                      [
                        t('services.bankCommissionFee'),
                        formatFdj(viewingChamber.bank_commission_fee),
                      ],
                      [
                        t('commercial.certificateFee'),
                        formatFdj(viewingChamber.certificate_fee),
                      ],
                    ],
                  },
                ]}
              />

              <p className="mt-4 text-center text-sm font-semibold uppercase tracking-wide text-[#0F3C66]">
                {t('services.chamberIdFooter').replace(
                  '{id}',
                  chamberDisplayId(viewingChamber)
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
