import { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp, Receipt, Banknote, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

interface Stats {
  monthlyRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalExpenses: number;
  deliveredOrders: number;
  lastMonthRevenue: number;
  lastMonthExpenses: number;
  lastMonthDeliveredOrders: number;
}

function monthOverMonthPct(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  phone_number: string;
  position: string;
  gender: string;
  residence_status: string;
  hire_date: string;
  status: string;
  absent_days: number;
  leave_days_remaining: number;
}

export function Dashboard() {
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [stats, setStats] = useState<Stats>({
    monthlyRevenue: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalExpenses: 0,
    deliveredOrders: 0,
    lastMonthRevenue: 0,
    lastMonthExpenses: 0,
    lastMonthDeliveredOrders: 0,
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('*');

      const { data: expenses } = await supabase
        .from('expenses')
        .select('*');

      const { data: employeesData } = await supabase
        .from('employees')
        .select('*');

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const monthlyOrders = orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      }) || [];

      const monthlyExpenses = expenses?.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      }) || [];

      const lastMonthOrders = orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === prevMonth && orderDate.getFullYear() === prevYear;
      }) || [];

      const lastMonthExpensesList = expenses?.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === prevMonth && expenseDate.getFullYear() === prevYear;
      }) || [];

      const revenue = monthlyOrders.reduce((sum, order) =>
        order.status === 'completed' ? sum + parseFloat(order.amount) : sum, 0
      );

      const totalExp = monthlyExpenses.reduce((sum, expense) =>
        sum + parseFloat(expense.amount), 0
      );

      const lastMonthRevenue = lastMonthOrders.reduce((sum, order) =>
        order.status === 'completed' ? sum + parseFloat(order.amount) : sum, 0
      );

      const lastMonthExp = lastMonthExpensesList.reduce((sum, expense) =>
        sum + parseFloat(expense.amount), 0
      );

      const lastMonthDelivered = lastMonthOrders.filter(o => o.status === 'completed').length;

      setStats({
        monthlyRevenue: revenue,
        totalOrders: monthlyOrders.length,
        completedOrders: monthlyOrders.filter(o => o.status === 'completed').length,
        pendingOrders: monthlyOrders.filter(o => o.status === 'pending').length,
        totalExpenses: totalExp,
        deliveredOrders: monthlyOrders.filter(o => o.status === 'completed').length,
        lastMonthRevenue,
        lastMonthExpenses: lastMonthExp,
        lastMonthDeliveredOrders: lastMonthDelivered,
      });

      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const newEmployees = employees.filter(emp => {
    const hireDate = new Date(emp.hire_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return hireDate >= thirtyDaysAgo;
  });

  const onLeaveEmployees = employees.filter(emp => emp.status === 'on_leave');

  const genderStats = {
    male: employees.filter(e => e.gender === 'male').length,
    female: employees.filter(e => e.gender === 'female').length,
  };

  const residenceStats = {
    citizen: employees.filter(e => e.residence_status === 'citizen').length,
    foreign: employees.filter(e => e.residence_status === 'foreign').length,
  };

  const malePercentage = employees.length > 0 ? ((genderStats.male / employees.length) * 100).toFixed(1) : 0;
  const femalePercentage = employees.length > 0 ? ((genderStats.female / employees.length) * 100).toFixed(1) : 0;
  const citizenPercentage = employees.length > 0 ? ((residenceStats.citizen / employees.length) * 100).toFixed(1) : 0;
  const foreignPercentage = employees.length > 0 ? ((residenceStats.foreign / employees.length) * 100).toFixed(1) : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-64">{t('common.loading')}</div>;
  }

  const revenueMoM = monthOverMonthPct(stats.monthlyRevenue, stats.lastMonthRevenue);
  const expensesMoM = monthOverMonthPct(stats.totalExpenses, stats.lastMonthExpenses);
  const deliveredMoM = monthOverMonthPct(stats.deliveredOrders, stats.lastMonthDeliveredOrders);
  const revenueUp = stats.monthlyRevenue >= stats.lastMonthRevenue;
  const expensesUp = stats.totalExpenses >= stats.lastMonthExpenses;
  const deliveredUp = stats.deliveredOrders >= stats.lastMonthDeliveredOrders;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-sm border border-green-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{formatAmount(stats.monthlyRevenue)}</p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-lg">
              <Banknote className="text-green-600" size={24} aria-hidden />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600 flex-wrap">
            <span>{`Last Month: ${formatAmount(stats.lastMonthRevenue)} (${revenueMoM.toFixed(2)}%)`}</span>
            {revenueUp ? (
              <TrendingUp size={16} className="text-green-600" aria-hidden />
            ) : (
              <TrendingDown size={16} className="text-green-600" aria-hidden />
            )}
            <span className={revenueUp ? 'text-green-600' : 'text-amber-700'}>
              {revenueUp ? 'Increased' : 'Decreased'}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 shadow-sm border border-orange-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <div className="bg-[#EE964C]/10 p-3 rounded-lg">
              <Receipt className="text-[#EE964C]" size={24} />
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">{stats.completedOrders} Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">{stats.pendingOrders} Pending</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm border border-blue-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Total Expenses</p>
              <p className="text-3xl font-bold text-gray-900">{formatAmount(stats.totalExpenses)}</p>
            </div>
            <div className="bg-[#0F3C66]/10 p-3 rounded-lg">
              <Banknote className="text-[#0F3C66]" size={24} aria-hidden />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600 flex-wrap">
            <span>{`Last Month: ${formatAmount(stats.lastMonthExpenses)} (${expensesMoM.toFixed(2)}%)`}</span>
            {expensesUp ? (
              <TrendingUp size={16} className="text-blue-600" aria-hidden />
            ) : (
              <TrendingDown size={16} className="text-blue-600" aria-hidden />
            )}
            <span className={expensesUp ? 'text-blue-600' : 'text-amber-700'}>
              {expensesUp ? 'Increased' : 'Decreased'}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Delivered Orders</p>
              <p className="text-3xl font-bold text-gray-900">{stats.deliveredOrders}</p>
            </div>
            <div className="bg-gray-400/10 p-3 rounded-lg">
              <Truck className="text-gray-700" size={24} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600 flex-wrap">
            <span>{`Last Month: ${stats.lastMonthDeliveredOrders} (${deliveredMoM.toFixed(2)}%)`}</span>
            {deliveredUp ? (
              <TrendingUp size={16} className="text-green-600" aria-hidden />
            ) : (
              <TrendingDown size={16} className="text-green-600" aria-hidden />
            )}
            <span className={deliveredUp ? 'text-green-600' : 'text-amber-700'}>
              {deliveredUp ? 'Increased' : 'Decreased'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tendances des commandes mensuelles</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p>No Data found for this chart based on this month, Check Back Later</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tendances mensuelles des revenus et des profits</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Revenu payé</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Montant du profit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tendances des Dépenses Mensuelles</h3>
          <div className="h-48 flex items-center justify-center text-gray-400">
            Chart placeholder
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Dépenses par type</h3>
          <div className="h-48 flex items-center justify-center text-gray-400">
            Chart placeholder
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Newly Joined Employees <span className="text-blue-600">{newEmployees.length}</span> And Total Employees Are <span className="text-blue-600">{employees.length}</span>
          </h3>
          <div className="overflow-x-auto">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <select aria-label="rows-per-page" className="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option>5</option>
                  <option>10</option>
                  <option>25</option>
                </select>
              </div>
              <input
                type="text"
                placeholder={t('common.search')}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              />
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Employee ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Position</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Hire Date</th>
                </tr>
              </thead>
              <tbody>
                {newEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  newEmployees.slice(0, 5)?.map((emp) => (
                    <tr key={emp.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{emp.employee_id}</td>
                      <td className="py-3 px-4 text-sm">{emp.full_name}</td>
                      <td className="py-3 px-4 text-sm">{emp.position}</td>
                      <td className="py-3 px-4 text-sm">{new Date(emp.hire_date).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="mt-4 text-sm text-gray-600">
              Showing {Math.min(newEmployees.length, 5)} to {newEmployees.length} of {newEmployees.length} entries
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">On Leave Employees</h3>
          <div className="overflow-x-auto">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <select aria-label="rows-per-page" className="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option>5</option>
                  <option>10</option>
                  <option>25</option>
                </select>
              </div>
              <input
                type="text"
                placeholder={t('common.search')}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              />
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Employee ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Remaining Days</th>
                </tr>
              </thead>
              <tbody>
                {onLeaveEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  onLeaveEmployees.slice(0, 5)?.map((emp) => (
                    <tr key={emp.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{emp.employee_id}</td>
                      <td className="py-3 px-4 text-sm">{emp.full_name}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                          On Leave
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{emp.leave_days_remaining}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="mt-4 text-sm text-gray-600">
              Showing {Math.min(onLeaveEmployees.length, 5)} to {onLeaveEmployees.length} of {onLeaveEmployees.length} entries
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Diversité des genres</h3>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#0F3C66"
                  strokeWidth="20"
                  strokeDasharray={`${femalePercentage * 2.51} 251`}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#EE964C"
                  strokeWidth="20"
                  strokeDasharray={`${malePercentage * 2.51} 251`}
                  strokeDashoffset={`-${femalePercentage * 2.51}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#0F3C66]">{femalePercentage}%</div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#0F3C66] rounded-full"></div>
                <span className="text-sm text-gray-700">Female</span>
              </div>
              <span className="text-sm font-semibold">{genderStats.female}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#EE964C] rounded-full"></div>
                <span className="text-sm text-gray-700">Male</span>
              </div>
              <span className="text-sm font-semibold">{genderStats.male}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Statut de Résidence</h3>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#0F3C66"
                  strokeWidth="20"
                  strokeDasharray={`${citizenPercentage * 2.51} 251`}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#EE964C"
                  strokeWidth="20"
                  strokeDasharray={`${foreignPercentage * 2.51} 251`}
                  strokeDashoffset={`-${citizenPercentage * 2.51}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#0F3C66]">{citizenPercentage}%</div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#0F3C66] rounded-full"></div>
                <span className="text-sm text-gray-700">citizen</span>
              </div>
              <span className="text-sm font-semibold">{residenceStats.citizen}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#EE964C] rounded-full"></div>
                <span className="text-sm text-gray-700">Foriegn</span>
              </div>
              <span className="text-sm font-semibold">{residenceStats.foreign}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="overflow-x-auto">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <select aria-label="rows-per-page" className="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option>5</option>
                </select>
              </div>
              <input
                type="text"
                placeholder={t('common.search')}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              />
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Employee ID</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Full Name</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Phone Number</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Absent Days</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-sm">-</td>
                  </tr>
                ) : (
                  employees.slice(0, 1)?.map((emp) => (
                    <tr key={emp.id} className="border-b">
                      <td className="py-2 px-2 text-xs">-</td>
                      <td className="py-2 px-2 text-xs">-</td>
                      <td className="py-2 px-2 text-xs">-</td>
                      <td className="py-2 px-2 text-xs">No data available</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="mt-2 text-xs text-gray-600">
              Showing 1 to 1 of 1 entries
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 py-4">
        2025© GEOSOM Technologies.
      </div>
    </div>
  );
}


