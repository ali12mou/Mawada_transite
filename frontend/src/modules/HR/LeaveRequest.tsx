import { useEffect, useMemo, useState } from 'react';
import { appConfirm } from '../../lib/appConfirm';
import { useCrudToast } from '../../hooks/useCrudToast';
import { Eye, Check, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { genericApi } from '../../api/genericApi';
import { fetchEmployees } from '../../api/hrApi';
import { useLanguage } from '../../contexts/LanguageContext';

interface LeaveRequestRow {
  id?: string;
  _id?: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  leave_balance?: number;
  document_url?: string;
  document_name?: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at?: string;
}

interface EmployeeOption {
  id: string;
  full_name: string;
  leave_days_remaining?: number;
}

interface LeaveTypeOption {
  id: string;
  _id?: string;
  name: string;
  days?: number;
  max_days_per_year?: number;
  is_active?: boolean;
  has_documents?: boolean;
}

function rowId(row: { id?: string; _id?: string }): string {
  return row._id || row.id || '';
}

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function calculateDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  const diffTime = endDate.getTime() - startDate.getTime();
  if (diffTime < 0) return 0;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function SortIcon() {
  return (
    <span className="ml-1 inline-flex flex-col text-[8px] leading-none text-gray-400">
      <span>▲</span>
      <span>▼</span>
    </span>
  );
}

export function LeaveRequest() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const crudToast = useCrudToast();
  const [requests, setRequests] = useState<LeaveRequestRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestRow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type_id: '',
    start_date: todayIsoDate(),
    end_date: todayIsoDate(),
    leave_balance: '',
    leave_days: '',
    reason: '',
    document_url: '',
    document_name: '',
  });

  useEffect(() => {
    void loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [reqData, empData, typeData] = await Promise.all([
        genericApi.list<LeaveRequestRow>('leave_request', 500),
        fetchEmployees(),
        genericApi.list<LeaveTypeOption>('leave_types', 500),
      ]);

      setRequests(reqData || []);
      setEmployees(
        (empData || [])
          .map((e) => ({
            id: rowId(e as { id?: string; _id?: string }),
            full_name: e.full_name,
            leave_days_remaining: e.leave_days_remaining,
          }))
          .filter((e) => e.id && e.full_name)
          .sort((a, b) => a.full_name.localeCompare(b.full_name, undefined, { sensitivity: 'base' }))
      );
      setLeaveTypes(
        (typeData || [])
          .map((lt) => ({
            ...lt,
            id: rowId(lt),
            name: String(lt.name || '').trim(),
          }))
          .filter((lt) => lt.id && lt.name)
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      );
    } catch (error) {
      console.error('Error loading leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const reloadLeaveTypes = async () => {
    try {
      const typeData = await genericApi.list<LeaveTypeOption>('leave_types', 500);
      setLeaveTypes(
        (typeData || [])
          .map((lt) => ({
            ...lt,
            id: rowId(lt),
            name: String(lt.name || '').trim(),
          }))
          .filter((lt) => lt.id && lt.name)
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      );
    } catch (error) {
      console.error('Error loading leave types:', error);
    }
  };

  const computedDays = useMemo(
    () => calculateDays(formData.start_date, formData.end_date),
    [formData.start_date, formData.end_date]
  );

  const openForm = () => {
    const today = todayIsoDate();
    setFormData({
      employee_id: '',
      leave_type_id: '',
      start_date: today,
      end_date: today,
      leave_balance: '',
      leave_days: '1',
      reason: '',
      document_url: '',
      document_name: '',
    });
    void reloadLeaveTypes();
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  const handleLeaveTypeChange = (leaveTypeId: string) => {
    const leaveType = leaveTypes.find((lt) => lt.id === leaveTypeId);
    const typeDays = leaveType?.days ?? leaveType?.max_days_per_year;
    setFormData((prev) => ({
      ...prev,
      leave_type_id: leaveTypeId,
      leave_days:
        typeDays != null && Number(typeDays) > 0 ? String(typeDays) : prev.leave_days,
    }));
  };

  const handleEmployeeChange = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    setFormData((prev) => ({
      ...prev,
      employee_id: employeeId,
      leave_balance:
        emp?.leave_days_remaining != null ? String(emp.leave_days_remaining) : '',
    }));
  };

  const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      next.leave_days = String(calculateDays(next.start_date, next.end_date) || '');
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalDays = Number(formData.leave_days) || computedDays;
    if (!formData.leave_type_id || !formData.employee_id) return;
    if (!formData.start_date || !formData.end_date || totalDays <= 0) {
      return;
    }

    try {
      await genericApi.create('leave_request', {
        employee_id: formData.employee_id,
        leave_type_id: formData.leave_type_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_days: totalDays,
        leave_balance: Number(formData.leave_balance) || 0,
        reason: formData.reason,
        document_url: formData.document_url || '',
        document_name: formData.document_name || '',
        status: 'pending',
        created_by: user?.id || null,
      });
      crudToast.onSaved(false);
      closeForm();
      await loadAll();
    } catch (error) {
      crudToast.onError(error);
      console.error('Error submitting leave request:', error);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (
      !(await appConfirm(t('leaveRequest.confirmApprove'), {
        title: t('leaveRequest.confirmTitle'),
        variant: 'warning',
      }))
    ) {
      return;
    }

    try {
      await genericApi.update('leave_request', requestId, {
        status: 'approved',
        reviewed_by: user?.id || null,
        reviewed_at: new Date().toISOString(),
      });
      crudToast.onApproved();
      setShowDetails(false);
      await loadAll();
    } catch (error) {
      crudToast.onError(error);
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    if (
      !(await appConfirm(t('leaveRequest.confirmReject'), {
        title: t('leaveRequest.confirmTitle'),
        variant: 'danger',
      }))
    ) {
      return;
    }

    try {
      await genericApi.update('leave_request', requestId, {
        status: 'rejected',
        reviewed_by: user?.id || null,
        reviewed_at: new Date().toISOString(),
      });
      crudToast.onRejected();
      setShowDetails(false);
      await loadAll();
    } catch (error) {
      crudToast.onError(error);
      console.error('Error rejecting request:', error);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? employee.full_name : '—';
  };

  const getLeaveTypeName = (leaveTypeId: string) => {
    const leaveType = leaveTypes.find((lt) => lt.id === leaveTypeId || rowId(lt as any) === leaveTypeId);
    return leaveType ? leaveType.name : '—';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((request) => {
      const employeeName = getEmployeeName(request.employee_id).toLowerCase();
      const leaveType = getLeaveTypeName(request.leave_type_id).toLowerCase();
      return (
        employeeName.includes(q) ||
        leaveType.includes(q) ||
        String(request.start_date || '').includes(q) ||
        String(request.end_date || '').includes(q) ||
        String(request.status || '').toLowerCase().includes(q)
      );
    });
  }, [requests, searchTerm, employees, leaveTypes]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / entriesPerPage));
  const page = Math.min(currentPage, totalPages);
  const startIndex = filteredRequests.length === 0 ? 0 : (page - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, filteredRequests.length);
  const pageRequests = filteredRequests.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  const thClass = 'px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap';

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#0F3C66]">{t('leaveRequest.title')}</h2>
        <button
          type="button"
          onClick={openForm}
          className="rounded bg-[#0F3C66] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#154b8a]"
        >
          {t('common.add')}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-lg font-bold text-[#0F3C66]">{t('leaveRequest.modalTitle')}</h3>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-md bg-[#0F3C66] p-1.5 text-white hover:bg-[#154b8a]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-5 pb-4 space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {t('leaveRequest.fieldLeaveType')}
                  </label>
                  <select
                    required
                    value={formData.leave_type_id}
                    onChange={(e) => handleLeaveTypeChange(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0F3C66]/20 focus:border-[#0F3C66]"
                  >
                    <option value="">--Select--</option>
                    {leaveTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {t('leaveRequest.fieldEmployee')}
                  </label>
                  <select
                    required
                    value={formData.employee_id}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0F3C66]/20 focus:border-[#0F3C66]"
                  >
                    <option value="">{t('leaveRequest.selectEmployee')}</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      {t('leaveRequest.fieldBalance')}
                    </label>
                    <input
                      type="text"
                      value={formData.leave_balance}
                      readOnly
                      className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      {t('leaveRequest.fieldStartDate')}
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => handleDateChange('start_date', e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0F3C66]/20 focus:border-[#0F3C66]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      {t('leaveRequest.fieldLeaveDays')}
                    </label>
                    <input
                      type="text"
                      value={formData.leave_days || String(computedDays || '')}
                      onChange={(e) => setFormData({ ...formData, leave_days: e.target.value })}
                      className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0F3C66]/20 focus:border-[#0F3C66]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      {t('leaveRequest.fieldEndDate')}
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(e) => handleDateChange('end_date', e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0F3C66]/20 focus:border-[#0F3C66]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {t('leaveRequest.fieldComment')}
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0F3C66]/20 focus:border-[#0F3C66]"
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-gray-200 px-5 py-4">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-md bg-[#0F3C66] text-white text-sm font-semibold hover:bg-[#154b8a]"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetails && selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#0F3C66]">{t('leaveRequest.detailsTitle')}</h3>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="rounded-md bg-[#0F3C66] p-1.5 text-white hover:bg-[#154b8a]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">{t('leaveRequest.fieldEmployee')}</label>
                  <div className="font-semibold">{getEmployeeName(selectedRequest.employee_id)}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">{t('leaveRequest.fieldLeaveType')}</label>
                  <div className="font-semibold">{getLeaveTypeName(selectedRequest.leave_type_id)}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-600">{t('leaveRequest.fieldStartDate')}</label>
                  <div className="font-semibold">{selectedRequest.start_date}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">{t('leaveRequest.fieldEndDate')}</label>
                  <div className="font-semibold">{selectedRequest.end_date}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">{t('leaveRequest.fieldLeaveDays')}</label>
                  <div className="font-semibold">{selectedRequest.total_days}</div>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">{t('leaveRequest.fieldComment')}</label>
                <div className="text-sm text-gray-800">{selectedRequest.reason || '—'}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">{t('leaveRequest.colStatus')}</label>
                <span
                  className={`ml-2 inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}
                >
                  {selectedRequest.status.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => void handleReject(rowId(selectedRequest))}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <X size={18} />
                    {t('leaveRequest.reject')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleApprove(rowId(selectedRequest))}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Check size={18} />
                    {t('leaveRequest.approve')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>{t('common.show')}</span>
            <input
              type="number"
              min={1}
              value={entriesPerPage}
              onChange={(e) => {
                const value = Math.max(1, Number(e.target.value) || 5);
                setEntriesPerPage(value);
                setCurrentPage(1);
              }}
              className="w-14 rounded border border-gray-300 px-2 py-1 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
            />
          </div>
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded border border-gray-300 px-3 py-1.5 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className={thClass}>
                  #
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('leaveRequest.colEmployeeName')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('leaveRequest.colLeaveType')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('leaveRequest.fieldStartDate')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('leaveRequest.fieldEndDate')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('leaveRequest.colStatus')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('leaveRequest.colDocument')}
                  <SortIcon />
                </th>
                <th className={thClass}>
                  {t('common.action')}
                  <SortIcon />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pageRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                pageRequests.map((request, index) => (
                  <tr key={rowId(request)} className="transition hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{startIndex + index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {getEmployeeName(request.employee_id)}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {getLeaveTypeName(request.leave_type_id)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{request.start_date}</td>
                    <td className="px-4 py-3 text-gray-700">{request.end_date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}
                      >
                        {request.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {request.document_url ? (
                        <a
                          href={request.document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[#0F3C66] hover:underline"
                        >
                          {request.document_name || t('leaveRequest.viewDocument')}
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetails(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title={t('common.view')}
                        >
                          <Eye size={16} />
                        </button>
                        {request.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleApprove(rowId(request))}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title={t('leaveRequest.approve')}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleReject(rowId(request))}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title={t('leaveRequest.reject')}
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
          <div>
            {t('common.showing')} {filteredRequests.length === 0 ? 0 : startIndex + 1}{' '}
            {t('common.to')} {endIndex} {t('common.of')} {filteredRequests.length}{' '}
            {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || filteredRequests.length === 0}
              className="rounded border border-gray-300 px-3 py-1 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || filteredRequests.length === 0}
              className="rounded border border-gray-300 px-3 py-1 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
