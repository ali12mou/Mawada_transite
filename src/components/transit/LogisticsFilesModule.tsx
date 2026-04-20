import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, FileText, X, FolderKanban, UserRound, Building2 } from 'lucide-react';
import {
  listLogisticsFiles,
  getLogisticsFile,
  upsertLogisticsFile,
  getGoodsByFileId,
  upsertFileGoods,
  getContainersByFileId,
  replaceContainers,
  logStatusChange,
} from '../../api/transitDb';
import type { LogisticsFile, LogisticsFileContainer, LogisticsFileGoods } from '../../types/geosomTransit';
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

const GENERAL_CONTACT_LABELS: Record<string, string> = {
  contact_name: 'Nom du contact',
  title: 'Fonction / titre',
  company_name: 'Raison sociale',
  email: 'Email',
  phone: 'Téléphone',
  mobile: 'Mobile',
  address: 'Adresse',
  job_position: 'Poste',
  website: 'Site web',
  language: 'Langue',
};

const inputClass =
  'mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/15';
const textareaClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/15 min-h-[140px] resize-y';
const labelClass = 'text-xs font-semibold uppercase tracking-wide text-gray-500';

export function LogisticsFilesModule() {
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
      alert('Impossible de charger le dossier');
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
      alert((e as Error).message || 'Erreur enregistrement');
    }
  };

  const addContainerRow = () => {
    setContainers([...containers, { container_size: '', number_of_units: 1, description: '' }]);
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#1e3a5f]">Dossiers logistiques / Opérations</h1>
            <p className="text-sm text-gray-600">
              Créez et gérez les dossiers (Job Number). Les transports et réservations s’appuient sur ces dossiers.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#152a44]"
          >
            <Plus size={18} />
            Nouveau dossier
          </button>
        </div>

        <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
              placeholder="Recherche (n° dossier, client…)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="open">Ouvert</option>
            <option value="operation_started">Opération démarrée</option>
            <option value="cancelled">Annulé</option>
            <option value="completed">Terminé</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Job N°</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Client / Société</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Statut</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Chargement…
                  </td>
                </tr>
              ) : files.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Aucun dossier. Créez un dossier pour démarrer le flux métier.
                  </td>
                </tr>
              ) : (
                files.map(f => (
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
                        className="text-[#e67e22] hover:underline"
                      >
                        Ouvrir
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
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] px-6 py-4 text-white">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-white/70">Dossier logistique</p>
                  <h2 className="mt-0.5 flex items-center gap-2 text-xl font-semibold">
                    <FolderKanban className="h-6 w-6 shrink-0 opacity-90" aria-hidden />
                    {editingId ? `Dossier ${form.job_number || ''}` : 'Nouveau dossier'}
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
                      ['general', 'Général & client'],
                      ['goods', 'Marchandises'],
                      ['remarks', 'Remarques'],
                      ['internal', 'Notes internes'],
                      ['extra', 'Extra'],
                      ['reservations', 'Réservations'],
                      ['purchases', 'Achats'],
                      ['sales', 'Ventes'],
                    ] as [TabId, string][]
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id)}
                      className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
                        activeTab === id
                          ? 'bg-white text-[#1e3a5f] shadow-sm ring-1 ring-gray-200/80'
                          : 'text-gray-600 hover:bg-white/70 hover:text-[#1e3a5f]'
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
                      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#1e3a5f]">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f]/10">
                          <FolderKanban className="h-4 w-4" aria-hidden />
                        </span>
                        Identification du dossier
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block md:col-span-2">
                          <span className={labelClass}>N° dossier / Job</span>
                          <input
                            className={inputClass}
                            value={form.job_number || ''}
                            onChange={e => setForm({ ...form, job_number: e.target.value })}
                            placeholder="Auto si vide"
                          />
                        </label>
                        <label className="block">
                          <span className={labelClass}>Type de dossier</span>
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
                          <span className={labelClass}>Ligne maritime</span>
                          <input
                            className={inputClass}
                            value={form.shipping_line || ''}
                            onChange={e => setForm({ ...form, shipping_line: e.target.value })}
                            placeholder="—"
                          />
                        </label>
                        <label className="block">
                          <span className={labelClass}>Type de client</span>
                          <select
                            className={inputClass}
                            value={form.customer_type || 'company'}
                            onChange={e =>
                              setForm({ ...form, customer_type: e.target.value as LogisticsFile['customer_type'] })
                            }
                          >
                            <option value="individual">Particulier</option>
                            <option value="company">Société</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className={labelClass}>Statut dossier</span>
                          <select
                            className={inputClass}
                            value={form.status || 'open'}
                            onChange={e =>
                              setForm({ ...form, status: e.target.value as LogisticsFile['status'] })
                            }
                          >
                            <option value="open">Ouvert</option>
                            <option value="operation_started">Opération démarrée</option>
                            <option value="cancelled">Annulé</option>
                            <option value="completed">Terminé</option>
                          </select>
                        </label>
                      </div>
                    </section>

                    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#1e3a5f]">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
                          <Building2 className="h-4 w-4" aria-hidden />
                        </span>
                        Destinataire
                      </h3>
                      <label className="block">
                        <span className={labelClass}>Destinataire (consignee)</span>
                        <input
                          className={inputClass}
                          value={form.consignee_shipment || ''}
                          onChange={e => setForm({ ...form, consignee_shipment: e.target.value })}
                          placeholder="Nom ou référence destinataire"
                        />
                      </label>
                    </section>

                    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#1e3a5f]">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-900">
                          <UserRound className="h-4 w-4" aria-hidden />
                        </span>
                        Contact & société
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {['contact_name', 'title', 'company_name', 'email', 'phone', 'mobile', 'address', 'job_position', 'website', 'language'].map(
                          field => (
                            <label key={field} className="block">
                              <span className={labelClass}>{GENERAL_CONTACT_LABELS[field] || field}</span>
                              <input
                                className={inputClass}
                                value={(form as Record<string, string>)[field] || ''}
                                onChange={e => setForm({ ...form, [field]: e.target.value })}
                              />
                            </label>
                          )
                        )}
                      </div>
                    </section>

                    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                      <h3 className="mb-4 text-sm font-semibold text-[#1e3a5f]">Commercial & suivi</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className={labelClass}>Agent</span>
                          <input
                            className={inputClass}
                            value={form.agent || ''}
                            onChange={e => setForm({ ...form, agent: e.target.value })}
                          />
                        </label>
                        <label className="block">
                          <span className={labelClass}>Équipe commerciale</span>
                          <input
                            className={inputClass}
                            value={form.sales_team || ''}
                            onChange={e => setForm({ ...form, sales_team: e.target.value })}
                          />
                        </label>
                        <label className="block">
                          <span className={labelClass}>Priorité</span>
                          <input
                            className={inputClass}
                            value={form.priority || ''}
                            onChange={e => setForm({ ...form, priority: e.target.value })}
                            placeholder="ex. Normal, Urgent"
                          />
                        </label>
                        <label className="block md:col-span-2">
                          <span className={labelClass}>Tags (séparés par virgule)</span>
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
                      <h3 className="mb-4 text-sm font-semibold text-[#1e3a5f]">Marchandise & B/L</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className={labelClass}>B/L</span>
                          <input
                            className={inputClass}
                            value={goods.bl_number || ''}
                            onChange={e => setGoods({ ...goods, bl_number: e.target.value })}
                          />
                        </label>
                        <label className="block">
                          <span className={labelClass}>Type de marchandise</span>
                          <input
                            className={inputClass}
                            value={goods.goods_type || ''}
                            onChange={e => setGoods({ ...goods, goods_type: e.target.value })}
                          />
                        </label>
                        <label className="block">
                          <span className={labelClass}>Poids total</span>
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
                          <span className={labelClass}>Nombre de colis</span>
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
                          <span className={labelClass}>Conteneurs 40&apos;</span>
                          <input
                            type="number"
                            className={inputClass}
                            value={goods.number_of_40ft ?? 0}
                            onChange={e => setGoods({ ...goods, number_of_40ft: parseInt(e.target.value, 10) || 0 })}
                          />
                        </label>
                        <label className="block">
                          <span className={labelClass}>Conteneurs 20&apos;</span>
                          <input
                            type="number"
                            className={inputClass}
                            value={goods.number_of_20ft ?? 0}
                            onChange={e => setGoods({ ...goods, number_of_20ft: parseInt(e.target.value, 10) || 0 })}
                          />
                        </label>
                        <label className="block md:col-span-2">
                          <span className={labelClass}>Description</span>
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
                        <span className="text-sm font-semibold text-[#1e3a5f]">Lignes conteneurs</span>
                        <button
                          type="button"
                          onClick={addContainerRow}
                          className="rounded-lg bg-[#e67e22]/10 px-3 py-1.5 text-sm font-medium text-[#c45f12] transition hover:bg-[#e67e22]/20"
                        >
                          + Ligne
                        </button>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-gray-100">
                        <table className="w-full min-w-[320px] text-sm">
                          <thead>
                            <tr className="border-b border-gray-100 bg-slate-50/90">
                              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Taille
                              </th>
                              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Nombre
                              </th>
                              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Description
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(containers.length ? containers : [{}]).map((row, i) => (
                              <tr key={i} className="border-b border-gray-50 last:border-0">
                                <td className="p-2 align-middle">
                                  <input
                                    className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/15"
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
                                    className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/15"
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
                                    className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/15"
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
                      <span className={labelClass}>Remarques</span>
                    </label>
                    <textarea
                      className={`${textareaClass} mt-2`}
                      rows={10}
                      value={form.remarks || ''}
                      onChange={e => setForm({ ...form, remarks: e.target.value })}
                      placeholder="Remarques visibles…"
                    />
                  </section>
                )}
                {activeTab === 'internal' && (
                  <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <label className="block">
                      <span className={labelClass}>Notes internes</span>
                    </label>
                    <textarea
                      className={`${textareaClass} mt-2`}
                      rows={10}
                      value={form.internal_notes || ''}
                      onChange={e => setForm({ ...form, internal_notes: e.target.value })}
                      placeholder="Réservé à l’équipe…"
                    />
                  </section>
                )}
                {activeTab === 'extra' && (
                  <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <label className="block">
                      <span className={labelClass}>Informations complémentaires</span>
                    </label>
                    <textarea
                      className={`${textareaClass} mt-2`}
                      rows={10}
                      value={form.extra_info || ''}
                      onChange={e => setForm({ ...form, extra_info: e.target.value })}
                      placeholder="Détails additionnels…"
                    />
                  </section>
                )}
                {['reservations', 'purchases', 'sales'].includes(activeTab) && (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#1e3a5f]/25 bg-white py-14 text-center text-gray-600 shadow-sm">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1e3a5f]/8">
                      <FileText className="h-7 w-7 text-[#1e3a5f]/60" aria-hidden />
                    </div>
                    <p className="max-w-md text-sm leading-relaxed">
                      Les lignes liées au Job <strong className="text-[#1e3a5f]">{form.job_number || '…'}</strong>{' '}
                      apparaîtront ici depuis les modules Réservations, Achats et Ventes une fois enregistrés.
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
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={save}
                  className="rounded-lg bg-[#e67e22] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d35400] focus:outline-none focus:ring-2 focus:ring-[#e67e22]/40"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
