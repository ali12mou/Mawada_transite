import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  DollarSign,
  ClipboardCheck,
  CalendarDays,
  RotateCcw,
  Tags,
  FileText,
  Briefcase,
  FileSignature,
  Wallet,
  Printer,
} from 'lucide-react';
import { genericApi } from '../../api/genericApi';
import { fetchEmployees, type Employee } from '../../api/hrApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';

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
  const win = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800');
  if (!win) return;
  const th = headers.map((h) => `<th>${h}</th>`).join('');
  const body = rows.length
    ? rows
        .map((r) => `<tr>${r.map((c) => `<td>${c || '—'}</td>`).join('')}</tr>`)
        .join('')
    : `<tr><td colspan="${headers.length}" style="text-align:center;padding:24px;">—</td></tr>`;
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;color:#111}
      h1{font-size:18px;margin:0 0 16px;color:#0F3C66}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}
      th{background:#f3f4f6}
      @media print{button{display:none}}
    </style></head><body>
    <h1>${title}</h1>
    <table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>
    <script>window.onload=()=>window.print()<\/script>
    </body></html>`);
  win.document.close();
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
      const id = rowId(e as { id?: string; _id?: string });
      if (id) map.set(id, e);
      if (e.employee_id) map.set(e.employee_id, e);
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

  const getEmployeeName = (id: string) => employeeById.get(id)?.full_name || '—';
  const getEmployeeMatricule = (id: string) =>
    employeeById.get(id)?.employee_id || id || '—';
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
      if (selectedEmployee !== 'all' && record.employee_id !== selectedEmployee) return false;
      if (dateFrom && date && date < dateFrom) return false;
      if (dateTo && date && date > dateTo) return false;
      if (selectedStatus !== 'all' && record.status?.toLowerCase() !== selectedStatus.toLowerCase()) {
        return false;
      }
      if (searchTerm) {
        const emp = employeeById.get(record.employee_id);
        const q = searchTerm.toLowerCase();
        if (
          !emp?.full_name?.toLowerCase().includes(q) &&
          !emp?.employee_id?.toLowerCase().includes(q)
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
    selectedStatus,
    searchTerm,
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
    icon: typeof Users;
    color: string;
  }[] = [
    {
      id: 'employees',
      title: t('hrReports.employeesReport'),
      subtitle: t('hrReports.employeesSubtitle'),
      icon: Users,
      color: 'bg-blue-50 text-[#0F3C66]',
    },
    {
      id: 'salary',
      title: t('hrReports.salaryReport'),
      subtitle: t('hrReports.salarySubtitle'),
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      id: 'payrollPeriods',
      title: t('hrReports.payrollPeriodsReport'),
      subtitle: t('hrReports.payrollPeriodsSubtitle'),
      icon: Wallet,
      color: 'bg-indigo-50 text-indigo-700',
    },
    {
      id: 'attendance',
      title: t('hrReports.attendanceReport'),
      subtitle: t('hrReports.attendanceSubtitle'),
      icon: ClipboardCheck,
      color: 'bg-green-50 text-green-700',
    },
    {
      id: 'leave',
      title: t('hrReports.leaveReport'),
      subtitle: t('hrReports.leaveSubtitle'),
      icon: CalendarDays,
      color: 'bg-orange-50 text-orange-700',
    },
    {
      id: 'leaveReturn',
      title: t('hrReports.leaveReturnReport'),
      subtitle: t('hrReports.leaveReturnSubtitle'),
      icon: RotateCcw,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      id: 'leaveTypes',
      title: t('hrReports.leaveTypesReport'),
      subtitle: t('hrReports.leaveTypesSubtitle'),
      icon: Tags,
      color: 'bg-cyan-50 text-cyan-700',
    },
    {
      id: 'documents',
      title: t('hrReports.documentsReport'),
      subtitle: t('hrReports.documentsSubtitle'),
      icon: FileText,
      color: 'bg-slate-50 text-slate-700',
    },
    {
      id: 'professions',
      title: t('hrReports.professionsReport'),
      subtitle: t('hrReports.professionsSubtitle'),
      icon: Briefcase,
      color: 'bg-violet-50 text-violet-700',
    },
    {
      id: 'contracts',
      title: t('hrReports.contractsReport'),
      subtitle: t('hrReports.contractsSubtitle'),
      icon: FileSignature,
      color: 'bg-rose-50 text-rose-700',
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
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-semibold text-gray-800">{t('hrReports.title')}</h1>
          <p className="text-gray-600">{t('hrReports.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {reportCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => void openReport(card.id)}
                className="rounded-lg bg-white p-8 text-left shadow transition hover:shadow-lg group"
              >
                <div className="mb-4 flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-lg ${card.color}`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                </div>
                <h2 className="mb-2 text-xl font-semibold text-gray-800">{card.title}</h2>
                <p className="text-sm text-gray-600">{card.subtitle}</p>
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
        <BackHeader title={t('hrReports.salaryReport')} />
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">{t('hrReports.selectYear')}</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">{t('hrReports.selectMonth')}</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedEmployeeType}
              onChange={(e) => setSelectedEmployeeType(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="all">{t('employees.all')}</option>
              <option value="Permanent">Permanent</option>
              <option value="Temporary">Temporaire</option>
              <option value="Contractual">Contractuel</option>
              <option value="Taxable">{t('employees.typeTaxable')}</option>
              <option value="Non-Taxable">{t('employees.typeNonTaxable')}</option>
            </select>
          </div>
          <PrintButton
            onClick={() =>
              printTable(
                t('hrReports.salaryReport'),
                [
                  '#',
                  t('hrReports.colMatricule'),
                  t('hrReports.colName'),
                  t('hrReports.colBaseSalary'),
                  t('hrReports.colTotalDeductions'),
                  t('hrReports.colNetSalary'),
                  t('hrReports.colType'),
                ],
                salaryRows.map((r, i) => [
                  String(i + 1),
                  r.employee_id,
                  r.full_name,
                  formatAmount(r.base_salary),
                  formatAmount(r.total_deductions),
                  formatAmount(r.net_salary),
                  r.type,
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
                  <th className="px-4 py-3 text-left">{t('hrReports.colAccount')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colBaseSalary')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colTotalDeductions')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colNetSalary')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colType')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {salaryRows.length === 0 ? (
                  <EmptyRow cols={8} />
                ) : (
                  salaryRows.map((record, index) => (
                    <tr key={`${record.employee_id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-[#0F3C66]">{record.employee_id}</td>
                      <td className="px-4 py-3">{record.full_name}</td>
                      <td className="px-4 py-3">{record.account_number}</td>
                      <td className="px-4 py-3">{formatAmount(record.base_salary)}</td>
                      <td className="px-4 py-3">{formatAmount(record.total_deductions)}</td>
                      <td className="px-4 py-3 font-semibold text-green-600">
                        {formatAmount(record.net_salary)}
                      </td>
                      <td className="px-4 py-3">{record.type}</td>
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
        <BackHeader title={t('hrReports.attendanceReport')} />
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
              aria-label={t('hrReports.dateFrom')}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
              aria-label={t('hrReports.dateTo')}
            />
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
                t('hrReports.attendanceReport'),
                [
                  '#',
                  t('hrReports.colMatricule'),
                  t('hrReports.colFullName'),
                  t('hrReports.colAttendanceDate'),
                  t('hrReports.colStatus'),
                  t('hrReports.colCheckIn'),
                  t('hrReports.colCheckOut'),
                ],
                filteredAttendance.map((r, i) => [
                  String(i + 1),
                  getEmployeeMatricule(r.employee_id),
                  getEmployeeName(r.employee_id),
                  r.date || r.attendance_date || '',
                  r.status,
                  r.check_in || '',
                  r.check_out || '',
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
                  <th className="px-4 py-3 text-left">{t('hrReports.colFullName')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colAttendanceDate')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colStatus')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colCheckIn')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colCheckOut')}</th>
                  <th className="px-4 py-3 text-left">{t('hrReports.colComment')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAttendance.length === 0 ? (
                  <EmptyRow cols={8} />
                ) : (
                  filteredAttendance.map((record, index) => {
                    const date = record.date || record.attendance_date || '';
                    return (
                      <tr key={rowId(record) || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-[#0F3C66]">
                          {getEmployeeMatricule(record.employee_id)}
                        </td>
                        <td className="px-4 py-3">{getEmployeeName(record.employee_id)}</td>
                        <td className="px-4 py-3">
                          {date ? new Date(date).toLocaleDateString(locale) : '—'}
                        </td>
                        <td className="px-4 py-3">{record.status}</td>
                        <td className="px-4 py-3">{record.check_in || '—'}</td>
                        <td className="px-4 py-3">{record.check_out || '—'}</td>
                        <td className="px-4 py-3">{record.notes || record.comments || '—'}</td>
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
