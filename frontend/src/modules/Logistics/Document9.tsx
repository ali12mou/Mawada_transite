import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  createDocument9,
  deleteDocument9,
  fetchDocument9List,
  updateDocument9,
  type Document9Record,
} from '../../api/document9Api';
import {
  buildDocument9PrintHtml,
  openDocument9PrintWindow,
  openDocument9ViewDocumentWindow,
} from '../../lib/document9PrintHtml';
import { fetchDocumentBranding } from '../../lib/documentBranding';
import { brandingFromConfig, type DocumentBranding } from '../../types/documentBranding';
import { Edit2, Trash2, Eye, FileText, Printer, Plus, Search } from 'lucide-react';
import { ActionMenu } from '../Shared/common/ActionMenu';
import Modal from '../Shared/common/Modal';

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
  pageTitle?: string;
  addButtonLabel?: string;
  transferWizardModal?: boolean;
};

const transferFieldClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all';
const transferLabelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500';

export function Document9({
  pageTitle,
  addButtonLabel,
  transferWizardModal,
}: Document9PageProps = {}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const headingTitle = pageTitle ?? t('document9.title');
  const addLabel = addButtonLabel ?? t('document9.addNew');

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
  const [modalStep, setModalStep] = useState(1);
  const [requireAllSteps, setRequireAllSteps] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await fetchDocument9List();
      setDocuments(data);
    } catch (e) {
      console.error(e);
      setLoadError(e instanceof Error ? e.message : 'Error loading documents');
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

    if (transferWizardModal && modalStep === 1) {
      if (requireAllSteps) {
        if (!formData.declarant?.trim() || !formData.actual_recipient?.trim()) {
          setSaveError(t('transfer9.step1RequiredError'));
          return;
        }
      }
      setModalStep(2);
      return;
    }

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
      setSaveError(err instanceof Error ? err.message : 'Error saving document');
    }
  };

  const handleEdit = (document: Document9Record) => {
    setEditingDocument(document);
    setFormData(recordToForm(document));
    setModalStep(1);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;
    try {
      await deleteDocument9(id);
      await fetchDocuments();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Error deleting document');
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <div className="text-lg font-medium text-gray-600">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 font-sans">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#0F3C66]">{headingTitle}</h1>
        <button
          onClick={() => {
            setFormData(emptyForm());
            setEditingDocument(null);
            setSaveError(null);
            setModalStep(1);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20 hover:bg-[#154b8a] transition-all font-bold tracking-wide active:scale-95"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      </div>

      {loadError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">{t('common.show')}</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3C66]/20 outline-none transition text-sm font-medium"
            >
              {[10, 25, 50, 100].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <span className="text-sm font-medium text-gray-600">{t('common.entries')}</span>
          </div>

          <div className="relative w-72">
            <input
              type="text"
              placeholder={`${t('common.searchLabel') || t('common.search')}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3C66]/20 focus:border-[#0F3C66] transition shadow-sm text-sm"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#0F3C66] text-white">
              <tr>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('document9.colSqn')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('document9.colRecipient')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('document9.colContainer')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('document9.colQuantity')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('document9.colExitPoint')}</th>
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('document9.colDestination')}</th>
                <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider w-24 text-center">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                currentDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#0F3C66]/5 transition group">
                    <td className="px-5 py-4 font-bold text-[#0F3C66]">{doc.sqn || '-'}</td>
                    <td className="px-5 py-4 font-bold text-gray-800 uppercase">{doc.actual_recipient || '-'}</td>
                    <td className="px-5 py-4 text-gray-600 uppercase">{doc.container_number || '-'}</td>
                    <td className="px-5 py-4 text-gray-600 font-mono">{doc.quantity || '-'}</td>
                    <td className="px-5 py-4 text-gray-600 uppercase">{doc.exit_point || '-'}</td>
                    <td className="px-5 py-4 text-gray-600 uppercase">{doc.destination || '-'}</td>
                    <td className="px-5 py-4 text-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionMenu
                        actions={[
                          {
                            label: t('common.view'),
                            icon: <Eye size={16} />,
                            onClick: () => setPreviewDoc(doc),
                          },
                          {
                            label: t('common.edit'),
                            icon: <Edit2 size={16} />,
                            onClick: () => handleEdit(doc),
                          },
                          {
                            label: t('common.delete'),
                            icon: <Trash2 size={16} />,
                            variant: 'danger',
                            onClick: () => handleDelete(doc.id),
                          },
                          {
                            label: t('document9.print'),
                            icon: <Printer size={16} />,
                            onClick: () => void openDocument9PrintWindow(doc),
                          },
                        ]}
                      />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-between items-center">
          <div className="text-sm font-medium text-gray-500">
            {t('common.showing')} <span className="font-bold text-gray-900">{startIndex + 1}</span> {t('common.to')} <span className="font-bold text-gray-900">{Math.min(endIndex, filteredDocuments.length)}</span> {t('common.of')} <span className="font-bold text-gray-900">{filteredDocuments.length}</span> {t('common.entries')}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm font-bold text-sm text-[#0F3C66]"
            >
              {t('common.previous') || 'Previous'}
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - currentPage) < 3).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-10 h-10 rounded-xl transition-all font-bold text-sm ${
                    currentPage === p
                      ? 'bg-[#0F3C66] text-white shadow-lg shadow-[#0F3C66]/20 active:scale-95'
                      : 'border border-gray-200 hover:bg-white hover:border-[#0F3C66]/30 text-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm font-bold text-sm text-[#0F3C66]"
            >
              {t('common.next') || 'Next'}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingDocument(null);
          setFormData(emptyForm());
          setSaveError(null);
          setModalStep(1);
        }}
        title={editingDocument ? t('common.edit') + ' ' + headingTitle : t('common.add') + ' ' + headingTitle}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden p-2">
          <div className="flex-1 overflow-y-auto uppercase space-y-4">
            {saveError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {saveError}
              </div>
            )}

            {transferWizardModal ? (
              <div className="space-y-6">
                <div className="mb-6 flex border-b pb-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white font-bold ${modalStep === 1 ? 'bg-[#0F3C66]' : 'bg-gray-200 text-gray-500'}`}>1</div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white font-bold ${modalStep === 2 ? 'bg-[#0F3C66]' : 'bg-gray-200 text-gray-500'}`}>2</div>
                  </div>
                </div>

                {modalStep === 1 ? (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('transfer9.recipientName')}</label>
                      <input type="text" value={formData.declarant} onChange={(e) => setFormData({ ...formData, declarant: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('transfer9.destination')}</label>
                      <input type="text" value={formData.actual_recipient} onChange={(e) => setFormData({ ...formData, actual_recipient: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white" />
                    </div>
                    <div className="md:col-span-2 pt-4 flex justify-end">
                      <button type="button" onClick={() => setModalStep(2)} className="rounded-xl px-6 py-2.5 bg-[#0F3C66] text-white font-bold shadow-lg shadow-[#0F3C66]/20">{t('common.next')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('document9.colContainer')}</label>
                      <input type="text" value={formData.container_number} onChange={(e) => setFormData({ ...formData, container_number: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('transfer9.quantity')}</label>
                      <input type="text" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('transfer9.goodsDescription')}</label>
                      <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition bg-white" />
                    </div>
                    <div className="md:col-span-2 pt-4 flex justify-between">
                      <button type="button" onClick={() => setModalStep(1)} className="rounded-xl px-6 py-2.5 border border-gray-200 font-bold hover:bg-gray-50 transition">{t('common.previous')}</button>
                      <button type="submit" className="rounded-xl px-6 py-2.5 bg-[#0F3C66] text-white font-bold shadow-lg shadow-[#0F3C66]/20 transition">{t('common.save')}</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                  {[
                    { key: 'date', label: t('common.date'), type: 'date' },
                    { key: 'actual_recipient', label: t('transfer9.actualRecipient') },
                    { key: 'actual_recipient_nif', label: t('transfer9.nifRecipient') },
                    { key: 'declarant', label: t('transfer9.declarant') },
                    { key: 'declarant_nif', label: t('transfer9.nifDeclarant') },
                    { key: 'do_number', label: t('transfer9.doNumber') },
                    { key: 'container_number', label: t('document9.colContainer') },
                    { key: 'boat', label: t('transfer9.boat') },
                    { key: 'trip_number', label: t('transfer9.tripNumber') },
                    { key: 'bl_number', label: t('transfer9.blNumber') },
                    { key: 'invoice_count', label: t('transfer9.invoiceCount'), type: 'number' },
                    { key: 'nomenclature', label: t('transfer9.nomenclature') },
                    { key: 'quantity', label: t('transfer9.quantity') },
                    { key: 'weight', label: t('transfer9.weight') },
                    { key: 'value', label: t('transfer9.value'), type: 'number' },
                    { key: 'exit_point', label: t('transfer9.exitPoint') },
                    { key: 'destination', label: t('transfer9.destination') },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{field.label}</label>
                      <input
                        type={field.type || 'text'}
                        value={formData[field.key as keyof typeof formData] as string | number}
                        onChange={(e) => setFormData({ ...formData, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition text-sm bg-white"
                        placeholder={t('transfer9.placeholderEnter')}
                      />
                    </div>
                  ))}
                  <div className="col-span-full">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{t('transfer9.goodsDescription')}</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition text-sm bg-white"
                      placeholder={t('transfer9.placeholderEnter')}
                    />
                  </div>
                </div>

                <details className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm group">
                  <summary className="cursor-pointer text-sm font-bold text-[#0F3C66] hover:text-[#EE964C] transition">{t('document9.optionalDetails')}</summary>
                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4 border-t border-gray-100">
                     {[
                      { key: 'license_code', label: t('transfer9.licenseCode') },
                      { key: 'operator_name', label: t('transfer9.fzOperatorName') },
                      { key: 'entry_doc_ref', label: t('transfer9.declarationEntry') },
                      { key: 'entry_date', label: t('common.date'), type: 'date' },
                      { key: 'sommier_ref', label: t('transfer9.summitNumber') },
                      { key: 'do_date', label: t('common.date'), type: 'date' },
                      { key: 'quantity_entered', label: t('transfer9.entryQuantity') },
                      { key: 'arrival_date', label: t('transfer9.arrivalDate'), type: 'date' },
                      { key: 'country_origin', label: t('transfer9.originCountry') },
                      { key: 'fiscal_reg', label: t('transfer9.fiscalReg') },
                      { key: 'packaging', label: t('transfer9.packaging') },
                      { key: 'qty_packages', label: t('transfer9.qtyPackages') },
                      { key: 'net_weight', label: t('transfer9.netWeight') },
                      { key: 'gross_weight', label: t('transfer9.grossWeight') },
                      { key: 'volume', label: t('transfer9.volume') },
                      { key: 'remaining_qty', label: t('transfer9.remainingQty') },
                    ].map(field => (
                       <div key={field.key}>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">{field.label}</label>
                        <input
                          type={field.type || 'text'}
                          value={formData[field.key as keyof typeof formData] as string}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#0F3C66]/10 focus:border-[#0F3C66] outline-none transition text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </details>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setFormData(emptyForm());
                      setEditingDocument(null);
                    }}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition active:scale-95 font-bold text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0F3C66] text-white rounded-xl shadow-lg shadow-[#0F3C66]/20 hover:bg-[#154b8a] transition active:scale-95 font-bold text-sm"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>
      )}

      {previewDoc && (
      <Modal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={`${t('common.view')} — SQN ${previewDoc?.sqn}`}
        size="xl"
      >
        <div className="flex flex-col h-[70vh]">
          <div className="flex justify-end gap-2 p-3 bg-gray-50/50 border-b border-gray-100">
            <button
              type="button"
              onClick={() => previewDoc && void openDocument9PrintWindow(previewDoc)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F3C66] px-4 py-2 text-sm font-bold text-white hover:bg-[#154b8a] transition shadow-md"
            >
              <Printer className="h-4 w-4" />
              {t('document9.print')}
            </button>
          </div>
          {previewDoc && (
            <iframe
              title="Aperçu document 9"
              className="flex-1 border-0 bg-gray-100 w-full"
              srcDoc={buildDocument9PrintHtml(previewDoc, branding ?? brandingFromConfig({}))}
            />
          )}
        </div>
      </Modal>
      )}
    </div>
  );
}


