import { useState, useEffect } from 'react';
import { Check, X, Eye, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

interface Payroll {
  id: string;
  employee_id: string;
  period_month: number;
  period_year: number;
  base_salary: number;
  bonuses: number;
  deductions: number;
  tax_amount: number;
  net_salary: number;
  status: string;
  generated_by: string;
  approved_by: string;
  approved_at: string;
  notes: string;
  created_at: string;
}

interface Employee {
  id: string;
  full_name: string;
}

export function PayrollApproval() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .select('*')
        .in('status', ['draft', 'pending_approval'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayrolls(data || []);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleApprove = async (payrollId: string) => {
    if (!confirm('Approve this payroll?')) return;

    try {
      const { error } = await supabase
        .from('payroll')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payrollId);

      if (error) throw error;

      fetchPayrolls();
      setShowDetails(false);
      alert('Payroll approved successfully!');
    } catch (error) {
      console.error('Error approving payroll:', error);
      alert('Error approving payroll. Please try again.');
    }
  };

  const handleReject = async (payrollId: string) => {
    const reason = prompt('Enter reason for rejection:');
    if (!reason) return;

    try {
      const { error } = await supabase
        .from('payroll')
        .update({
          status: 'rejected',
          notes: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payrollId);

      if (error) throw error;

      fetchPayrolls();
      setShowDetails(false);
      alert('Payroll rejected.');
    } catch (error) {
      console.error('Error rejecting payroll:', error);
      alert('Error rejecting payroll. Please try again.');
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.full_name : 'Unknown';
  };

  const formatCurrency = (amount: number) => formatAmount(amount);

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Payroll Approval</h2>
          <p className="text-gray-600 mt-1">Review and approve employee payrolls</p>
        </div>
      </div>

      {showDetails && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Payroll Details</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Employee</label>
                  <div className="font-semibold">{getEmployeeName(selectedPayroll.employee_id)}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Period</label>
                  <div className="font-semibold">
                    {getMonthName(selectedPayroll.period_month)} {selectedPayroll.period_year}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Base Salary</label>
                    <div className="text-lg font-semibold">{formatCurrency(selectedPayroll.base_salary)}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Bonuses</label>
                    <div className="text-lg font-semibold text-green-600">{formatCurrency(selectedPayroll.bonuses)}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Deductions</label>
                    <div className="text-lg font-semibold text-red-600">{formatCurrency(selectedPayroll.deductions)}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Tax</label>
                    <div className="text-lg font-semibold text-red-600">{formatCurrency(selectedPayroll.tax_amount)}</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-sm text-gray-600">Net Salary</label>
                <div className="text-2xl font-bold text-[#0F3C66]">{formatCurrency(selectedPayroll.net_salary)}</div>
              </div>

              {selectedPayroll.notes && (
                <div className="border-t pt-4">
                  <label className="text-sm text-gray-600">Notes</label>
                  <div className="text-sm text-gray-800">{selectedPayroll.notes}</div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => handleReject(selectedPayroll.id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <X size={20} />
                Reject
              </button>
              <button
                onClick={() => handleApprove(selectedPayroll.id)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Check size={20} />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrolls?.map((payroll) => (
                <tr key={payroll.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {getEmployeeName(payroll.employee_id)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getMonthName(payroll.period_month)} {payroll.period_year}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(payroll.base_salary)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-[#0F3C66]">
                      {formatCurrency(payroll.net_salary)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payroll.status)}`}>
                      {payroll.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedPayroll(payroll);
                          setShowDetails(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleApprove(payroll.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleReject(payroll.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {payrolls.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No payrolls pending approval.
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


