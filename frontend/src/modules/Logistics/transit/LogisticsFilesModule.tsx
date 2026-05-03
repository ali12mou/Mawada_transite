import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, FileText, X, FolderKanban, UserRound, Building2 } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import {
  listLogisticsFiles,
  getLogisticsFile,
  upsertLogisticsFile,
  getGoodsByFileId,
  upsertFileGoods,
  getContainersByFileId,
  replaceContainers,
  logStatusChange,
} from '../../../api/transitDb';
import type { LogisticsFile, LogisticsFileContainer, LogisticsFileGoods } from '../../../types/geosomTransit';
const EMPTY_GOODS: Partial<LogisticsFileGoods> = {
  bl_number: '',
  goods_type: '',
  total_weight: undefined,
  goods_description: '',
  number_of_packages: undefined,
  number_of_40ft: 0,
  number_of_20ft: 0,
};

type TabId =
  | 'general'
  | 'goods'
  | 'remarks'
  | 'internal'
  | 'extra'
  | 'reservations'
  | 'purchases'
  | 'sales';

const GENERAL_CONTACT_LABELS = (t: any): Record<string, string> => ({
  contact_name: t('transit.logisticsFiles.fieldContactName'),
  title: t('transit.logisticsFiles.fieldTitle'),
  company_name: t('transit.logisticsFiles.fieldCompanyName'),
  email: t('transit.logisticsFiles.fieldEmail'),
  phone: t('transit.logisticsFiles.fieldPhone'),
  mobile: t('transit.logisticsFiles.fieldMobile'),
  address: t('transit.logisticsFiles.fieldAddress'),
  job_position: t('transit.logisticsFiles.fieldJobPosition'),
  website: t('transit.logisticsFiles.fieldWebsite'),
  language: t('transit.logisticsFiles.fieldLanguage'),
});

const inputClass =
  'mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/15';
const textareaClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/15 min-h-[140px] resize-y';
const labelClass = 'text-xs font-semibold uppercase tracking-wide text-gray-500';

export function LogisticsFilesModule() {
  const { t } = useLanguage();
  const contactLabels = GENERAL_CONTACT_LABELS(t);
  const [files, setFiles] = useState<LogisticsFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [form, setForm] = useState<Partial<LogisticsFile>>({});
  const [goods, setGoods] = useState<Partial<LogisticsFileGoods>>(EMPTY_GOODS);
  const [containers, setContainers] = useState<Partial<LogisticsFileContainer>[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await listLogisticsFiles({ search, status: statusFilter || undefined });
      setFiles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      file_type: 'import',
      customer_type: 'company',
      status: 'open',
    });
    setGoods(EMPTY_GOODS);
    setContainers([]);
    setActiveTab('general');
    setModalOpen(true);
  };

  const openEdit = async (id: string) => {
    setEditingId(id);
    setActiveTab('general');
    try {
      const f = await getLogisticsFile(id);
      setForm(f);
      const g = await getGoodsByFileId(id);
      setGoods(g ? { ...g } : EMPTY_GOODS);
      const c = await getContainersByFileId(id);
      setContainers(c.length ? c : [{ container_size: '', number_of_units: 1, description: '' }]);
      setModalOpen(true);
    } catch (e) {
      console.error(e);
      alert(t('common.errorLoading') || 'Error');
    }
  };

  const save = async () => {
    try {
      const prev = editingId ? await getLogisticsFile(editingId).catch(() => null) : null;
      const saved = await upsertLogisticsFile({ ...form, id: editingId || undefined } as LogisticsFile);
      await upsertFileGoods(saved.id, goods);
      await replaceContainers(
        saved.id,
        containers.filter(c => c.container_size || c.description)
      );
      if (prev && prev.status !== saved.status) {
        await logStatusChange('logistics_file', saved.id, prev.status, saved.status);
      }
      setModalOpen(false);
      load();
    } catch (e: unknown) {
      console.error(e);
      alert((e as Error).message || t('common.errorSaving'));
    }
  };

  const addContainerRow = () => {
    setContainers([...containers, { container_size: '', number_of_units: 1, description: '' }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F3C66]">{t('transit.logisticsFiles.title')}</h1>
          <p className="text-sm text-gray-600">
            {t('transit.logisticsFiles.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F3C66] px-4 py-2 text-sm font-medium text-white hover:bg-[#152a44]"
        >
          <Plus size={18} />
          {t('transit.logisticsFiles.addButton')}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
            placeholder={t('transit.logisticsFiles.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">{t('transit.logisticsFiles.allStatuses')}</option>
          <option value="open">{t('transit.logisticsFiles.statusOpen')}</option>
          <option value="operation_started">{t('transit.logisticsFiles.statusStarted')}</option>
          <option value="cancelled">{t('transit.logisticsFiles.statusCancelled')}</option>
          <option value="completed">{t('transit.logisticsFiles.statusCompleted')}</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{t('transit.logisticsFiles.colJobNo')}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{t('transit.logisticsFiles.colType')}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{t('transit.logisticsFiles.colClientCompany')}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{t('transit.logisticsFiles.colStatus')}</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">{t('common.action')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : files.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  {t('transit.logisticsFiles.empty')}
                </td>
              </tr>
            ) : (
              files?.map(f => (
                <tr key={f.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium">{f.job_number}</td>
                  <td className="px-4 py-3 uppercase">{f.file_type}</td>
                  <td className="px-4 py-3">{f.company_name || f.contact_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-800">{f.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(f.id)}
                      className="text-[#EE964C] hover:underline"
                    >
                      {t('transit.logisticsFiles.actionOpen')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-black/5">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-[#0F3C66] to-[#154b8a] px-6 py-4 text-white">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/70">{t('transit.logisticsFiles.modalTitleEdit')}</p>
                <h2 className="mt-0.5 flex items-center gap-2 text-xl font-semibold">
                  <FolderKanban className="h-6 w-6 shrink-0 opacity-90" aria-hidden />
                  {editingId ? `${t('transit.logisticsFiles.modalTitleEdit')} ${form.job_number || ''}` : t('transit.logisticsFiles.modalTitleAdd')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-white/90 transition hover:bg-white/10"
                aria-label="Fermer"
              >
                <X size={22} />
              </button>
            </div>

            <div className="border-b border-gray-100 bg-gray-50/90 px-4 py-3 sm:px-6">
              <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-200/60 p-1">
                {(
                  [
                    ['general', t('transit.logisticsFiles.tabGeneral')],
                    ['goods', t('transit.logisticsFiles.tabGoods')],
                    ['remarks', t('transit.logisticsFiles.tabRemarks')],
                    ['internal', t('transit.logisticsFiles.tabInternal')],
                    ['extra', t('transit.logisticsFiles.tabExtra')],
                    ['reservations', t('transit.logisticsFiles.tabReservations')],
                    ['purchases', t('transit.logisticsFiles.tabPurchases')],
                    ['sales', t('transit.logisticsFiles.tabSales')],
                  ] as [TabId, string][]
                )?.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition ${activeTab === id
                        ? 'bg-white text-[#0F3C66] shadow-sm ring-1 ring-gray-200/80'
                        : 'text-gray-600 hover:bg-white/70 hover:text-[#0F3C66]'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/50 px-4 py-5 sm:px-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#0F3C66]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F3C66]/10">
                        <FolderKanban className="h-4 w-4" aria-hidden />
                      </span>
                      {t('transit.logisticsFiles.sectionId')}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block md:col-span-2">
                        <span className={labelClass}>{t('transit.logisticsFiles.fieldJobNo')}</span>
                        <input
                          className={inputClass}
                          value={form.job_number || ''}
                          onChange={e => setForm({ ...form, job_number: e.target.value })}
                          placeholder={t('transit.logisticsFiles.placeholderJobNo')}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>{t('transit.logisticsFiles.fieldType')}</span>
                        <select
                          className={inputClass}
                          value={form.file_type || 'import'}
                          onChange={e =>
                            setForm({ ...form, file_type: e.target.value as LogisticsFile['file_type'] })
                          }
                        >
                          <option value="import">Import</option>
                          <option value="export">Export</option>
                          <option value="atd">ATD</option>
                          <option value="local">Local</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className={labelClass}>{t('transit.logisticsFiles.fieldShippingLine')}</span>
                        <input
                          className={inputClass}
                          value={form.shipping_line || ''}
                          onChange={e => setForm({ ...form, shipping_line: e.target.value })}
                          placeholder="—"
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>{t('transit.logisticsFiles.fieldCustomerType')}</span>
                        <select
                          className={inputClass}
                          value={form.customer_type || 'company'}
                          onChange={e =>
                            setForm({ ...form, customer_type: e.target.value as LogisticsFile['customer_type'] })
                          }
                        >
                          <option value="individual">{t('transit.logisticsFiles.customerIndividual')}</option>
                          <option value="company">{t('transit.logisticsFiles.customerCompany')}</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className={labelClass}>{t('transit.logisticsFiles.fieldStatus')}</span>
                        <select
                          className={inputClass}
                          value={form.status || 'open'}
                          onChange={e =>
                            setForm({ ...form, status: e.target.value as LogisticsFile['status'] })
                          }
                        >
                          <option value="open">{t('transit.logisticsFiles.statusOpen')}</option>
                          <option value="operation_started">{t('transit.logisticsFiles.statusStarted')}</option>
                          <option value="cancelled">{t('transit.logisticsFiles.statusCancelled')}</option>
                          <option value="completed">{t('transit.logisticsFiles.statusCompleted')}</option>
                        </select>
                      </label>
                    </div>
                  </section>

                  <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#0F3C66]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
                        <Building2 className="h-4 w-4" aria-hidden />
                      </span>
                      {t('transit.logisticsFiles.sectionConsignee')}
                    </h3>
                    <label className="block">
                      <span className={labelClass}>{t('transit.logisticsFiles.fieldConsignee')}</span>
                      <input
                        className={inputClass}
                        value={form.consignee_shipment || ''}
                        onChange={e => setForm({ ...form, consignee_shipment: e.target.value })}
                        placeholder={t('transit.logisticsFiles.placeholderConsignee')}
                      />
                    </label>
                  </section>

                  <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#0F3C66]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-900">
                        <UserRound className="h-4 w-4" aria-hidden />
                      </span>
                      {t('transit.logisticsFiles.sectionContact')}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {['contact_name', 'title', 'company_name', 'email', 'phone', 'mobile', 'address', 'job_position', 'website', 'language'].map(
                        field => (
                          <label key={field} className="block">
                            <span className={labelClass}>{contactLabels[field] || field}</span>
                            <input
                              className={inputClass}
                              value={(form as Record<string, any>)[field] || ''}
                              onChange={e => setForm({ ...form, [field]: e.target.value })}
                            />
                          </label>
                        )
                      )}
                    </div>
                  </section>

                  <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-[#0F3C66]">{t('transit.logisticsFiles.sectionCommercial')}</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className={labelClass}>{t('transit.logisticsFiles.fieldAgent')}</span>
                        <input
                          className={inputClass}
                          value={form.agent || ''}
                          onChange={e => setForm({ ...form, agent: e.target.value })}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>{t('transit.logisticsFiles.fieldSalesTeam')}</span>
                        <input
                          className={inputClass}
                          value={form.sales_team || ''}
                          onChange={e => setForm({ ...form, sales_team: e.target.value })}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>{t('transit.logisticsFiles.fieldPriority')}</span>
                        <input
                          className={inputClass}
                          value={form.priority || ''}
                          onChange={e => setForm({ ...form, priority: e.target.value })}
                          placeholder="ex. Normal, Urgent"
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <span className={labelClass}>{t('transit.logisticsFiles.fieldTags')}</span>
                        <input
                          className={inputClass}
                          value={(form.tags || []).join(', ')}
                          onChange={e =>
                            setForm({
                              ...form,
                              tags: e.target.value
                                .split(',')
                                .map(s => s.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="tag1, tag2…"
                        />
                      </label>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'goods' && (
                <div className="space-y-6">
                  <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-[#0F3C66]">{t('transit.logisticsFiles.sectionGoods')}</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className={labelClass}>{t('transit.logisticsFiles.fieldBl')}</span>
                        <input
                          className={inputClass}
                          value={goods.bl_number || ''}
                          onChange={e => setGoods({ ...goods, bl_number: e.target.value })}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>{t('transit.logisticsFiles.fieldGoodsType')}</span>
                        <input
                          className={inputClass}
                          value={goods.goods_type || ''}
                          onChange={e => setGoods({ ...goods, goods_type: e.target.value })}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>{t('transit.logisticsFiles.fieldTotalWeight')}</span>
                        <input
                          type="number"
                          className={inputClass}
                          value={goods.total_weight ?? ''}
                          onChange={e =>
                            setGoods({ ...goods, total_weight: parseFloat(e.target.value) || undefined })
                          }
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>{t('transit.logisticsFiles.fieldPackages')}</span>
                        <input
                          type="number"
                          className={inputClass}
                          value={goods.number_of_packages ?? ''}
                          onChange={e =>
                            setGoods({ ...goods, number_of_packages: parseInt(e.target.value, 10) || undefined })
                          }
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>{t('transit.logisticsFiles.field40ft')}</span>
                        <input
                          type="number"
                          className={inputClass}
                          value={goods.number_of_40ft ?? 0}
                          onChange={e => setGoods({ ...goods, number_of_40ft: parseInt(e.target.value, 10) || 0 })}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>{t('transit.logisticsFiles.field20ft')}</span>
                        <input
                          type="number"
                          className={inputClass}
                          value={goods.number_of_20ft ?? 0}
                          onChange={e => setGoods({ ...goods, number_of_20ft: parseInt(e.target.value, 10) || 0 })}
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <span className={labelClass}>{t('transit.logisticsFiles.fieldDescription')}</span>
                        <textarea
                          className={`${textareaClass} mt-1.5 min-h-[88px]`}
                          rows={3}
                          value={goods.goods_description || ''}
                          onChange={e => setGoods({ ...goods, goods_description: e.target.value })}
                        />
                      </label>
                    </div>
                  </section>
                  <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#0F3C66]">{t('transit.logisticsFiles.sectionContainerLines')}</span>
                      <button
                        type="button"
                        onClick={addContainerRow}
                        className="rounded-lg bg-[#EE964C]/10 px-3 py-1.5 text-sm font-medium text-[#c45f12] transition hover:bg-[#EE964C]/20"
                      >
                        {t('transit.logisticsFiles.addContainerLine')}
                      </button>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-gray-100">
                      <table className="w-full min-w-[320px] text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-slate-50/90">
                            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                              {t('transit.logisticsFiles.colSize')}
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                              {t('transit.logisticsFiles.colNumber')}
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                              {t('transit.logisticsFiles.colDescription')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(containers.length ? containers : [{}])?.map((row, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0">
                              <td className="p-2 align-middle">
                                <input
                                  className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/15"
                                  value={row.container_size || ''}
                                  onChange={e => {
                                    const next = [...(containers.length ? containers : [{}])];
                                    next[i] = { ...next[i], container_size: e.target.value };
                                    setContainers(next);
                                  }}
                                />
                              </td>
                              <td className="p-2 align-middle">
                                <input
                                  type="number"
                                  className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/15"
                                  value={row.number_of_units ?? 1}
                                  onChange={e => {
                                    const next = [...(containers.length ? containers : [{}])];
                                    next[i] = { ...next[i], number_of_units: parseInt(e.target.value, 10) || 1 };
                                    setContainers(next);
                                  }}
                                />
                              </td>
                              <td className="p-2 align-middle">
                                <input
                                  className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-[#0F3C66] focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/15"
                                  value={row.description || ''}
                                  onChange={e => {
                                    const next = [...(containers.length ? containers : [{}])];
                                    next[i] = { ...next[i], description: e.target.value };
                                    setContainers(next);
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'remarks' && (
                <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <label className="block">
                    <span className={labelClass}>{t('transit.logisticsFiles.tabRemarks')}</span>
                  </label>
                  <textarea
                    className={`${textareaClass} mt-2`}
                    rows={10}
                    value={form.remarks || ''}
                    onChange={e => setForm({ ...form, remarks: e.target.value })}
                    placeholder={t('transit.logisticsFiles.remarksPlaceholder')}
                  />
                </section>
              )}
              {activeTab === 'internal' && (
                <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <label className="block">
                    <span className={labelClass}>{t('transit.logisticsFiles.tabInternal')}</span>
                  </label>
                  <textarea
                    className={`${textareaClass} mt-2`}
                    rows={10}
                    value={form.internal_notes || ''}
                    onChange={e => setForm({ ...form, internal_notes: e.target.value })}
                    placeholder={t('transit.logisticsFiles.internalPlaceholder')}
                  />
                </section>
              )}
              {activeTab === 'extra' && (
                <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <label className="block">
                    <span className={labelClass}>{t('transit.logisticsFiles.tabExtra')}</span>
                  </label>
                  <textarea
                    className={`${textareaClass} mt-2`}
                    rows={10}
                    value={form.extra_info || ''}
                    onChange={e => setForm({ ...form, extra_info: e.target.value })}
                    placeholder={t('transit.logisticsFiles.extraPlaceholder')}
                  />
                </section>
              )}
              {['reservations', 'purchases', 'sales'].includes(activeTab) && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#0F3C66]/25 bg-white py-14 text-center text-gray-600 shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F3C66]/8">
                    <FileText className="h-7 w-7 text-[#0F3C66]/60" aria-hidden />
                  </div>
                  <p className="max-w-md text-sm leading-relaxed">
                    {t('transit.logisticsFiles.linkedItemsMessage').replace('{jobNo}', form.job_number || '…')}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={save}
                className="rounded-lg bg-[#EE964C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d35400] focus:outline-none focus:ring-2 focus:ring-[#EE964C]/40"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


