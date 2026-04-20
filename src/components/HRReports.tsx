import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, ClipboardCheck, Eye, DollarSign, Calendar } from 'lucide-react';
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
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [currentView, setCurrentView] = useState<'main' | 'salary' | 'attendance'>('main');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedEmployeeType, setSelectedEmployeeType] = useState('Tous');

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
    } finally {
      setLoading(false);
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
    return employees.map(emp => {
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
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  if (currentView === 'main') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Rapports RH</h1>
          <p className="text-gray-600">Tous les rapports de celui sélectionné</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setCurrentView('salary')}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-8 text-left group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition">
                <DollarSign className="w-8 h-8 text-[#1e3a5f]" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Rapport mensuel sur les salaires
            </h2>
            <p className="text-gray-600 text-sm">
              View monthly salary reports.
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
              Rapport de présence (manuel)
            </h2>
            <p className="text-gray-600 text-sm">
              View manual attendance records.
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
            className="text-[#1e3a5f] hover:underline mb-4 flex items-center gap-2"
          >
            ← Retour aux rapports
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">Rapport de salaire mensuel</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner une année
              </label>
              <select
                aria-label="selected-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              >
                <option value="">Select Year</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un mois
              </label>
              <select
                aria-label="selected-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              >
                <option value="">Select Month</option>
                {months.map((month, idx) => (
                  <option key={idx} value={month}>{month}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Types d'employés
              </label>
              <select
                aria-label="employee-type"
                value={selectedEmployeeType}
                onChange={(e) => setSelectedEmployeeType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              >
                <option value="Tous">Tous</option>
                <option value="Permanent">Permanent</option>
                <option value="Temporaire">Temporaire</option>
                <option value="Contractuel">Contractuel</option>
              </select>
            </div>
          </div>

          <button className="px-6 py-2 bg-[#1e3a5f] text-white rounded-md hover:bg-[#2d4a6f] mb-6">
            Générer une lettre de paie
          </button>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">SN</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Matricule</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Numéro de compte</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Salaire de base</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Déductions totales</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Salaire net</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrollData.length > 0 ? (
                  payrollData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-[#1e3a5f] font-medium">{record.employee_id}</td>
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
                      No Data Found
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
            className="text-[#1e3a5f] hover:underline mb-4 flex items-center gap-2"
          >
            ← Retour aux rapports
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">
            Rapport de présence des employés (manuel)
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plage de dates
              </label>
              <input
                type="date"
                aria-label="date-range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employés
              </label>
              <select
                aria-label="selected-employee"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              >
                <option value="All">All</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.employee_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('common.search')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID Employé</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nom complet</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Numéro de téléphone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date de présence</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Commentaire</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ajouté par</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttendance.length > 0 ? (
                  filteredAttendance.map((record, index) => {
                    const employee = employees.find(emp => emp.id === record.employee_id);

                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-[#1e3a5f] font-medium">
                          {employee?.employee_id || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">{employee?.full_name || '-'}</td>
                        <td className="px-4 py-3 text-sm">{employee?.phone_number || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(record.attendance_date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                            record.status === 'Present'
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
                      Aucune donnée trouvée
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
