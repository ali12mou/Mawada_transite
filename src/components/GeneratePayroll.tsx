import { useState, useEffect } from 'react';
import { DollarSign, Calculator, Save, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

interface Employee {
  id: string;
  full_name: string;
  base_salary: number;
}

interface PayrollItem {
  employee_id: string;
  employee_name: string;
  base_salary: number;
  bonuses: number;
  deductions: number;
  tax_amount: number;
  net_salary: number;
}

export function GeneratePayroll() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, base_salary')
        .order('full_name');

      if (error) throw error;

      const items: PayrollItem[] = (data || [])?.map(emp => ({
        employee_id: emp.id,
        employee_name: emp.full_name,
        base_salary: emp.base_salary || 0,
        bonuses: 0,
        deductions: 0,
        tax_amount: 0,
        net_salary: emp.base_salary || 0,
      }));

      setEmployees(data || []);
      setPayrollItems(items);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTax = (grossSalary: number) => {
    if (grossSalary <= 1000) return 0;
    if (grossSalary <= 3000) return grossSalary * 0.10;
    if (grossSalary <= 5000) return grossSalary * 0.15;
    return grossSalary * 0.20;
  };

  const updatePayrollItem = (employeeId: string, field: string, value: number) => {
    setPayrollItems(prev => prev?.map(item => {
      if (item.employee_id === employeeId) {
        const updated = { ...item, [field]: value };
        const grossSalary = updated.base_salary + updated.bonuses - updated.deductions;
        updated.tax_amount = calculateTax(grossSalary);
        updated.net_salary = grossSalary - updated.tax_amount;
        return updated;
      }
      return item;
    }));
  };

  const handleGeneratePayroll = async () => {
    if (!confirm(`Generate payroll for ${selectedMonth}/${selectedYear}?`)) return;

    setSaving(true);
    try {
      const payrollData = payrollItems?.map(item => ({
        employee_id: item.employee_id,
        period_month: selectedMonth,
        period_year: selectedYear,
        base_salary: item.base_salary,
        bonuses: item.bonuses,
        deductions: item.deductions,
        tax_amount: item.tax_amount,
        net_salary: item.net_salary,
        status: 'draft',
        generated_by: user?.id,
      }));

      const { error } = await supabase
        .from('payroll')
        .insert(payrollData);

      if (error) throw error;

      alert('Payroll generated successfully!');
    } catch (error) {
      console.error('Error generating payroll:', error);
      alert('Error generating payroll. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => formatAmount(amount);

  const totalPayroll = payrollItems.reduce((sum, item) => sum + item.net_salary, 0);
  const totalTax = payrollItems.reduce((sum, item) => sum + item.tax_amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Generate Payroll</h2>
          <p className="text-gray-600 mt-1">Calculate and generate employee payroll</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Gross Payroll</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(payrollItems.reduce((sum, item) => sum + item.base_salary + item.bonuses - item.deductions, 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tax</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalTax)}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Calculator className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Net Payroll</p>
              <p className="text-2xl font-bold text-[#0F3C66]">{formatCurrency(totalPayroll)}</p>
            </div>
            <div className="w-12 h-12 bg-[#0F3C66] rounded-lg flex items-center justify-center">
              <DollarSign className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]?.map(month => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
            />
          </div>
          <div className="flex-1"></div>
          <button
            onClick={handleGeneratePayroll}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-[#0F3C66] text-white rounded-lg hover:bg-[#154b8a] transition disabled:opacity-50 mt-6"
          >
            <Save size={20} />
            {saving ? 'Generating...' : 'Generate Payroll'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bonuses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tax
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Salary
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrollItems?.map((item) => (
                <tr key={item.employee_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{item.employee_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(item.base_salary)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      step="0.01"
                      value={item.bonuses}
                      onChange={(e) => updatePayrollItem(item.employee_id, 'bonuses', parseFloat(e.target.value) || 0)}
                      className="w-28 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      step="0.01"
                      value={item.deductions}
                      onChange={(e) => updatePayrollItem(item.employee_id, 'deductions', parseFloat(e.target.value) || 0)}
                      className="w-28 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0F3C66] focus:border-transparent"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-red-600 font-medium">
                      {formatCurrency(item.tax_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-[#0F3C66]">
                      {formatCurrency(item.net_salary)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


