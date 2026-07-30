import { useState, useEffect } from 'react';
import { appConfirm } from '../../lib/appConfirm';
import { useCrudToast } from '../../hooks/useCrudToast';
import { Pencil, Trash2, X } from 'lucide-react';
import { genericApi } from '../../api/genericApi';
import { useLanguage } from '../../contexts/LanguageContext';

interface LeaveType {
  id?: string;
  _id?: string;
  name: string;
  days: number;
  period_type: string;
  has_documents: boolean;
  is_active: boolean;
  created_at?: string;
}

function rowId(row: { id?: string; _id?: string }): string {
  return row._id || row.id || '';
}

const PERIOD_TYPES = ['Mensuel', 'Annuel'] as const;

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  id: string;
}) {
  return (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
      <input
        id={id}
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0F3C66]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F3C66]" />
    </label>
  );
}

export function LeaveTypes() {
  const { t } = useLanguage();
  const crudToast = useCrudToast();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    days: '',
    period_type: 'Mensuel',
    has_documents: false,
    is_active: true,
  });

  useEffect(() => {
    void fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      const data = await genericApi.list<LeaveType>('leave_types', 500);
      setLeaveTypes(data || []);
    } catch (error) {
      console.error('Error fetching leave types:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setFormData({
      name: '',
      days: '',
      period_type: 'Mensuel',
      has_documents: false,
      is_active: true,
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name.trim(),
      days: Number(formData.days) || 0,
      period_type: formData.period_type,
      has_documents: formData.has_documents,
      is_active: formData.is_active,
      // Compatibilité avec l’ancien schéma / filtre LeaveRequest
      max_days_per_year: Number(formData.days) || 0,
    };
    if (!payload.name) return;

    try {
      if (editingId) {
        await genericApi.update('leave_types', editingId, payload);
      } else {
        await genericApi.create('leave_types', payload);
      }
      crudToast.onSaved(!!editingId);
      resetForm();
      await fetchLeaveTypes();
    } catch (error) {
      crudToast.onError(error);
      console.error('Error saving leave type:', error);
    }
  };

  const handleEdit = (leaveType: LeaveType) => {
    const days =
      leaveType.days != null
        ? leaveType.days
        : (leaveType as LeaveType & { max_days_per_year?: number }).max_days_per_year || 0;
    setFormData({
      name: leaveType.name || '',
      days: days ? String(days) : '',
      period_type: leaveType.period_type || 'Mensuel',
      has_documents: !!leaveType.has_documents,
      is_active: leaveType.is_active !== false,
    });
    setEditingId(rowId(leaveType));
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (
      !(await appConfirm(t('leaveTypes.deleteConfirm'), {
        title: t('leaveTypes.confirmTitle'),
        variant: 'danger',
      }))
    ) {
      return;
    }
    try {
      await genericApi.delete('leave_types', id);
      crudToast.onDeleted();
      await fetchLeaveTypes();
    } catch (error) {
      crudToast.onError(error, 'common.errorDeleting');
      console.error('Error deleting leave type:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      days: '',
      period_type: 'Mensuel',
      has_documents: false,
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const displayDays = (leaveType: LeaveType) => {
    if (leaveType.days != null && leaveType.days !== undefined) return leaveType.days;
    const legacy = (leaveType as LeaveType & { max_days_per_year?: number }).max_days_per_year;
    return legacy ?? '—';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">{t('leaveTypes.title')}</h2>
        <button
          type="button"
          onClick={openAdd}
          className="rounded bg-[#0F3C66] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#154b8a]"
        >
          {t('common.add')}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? t('common.edit') : t('common.add')}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 px-5 pb-4 pt-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">
                    {t('leaveTypes.fieldName')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#0F3C66] focus:ring-2 focus:ring-[#0F3C66]/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="has_documents" className="text-sm font-semibold text-gray-800">
                      {t('leaveTypes.fieldHasDocuments')}
                    </label>
                    <Toggle
                      id="has_documents"
                      checked={formData.has_documents}
                      onChange={(value) => setFormData({ ...formData, has_documents: value })}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="is_active" className="text-sm font-semibold text-gray-800">
                      {t('leaveTypes.fieldActivate')}
                    </label>
                    <Toggle
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(value) => setFormData({ ...formData, is_active: value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">
                    {t('leaveTypes.fieldType')}
                  </label>
                  <select
                    value={formData.period_type}
                    onChange={(e) => setFormData({ ...formData, period_type: e.target.value })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0F3C66] focus:ring-2 focus:ring-[#0F3C66]/20"
                  >
                    {PERIOD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type === 'Mensuel'
                          ? t('leaveTypes.typeMonthly')
                          : t('leaveTypes.typeYearly')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">
                    {t('leaveTypes.fieldDays')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.days}
                    onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#0F3C66] focus:ring-2 focus:ring-[#0F3C66]/20"
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-gray-100 px-5 py-4">
                <button
                  type="submit"
                  className="rounded-md bg-[#0F3C66] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#154b8a]"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-white">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  {t('leaveTypes.colSqn')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  {t('leaveTypes.colName')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  {t('leaveTypes.colDays')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  {t('leaveTypes.colType')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  {t('common.action')}
                </th>
              </tr>
            </thead>
            <tbody>
              {leaveTypes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                leaveTypes.map((leaveType, index) => (
                  <tr key={rowId(leaveType)} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{leaveType.name}</td>
                    <td className="px-4 py-3 text-gray-700">{displayDays(leaveType)}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {leaveType.period_type || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(leaveType)}
                          className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                          title={t('common.edit')}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(rowId(leaveType))}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          title={t('common.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
