import { useEffect, useState } from 'react';
import { Ban, Check, Eye, FileCheck, X } from 'lucide-react';
import { appConfirm } from '../../lib/appConfirm';
import { useCrudToast } from '../../hooks/useCrudToast';
import { toastError, toastSuccess } from '../../lib/appToast';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { genericApi } from '../../api/genericApi';

const MONTH_KEYS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

interface PayrollReportItem {
  matricule?: string;
  employee_name?: string;
  base_salary?: number;
  retraite?: number;
  amu?: number;
  deduction?: number;
  cnss?: number;
  taxable_salary?: number;
  its?: number;
  net_salary?: number;
}

interface PayrollReport {
  id?: string;
  _id?: string;
  period_month: number;
  period_year: number;
  period_label?: string;
  employee_count?: number;
  status?: string;
  items?: PayrollReportItem[];
  totals?: {
    base_salary?: number;
    retraite?: number;
    amu?: number;
    deduction?: number;
    cnss?: number;
    taxable_salary?: number;
    its?: number;
    net_salary?: number;
  };
  generated_at?: string;
  approved_by?: string | null;
  approved_at?: string | null;
  notes?: string;
}

function reportId(report: PayrollReport): string {
  return String(report.id || report._id || '');
}

function formatFdj(amount: number): string {
  const formatted = Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Fdj${formatted}`;
}

function periodLabel(report: PayrollReport): string {
  if (report.period_label) {
    const parts = String(report.period_label).split('-');
    if (parts.length === 2) return `${parts[1]}-${parts[0]}`;
    return report.period_label;
  }
  const month = MONTH_KEYS[(Number(report.period_month) || 1) - 1] || 'Jan';
  return `${month}-${report.period_year}`;
}

function totalDeductions(report: PayrollReport): number {
  const totals = report.totals || {};
  return (
    Number(totals.retraite || 0) +
    Number(totals.amu || 0) +
    Number(totals.deduction || 0) +
    Number(totals.its || 0)
  );
}

function totalNet(report: PayrollReport): number {
  if (report.totals?.net_salary != null) return Number(report.totals.net_salary);
  return (report.items || []).reduce((sum, item) => sum + Number(item.net_salary || 0), 0);
}

function employeeCount(report: PayrollReport): number {
  if (report.employee_count != null) return Number(report.employee_count);
  return (report.items || []).length;
}

export function PayrollApproval() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const crudToast = useCrudToast();
  const [reports, setReports] = useState<PayrollReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<PayrollReport | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    void fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await genericApi.list<PayrollReport>('payroll_reports', 500);
      const pending = (data || [])
        .filter((r) => ['generated', 'pending_approval', 'draft'].includes(String(r.status || 'generated')))
        .sort((a, b) => {
          const ya = Number(a.period_year) * 100 + Number(a.period_month);
          const yb = Number(b.period_year) * 100 + Number(b.period_month);
          return yb - ya;
        });
      setReports(pending);
    } catch (error) {
      console.error('Error fetching payroll reports:', error);
      toastError(t('payrollApproval.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const syncPayrollRowsStatus = async (
    report: PayrollReport,
    status: 'approved' | 'rejected',
    extra: Record<string, unknown> = {}
  ) => {
    const rows = await genericApi.list<any>('payroll', 1000);
    const year = Number(report.period_year);
    const month = Number(report.period_month);
    await Promise.all(
      (rows || [])
        .filter((row) => Number(row.period_year) === year && Number(row.period_month) === month)
        .map((row) => {
          const id = row.id || row._id;
          if (!id) return Promise.resolve();
          return genericApi.update('payroll', String(id), { status, ...extra });
        })
    );
  };

  const handleApprove = async (report: PayrollReport) => {
    const id = reportId(report);
    if (!id) return;

    if (
      !(await appConfirm(t('payrollApproval.confirmApproveMessage'), {
        title: t('payrollApproval.confirmApproveTitle'),
        variant: 'warning',
      }))
    ) {
      return;
    }

    try {
      await genericApi.update('payroll_reports', id, {
        status: 'approved',
        approved_by: user?.id || null,
        approved_at: new Date().toISOString(),
      });
      await syncPayrollRowsStatus(report, 'approved', {
        approved_by: user?.id || null,
        approved_at: new Date().toISOString(),
      });
      crudToast.onApproved();
      setShowDetails(false);
      setSelectedReport(null);
      await fetchReports();
    } catch (error) {
      crudToast.onError(error);
      console.error('Error approving payroll:', error);
    }
  };

  const handleReject = async (report: PayrollReport) => {
    const id = reportId(report);
    if (!id) return;

    if (
      !(await appConfirm(t('payrollApproval.confirmRejectMessage'), {
        title: t('payrollApproval.confirmRejectTitle'),
        variant: 'danger',
      }))
    ) {
      return;
    }

    try {
      await genericApi.update('payroll_reports', id, {
        status: 'rejected',
        approved_by: user?.id || null,
        approved_at: new Date().toISOString(),
      });
      await syncPayrollRowsStatus(report, 'rejected');
      crudToast.onRejected();
      setShowDetails(false);
      setSelectedReport(null);
      await fetchReports();
    } catch (error) {
      crudToast.onError(error);
      console.error('Error rejecting payroll:', error);
    }
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
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-[#0F3C66]">{t('payrollApproval.title')}</h2>
          <FileCheck size={22} className="text-[#0F3C66]" />
        </div>
        <div className="text-sm font-medium text-[#EE964C]">{t('common.version')}</div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#F3F4F6]">
                <th className="px-4 py-3 text-left text-xs font-bold text-[#0F3C66] border border-gray-200">#</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#0F3C66] border border-gray-200">
                  {t('payrollApproval.colPeriod')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#0F3C66] border border-gray-200">
                  {t('payrollApproval.colEmployees')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#0F3C66] border border-gray-200">
                  {t('payrollApproval.colDeductions')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#0F3C66] border border-gray-200">
                  {t('payrollApproval.colNet')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[#0F3C66] border border-gray-200">
                  {t('common.action')}
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 border border-gray-200">
                    {t('payrollApproval.empty')}
                  </td>
                </tr>
              ) : (
                reports.map((report, index) => (
                  <tr key={reportId(report)} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 border border-gray-200">{index + 1}</td>
                    <td className="px-4 py-3 text-gray-700 border border-gray-200">{periodLabel(report)}</td>
                    <td className="px-4 py-3 text-gray-700 border border-gray-200">{employeeCount(report)}</td>
                    <td className="px-4 py-3 text-gray-700 border border-gray-200">
                      {formatFdj(totalDeductions(report))}
                    </td>
                    <td className="px-4 py-3 text-gray-700 border border-gray-200">
                      {formatFdj(totalNet(report))}
                    </td>
                    <td className="px-4 py-3 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          title={t('common.view')}
                          onClick={() => {
                            setSelectedReport(report);
                            setShowDetails(true);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#3B82F6] text-white hover:bg-[#2563EB] transition"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          title={t('payrollApproval.approve')}
                          onClick={() => void handleApprove(report)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#22C55E] text-white hover:bg-[#16A34A] transition"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          type="button"
                          title={t('payrollApproval.reject')}
                          onClick={() => void handleReject(report)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EF4444] text-white hover:bg-[#DC2626] transition"
                        >
                          <Ban size={15} />
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

      {showDetails && selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-[#0F3C66]">
                {t('payrollApproval.detailsTitle')} — {periodLabel(selectedReport)}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowDetails(false);
                  setSelectedReport(null);
                }}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-auto p-5">
              <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">{t('payrollApproval.colEmployees')}</div>
                  <div className="mt-1 text-lg font-semibold text-gray-800">{employeeCount(selectedReport)}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">{t('payrollApproval.colDeductions')}</div>
                  <div className="mt-1 text-lg font-semibold text-gray-800">{formatFdj(totalDeductions(selectedReport))}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">{t('payrollApproval.colNet')}</div>
                  <div className="mt-1 text-lg font-semibold text-[#0F3C66]">{formatFdj(totalNet(selectedReport))}</div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full min-w-[800px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#F3F4F6]">
                      <th className="px-3 py-2 text-left text-xs font-bold text-[#0F3C66] border border-gray-200">#</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-[#0F3C66] border border-gray-200">
                        {t('generatePayroll.colMatricule')}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-[#0F3C66] border border-gray-200">
                        {t('generatePayroll.colName')}
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-[#0F3C66] border border-gray-200">
                        {t('generatePayroll.colBase')}
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-[#0F3C66] border border-gray-200">
                        {t('generatePayroll.colNet')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedReport.items || []).map((item, index) => (
                      <tr key={`${item.matricule}-${index}`}>
                        <td className="px-3 py-2 border border-gray-200 text-gray-600">{index + 1}</td>
                        <td className="px-3 py-2 border border-gray-200 text-gray-700">{item.matricule || '-'}</td>
                        <td className="px-3 py-2 border border-gray-200 text-gray-700">{item.employee_name || '-'}</td>
                        <td className="px-3 py-2 border border-gray-200 text-right text-gray-700">
                          {formatFdj(Number(item.base_salary || 0))}
                        </td>
                        <td className="px-3 py-2 border border-gray-200 text-right text-gray-700">
                          {formatFdj(Number(item.net_salary || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowDetails(false);
                  setSelectedReport(null);
                }}
                className="px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => void handleReject(selectedReport)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
              >
                <Ban size={16} />
                {t('payrollApproval.reject')}
              </button>
              <button
                type="button"
                onClick={() => void handleApprove(selectedReport)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white text-sm hover:bg-green-700"
              >
                <Check size={16} />
                {t('payrollApproval.approve')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
