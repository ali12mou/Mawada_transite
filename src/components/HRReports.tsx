import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ClipboardCheck, Eye, DollarSign } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  phone_number?: string;
  account_number?: string;
  base_salary?: number;
  created_at: string;
}

interface Attendance {
  id: string;
  employee_id: string;
  attendance_date: string;
  status: string;
  comments?: string;
  created_by?: string;
  created_at: string;
}

interface PayrollData {
  employee_id: string;
  full_name: string;
  account_number?: string;
  base_salary: number;
  total_deductions: number;
  net_salary: number;
  type: string;
}

export function HRReports() {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const [currentView, setCurrentView] = useState<'main' | 'salary' | 'attendance'>('main');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedEmployeeType, setSelectedEmployeeType] = useState('all');

  const [dateRange, setDateRange] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('employee_id', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .order('attendance_date', { ascending: false });

      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const getPayrollData = (): PayrollData[] => {
    return employees?.map(emp => {
      const baseSalary = emp.base_salary || 0;
      const totalDeductions = baseSalary * 0.15;
      const netSalary = baseSalary - totalDeductions;

      return {
        employee_id: emp.employee_id,
        full_name: emp.full_name,
        account_number: emp.account_number,
        base_salary: baseSalary,
        total_deductions: totalDeductions,
        net_salary: netSalary,
        type: 'Permanent'
      };
    });
  };

  const getFilteredAttendance = () => {
    let filtered = [...attendanceRecords];

    if (selectedEmployee !== 'All') {
      filtered = filtered.filter(record => record.employee_id === selectedEmployee);
    }

    if (searchTerm) {
      filtered = filtered.filter(record => {
        const employee = employees.find(emp => emp.id === record.employee_id);
        return employee?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee?.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    return filtered;
  };

  const years = ['2024', '2025', '2026'];
  const monthsFr = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const months = language === 'fr' ? monthsFr : monthsEn;

  if (currentView === 'main') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">{t('hrReports.title')}</h1>
          <p className="text-gray-600">{t('hrReports.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setCurrentView('salary')}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-8 text-left group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition">
                <DollarSign className="w-8 h-8 text-[#0F3C66]" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {t('hrReports.salaryReport')}
            </h2>
            <p className="text-gray-600 text-sm">
              {t('hrReports.salarySubtitle')}
            </p>
          </button>

          <button
            onClick={() => setCurrentView('attendance')}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-8 text-left group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition">
                <ClipboardCheck className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {t('hrReports.attendanceReport')}
            </h2>
            <p className="text-gray-600 text-sm">
              {t('hrReports.attendanceSubtitle')}
            </p>
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'salary') {
    const payrollData = getPayrollData();

    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => setCurrentView('main')}
            className="text-[#0F3C66] hover:underline mb-4 flex items-center gap-2"
          >
            ← {t('hrReports.backToReports')}
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">{t('hrReports.salaryReport')}</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('hrReports.selectYear')}
              </label>
              <select
                aria-label="selected-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              >
                <option value="">{t('hrReports.selectYear')}</option>
                {years?.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('hrReports.selectMonth')}
              </label>
              <select
                aria-label="selected-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              >
                <option value="">{t('hrReports.selectMonth')}</option>
                {months?.map((month, idx) => (
                  <option key={idx} value={month}>{month}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('hrReports.employeeTypes')}
              </label>
              <select
                aria-label="employee-type"
                value={selectedEmployeeType}
                onChange={(e) => setSelectedEmployeeType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              >
                <option value="all">{t('employees.all')}</option>
                <option value="Permanent">Permanent</option>
                <option value="Temporary">Temporaire</option>
                <option value="Contractual">Contractuel</option>
              </select>
            </div>
          </div>

          <button className="px-6 py-2 bg-[#0F3C66] text-white rounded-md hover:bg-[#154b8a] mb-6">
            {t('hrReports.generatePayslip')}
          </button>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('hrReports.colSN')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('hrReports.colMatricule')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('hrReports.colName')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('hrReports.colAccount')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('hrReports.colBaseSalary')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('hrReports.colTotalDeductions')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('hrReports.colNetSalary')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('hrReports.colType')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrollData.length > 0 ? (
                  payrollData?.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-[#0F3C66] font-medium">{record.employee_id}</td>
                      <td className="px-4 py-3 text-sm">{record.full_name}</td>
                      <td className="px-4 py-3 text-sm">{record.account_number || '-'}</td>
                      <td className="px-4 py-3 text-sm">{formatAmount(record.base_salary)}</td>
                      <td className="px-4 py-3 text-sm">{formatAmount(record.total_deductions)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatAmount(record.net_salary)}</td>
                      <td className="px-4 py-3 text-sm">{record.type}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      {t('hrReports.noData')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'attendance') {
    const filteredAttendance = getFilteredAttendance();

    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => setCurrentView('main')}
            className="text-[#0F3C66] hover:underline mb-4 flex items-center gap-2"
          >
            ← {t('hrReports.backToReports')}
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">
            {t('hrReports.attendanceReport')}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('hrReports.dateRange')}
              </label>
              <input
                type="date"
                aria-label="date-range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('hrReports.employees')}
              </label>
              <select
                aria-label="selected-employee"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              >
                <option value="All">{t('employees.all')}</option>
                {employees?.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.employee_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.search')}
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('common.search')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('hrReports.colEmployeeId')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('hrReports.colFullName')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('hrReports.colPhone')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('hrReports.colAttendanceDate')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('hrReports.colStatus')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('hrReports.colComment')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('hrReports.colAddedBy')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t('common.action')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttendance.length > 0 ? (
                  filteredAttendance?.map((record, index) => {
                    const employee = employees.find(emp => emp.id === record.employee_id);

                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-[#0F3C66] font-medium">
                          {employee?.employee_id || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">{employee?.full_name || '-'}</td>
                        <td className="px-4 py-3 text-sm">{employee?.phone_number || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(record.attendance_date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${record.status === 'Present'
                              ? 'bg-green-100 text-green-800'
                              : record.status === 'Absent'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{record.comments || '-'}</td>
                        <td className="px-4 py-3 text-sm">-</td>
                        <td className="px-4 py-3">
                          <button aria-label="view-attendance" className="text-blue-600 hover:text-blue-800">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      {t('hrReports.noData')}
                    </td>
                  </tr>
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


