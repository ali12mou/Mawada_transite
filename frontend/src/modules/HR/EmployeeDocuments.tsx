import { useEffect, useMemo, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { useCrudToast } from '../../hooks/useCrudToast';
import { toastError } from '../../lib/appToast';
import { genericApi } from '../../api/genericApi';
import { fetchEmployees } from '../../api/hrApi';
import { useLanguage } from '../../contexts/LanguageContext';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const DOC_TYPES = [
  'cv',
  'certificates',
  'identity',
  'work_permit',
  'driving',
  'passport',
] as const;

type DocType = (typeof DOC_TYPES)[number];

interface EmployeeDocument {
  id?: string;
  _id?: string;
  employee_id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  upload_date?: string;
  created_at?: string;
}

interface EmployeeOption {
  id: string;
  employee_id?: string;
  full_name: string;
}

interface FileSlot {
  url: string;
  name: string;
  existingId?: string;
  dirty: boolean;
}

type FileSlots = Record<DocType, FileSlot>;

function rowId(row: { id?: string; _id?: string }): string {
  return row._id || row.id || '';
}

function emptySlots(): FileSlots {
  return {
    cv: { url: '', name: '', dirty: false },
    certificates: { url: '', name: '', dirty: false },
    identity: { url: '', name: '', dirty: false },
    work_permit: { url: '', name: '', dirty: false },
    driving: { url: '', name: '', dirty: false },
    passport: { url: '', name: '', dirty: false },
  };
}

function readLocalFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
    reader.readAsDataURL(file);
  });
}

function isDocType(value: string): value is DocType {
  return (DOC_TYPES as readonly string[]).includes(value);
}

export function EmployeeDocuments() {
  const { t } = useLanguage();
  const crudToast = useCrudToast();
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [slots, setSlots] = useState<FileSlots>(emptySlots);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    void loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [docs, emps] = await Promise.all([
        genericApi.list<EmployeeDocument>('employee_documents', 1000),
        fetchEmployees(),
      ]);
      setDocuments(docs || []);
      const list = (emps || [])
        .map((e) => ({
          id: rowId(e as { id?: string; _id?: string }),
          employee_id: e.employee_id,
          full_name: e.full_name,
        }))
        .filter((e) => e.id && e.full_name)
        .sort((a, b) => a.full_name.localeCompare(b.full_name, undefined, { sensitivity: 'base' }));
      setEmployees(list);
    } catch (error) {
      console.error('Error loading employee documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const docsByEmployee = useMemo(() => {
    const map = new Map<string, Partial<Record<DocType, EmployeeDocument>>>();
    for (const doc of documents) {
      const type = String(doc.document_type || '');
      if (!isDocType(type) || !doc.document_url) continue;
      const key = doc.employee_id;
      if (!map.has(key)) map.set(key, {});
      map.get(key)![type] = doc;
    }
    return map;
  }, [documents]);

  const filteredEmployees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.full_name.toLowerCase().includes(q) ||
        String(e.employee_id || '').toLowerCase().includes(q)
    );
  }, [employees, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / entriesPerPage));
  const page = Math.min(currentPage, totalPages);
  const startIndex = filteredEmployees.length === 0 ? 0 : (page - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, filteredEmployees.length);
  const pageEmployees = filteredEmployees.slice(startIndex, endIndex);

  const typeLabel = (type: DocType) => {
    const map: Record<DocType, string> = {
      cv: t('documents.typeCv'),
      certificates: t('documents.typeCertificates'),
      identity: t('documents.typeIdentity'),
      work_permit: t('documents.typeWorkPermit'),
      driving: t('documents.typeDriving'),
      passport: t('documents.typePassport'),
    };
    return map[type];
  };

  const openUploadModal = (employeeId: string) => {
    const existing = docsByEmployee.get(employeeId) || {};
    const next = emptySlots();
    for (const type of DOC_TYPES) {
      const doc = existing[type];
      if (doc?.document_url) {
        next[type] = {
          url: doc.document_url,
          name: doc.document_name || typeLabel(type),
          existingId: rowId(doc),
          dirty: false,
        };
      }
    }
    setSelectedEmployeeId(employeeId);
    setSlots(next);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEmployeeId('');
    setSlots(emptySlots());
    setSaving(false);
  };

  const handleFilePick = async (type: DocType, fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      toastError(t('documents.fileTooLarge'));
      return;
    }

    try {
      const dataUrl = await readLocalFile(file);
      setSlots((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          url: dataUrl,
          name: file.name,
          dirty: true,
        },
      }));
    } catch (error) {
      console.error(error);
      toastError(t('documents.fileReadError'));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      toastError(t('documents.selectEmployee'));
      return;
    }

    const dirtySlots = DOC_TYPES.filter((type) => slots[type].dirty && slots[type].url);
    if (dirtySlots.length === 0) {
      toastError(t('documents.fileRequired'));
      return;
    }

    setSaving(true);
    try {
      await Promise.all(
        dirtySlots.map(async (type) => {
          const slot = slots[type];
          const payload = {
            employee_id: selectedEmployeeId,
            document_type: type,
            document_name: slot.name || typeLabel(type),
            document_url: slot.url,
            upload_date: new Date().toISOString(),
            expiry_date: '',
            notes: '',
          };
          if (slot.existingId) {
            await genericApi.update('employee_documents', slot.existingId, payload);
          } else {
            await genericApi.create('employee_documents', payload);
          }
        })
      );
      crudToast.onSaved(true);
      closeModal();
      await loadAll();
    } catch (error) {
      crudToast.onError(error);
      console.error('Error uploading documents:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderDownloadCell = (employeeId: string, type: DocType) => {
    const doc = docsByEmployee.get(employeeId)?.[type];
    if (!doc?.document_url) {
      return <span className="text-gray-300">—</span>;
    }
    return (
      <a
        href={doc.document_url}
        download={doc.document_name || typeLabel(type)}
        className="text-[#0F3C66] hover:underline font-medium"
      >
        {t('documents.download')}
      </a>
    );
  };

  const renderFileInput = (type: DocType, required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {typeLabel(type)}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <div className="flex overflow-hidden rounded-md border border-gray-300">
        <label className="shrink-0 cursor-pointer bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 border-r border-gray-300">
          {t('documents.chooseFile')}
          <input
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx"
            onChange={(e) => {
              void handleFilePick(type, e.target.files);
              e.target.value = '';
            }}
          />
        </label>
        <div className="flex min-w-0 flex-1 items-center bg-[#4B5563] px-3 text-sm text-white truncate">
          {slots[type].name || t('documents.noFileChosen')}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-gray-700">{t('documents.pageTitle')}</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{t('common.show')}</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>{t('common.entries')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{t('common.search')}:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-3 py-1.5 min-w-[180px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">#</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">
                  {t('documents.colFullName')}
                </th>
                {DOC_TYPES.map((type) => (
                  <th
                    key={type}
                    className="px-3 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200"
                  >
                    {typeLabel(type)}
                  </th>
                ))}
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">
                  {t('common.action')}
                </th>
              </tr>
            </thead>
            <tbody>
              {pageEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500 border border-gray-200">
                    {t('documents.emptyEmployees')}
                  </td>
                </tr>
              ) : (
                pageEmployees.map((employee, index) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-gray-600 border border-gray-200">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-3 py-3 text-gray-800 border border-gray-200 font-medium">
                      {employee.full_name}
                    </td>
                    {DOC_TYPES.map((type) => (
                      <td key={type} className="px-3 py-3 border border-gray-200">
                        {renderDownloadCell(employee.id, type)}
                      </td>
                    ))}
                    <td className="px-3 py-3 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => openUploadModal(employee.id)}
                        className="p-2 text-[#0F3C66] hover:bg-blue-50 rounded-lg transition"
                        title={t('documents.uploadDocuments')}
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
          <div>
            {t('common.showing')}{' '}
            <span className="font-semibold text-gray-800">
              {filteredEmployees.length === 0 ? 0 : startIndex + 1}
            </span>{' '}
            {t('common.to')}{' '}
            <span className="font-semibold text-gray-800">{endIndex}</span> {t('common.of')}{' '}
            <span className="font-semibold text-gray-800">{filteredEmployees.length}</span>{' '}
            {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-40"
            >
              {t('common.previous')}
            </button>
            <span className="px-3 py-1.5 border border-gray-300 rounded bg-white font-semibold">
              {page}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-40"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-[#0F3C66]">
                {t('documents.uploadDocuments')}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md bg-[#0F3C66] p-1.5 text-white hover:bg-[#154b8a]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="overflow-y-auto max-h-[calc(92vh-130px)] p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('documents.fieldEmployee')}
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => openUploadModal(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0F3C66]/20 outline-none"
                  required
                >
                  <option value="">{t('documents.selectEmployee')}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderFileInput('cv')}
                {renderFileInput('certificates')}
                {renderFileInput('identity')}
                {renderFileInput('work_permit')}
                {renderFileInput('driving')}
                {renderFileInput('passport')}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-md bg-[#0F3C66] text-white text-sm font-semibold hover:bg-[#154b8a] disabled:opacity-50"
                >
                  {saving ? t('common.loading') : t('documents.uploadButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
