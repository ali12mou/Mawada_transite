import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  createDocument9,
  deleteDocument9,
  fetchDocument9List,
  updateDocument9,
  type Document9Record,
} from '../api/document9Api';
import {
  buildDocument9PrintHtml,
  openDocument9PrintWindow,
  openDocument9ViewDocumentWindow,
} from '../lib/document9PrintHtml';
import { fetchDocumentBranding } from '../lib/documentBranding';
import { brandingFromConfig, type DocumentBranding } from '../types/documentBranding';
import { Edit2, Trash2, Eye, FileText, X, Printer, MoreVertical, FileDown } from 'lucide-react';

const TRANSACTION_OPTIONS: { id: string; label: string }[] = [
  { id: 'import', label: 'Import' },
  { id: 'transit', label: 'Transit' },
  { id: 'transbordement', label: 'Transbordement' },
  { id: 'exportation', label: 'Exportation' },
  { id: 'admission_temporaire', label: 'Admission temporaire' },
  { id: 'depot_fz', label: 'Dépôt FZ/ZF' },
  { id: 'entrepot', label: 'Entrepôt' },
  { id: 'transfert', label: 'Transfert' },
];

const TRANSPORT_OPTIONS: { id: string; label: string }[] = [
  { id: 'camion', label: 'Camion' },
  { id: 'train', label: 'Train' },
  { id: 'avion', label: 'Avion' },
  { id: 'navire', label: 'Navire' },
  { id: 'boutre', label: 'Boutre' },
];

type FormState = Omit<Document9Record, 'id' | 'sqn' | 'createdAt' | 'updatedAt'>;

function emptyForm(): FormState {
  return {
    date: new Date().toISOString().split('T')[0],
    actual_recipient: '',
    actual_recipient_nif: '',
    declarant: '',
    declarant_nif: '',
    do_number: '',
    container_number: '',
    boat: '',
    trip_number: '',
    bl_number: '',
    invoice_count: 0,
    nomenclature: '',
    quantity: '',
    weight: '',
    value: 0,
    exit_point: '',
    destination: '',
    description: '',
    license_code: '',
    operator_name: '',
    entry_doc_ref: '',
    entry_date: '',
    sommier_ref: '',
    do_date: '',
    quantity_entered: '',
    arrival_date: '',
    country_origin: '',
    fiscal_reg: '',
    packaging: '',
    qty_packages: '',
    net_weight: '',
    gross_weight: '',
    volume: '',
    remaining_qty: '',
    transaction_types: [],
    transport_modes: [],
    created_by: '',
  };
}

function recordToForm(d: Document9Record): FormState {
  return {
    date: d.date || new Date().toISOString().split('T')[0],
    actual_recipient: d.actual_recipient || '',
    actual_recipient_nif: d.actual_recipient_nif || '',
    declarant: d.declarant || '',
    declarant_nif: d.declarant_nif || '',
    do_number: d.do_number || '',
    container_number: d.container_number || '',
    boat: d.boat || '',
    trip_number: d.trip_number || '',
    bl_number: d.bl_number || '',
    invoice_count: d.invoice_count ?? 0,
    nomenclature: d.nomenclature || '',
    quantity: d.quantity || '',
    weight: d.weight || '',
    value: d.value ?? 0,
    exit_point: d.exit_point || '',
    destination: d.destination || '',
    description: d.description || '',
    license_code: d.license_code || '',
    operator_name: d.operator_name || '',
    entry_doc_ref: d.entry_doc_ref || '',
    entry_date: d.entry_date || '',
    sommier_ref: d.sommier_ref || '',
    do_date: d.do_date || '',
    quantity_entered: d.quantity_entered || '',
    arrival_date: d.arrival_date || '',
    country_origin: d.country_origin || '',
    fiscal_reg: d.fiscal_reg || '',
    packaging: d.packaging || '',
    qty_packages: d.qty_packages || '',
    net_weight: d.net_weight || '',
    gross_weight: d.gross_weight || '',
    volume: d.volume || '',
    remaining_qty: d.remaining_qty || '',
    transaction_types: [...(d.transaction_types || [])],
    transport_modes: [...(d.transport_modes || [])],
    created_by: d.created_by || '',
  };
}

function toggleId(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

export type Document9PageProps = {
  /** Titre affiché en haut de page (ex. menu Transfert) */
  pageTitle?: string;
  /** Libellé du bouton d’ajout */
  addButtonLabel?: string;
  /** Menu « ⋮ » (Transferts) à la place des icônes d’action inline */
  rowActionsAsDropdown?: boolean;
  /** Formulaire modal en 2 étapes (maquette Transferts Document N°9) */
  transferWizardModal?: boolean;
};

const transferFieldClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
const transferLabelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500';

export function Document9({
  pageTitle,
  addButtonLabel,
  rowActionsAsDropdown,
  transferWizardModal,
}: Document9PageProps = {}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const headingTitle = pageTitle ?? 'Document N° 9';
  const addLabel = addButtonLabel ?? 'Document N° 9';
  const [documents, setDocuments] = useState<Document9Record[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document9Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document9Record | null>(null);
  const [branding, setBranding] = useState<DocumentBranding | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingDocument, setEditingDocument] = useState<Document9Record | null>(null);
  const [formData, setFormData] = useState<FormState>(() => emptyForm());
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [modalStep, setModalStep] = useState(1);
  const [requireAllSteps, setRequireAllSteps] = useState(false);

  useEffect(() => {
    if (!openActionMenuId) return;
    const close = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest('[data-document9-actions]')) setOpenActionMenuId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [openActionMenuId]);

  const fetchDocuments = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await fetchDocument9List();
      setDocuments(data);
    } catch (e) {
      console.error(e);
      setLoadError(
        e instanceof Error
          ? e.message
          : 'Impossible de charger les documents. Vérifiez que le backend (npm run backend) est démarré.'
      );
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    fetchDocumentBranding()
      .then(setBranding)
      .catch(() => setBranding(brandingFromConfig({})));
  }, []);

  useEffect(() => {
    let filtered = [...documents];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.actual_recipient?.toLowerCase().includes(q) ||
          doc.container_number?.toLowerCase().includes(q) ||
          doc.destination?.toLowerCase().includes(q) ||
          String(doc.sqn).includes(q)
      );
    }
    setFilteredDocuments(filtered);
  }, [documents, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    try {
      const payload = { ...formData, created_by: user?.id || formData.created_by };
      if (editingDocument) {
        await updateDocument9(editingDocument.id, payload);
      } else {
        await createDocument9(payload);
      }
      setShowModal(false);
      setEditingDocument(null);
      setFormData(emptyForm());
      setModalStep(1);
      await fetchDocuments();
    } catch (err) {
      console.error(err);
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement');
    }
  };

  const handleEdit = (document: Document9Record) => {
    setEditingDocument(document);
    setFormData(recordToForm(document));
    setModalStep(1);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
    try {
      await deleteDocument9(id);
      await fetchDocuments();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Suppression impossible');
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages, filteredDocuments.length]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-gray-800">{headingTitle}</h1>
          <FileText className="h-6 w-6 text-gray-600" />
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingDocument(null);
            setFormData(emptyForm());
            setSaveError(null);
            setModalStep(1);
            setShowModal(true);
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {addLabel}
        </button>
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </div>
      )}

      <div className="rounded-lg bg-white shadow">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Afficher</span>
            <input
              type="number"
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="w-16 rounded border border-gray-300 px-2 py-1"
              min={1}
            />
            <span className="text-sm text-gray-600">lignes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Recherche :</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="SQN, destinataire, conteneur…"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-700 uppercase">
                  SQN
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-700 uppercase">
                  Destinataire réel
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-700 uppercase">
                  N° conteneur
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-700 uppercase">
                  Quantité
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-700 uppercase">
                  Point de sortie
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-700 uppercase">
                  Destination
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-700 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {currentDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{doc.sqn}</td>
                  <td className="px-4 py-3 text-sm">{doc.actual_recipient || '—'}</td>
                  <td className="px-4 py-3 text-sm">{doc.container_number || '—'}</td>
                  <td className="px-4 py-3 text-sm">{doc.quantity || '—'}</td>
                  <td className="px-4 py-3 text-sm">{doc.exit_point || '—'}</td>
                  <td className="px-4 py-3 text-sm">{doc.destination || '—'}</td>
                  <td className="px-4 py-3">
                    {rowActionsAsDropdown ? (
                      <div className="relative flex justify-end" data-document9-actions>
                        <button
                          type="button"
                          title={t('transfer9.actionsMenu')}
                          aria-label={t('transfer9.actionsMenu')}
                          aria-expanded={openActionMenuId === doc.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionMenuId(openActionMenuId === doc.id ? null : doc.id);
                          }}
                          className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {openActionMenuId === doc.id && (
                          <div
                            role="menu"
                            className="absolute right-0 top-full z-50 mt-1 w-[min(220px,calc(100vw-3rem))] rounded-lg border border-sky-200 bg-white py-1 shadow-md"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-blue-600 hover:bg-blue-50"
                              onClick={() => {
                                setPreviewDoc(doc);
                                setOpenActionMenuId(null);
                              }}
                            >
                              <Eye className="h-4 w-4 shrink-0" />
                              <span>{t('transfer9.actionView')}</span>
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm text-blue-600 hover:bg-blue-50"
                              onClick={() => {
                                void openDocument9ViewDocumentWindow(doc);
                                setOpenActionMenuId(null);
                              }}
                            >
                              <Eye className="h-4 w-4 shrink-0 pt-0.5" />
                              <span className="leading-snug">{t('transfer9.actionViewDocument')}</span>
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-blue-600 hover:bg-blue-50"
                              onClick={() => {
                                handleEdit(doc);
                                setOpenActionMenuId(null);
                              }}
                            >
                              <Edit2 className="h-4 w-4 shrink-0" />
                              <span>{t('transfer9.actionEdit')}</span>
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                              onClick={() => {
                                handleDelete(doc.id);
                                setOpenActionMenuId(null);
                              }}
                            >
                              <Trash2 className="h-4 w-4 shrink-0" />
                              <span>{t('transfer9.actionDelete')}</span>
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm text-blue-600 hover:bg-blue-50"
                              onClick={() => {
                                void openDocument9PrintWindow(doc);
                                setOpenActionMenuId(null);
                              }}
                            >
                              <FileDown className="h-4 w-4 shrink-0 pt-0.5 text-[#1e3a5f]" />
                              <span className="leading-snug">{t('transfer9.actionDownloadPdf')}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          title="Aperçu"
                          onClick={() => setPreviewDoc(doc)}
                          className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Imprimer (avis officiel)"
                          onClick={() => void openDocument9PrintWindow(doc)}
                          className="rounded p-1.5 text-[#1e3a5f] hover:bg-slate-100"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Modifier"
                          onClick={() => handleEdit(doc)}
                          className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Supprimer"
                          onClick={() => handleDelete(doc.id)}
                          className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t p-4">
          <div className="text-sm text-gray-600">
            {filteredDocuments.length === 0
              ? 'Aucune entrée'
              : `${startIndex + 1} – ${Math.min(endIndex, filteredDocuments.length)} sur ${filteredDocuments.length}`}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-xl font-semibold text-[#1e3a5f]">
                {transferWizardModal
                  ? t('transfer9.addUpdate')
                  : editingDocument
                    ? `Mettre à jour Document N° 9 (SQN ${editingDocument.sqn})`
                    : 'Ajouter Document N° 9'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingDocument(null);
                  setFormData(emptyForm());
                  setSaveError(null);
                  setModalStep(1);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                if (transferWizardModal && modalStep === 1) {
                  e.preventDefault();
                  return;
                }
                void handleSubmit(e);
              }}
              className="px-6 py-5"
            >
              {saveError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {saveError}
                </div>
              )}

              {transferWizardModal && (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-sky-950">
                      <span aria-hidden>⏳</span>
                      <span>{t('transfer9.processOngoing')}</span>
                    </div>
                    <label className="flex cursor-pointer flex-wrap items-center gap-2 text-sm text-sky-950">
                      <span>{t('transfer9.requireAllSteps')}</span>
                      <input
                        type="checkbox"
                        checked={requireAllSteps}
                        onChange={(e) => setRequireAllSteps(e.target.checked)}
                        className="h-4 w-9 cursor-pointer appearance-none rounded-full bg-gray-300 transition-colors checked:bg-blue-600"
                        role="switch"
                        aria-checked={requireAllSteps}
                      />
                    </label>
                  </div>
                  <div className="mb-6 flex justify-center">
                    <div className="flex items-center gap-0">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                          modalStep === 1 ? 'bg-[#2d3e50] text-white' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        1
                      </div>
                      <div className="mx-2 h-0.5 w-24 bg-gray-300" />
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                          modalStep === 2 ? 'bg-[#2d3e50] text-white' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        2
                      </div>
                    </div>
                  </div>
                </>
              )}

              {transferWizardModal && modalStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.recipientName')}</label>
                      <input
                        type="text"
                        value={formData.declarant}
                        onChange={(e) => setFormData({ ...formData, declarant: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.codeNo')}</label>
                      <input
                        type="text"
                        value={formData.declarant_nif}
                        onChange={(e) => setFormData({ ...formData, declarant_nif: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.licenseCode')}</label>
                      <input
                        type="text"
                        value={formData.license_code}
                        onChange={(e) => setFormData({ ...formData, license_code: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.fzOperatorName')}</label>
                      <input
                        type="text"
                        value={formData.operator_name}
                        onChange={(e) => setFormData({ ...formData, operator_name: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.declarationEntry')}</label>
                      <input
                        type="text"
                        value={formData.entry_doc_ref}
                        onChange={(e) => setFormData({ ...formData, entry_doc_ref: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.summitNumber')}</label>
                      <input
                        type="text"
                        value={formData.sommier_ref}
                        onChange={(e) => setFormData({ ...formData, sommier_ref: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.doNumber')}</label>
                      <input
                        type="text"
                        value={formData.do_number}
                        onChange={(e) => setFormData({ ...formData, do_number: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.entryQuantity')}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.quantity_entered}
                        onChange={(e) => setFormData({ ...formData, quantity_entered: e.target.value })}
                        placeholder="0"
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.vesselName')}</label>
                      <input
                        type="text"
                        value={formData.boat}
                        onChange={(e) => setFormData({ ...formData, boat: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.arrivalDate')}</label>
                      <input
                        type="date"
                        value={formData.arrival_date}
                        onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.nifCode')}</label>
                      <input
                        type="text"
                        value={formData.actual_recipient_nif}
                        onChange={(e) => setFormData({ ...formData, actual_recipient_nif: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.destinationName')}</label>
                      <input
                        type="text"
                        value={formData.actual_recipient}
                        onChange={(e) => setFormData({ ...formData, actual_recipient: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSaveError(null);
                        if (requireAllSteps) {
                          if (!formData.declarant?.trim() || !formData.actual_recipient?.trim()) {
                            setSaveError(t('transfer9.step1RequiredError'));
                            return;
                          }
                        }
                        setModalStep(2);
                      }}
                      className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      {t('transfer9.next')}
                    </button>
                  </div>
                </div>
              )}

              {transferWizardModal && modalStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.shippingNumber')}</label>
                      <input
                        type="text"
                        value={formData.bl_number}
                        onChange={(e) => setFormData({ ...formData, bl_number: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.originCountry')}</label>
                      <input
                        type="text"
                        value={formData.country_origin}
                        onChange={(e) => setFormData({ ...formData, country_origin: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.voyageNumber')}</label>
                      <input
                        type="text"
                        value={formData.trip_number}
                        onChange={(e) => setFormData({ ...formData, trip_number: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.fiscalReg')}</label>
                      <input
                        type="text"
                        value={formData.fiscal_reg}
                        onChange={(e) => setFormData({ ...formData, fiscal_reg: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.hsCode')}</label>
                      <input
                        type="text"
                        value={formData.nomenclature}
                        onChange={(e) => setFormData({ ...formData, nomenclature: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.exitQuantity')}</label>
                      <input
                        type="text"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={transferLabelClass}>{t('transfer9.goodsDescription')}</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={t('transfer9.placeholderEnter')}
                      className={`${transferFieldClass} min-h-[100px] resize-y`}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.grossWeight')}</label>
                      <input
                        type="text"
                        value={formData.gross_weight}
                        onChange={(e) => setFormData({ ...formData, gross_weight: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.declaredValue')}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.exitPoint')}</label>
                      <input
                        type="text"
                        value={formData.exit_point}
                        onChange={(e) => setFormData({ ...formData, exit_point: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.destination')}</label>
                      <input
                        type="text"
                        value={formData.destination}
                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                        placeholder={t('transfer9.placeholderEnter')}
                        className={transferFieldClass}
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSaveError(null);
                        setModalStep(1);
                      }}
                      className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      {t('commercial.previous')}
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      {t('transfer9.finish')}
                    </button>
                  </div>
                </div>
              )}

              {!transferWizardModal && (
                <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Destinataire réel</label>
                  <input
                    type="text"
                    value={formData.actual_recipient}
                    onChange={(e) => setFormData({ ...formData, actual_recipient: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Code NIF (destinataire)</label>
                  <input
                    type="text"
                    value={formData.actual_recipient_nif}
                    onChange={(e) => setFormData({ ...formData, actual_recipient_nif: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Déclarant</label>
                  <input
                    type="text"
                    value={formData.declarant}
                    onChange={(e) => setFormData({ ...formData, declarant: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Code NIF (déclarant)</label>
                  <input
                    type="text"
                    value={formData.declarant_nif}
                    onChange={(e) => setFormData({ ...formData, declarant_nif: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">N° D/O</label>
                  <input
                    type="text"
                    value={formData.do_number}
                    onChange={(e) => setFormData({ ...formData, do_number: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">N° de conteneur</label>
                  <input
                    type="text"
                    value={formData.container_number}
                    onChange={(e) => setFormData({ ...formData, container_number: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Bateau</label>
                  <input
                    type="text"
                    value={formData.boat}
                    onChange={(e) => setFormData({ ...formData, boat: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">N° de voyage</label>
                  <input
                    type="text"
                    value={formData.trip_number}
                    onChange={(e) => setFormData({ ...formData, trip_number: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">N° BL</label>
                  <input
                    type="text"
                    value={formData.bl_number}
                    onChange={(e) => setFormData({ ...formData, bl_number: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nombre de factures</label>
                  <input
                    type="number"
                    value={formData.invoice_count}
                    onChange={(e) => setFormData({ ...formData, invoice_count: Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nomenclatures (Code SH)</label>
                  <input
                    type="text"
                    value={formData.nomenclature}
                    onChange={(e) => setFormData({ ...formData, nomenclature: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Quantité</label>
                  <input
                    type="text"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Poids</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Valeur (FDJ)</label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Point de sortie</label>
                  <input
                    type="text"
                    value={formData.exit_point}
                    onChange={(e) => setFormData({ ...formData, exit_point: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Destination</label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-full">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <details className="mt-6 rounded-lg border border-gray-200 bg-slate-50/80 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-[#1e3a5f]">
                  Détails pour l’avis PDF (optionnel)
                </summary>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Code licence</label>
                    <input
                      type="text"
                      value={formData.license_code}
                      onChange={(e) => setFormData({ ...formData, license_code: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Nom opérateur FZ / entrepôt</label>
                    <input
                      type="text"
                      value={formData.operator_name}
                      onChange={(e) => setFormData({ ...formData, operator_name: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Doc. entrée ZF/FZ</label>
                    <input
                      type="text"
                      value={formData.entry_doc_ref}
                      onChange={(e) => setFormData({ ...formData, entry_doc_ref: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Date entrée</label>
                    <input
                      type="date"
                      value={formData.entry_date}
                      onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">N° sommier / répertoire</label>
                    <input
                      type="text"
                      value={formData.sommier_ref}
                      onChange={(e) => setFormData({ ...formData, sommier_ref: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Date D/O</label>
                    <input
                      type="date"
                      value={formData.do_date}
                      onChange={(e) => setFormData({ ...formData, do_date: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Quantité entrée</label>
                    <input
                      type="text"
                      value={formData.quantity_entered}
                      onChange={(e) => setFormData({ ...formData, quantity_entered: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Date d’arrivée</label>
                    <input
                      type="date"
                      value={formData.arrival_date}
                      onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Pays d’origine</label>
                    <input
                      type="text"
                      value={formData.country_origin}
                      onChange={(e) => setFormData({ ...formData, country_origin: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Régime fiscal</label>
                    <input
                      type="text"
                      value={formData.fiscal_reg}
                      onChange={(e) => setFormData({ ...formData, fiscal_reg: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Conditionnement</label>
                    <input
                      type="text"
                      value={formData.packaging}
                      onChange={(e) => setFormData({ ...formData, packaging: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Qté colis</label>
                    <input
                      type="text"
                      value={formData.qty_packages}
                      onChange={(e) => setFormData({ ...formData, qty_packages: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Poids net</label>
                    <input
                      type="text"
                      value={formData.net_weight}
                      onChange={(e) => setFormData({ ...formData, net_weight: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Poids brut</label>
                    <input
                      type="text"
                      value={formData.gross_weight}
                      onChange={(e) => setFormData({ ...formData, gross_weight: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Volume</label>
                    <input
                      type="text"
                      value={formData.volume}
                      onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Qté restante</label>
                    <input
                      type="text"
                      value={formData.remaining_qty}
                      onChange={(e) => setFormData({ ...formData, remaining_qty: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <fieldset className="rounded border border-gray-200 bg-white p-3">
                    <legend className="px-1 text-xs font-semibold text-gray-700">Type de transaction</legend>
                    <div className="flex flex-wrap gap-2">
                      {TRANSACTION_OPTIONS.map((o) => (
                        <label key={o.id} className="flex max-w-full items-center gap-1.5 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.transaction_types.includes(o.id)}
                            onChange={() =>
                              setFormData({
                                ...formData,
                                transaction_types: toggleId(formData.transaction_types, o.id),
                              })
                            }
                          />
                          {o.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="rounded border border-gray-200 bg-white p-3">
                    <legend className="px-1 text-xs font-semibold text-gray-700">Mode de transport</legend>
                    <div className="flex flex-wrap gap-2">
                      {TRANSPORT_OPTIONS.map((o) => (
                        <label key={o.id} className="flex items-center gap-1.5 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.transport_modes.includes(o.id)}
                            onChange={() =>
                              setFormData({
                                ...formData,
                                transport_modes: toggleId(formData.transport_modes, o.id),
                              })
                            }
                          />
                          {o.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </details>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingDocument(null);
                    setFormData(emptyForm());
                    setSaveError(null);
                    setModalStep(1);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold text-[#1e3a5f]">Aperçu — Avis de livraison (SQN {previewDoc.sqn})</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void openDocument9PrintWindow(previewDoc)}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-sm text-white hover:bg-[#163252]"
                >
                  <Printer className="h-4 w-4" />
                  Imprimer
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <iframe
              title="Aperçu document 9"
              className="min-h-[70vh] flex-1 border-0 bg-gray-100"
              srcDoc={buildDocument9PrintHtml(previewDoc, branding ?? brandingFromConfig({}))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
