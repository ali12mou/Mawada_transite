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
} from '../../lib/document9PrintHtml';
import { Transfer9DetailsView } from './Transfer9DetailsView';
import { fetchDocumentBranding } from '../../lib/documentBranding';
import { brandingFromConfig, type DocumentBranding } from '../../types/documentBranding';
import { fetchCompanies, type CompanyRecord } from '../../api/companiesApi';
import { fetchClients, type ClientRecord } from '../../api/clientsApi';
import { genericApi } from '../../api/genericApi';
import { Edit2, Trash2, Eye, FileText, Printer, Plus, Search, HelpCircle } from 'lucide-react';
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

function valStr(v: unknown): string {
  if (v == null || v === '') return '';
  return String(v);
}

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
    invoice_count: '',
    nomenclature: '',
    quantity: '',
    weight: '',
    value: '',
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
    seller_company: '',
    buyer_company: '',
    client_name: '',
    source_destination_label: '',
    closing_date: '',
    bill_of_loading: '',
    declaration_s: '',
    declaration_e: '',
    dossier_fee: '',
    truck_load_quantity: '',
    transit_fee: '',
    service_fee: '',
    pass_cancel_fee: '',
    transfer_total: '',
    doc_sydonia: '',
    doc_delivery_order: '',
    doc_commercial: '',
    doc_packing_list: '',
    doc_transfer_declaration_s: '',
    doc_full_scan: '',
    doc_number_9_file: '',
    price_number_9: '',
    doc_number_4_file: '',
    price_number_4: '',
    doc_ti_cancel_file: '',
    price_ti_cancel: '',
    doc_declaration_se_cancel_file: '',
    price_declaration_se_cancel: '',
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
    invoice_count: valStr(d.invoice_count),
    nomenclature: d.nomenclature || '',
    quantity: d.quantity || '',
    weight: d.weight || '',
    value: valStr(d.value),
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
    seller_company: d.seller_company || '',
    buyer_company: d.buyer_company || '',
    client_name: d.client_name || '',
    source_destination_label: d.source_destination_label || '',
    closing_date: d.closing_date || '',
    bill_of_loading: d.bill_of_loading || '',
    declaration_s: valStr(d.declaration_s),
    declaration_e: valStr(d.declaration_e),
    dossier_fee: valStr(d.dossier_fee),
    truck_load_quantity: valStr(d.truck_load_quantity),
    transit_fee: valStr(d.transit_fee),
    service_fee: valStr(d.service_fee),
    pass_cancel_fee: valStr(d.pass_cancel_fee),
    transfer_total: valStr(d.transfer_total),
    doc_sydonia: d.doc_sydonia || '',
    doc_delivery_order: d.doc_delivery_order || '',
    doc_commercial: d.doc_commercial || '',
    doc_packing_list: d.doc_packing_list || '',
    doc_transfer_declaration_s: d.doc_transfer_declaration_s || '',
    doc_full_scan: d.doc_full_scan || '',
    doc_number_9_file: d.doc_number_9_file || '',
    price_number_9: valStr(d.price_number_9),
    doc_number_4_file: d.doc_number_4_file || '',
    price_number_4: valStr(d.price_number_4),
    doc_ti_cancel_file: d.doc_ti_cancel_file || '',
    price_ti_cancel: valStr(d.price_ti_cancel),
    doc_declaration_se_cancel_file: d.doc_declaration_se_cancel_file || '',
    price_declaration_se_cancel: valStr(d.price_declaration_se_cancel),
  };
}

function TransferFileField({
  label,
  fileName,
  onPick,
  chooseLabel,
  noFileLabel,
}: {
  label: string;
  fileName: string;
  onPick: (name: string) => void;
  chooseLabel: string;
  noFileLabel: string;
}) {
  return (
    <div>
      <label className={transferLabelClass}>{label}</label>
      <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-[#4a5568] p-1">
        <label className="cursor-pointer rounded bg-white px-3 py-1.5 text-xs font-medium text-gray-700">
          {chooseLabel}
          <input
            type="file"
            className="sr-only"
            onChange={(e) => onPick(e.target.files?.[0]?.name || '')}
          />
        </label>
        <span className="truncate text-xs text-white">{fileName || noFileLabel}</span>
      </div>
    </div>
  );
}

function toggleId(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

export type Document9PageProps = {
  pageTitle?: string;
  addButtonLabel?: string;
  transferWizardModal?: boolean;
  rowActionsAsDropdown?: boolean;
};

function formatDeclaredValue(value: string | number | undefined | null): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '—';
  const n = Number(raw.replace(/\s/g, '').replace(',', '.'));
  if (Number.isFinite(n) && raw !== '') {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (/^-?\d+([.,]\d+)?$/.test(raw.replace(/\s/g, ''))) {
      return n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
    }
  }
  return raw;
}

function validateTransferStep1(form: FormState, requireAll: boolean): boolean {
  if (!requireAll) return true;
  const required: (keyof FormState)[] = [
    'declarant',
    'license_code',
    'entry_doc_ref',
    'do_number',
    'boat',
    'declarant_nif',
    'actual_recipient_nif',
    'operator_name',
    'sommier_ref',
    'quantity_entered',
    'arrival_date',
    'actual_recipient',
  ];
  return required.every((key) => String(form[key] ?? '').trim() !== '');
}

const transferFieldClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all';
const transferLabelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500';

export function Document9({
  pageTitle,
  addButtonLabel,
  transferWizardModal,
  rowActionsAsDropdown,
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
  const [companiesList, setCompaniesList] = useState<CompanyRecord[]>([]);
  const [clientsList, setClientsList] = useState<ClientRecord[]>([]);
  const [goodsCategories, setGoodsCategories] = useState<{ id?: string; _id?: string; name: string }[]>([]);
  const [locationsList, setLocationsList] = useState<{ id?: string; _id?: string; name: string }[]>([]);

  const transferMaxStep = editingDocument && transferWizardModal ? 4 : 2;

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
    if (!transferWizardModal) return;
    (async () => {
      try {
        const [companies, clients, categories, locations] = await Promise.all([
          fetchCompanies(),
          fetchClients(),
          genericApi.list('product_categories'),
          genericApi.list('locations'),
        ]);
        setCompaniesList(companies);
        setClientsList(clients);
        setGoodsCategories(categories || []);
        setLocationsList(locations || []);
      } catch (e) {
        console.error('Error loading transfer form lists:', e);
      }
    })();
  }, [transferWizardModal]);

  useEffect(() => {
    let filtered = [...documents];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((doc) => {
        const haystack = [
          doc.actual_recipient,
          doc.declarant,
          doc.container_number,
          doc.destination,
          doc.entry_doc_ref,
          doc.description,
          String(doc.sqn),
          String(doc.value),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    setFilteredDocuments(filtered);
  }, [documents, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (transferWizardModal && modalStep < transferMaxStep) {
      if (modalStep === 1 && !validateTransferStep1(formData, requireAllSteps)) {
        setSaveError(t('transfer9.step1RequiredError'));
        return;
      }
      setModalStep(modalStep + 1);
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
                {transferWizardModal ? (
                  <>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">#</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('transfer9.tableRecipient')}</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('transfer9.destination')}</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('transfer9.declarationEntry')}</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('transfer9.goodsDescription')}</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('transfer9.tableDeclarant')}</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('transfer9.declaredValue')}</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider w-20">{t('common.action')}</th>
                  </>
                ) : (
                  <>
                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('document9.colSqn')}</th>
                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('document9.colRecipient')}</th>
                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('document9.colContainer')}</th>
                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('document9.colQuantity')}</th>
                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('document9.colExitPoint')}</th>
                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider border-r border-[#154b8a]/50">{t('document9.colDestination')}</th>
                    <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider w-24 text-center">{t('common.action')}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentDocuments.length === 0 ? (
                <tr>
                  <td colSpan={transferWizardModal ? 8 : 7} className="py-12 text-center text-gray-400">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                currentDocuments.map((doc, rowIndex) => (
                  <tr key={doc.id} className="hover:bg-[#0F3C66]/5 transition group border-b border-gray-100">
                    {transferWizardModal ? (
                      <>
                        <td className="px-4 py-3 text-gray-600">{startIndex + rowIndex + 1}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800 uppercase">{doc.actual_recipient || '—'}</td>
                        <td className="px-4 py-3 text-gray-700 uppercase">{doc.destination || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{doc.entry_doc_ref || '—'}</td>
                        <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={doc.description}>{doc.description || '—'}</td>
                        <td className="px-4 py-3 text-gray-700 uppercase">{doc.declarant || '—'}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{formatDeclaredValue(doc.value)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className={rowActionsAsDropdown ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                            <ActionMenu
                              actions={[
                                {
                                  label: t('transfer9.actionView'),
                                  icon: <Eye size={16} />,
                                  onClick: () => setPreviewDoc(doc),
                                },
                                {
                                  label: t('transfer9.actionPrint'),
                                  icon: <Printer size={16} />,
                                  onClick: () => void openDocument9PrintWindow(doc),
                                },
                                {
                                  label: t('transfer9.actionEdit'),
                                  icon: <Edit2 size={16} />,
                                  onClick: () => handleEdit(doc),
                                },
                                {
                                  label: t('transfer9.actionDelete'),
                                  icon: <Trash2 size={16} />,
                                  variant: 'danger',
                                  onClick: () => handleDelete(doc.id),
                                },
                              ]}
                            />
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-4 font-bold text-[#0F3C66]">{doc.sqn || '-'}</td>
                        <td className="px-5 py-4 font-bold text-gray-800 uppercase">{doc.actual_recipient || '-'}</td>
                        <td className="px-5 py-4 text-gray-600 uppercase">{doc.container_number || '-'}</td>
                        <td className="px-5 py-4 text-gray-600 font-mono">{doc.quantity || '-'}</td>
                        <td className="px-5 py-4 text-gray-600 uppercase">{doc.exit_point || '-'}</td>
                        <td className="px-5 py-4 text-gray-600 uppercase">{doc.destination || '-'}</td>
                        <td className="px-5 py-4 text-center">
                          <div className={rowActionsAsDropdown ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
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
                      </>
                    )}
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
        title={
          transferWizardModal
            ? editingDocument
              ? `${t('common.edit')} — ${t('transfer9.addUpdate')}`
              : t('transfer9.addUpdate')
            : editingDocument
              ? `${t('common.edit')} ${headingTitle}`
              : `${t('common.add')} ${headingTitle}`
        }
        size={transferWizardModal ? 'xxl' : 'xl'}
      >
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden p-2">
          <div className="flex-1 overflow-y-auto uppercase space-y-4">
            {saveError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {saveError}
              </div>
            )}

            {transferWizardModal ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                  <span>⌛ {t('transfer9.processOngoing')} ⌛</span>
                  <label className="flex items-center gap-2 font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={requireAllSteps}
                      onChange={(e) => setRequireAllSteps(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#0F3C66] focus:ring-[#0F3C66]"
                    />
                    {t('transfer9.requireAllSteps')}
                    <HelpCircle size={14} className="text-[#0F3C66]" aria-hidden />
                  </label>
                </div>

                <div className="flex items-center justify-center gap-2 py-2">
                  {Array.from({ length: transferMaxStep }, (_, i) => i + 1).map((n, idx) => (
                    <div key={n} className="flex items-center gap-2">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-bold ${
                          modalStep === n ? 'bg-[#0F3C66] text-white' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {n}
                      </div>
                      {idx < transferMaxStep - 1 ? <div className="h-0.5 w-10 bg-gray-300" /> : null}
                    </div>
                  ))}
                </div>

                {modalStep === 1 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {(
                      [
                        ['declarant', 'transfer9.recipientName'],
                        ['license_code', 'transfer9.licenseCode'],
                        ['entry_doc_ref', 'transfer9.declarationEntry'],
                        ['do_number', 'transfer9.doNumber'],
                        ['boat', 'transfer9.vesselName'],
                        ['declarant_nif', 'transfer9.nifCode'],
                        ['actual_recipient_nif', 'transfer9.codeNo'],
                        ['operator_name', 'transfer9.fzOperatorName'],
                        ['sommier_ref', 'transfer9.summitNumber'],
                        ['quantity_entered', 'transfer9.entryQuantity'],
                        ['arrival_date', 'transfer9.arrivalDate', 'date'],
                        ['actual_recipient', 'transfer9.tableRecipient'],
                      ] as const
                    ).map(([key, labelKey, type]) => (
                      <div key={key}>
                        <label className={transferLabelClass}>{t(labelKey)}</label>
                        <input
                          type={type === 'date' ? 'date' : 'text'}
                          value={formData[key] as string}
                          onChange={(e) =>
                            setFormData({ ...formData, [key]: e.target.value })
                          }
                          className={transferFieldClass}
                          placeholder={t('transfer9.placeholderEnter')}
                        />
                      </div>
                    ))}
                    <div className="md:col-span-2 flex justify-start pt-2">
                      <button
                        type="submit"
                        className="rounded-md bg-[#0F3C66] px-6 py-2 text-sm font-semibold text-white hover:bg-[#154b8a]"
                      >
                        {t('transfer9.next')}
                      </button>
                    </div>
                  </div>
                ) : modalStep === 2 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {(
                        [
                          ['bl_number', 'transfer9.shippingNumber'],
                          ['country_origin', 'transfer9.originCountry'],
                          ['trip_number', 'transfer9.voyageNumber'],
                          ['fiscal_reg', 'transfer9.fiscalReg'],
                          ['nomenclature', 'transfer9.hsCode'],
                          ['quantity', 'transfer9.exitQuantity'],
                        ] as const
                      ).map(([key, labelKey]) => (
                        <div key={key}>
                          <label className={transferLabelClass}>{t(labelKey)}</label>
                          <input
                            type="text"
                            value={formData[key] as string}
                            onChange={(e) =>
                              setFormData({ ...formData, [key]: e.target.value })
                            }
                            className={transferFieldClass}
                            placeholder={t('transfer9.placeholderEnter')}
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className={transferLabelClass}>{t('transfer9.goodsDescription')}</label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={transferFieldClass}
                        placeholder={t('transfer9.placeholderEnter')}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {(
                        [
                          ['gross_weight', 'transfer9.grossWeight'],
                          ['value', 'transfer9.declaredValue'],
                          ['exit_point', 'transfer9.exitPoint'],
                          ['destination', 'transfer9.destination'],
                        ] as const
                      ).map(([key, labelKey]) => (
                        <div key={key}>
                          <label className={transferLabelClass}>{t(labelKey)}</label>
                          <input
                            type="text"
                            value={formData[key] as string}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [key]: e.target.value,
                              })
                            }
                            className={transferFieldClass}
                            placeholder={t('transfer9.placeholderEnter')}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setModalStep(1)}
                        className="rounded-md bg-[#0F3C66] px-6 py-2 text-sm font-semibold text-white hover:bg-[#154b8a]"
                      >
                        {t('common.previous')}
                      </button>
                      <button
                        type="submit"
                        className="rounded-md bg-[#0F3C66] px-6 py-2 text-sm font-semibold text-white hover:bg-[#154b8a]"
                      >
                        {transferMaxStep > 2 ? t('transfer9.next') : t('transfer9.finish')}
                      </button>
                    </div>
                  </div>
                ) : modalStep === 3 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className={transferLabelClass}>{t('transfer9.sellerCompany')}</label>
                        <select
                          value={formData.seller_company}
                          onChange={(e) => setFormData({ ...formData, seller_company: e.target.value })}
                          className={transferFieldClass}
                        >
                          <option value="">{t('transfer9.selectSellerCompany')}</option>
                          {companiesList.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={transferLabelClass}>{t('transfer9.buyerCompany')}</label>
                        <input
                          type="text"
                          value={formData.buyer_company}
                          onChange={(e) => setFormData({ ...formData, buyer_company: e.target.value })}
                          className={transferFieldClass}
                        />
                      </div>
                      <div>
                        <label className={transferLabelClass}>{t('transfer9.goodsDescription')}</label>
                        <select
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className={transferFieldClass}
                        >
                          <option value="">{t('transfer9.selectGoodsDescription')}</option>
                          {goodsCategories.map((c) => (
                            <option key={c.id || c._id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={transferLabelClass}>{t('transfer9.clientName')}</label>
                        <select
                          value={formData.client_name}
                          onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                          className={transferFieldClass}
                        >
                          <option value="">{t('transfer9.selectCustomer')}</option>
                          {clientsList.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={transferLabelClass}>{t('transfer9.sourceDestination')}</label>
                        <select
                          value={formData.source_destination_label}
                          onChange={(e) =>
                            setFormData({ ...formData, source_destination_label: e.target.value })
                          }
                          className={transferFieldClass}
                        >
                          <option value="">{t('transfer9.selectSourceDestination')}</option>
                          {locationsList.map((l) => (
                            <option key={l.id || l._id} value={l.name}>
                              {l.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={transferLabelClass}>{t('transfer9.closingDate')}</label>
                        <input
                          type="date"
                          value={formData.closing_date}
                          onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
                          className={transferFieldClass}
                        />
                      </div>
                      <div>
                        <label className={transferLabelClass}>{t('transfer9.billOfLoading')}</label>
                        <input
                          type="text"
                          value={formData.bill_of_loading}
                          onChange={(e) => setFormData({ ...formData, bill_of_loading: e.target.value })}
                          className={transferFieldClass}
                        />
                      </div>
                      <div>
                        <label className={transferLabelClass}>{t('transfer9.quantity')}</label>
                        <input
                          type="text"
                          value={formData.quantity}
                          onChange={(e) =>
                            setFormData({ ...formData, quantity: e.target.value })
                          }
                          className={transferFieldClass}
                        />
                      </div>
                      {(
                        [
                          ['declaration_s', 'transfer9.declarationS'],
                          ['declaration_e', 'transfer9.declarationE'],
                          ['dossier_fee', 'transfer9.dossierFee'],
                          ['truck_load_quantity', 'transfer9.truckLoadQty'],
                          ['transit_fee', 'transfer9.transitFee'],
                          ['service_fee', 'transfer9.serviceFee'],
                          ['pass_cancel_fee', 'transfer9.passCancelFee'],
                          ['transfer_total', 'transfer9.transferTotal'],
                        ] as const
                      ).map(([key, labelKey]) => (
                        <div key={key}>
                          <label className={transferLabelClass}>{t(labelKey)}</label>
                          <input
                            type="text"
                            value={formData[key] as string}
                            onChange={(e) =>
                              setFormData({ ...formData, [key]: e.target.value })
                            }
                            className={transferFieldClass}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setModalStep(2)}
                        className="rounded-md bg-[#0F3C66] px-6 py-2 text-sm font-semibold text-white hover:bg-[#154b8a]"
                      >
                        {t('common.previous')}
                      </button>
                      <button
                        type="submit"
                        className="rounded-md bg-[#0F3C66] px-6 py-2 text-sm font-semibold text-white hover:bg-[#154b8a]"
                      >
                        {t('transfer9.next')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-md bg-[#1E2F4A] px-4 py-3 text-sm font-medium text-yellow-300">
                      ⚠️ {t('transfer9.documentsRequiredNote')}
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <TransferFileField
                        label={t('transfer9.docSydonia')}
                        fileName={formData.doc_sydonia}
                        onPick={(name) => setFormData({ ...formData, doc_sydonia: name })}
                        chooseLabel={t('transfer9.chooseFile')}
                        noFileLabel={t('transfer9.noFileChosen')}
                      />
                      <TransferFileField
                        label={t('transfer9.docDeliveryOrder')}
                        fileName={formData.doc_delivery_order}
                        onPick={(name) => setFormData({ ...formData, doc_delivery_order: name })}
                        chooseLabel={t('transfer9.chooseFile')}
                        noFileLabel={t('transfer9.noFileChosen')}
                      />
                      <TransferFileField
                        label={t('transfer9.docCommercial')}
                        fileName={formData.doc_commercial}
                        onPick={(name) => setFormData({ ...formData, doc_commercial: name })}
                        chooseLabel={t('transfer9.chooseFile')}
                        noFileLabel={t('transfer9.noFileChosen')}
                      />
                      <div className="md:col-span-2">
                        <TransferFileField
                          label={t('transfer9.docPackingList')}
                          fileName={formData.doc_packing_list}
                          onPick={(name) => setFormData({ ...formData, doc_packing_list: name })}
                          chooseLabel={t('transfer9.chooseFile')}
                          noFileLabel={t('transfer9.noFileChosen')}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <TransferFileField
                          label={t('transfer9.docTransferDeclarationS')}
                          fileName={formData.doc_transfer_declaration_s}
                          onPick={(name) =>
                            setFormData({ ...formData, doc_transfer_declaration_s: name })
                          }
                          chooseLabel={t('transfer9.chooseFile')}
                          noFileLabel={t('transfer9.noFileChosen')}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {(
                        [
                          ['doc_number_9_file', 'transfer9.docNumber9', 'price_number_9', 'transfer9.priceNumber9'],
                          ['doc_number_4_file', 'transfer9.docNumber4', 'price_number_4', 'transfer9.priceNumber4'],
                          [
                            'doc_ti_cancel_file',
                            'transfer9.docTiCancel',
                            'price_ti_cancel',
                            'transfer9.priceTiCancel',
                          ],
                          [
                            'doc_declaration_se_cancel_file',
                            'transfer9.docDeclarationSeCancel',
                            'price_declaration_se_cancel',
                            'transfer9.priceDeclarationSeCancel',
                          ],
                        ] as const
                      ).map(([fileKey, fileLabel, priceKey, priceLabel]) => (
                        <div
                          key={fileKey}
                          className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
                        >
                          <TransferFileField
                            label={t(fileLabel)}
                            fileName={formData[fileKey] as string}
                            onPick={(name) => setFormData({ ...formData, [fileKey]: name })}
                            chooseLabel={t('transfer9.chooseFile')}
                            noFileLabel={t('transfer9.noFileChosen')}
                          />
                          <div>
                            <label className={transferLabelClass}>{t(priceLabel)}</label>
                            <input
                              type="text"
                              value={formData[priceKey] as string}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  [priceKey]: e.target.value,
                                })
                              }
                              className={transferFieldClass}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <TransferFileField
                        label={t('transfer9.docFullScan')}
                        fileName={formData.doc_full_scan}
                        onPick={(name) => setFormData({ ...formData, doc_full_scan: name })}
                        chooseLabel={t('transfer9.chooseFile')}
                        noFileLabel={t('transfer9.noFileChosen')}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setModalStep(3)}
                        className="rounded-md bg-[#0F3C66] px-6 py-2 text-sm font-semibold text-white hover:bg-[#154b8a]"
                      >
                        {t('common.previous')}
                      </button>
                      <button
                        type="submit"
                        className="rounded-md bg-[#0F3C66] px-6 py-2 text-sm font-semibold text-white hover:bg-[#154b8a]"
                      >
                        {t('transfer9.finish')}
                      </button>
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
                    { key: 'invoice_count', label: t('transfer9.invoiceCount') },
                    { key: 'nomenclature', label: t('transfer9.nomenclature') },
                    { key: 'quantity', label: t('transfer9.quantity') },
                    { key: 'weight', label: t('transfer9.weight') },
                    { key: 'value', label: t('transfer9.value') },
                    { key: 'exit_point', label: t('transfer9.exitPoint') },
                    { key: 'destination', label: t('transfer9.destination') },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">{field.label}</label>
                      <input
                        type={field.type || 'text'}
                        value={formData[field.key as keyof typeof formData] as string}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
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
        title={
          transferWizardModal
            ? t('transfer9.transferDetails')
            : `${t('common.view')} — SQN ${previewDoc?.sqn}`
        }
        size="xl"
      >
        {transferWizardModal ? (
          <div className="space-y-4">
            <Transfer9DetailsView doc={previewDoc} t={t} />
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => void openDocument9PrintWindow(previewDoc)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F3C66] px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-[#154b8a]"
              >
                <Printer className="h-4 w-4" />
                {t('transfer9.actionPrint')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-[70vh] flex-col">
            <div className="flex justify-end gap-2 border-b border-gray-100 bg-gray-50/50 p-3">
              <button
                type="button"
                onClick={() => previewDoc && void openDocument9PrintWindow(previewDoc)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F3C66] px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-[#154b8a]"
              >
                <Printer className="h-4 w-4" />
                {t('document9.print')}
              </button>
            </div>
            <iframe
              title="Aperçu document 9"
              className="w-full flex-1 border-0 bg-gray-100"
              srcDoc={buildDocument9PrintHtml(previewDoc, branding ?? brandingFromConfig({}))}
            />
          </div>
        )}
      </Modal>
      )}
    </div>
  );
}


