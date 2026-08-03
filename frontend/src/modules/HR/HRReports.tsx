import { useEffect, useMemo, useState } from 'react';
import {
  ClipboardCheck,
  Printer,
  Banknote,
  Eye,
} from 'lucide-react';
import { genericApi } from '../../api/genericApi';
import { fetchEmployees, type Employee } from '../../api/hrApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { openHtmlPreviewWithDownload } from '../../lib/htmlPrintPdf';
import { openPayrollLetterPrint } from '../../lib/payrollLetterPrintHtml';

type ReportView =
  | 'main'
  | 'employees'
  | 'salary'
  | 'payrollPeriods'
  | 'attendance'
  | 'leave'
  | 'leaveReturn'
  | 'leaveTypes'
  | 'documents'
  | 'professions'
  | 'contracts';

interface AttendanceRow {
  id?: string;
  _id?: string;
  employee_id: string;
  date?: string;
  attendance_date?: string;
  check_in?: string;
  check_out?: string;
  status: string;
  work_hours?: number;
  overtime_hours?: number;
  notes?: string;
  comments?: string;
  comment?: string;
  added_by?: string;
  created_by?: string;
}

interface LeaveRequestRow {
  id?: string;
  _id?: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days?: number;
  reason?: string;
  status: string;
}

interface LeaveReturnRow {
  id?: string;
  _id?: string;
  employee_id: string;
  original_end_date?: string;
  new_return_date?: string;
  reason?: string;
  status: string;
}

interface LeaveTypeRow {
  id?: string;
  _id?: string;
  name: string;
  days?: number;
  max_days_per_year?: number;
  period_type?: string;
  has_documents?: boolean;
  is_active?: boolean;
}

interface DocumentRow {
  id?: string;
  _id?: string;
  employee_id: string;
  document_type: string;
  document_name: string;
  upload_date?: string;
  created_at?: string;
}

interface NamedActiveRow {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

interface PayrollReportItem {
  matricule?: string;
  employee_name?: string;
  employee_type?: string;
  base_salary?: number;
  deduction?: number;
  retraite?: number;
  amu?: number;
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
  total_deductions?: number;
  total_net?: number;
  status?: string;
  items?: PayrollReportItem[];
  generated_at?: string;
}

function rowId(row: { id?: string; _id?: string }): string {
  return row._id || row.id || '';
}

function printTable(title: string, headers: string[], rows: string[][]) {
  const th = headers.map((h) => `<th>${h}</th>`).join('');
  const body = rows.length
    ? rows
        .map((r) => `<tr>${r.map((c) => `<td>${c || '—'}</td>`).join('')}</tr>`)
        .join('')
    : `<tr><td colspan="${headers.length}" style="text-align:center;padding:24px;">—</td></tr>`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;color:#111}
      h1{font-size:18px;margin:0 0 16px;color:#0F3C66}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}
      th{background:#f3f4f6}
    </style></head><body>
    <h1>${title}</h1>
    <table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>
    </body></html>`;
  openHtmlPreviewWithDownload(html, `${title.replace(/[^\w\-]+/g, '_') || 'rapport'}.pdf`);
}

export function HRReports() {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const [currentView, setCurrentView] = useState<ReportView>('main');
  const [loading, setLoading] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRow[]>([]);
  const [payrollReports, setPayrollReports] = useState<PayrollReport[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRow[]>([]);
  const [leaveReturns, setLeaveReturns] = useState<LeaveReturnRow[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeRow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [professions, setProfessions] = useState<NamedActiveRow[]>([]);
  const [contracts, setContracts] = useState<NamedActiveRow[]>([]);

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedEmployeeType, setSelectedEmployeeType] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceDetail, setAttendanceDetail] = useState<AttendanceRow | null>(null);

  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 2, y - 1, y, y + 1].map(String);
  }, []);
  const monthsFr = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];
  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const months = language === 'fr' ? monthsFr : monthsEn;

  const employeeById = useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach((e) => {
      const mongoId = rowId(e as { id?: string; _id?: string });
      if (mongoId) map.set(mongoId, e);
      if (e.id) map.set(String(e.id), e);
      if (e.employee_id) map.set(String(e.employee_id), e);
    });
    return map;
  }, [employees]);

  const leaveTypeById = useMemo(() => {
    const map = new Map<string, LeaveTypeRow>();
    leaveTypes.forEach((lt) => {
      const id = rowId(lt);
      if (id) map.set(id, lt);
    });
    return map;
  }, [leaveTypes]);

  const resolveEmployee = (ref: string): Employee | undefined => {
    if (!ref) return undefined;
    const direct = employeeById.get(ref);
    if (direct) return direct;
    return employees.find(
      (e) =>
        rowId(e as { id?: string; _id?: string }) === ref ||
        e.id === ref ||
        e.employee_id === ref ||
        String(e.full_name || '').toLowerCase() === ref.toLowerCase()
    );
  };

  const getEmployeeName = (id: string) => resolveEmployee(id)?.full_name || '—';
  const getEmployeeMatricule = (id: string) =>
    resolveEmployee(id)?.employee_id || id || '—';
  const getEmployeePhone = (id: string) => resolveEmployee(id)?.phone_number || '—';
  const getLeaveTypeName = (id: string) => leaveTypeById.get(id)?.name || '—';

  const loadEmployees = async () => {
    const data = await fetchEmployees();
    setEmployees(data || []);
  };

  const openReport = async (view: ReportView) => {
    setCurrentView(view);
    setSearchTerm('');
    setSelectedEmployee('all');
    setSelectedStatus('all');
    setDateFrom('');
    setDateTo('');
    setAttendanceDetail(null);
    setLoading(true);
    try {
      await loadEmployees();
      if (view === 'salary' || view === 'payrollPeriods') {
        setPayrollReports((await genericApi.list<PayrollReport>('payroll_reports', 500)) || []);
      }
      if (view === 'attendance') {
        setAttendanceRecords((await genericApi.list<AttendanceRow>('attendance', 1000)) || []);
      }
      if (view === 'leave' || view === 'leaveReturn') {
        setLeaveRequests((await genericApi.list<LeaveRequestRow>('leave_request', 1000)) || []);
        setLeaveTypes((await genericApi.list<LeaveTypeRow>('leave_types', 500)) || []);
      }
      if (view === 'leaveReturn') {
        setLeaveReturns(
          (await genericApi.list<LeaveReturnRow>('leave_return_requests', 1000)) || []
        );
      }
      if (view === 'leaveTypes') {
        setLeaveTypes((await genericApi.list<LeaveTypeRow>('leave_types', 500)) || []);
      }
      if (view === 'documents') {
        setDocuments((await genericApi.list<DocumentRow>('employee_documents', 1000)) || []);
      }
      if (view === 'professions') {
        setProfessions((await genericApi.list<NamedActiveRow>('employee_professions', 500)) || []);
      }
      if (view === 'contracts') {
        setContracts((await genericApi.list<NamedActiveRow>('contract_types', 500)) || []);
      }
    } catch (error) {
      console.error('Error loading HR report data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEmployees().catch((e) => console.error(e));
  }, []);

  const getSelectedMonthNumber = (): number | null => {
    if (!selectedMonth) return null;
    const idx = months.findIndex((m) => m === selectedMonth);
    return idx >= 0 ? idx + 1 : null;
  };

  const salaryRows = useMemo(() => {
    const monthNum = getSelectedMonthNumber();
    const yearNum = selectedYear ? Number(selectedYear) : null;
    let reports = [...payrollReports];
    if (yearNum) reports = reports.filter((r) => Number(r.period_year) === yearNum);
    if (monthNum) reports = reports.filter((r) => Number(r.period_month) === monthNum);
    if (reports.length === 0) return [];
    reports.sort(
      (a, b) =>
        new Date(b.generated_at || 0).getTime() - new Date(a.generated_at || 0).getTime()
    );
    const report = reports[0];
    return (report.items || [])
      .map((item) => {
        const base = Number(item.base_salary || 0);
        const totalDeductions =
          Number(item.retraite || 0) +
          Number(item.amu || 0) +
          Number(item.deduction || 0) +
          Number(item.its || 0);
        return {
          employee_id: item.matricule || '',
          full_name: item.employee_name || '',
          account_number: employees.find((e) => e.employee_id === item.matricule)?.account_number || '—',
          base_salary: base,
          total_deductions: totalDeductions,
          net_salary: Number(item.net_salary || 0),
          type: item.employee_type || '—',
        };
      })
      .filter((row) => {
        if (selectedEmployeeType === 'all') return true;
        return row.type.toLowerCase() === selectedEmployeeType.toLowerCase();
      });
  }, [
    payrollReports,
    selectedYear,
    selectedMonth,
    selectedEmployeeType,
    employees,
    language,
  ]);

  const salaryTotals = useMemo(() => {
    return salaryRows.reduce(
      (acc, row) => ({
        base_salary: acc.base_salary + Number(row.base_salary || 0),
        total_deductions: acc.total_deductions + Number(row.total_deductions || 0),
        net_salary: acc.net_salary + Number(row.net_salary || 0),
      }),
      { base_salary: 0, total_deductions: 0, net_salary: 0 }
    );
  }, [salaryRows]);

  const filteredEmployees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return employees.filter((e) => {
      if (selectedEmployeeType !== 'all' && (e.employee_type || '') !== selectedEmployeeType) {
        return false;
      }
      if (!q) return true;
      return (
        e.full_name?.toLowerCase().includes(q) ||
        e.employee_id?.toLowerCase().includes(q) ||
        e.phone_number?.toLowerCase().includes(q) ||
        e.profession?.toLowerCase().includes(q)
      );
    });
  }, [employees, searchTerm, selectedEmployeeType]);

  const filteredAttendance = useMemo(() => {
    return attendanceRecords.filter((record) => {
      const date = record.date || record.attendance_date || '';
      const emp = resolveEmployee(record.employee_id);
      if (selectedEmployee !== 'all') {
        const empMongoId = emp ? rowId(emp as { id?: string; _id?: string }) : '';
        const match =
          record.employee_id === selectedEmployee ||
          empMongoId === selectedEmployee ||
          emp?.id === selectedEmployee ||
          emp?.employee_id === selectedEmployee;
        if (!match) return false;
      }
      if (dateFrom && date && date.slice(0, 10) < dateFrom) return false;
      if (dateTo && date && date.slice(0, 10) > dateTo) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (
          !emp?.full_name?.toLowerCase().includes(q) &&
          !emp?.employee_id?.toLowerCase().includes(q) &&
          !emp?.phone_number?.toLowerCase().includes(q) &&
          !String(record.status || '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    attendanceRecords,
    selectedEmployee,
    dateFrom,
    dateTo,
    searchTerm,
    employees,
    employeeById,
  ]);

  const filteredLeaves = useMemo(() => {
    return leaveRequests.filter((req) => {
      if (selectedEmployee !== 'all' && req.employee_id !== selectedEmployee) return false;
      if (selectedStatus !== 'all' && req.status !== selectedStatus) return false;
      if (dateFrom && req.start_date && req.start_date < dateFrom) return false;
      if (dateTo && req.end_date && req.end_date > dateTo) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const name = getEmployeeName(req.employee_id).toLowerCase();
        const type = getLeaveTypeName(req.leave_type_id).toLowerCase();
        if (!name.includes(q) && !type.includes(q) && !String(req.status).includes(q)) return false;
      }
      return true;
    });
  }, [
    leaveRequests,
    selectedEmployee,
    selectedStatus,
    dateFrom,
    dateTo,
    searchTerm,
    employeeById,
    leaveTypeById,
  ]);

  const filteredLeaveReturns = useMemo(() => {
    return leaveReturns.filter((req) => {
      if (selectedEmployee !== 'all' && req.employee_id !== selectedEmployee) return false;
      if (selectedStatus !== 'all' && req.status !== selectedStatus) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!getEmployeeName(req.employee_id).toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [leaveReturns, selectedEmployee, selectedStatus, searchTerm, employeeById]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (selectedEmployee !== 'all' && doc.employee_id !== selectedEmployee) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const name = getEmployeeName(doc.employee_id).toLowerCase();
        if (
          !name.includes(q) &&
          !doc.document_type?.toLowerCase().includes(q) &&
          !doc.document_name?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [documents, selectedEmployee, searchTerm, employeeById]);

  const reportCards: {
    id: ReportView;
    title: string;
    subtitle: string;
    icon: typeof Banknote;
  }[] = [
    {
      id: 'salary',
      title: t('hrReports.salaryReport'),
      subtitle: t('hrReports.salarySubtitle'),
      icon: Banknote,
    },
    {
      id: 'attendance',
      title: t('hrReports.attendanceReport'),
      subtitle: t('hrReports.attendanceSubtitle'),
      icon: ClipboardCheck,
    },
  ];

  const BackHeader = ({ title }: { title: string }) => (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setCurrentView('main')}
        className="mb-4 flex items-center gap-2 text-[#0F3C66] hover:underline"
      >
        ← {t('hrReports.backToReports')}
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
      </div>
    </div>
  );

  const PrintButton = ({ onClick }: { onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 inline-flex items-center gap-2 rounded-md bg-[#0F3C66] px-4 py-2 text-sm font-medium text-white hover:bg-[#154b8a]"
    >
      <Printer className="h-4 w-4" />
      {t('hrReports.print')}
    </button>
  );

  const EmptyRow = ({ cols }: { cols: number }) => (
    <tr>
      <td colSpan={cols} className="px-4 py-8 text-center text-gray-500">
        {t('hrReports.noData')}
      </td>
    </tr>
  );

  if (currentView === 'main') {
    return (
      <div className="p-6">
        <div className="mb-8">
          <p className="text-base text-gray-500">{t('hrReports.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl">
          {reportCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => void openReport(card.id)}
                className="rounded-2xl bg-[#F3F4F6] p-8 text-left transition hover:bg-[#EBECEF] hover:shadow-sm"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                  <Icon className="h-7 w-7 text-[#0F3C66]" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-[#0F3C66]">{card.title}</h2>
                <p className="text-sm text-gray-500">{card.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (currentView === 'employees') {
    return (
      <div className="p-6">
        <BackHeader title={t('hrReports.employeesReport')} />
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('common.search')}
              className="rounded-md border border-gray-300 px-3 py-2"
            />
            <select
              value={selectedEmployeeType}
              onChange={(e) => setSelectedEmployeeType(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="all">{t('hrReports.employeeTypes')}</option>
              <option value="Taxable">{t('employees.typeTaxable')}</option>
              <option value="Non-Taxable">{t('employees.typeNonTaxable')}</option>
            </select>
          </div>
          <PrintButton
            onClick={() =>
              printTable(
                t('hrReports.employeesReport'),
                [
                  '#',
                  t('hrReports.colMatricule'),
                  t('hrReports.colName'),
                  t('hrReports.colPhone'),
                  t('hrReports.colType'),
                  t('employees.fieldProfession'),
                  t('employees.fieldContractType'),
                ],
                filteredEmployees.map((e, i) => [
                  String(i + 1),
                  e.employee_id || '',
                  e.full_name || '',
                  e.phone_number || '',
                  e.employee_type || '',
                  e.profession || '',
                  e.contract_type || '',
                ])
              )
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colMatricule')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colName')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colPhone')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colType')}</th>
                  <th className="px-4 py-3 text-left">{t('employees.fieldProfession')}</th>
                  <th className="px-4 py-3 text-left">{t('employees.fieldContractType')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.length === 0 ? (
                  <EmptyRow cols={8} />
                ) : (
                  filteredEmployees.map((e, i) => (
                    <tr key={rowId(e as any) || e.employee_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-[#0F3C66]">{e.employee_id}</td>
                      <td className="px-4 py-3">{e.full_name}</td>
                      <td className="px-4 py-3">{e.phone_number || '—'}</td>
                      <td className="px-4 py-3">{e.employee_type || '—'}</td>
                      <td className="px-4 py-3">{e.profession || '—'}</td>
                      <td className="px-4 py-3">{e.contract_type || '—'}</td>
                      <td className="px-4 py-3">{e.status || '—'}</td>
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

  if (currentView === 'salary') {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() => setCurrentView('main')}
          className="mb-4 flex items-center gap-2 text-sm text-[#0F3C66] hover:underline"
        >
          ← {t('hrReports.backToReports')}
        </button>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-700">{t('hrReports.salaryReport')}</h1>
          <div className="text-xs font-bold uppercase tracking-widest text-[#EE964C] bg-[#EE964C]/10 px-2 py-1 rounded">
            {t('common.version')}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('hrReports.selectYear')}
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
              >
                <option value="">{t('hrReports.selectYearPlaceholder')}</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('hrReports.selectMonth')}
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
              >
                <option value="">{t('hrReports.selectMonthPlaceholder')}</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('hrReports.employeeTypes')}
              </label>
              <select
                value={selectedEmployeeType}
                onChange={(e) => setSelectedEmployeeType(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
              >
                <option value="all">{t('hrReports.allTypes')}</option>
                <option value="Permanent">Permanent</option>
                <option value="Temporary">Temporaire</option>
                <option value="Contractual">Contractuel</option>
                <option value="Taxable">{t('employees.typeTaxable')}</option>
                <option value="Non-Taxable">{t('employees.typeNonTaxable')}</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!selectedYear || !selectedMonth) {
                alert(t('hrReports.selectPeriodFirst'));
                return;
              }
              void openPayrollLetterPrint({
                periodMonthLabel: selectedMonth,
                periodYear: selectedYear,
                rows: salaryRows.map((r) => ({
                  full_name: r.full_name,
                  account_number: r.account_number === '—' ? '' : r.account_number,
                  net_salary: r.net_salary,
                })),
              });
            }}
            className="mb-6 rounded-md bg-[#0F3C66] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#154b8a]"
          >
            {t('hrReports.generatePayslip')}
          </button>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border border-gray-200 bg-white">
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                    {t('hrReports.colSN')}
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                    {t('hrReports.colMatricule')}
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                    {t('hrReports.colName')}
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                    {t('hrReports.colAccount')}
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                    {t('hrReports.colBaseSalary')}
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                    {t('hrReports.colTotalDeductions')}
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                    {t('hrReports.colNetSalary')}
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                    {t('hrReports.colType')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {salaryRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="border border-gray-200 px-4 py-16 text-center text-gray-500"
                    >
                      {t('hrReports.noData')}
                    </td>
                  </tr>
                ) : (
                  salaryRows.map((record, index) => (
                    <tr key={`${record.employee_id}-${index}`} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3 text-gray-700">{index + 1}</td>
                      <td className="border border-gray-200 px-4 py-3 font-medium text-[#0F3C66]">
                        {record.employee_id}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-gray-800">
                        {record.full_name}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-gray-700">
                        {record.account_number || '—'}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-gray-800">
                        {formatAmount(record.base_salary)}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-gray-800">
                        {formatAmount(record.total_deductions)}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 font-semibold text-gray-900">
                        {formatAmount(record.net_salary)}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-gray-700">{record.type}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {salaryRows.length > 0 ? (
                <tfoot>
                  <tr className="border border-gray-200 bg-gray-50 font-semibold text-gray-900">
                    <td
                      colSpan={4}
                      className="border border-gray-200 px-4 py-3 text-right uppercase tracking-wide"
                    >
                      {t('hrReports.totalSalaries')}
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      {formatAmount(salaryTotals.base_salary)}
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      {formatAmount(salaryTotals.total_deductions)}
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      {formatAmount(salaryTotals.net_salary)}
                    </td>
                    <td className="border border-gray-200 px-4 py-3" />
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'payrollPeriods') {
    const sorted = [...payrollReports].sort(
      (a, b) =>
        Number(b.period_year) - Number(a.period_year) ||
        Number(b.period_month) - Number(a.period_month)
    );
    return (
      <div className="p-6">
        <BackHeader title={t('hrReports.payrollPeriodsReport')} />
        <div className="rounded-lg bg-white p-6 shadow">
          <PrintButton
            onClick={() =>
              printTable(
                t('hrReports.payrollPeriodsReport'),
                [
                  '#',
                  t('hrReports.colPeriod'),
                  t('hrReports.colEmployeesCount'),
                  t('hrReports.colTotalDeductions'),
                  t('hrReports.colNetSalary'),
                  t('hrReports.colStatus'),
                ],
                sorted.map((r, i) => {
                  const items = r.items || [];
                  const deductions = items.reduce(
                    (s, it) =>
                      s +
                      Number(it.retraite || 0) +
                      Number(it.amu || 0) +
                      Number(it.deduction || 0) +
                      Number(it.its || 0),
                    0
                  );
                  const net = items.reduce((s, it) => s + Number(it.net_salary || 0), 0);
                  return [
                    String(i + 1),
                    r.period_label || `${r.period_month}/${r.period_year}`,
                    String(r.employee_count ?? items.length),
                    formatAmount(r.total_deductions ?? deductions),
                    formatAmount(r.total_net ?? net),
                    r.status || '—',
                  ];
                })
              )
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colPeriod')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colEmployeesCount')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colTotalDeductions')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colNetSalary')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sorted.length === 0 ? (
                  <EmptyRow cols={6} />
                ) : (
                  sorted.map((r, i) => {
                    const items = r.items || [];
                    const deductions = items.reduce(
                      (s, it) =>
                        s +
                        Number(it.retraite || 0) +
                        Number(it.amu || 0) +
                        Number(it.deduction || 0) +
                        Number(it.its || 0),
                      0
                    );
                    const net = items.reduce((s, it) => s + Number(it.net_salary || 0), 0);
                    return (
                      <tr key={rowId(r)} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{i + 1}</td>
                        <td className="px-4 py-3 font-medium">
                          {r.period_label || `${r.period_month}/${r.period_year}`}
                        </td>
                        <td className="px-4 py-3">{r.employee_count ?? items.length}</td>
                        <td className="px-4 py-3">
                          {formatAmount(r.total_deductions ?? deductions)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-green-600">
                          {formatAmount(r.total_net ?? net)}
                        </td>
                        <td className="px-4 py-3">{r.status || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'attendance') {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() => setCurrentView('main')}
          className="mb-4 flex items-center gap-2 text-sm text-[#0F3C66] hover:underline"
        >
          ← {t('hrReports.backToReports')}
        </button>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-700">
            {t('hrReports.attendancePageTitle')}
          </h1>
          <div className="rounded bg-[#EE964C]/10 px-2 py-1 text-xs font-bold uppercase tracking-widest text-[#EE964C]">
            {t('common.version')}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('hrReports.dateRange')}
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  const v = e.target.value;
                  setDateFrom(v);
                  setDateTo(v);
                }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('hrReports.employees')}
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
              >
                <option value="all">{t('hrReports.allTypes')}</option>
                {employees.map((emp) => {
                  const id = rowId(emp as { id?: string; _id?: string }) || emp.employee_id;
                  return (
                    <option key={id} value={id}>
                      {emp.employee_id ? `${emp.employee_id} — ${emp.full_name}` : emp.full_name}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('hrReports.search')}
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0F3C66] focus:ring-1 focus:ring-[#0F3C66]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('hrReports.colEmployeeId')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('hrReports.colFullName')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('hrReports.colPhone')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('hrReports.colAttendanceDate')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('hrReports.colStatus')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-[#0F3C66]">
                    {t('common.action')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-gray-500">
                      {t('hrReports.noData')}
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((record, index) => {
                    const date = record.date || record.attendance_date || '';
                    const emp = resolveEmployee(record.employee_id);
                    return (
                      <tr
                        key={rowId(record) || index}
                        className={index % 2 === 1 ? 'bg-gray-50/70' : 'bg-white'}
                      >
                        <td className="border-t border-gray-100 px-4 py-3 font-medium text-[#0F3C66]">
                          {emp?.employee_id || getEmployeeMatricule(record.employee_id)}
                        </td>
                        <td className="border-t border-gray-100 px-4 py-3 text-gray-800">
                          {emp?.full_name || getEmployeeName(record.employee_id)}
                        </td>
                        <td className="border-t border-gray-100 px-4 py-3 text-gray-700">
                          {emp?.phone_number || getEmployeePhone(record.employee_id)}
                        </td>
                        <td className="border-t border-gray-100 px-4 py-3 text-gray-700">
                          {date ? new Date(date).toLocaleDateString(locale) : '—'}
                        </td>
                        <td className="border-t border-gray-100 px-4 py-3 text-gray-700">
                          {record.status || '—'}
                        </td>
                        <td className="border-t border-gray-100 px-4 py-3">
                          <button
                            type="button"
                            className="rounded p-1.5 text-[#0F3C66] hover:bg-gray-100"
                            title={t('common.view')}
                            onClick={() => setAttendanceDetail(record)}
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {attendanceDetail && (() => {
          const emp = resolveEmployee(attendanceDetail.employee_id);
          const date = attendanceDetail.date || attendanceDetail.attendance_date || '';
          const detailRows: Array<[string, string]> = [
            [
              t('hrReports.colEmployeeId'),
              emp?.employee_id || getEmployeeMatricule(attendanceDetail.employee_id),
            ],
            [
              t('hrReports.colFullName'),
              emp?.full_name || getEmployeeName(attendanceDetail.employee_id),
            ],
            [
              t('hrReports.colPhone'),
              emp?.phone_number || getEmployeePhone(attendanceDetail.employee_id),
            ],
            [
              t('hrReports.colAttendanceDate'),
              date ? new Date(date).toLocaleDateString(locale) : '—',
            ],
            [t('hrReports.colStatus'), attendanceDetail.status || '—'],
          ];
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                  <h2 className="text-lg font-semibold text-[#0F3C66]">
                    {t('hrReports.attendanceDetailTitle')}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setAttendanceDetail(null)}
                    className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 p-5">
                  {detailRows.map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {label}
                      </div>
                      <div className="mt-1 text-sm text-gray-800 break-words">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 px-5 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setAttendanceDetail(null)}
                    className="rounded-md bg-[#0F3C66] px-4 py-2 text-sm font-medium text-white hover:bg-[#0c3154]"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  if (currentView === 'leave') {
    return (
      <div className="p-6">
        <BackHeader title={t('hrReports.leaveReport')} />
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="all">{t('employees.all')}</option>
              {employees.map((emp) => (
                <option key={rowId(emp as any)} value={rowId(emp as any)}>
                  {emp.full_name}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="all">{t('hrReports.colStatus')}</option>
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="cancelled">cancelled</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('common.search')}
              className="rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <PrintButton
            onClick={() =>
              printTable(
                t('hrReports.leaveReport'),
                [
                  '#',
                  t('hrReports.colFullName'),
                  t('leaveRequest.colLeaveType'),
                  t('leaveRequest.fieldStartDate'),
                  t('leaveRequest.fieldEndDate'),
                  t('leaveRequest.colDays'),
                  t('hrReports.colStatus'),
                ],
                filteredLeaves.map((r, i) => [
                  String(i + 1),
                  getEmployeeName(r.employee_id),
                  getLeaveTypeName(r.leave_type_id),
                  r.start_date,
                  r.end_date,
                  String(r.total_days ?? ''),
                  r.status,
                ])
              )
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colFullName')}</th>
                  <th className="px-4 py-3 text-left">{t('leaveRequest.colLeaveType')}</th>
                  <th className="px-4 py-3 text-left">{t('leaveRequest.fieldStartDate')}</th>
                  <th className="px-4 py-3 text-left">{t('leaveRequest.fieldEndDate')}</th>
                  <th className="px-4 py-3 text-left">{t('leaveRequest.colDays')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeaves.length === 0 ? (
                  <EmptyRow cols={7} />
                ) : (
                  filteredLeaves.map((req, i) => (
                    <tr key={rowId(req)} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{i + 1}</td>
                      <td className="px-4 py-3">{getEmployeeName(req.employee_id)}</td>
                      <td className="px-4 py-3">{getLeaveTypeName(req.leave_type_id)}</td>
                      <td className="px-4 py-3">{req.start_date}</td>
                      <td className="px-4 py-3">{req.end_date}</td>
                      <td className="px-4 py-3">{req.total_days ?? '—'}</td>
                      <td className="px-4 py-3 uppercase">{req.status}</td>
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

  if (currentView === 'leaveReturn') {
    return (
      <div className="p-6">
        <BackHeader title={t('hrReports.leaveReturnReport')} />
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="all">{t('employees.all')}</option>
              {employees.map((emp) => (
                <option key={rowId(emp as any)} value={rowId(emp as any)}>
                  {emp.full_name}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="all">{t('hrReports.colStatus')}</option>
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('common.search')}
              className="rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <PrintButton
            onClick={() =>
              printTable(
                t('hrReports.leaveReturnReport'),
                [
                  '#',
                  t('hrReports.colFullName'),
                  t('hrReports.colOriginalEnd'),
                  t('hrReports.colReturnDate'),
                  t('hrReports.colStatus'),
                ],
                filteredLeaveReturns.map((r, i) => [
                  String(i + 1),
                  getEmployeeName(r.employee_id),
                  r.original_end_date || '',
                  r.new_return_date || '',
                  r.status,
                ])
              )
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colFullName')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colOriginalEnd')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colReturnDate')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colComment')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeaveReturns.length === 0 ? (
                  <EmptyRow cols={6} />
                ) : (
                  filteredLeaveReturns.map((req, i) => (
                    <tr key={rowId(req)} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{i + 1}</td>
                      <td className="px-4 py-3">{getEmployeeName(req.employee_id)}</td>
                      <td className="px-4 py-3">{req.original_end_date || '—'}</td>
                      <td className="px-4 py-3">{req.new_return_date || '—'}</td>
                      <td className="px-4 py-3">{req.reason || '—'}</td>
                      <td className="px-4 py-3 uppercase">{req.status}</td>
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

  if (currentView === 'leaveTypes') {
    return (
      <div className="p-6">
        <BackHeader title={t('hrReports.leaveTypesReport')} />
        <div className="rounded-lg bg-white p-6 shadow">
          <PrintButton
            onClick={() =>
              printTable(
                t('hrReports.leaveTypesReport'),
                ['#', t('leaveTypes.colName'), t('leaveTypes.colDays'), t('leaveTypes.colType'), t('hrReports.colStatus')],
                leaveTypes.map((lt, i) => [
                  String(i + 1),
                  lt.name,
                  String(lt.days ?? lt.max_days_per_year ?? ''),
                  lt.period_type || '',
                  lt.is_active === false ? 'inactive' : 'active',
                ])
              )
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">{t('leaveTypes.colName')}</th>
                  <th className="px-4 py-3 text-left">{t('leaveTypes.colDays')}</th>
                  <th className="px-4 py-3 text-left">{t('leaveTypes.colType')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaveTypes.length === 0 ? (
                  <EmptyRow cols={5} />
                ) : (
                  leaveTypes.map((lt, i) => (
                    <tr key={rowId(lt)} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{i + 1}</td>
                      <td className="px-4 py-3">{lt.name}</td>
                      <td className="px-4 py-3">{lt.days ?? lt.max_days_per_year ?? '—'}</td>
                      <td className="px-4 py-3">{lt.period_type || '—'}</td>
                      <td className="px-4 py-3">
                        {lt.is_active === false ? 'inactive' : 'active'}
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

  if (currentView === 'documents') {
    return (
      <div className="p-6">
        <BackHeader title={t('hrReports.documentsReport')} />
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="all">{t('employees.all')}</option>
              {employees.map((emp) => (
                <option key={rowId(emp as any)} value={rowId(emp as any)}>
                  {emp.full_name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('common.search')}
              className="rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <PrintButton
            onClick={() =>
              printTable(
                t('hrReports.documentsReport'),
                [
                  '#',
                  t('hrReports.colFullName'),
                  t('hrReports.colDocType'),
                  t('hrReports.colDocName'),
                  t('hrReports.colUploadDate'),
                ],
                filteredDocuments.map((d, i) => [
                  String(i + 1),
                  getEmployeeName(d.employee_id),
                  d.document_type,
                  d.document_name,
                  d.upload_date || d.created_at || '',
                ])
              )
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colFullName')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colDocType')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colDocName')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colUploadDate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocuments.length === 0 ? (
                  <EmptyRow cols={5} />
                ) : (
                  filteredDocuments.map((doc, i) => (
                    <tr key={rowId(doc)} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{i + 1}</td>
                      <td className="px-4 py-3">{getEmployeeName(doc.employee_id)}</td>
                      <td className="px-4 py-3">{doc.document_type}</td>
                      <td className="px-4 py-3">{doc.document_name}</td>
                      <td className="px-4 py-3">
                        {doc.upload_date || doc.created_at
                          ? new Date(doc.upload_date || doc.created_at || '').toLocaleDateString(
                              locale
                            )
                          : '—'}
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

  if (currentView === 'professions') {
    return (
      <div className="p-6">
        <BackHeader title={t('hrReports.professionsReport')} />
        <div className="rounded-lg bg-white p-6 shadow">
          <PrintButton
            onClick={() =>
              printTable(
                t('hrReports.professionsReport'),
                ['#', t('leaveTypes.colName'), t('hrReports.colComment'), t('hrReports.colStatus')],
                professions.map((p, i) => [
                  String(i + 1),
                  p.name,
                  p.description || '',
                  p.is_active === false ? 'inactive' : 'active',
                ])
              )
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">{t('leaveTypes.colName')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colComment')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {professions.length === 0 ? (
                  <EmptyRow cols={4} />
                ) : (
                  professions.map((p, i) => (
                    <tr key={rowId(p)} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{i + 1}</td>
                      <td className="px-4 py-3">{p.name}</td>
                      <td className="px-4 py-3">{p.description || '—'}</td>
                      <td className="px-4 py-3">
                        {p.is_active === false ? 'inactive' : 'active'}
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

  if (currentView === 'contracts') {
    return (
      <div className="p-6">
        <BackHeader title={t('hrReports.contractsReport')} />
        <div className="rounded-lg bg-white p-6 shadow">
          <PrintButton
            onClick={() =>
              printTable(
                t('hrReports.contractsReport'),
                ['#', t('leaveTypes.colName'), t('hrReports.colComment'), t('hrReports.colStatus')],
                contracts.map((c, i) => [
                  String(i + 1),
                  c.name,
                  c.description || '',
                  c.is_active === false ? 'inactive' : 'active',
                ])
              )
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">{t('leaveTypes.colName')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colComment')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contracts.length === 0 ? (
                  <EmptyRow cols={4} />
                ) : (
                  contracts.map((c, i) => (
                    <tr key={rowId(c)} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{i + 1}</td>
                      <td className="px-4 py-3">{c.name}</td>
                      <td className="px-4 py-3">{c.description || '—'}</td>
                      <td className="px-4 py-3">
                        {c.is_active === false ? 'inactive' : 'active'}
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

  return null;
}
