import { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp, Receipt, Banknote, Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { fetchDashboardStats, DashboardStats } from '../api/dashboardApi';
import { fetchEmployees, Employee } from '../api/hrApi';

export function Dashboard() {
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [stats, emps] = await Promise.all([
        fetchDashboardStats(),
        fetchEmployees()
      ]);
      setData(stats);
      setEmployees(emps || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const newEmployees = employees.filter(emp => {
    if (!emp.employment_date) return false;
    const empDate = new Date(emp.employment_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return empDate >= thirtyDaysAgo;
  });

  const onLeaveEmployees = employees.filter(emp => emp.status === 'on_leave');

  const genderStats = {
    male: employees.filter(e => e.gender?.toLowerCase() === 'male').length,
    female: employees.filter(e => e.gender?.toLowerCase() === 'female').length,
  };

  const malePercent = employees.length > 0 ? (genderStats.male / employees.length) * 100 : 0;
  const femalePercent = employees.length > 0 ? (genderStats.female / employees.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t('dashboard.monthlyRevenue')}
          value={formatAmount(data?.overview.totalRevenue || 0)}
          mom={data?.overview.revenueMoM}
          icon={<Banknote className="text-blue-600" size={24} />}
          color="blue"
        />
        <StatCard 
          title={t('dashboard.deliveredOrders')}
          value={String(data?.overview.totalOrders || 0)}
          mom={data?.overview.ordersMoM}
          icon={<Receipt className="text-purple-600" size={24} />}
          color="purple"
        />
        <StatCard 
          title={t('dashboard.monthlyExpenses')}
          value={formatAmount(data?.overview.totalExpenses || 0)}
          mom={data?.overview.expenseMoM}
          icon={<TrendingDown className="text-orange-600" size={24} />}
          color="orange"
          inverse
        />
        <StatCard 
          title={t('dashboard.employees')}
          value={String(data?.overview.activeEmployees || 0)}
          icon={<Users className="text-green-600" size={24} />}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Activity Chart Placeholder */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">{t('dashboard.orderActivity')}</h3>
            <div className="flex gap-4 text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span>{t('dashboard.completed')}: {data?.orders.completed}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                <span>{t('dashboard.pending')}: {data?.orders.pending}</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {[65, 45, 75, 55, 85, 40, 60, 90, 70, 50, 80, 55, 45, 65, 75, 45, 55, 35, 65, 85].map((h, i) => (
              <div key={i} className="flex-1 space-y-1">
                <div className="bg-blue-600/80 rounded-t w-full" style={{ height: `${h}%` }}></div>
                <div className="bg-purple-600/80 w-full" style={{ height: `${h * 0.4}%` }}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Employees */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">{t('dashboard.recentEmployees')}</h3>
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded">NEW</span>
          </div>
          <div className="space-y-4">
            {newEmployees.slice(0, 6).map((emp) => (
              <div key={emp.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                  {emp.full_name.substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900 truncate">{emp.full_name}</div>
                  <div className="text-xs text-gray-500 truncate">{emp.profession || '-'}</div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-[10px] text-gray-400 font-medium">{emp.employment_date}</div>
                  <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-bold uppercase tracking-wider mt-1">NEW</span>
                </div>
              </div>
            ))}
            {newEmployees.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-gray-500 text-sm italic">{t('dashboard.noNewEmployees')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gender Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6">{t('dashboard.genderDiversity')}</h3>
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40 mb-6">
              <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                <circle 
                  cx="50" cy="50" r="40" fill="none" stroke="#2563EB" strokeWidth="12" 
                  strokeDasharray={`${malePercent * 2.51} 251`} 
                />
                <circle 
                  cx="50" cy="50" r="40" fill="none" stroke="#EC4899" strokeWidth="12" 
                  strokeDasharray={`${femalePercent * 2.51} 251`} 
                  strokeDashoffset={`-${malePercent * 2.51}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">{t('dashboard.total')}</div>
                  <div className="text-2xl font-black text-gray-900">{employees.length}</div>
                </div>
              </div>
            </div>
            <div className="w-full flex justify-around">
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1 justify-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full shadow-sm"></div>
                  <span className="text-sm font-bold text-gray-700">Male</span>
                </div>
                <div className="text-lg font-black text-blue-600">{malePercent.toFixed(0)}%</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">{genderStats.male} {t('dashboard.employees')}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1 justify-center">
                  <div className="w-3 h-3 bg-pink-500 rounded-full shadow-sm"></div>
                  <span className="text-sm font-bold text-gray-700">Female</span>
                </div>
                <div className="text-lg font-black text-pink-500">{femalePercent.toFixed(0)}%</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">{genderStats.female} {t('dashboard.employees')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* On Leave Employees */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6">{t('dashboard.onLeaveEmployees')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <th className="pb-4 px-2">{t('employees.colId')}</th>
                  <th className="pb-4 px-2">{t('employees.colName')}</th>
                  <th className="pb-4 px-2">{t('employees.colProfession')}</th>
                  <th className="pb-4 px-2 text-right">{t('employees.colRemainingLeave')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {onLeaveEmployees.map((emp) => (
                  <tr key={emp.id} className="text-sm group hover:bg-gray-50/50 transition">
                    <td className="py-4 px-2 font-mono text-xs text-blue-600 font-bold">{emp.employee_id}</td>
                    <td className="py-4 px-2 font-bold text-gray-900">{emp.full_name}</td>
                    <td className="py-4 px-2 text-gray-500">{emp.profession || '-'}</td>
                    <td className="py-4 px-2 text-right">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-black">
                        {emp.leave_days_remaining} {t('dashboard.days')}
                      </span>
                    </td>
                  </tr>
                ))}
                {onLeaveEmployees.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400 italic">
                      {t('dashboard.noEmployeesOnLeave')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="text-center text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] pt-8">
        © 2025 GEOSOM TRANSIT & LOGISTICS • POWERED BY MONGODB
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  mom?: string;
  icon: React.ReactNode;
  color: string;
  inverse?: boolean;
}

function StatCard({ title, value, mom, icon, color, inverse = false }: StatCardProps) {
  const isPositive = Number(mom || 0) >= 0;
  const isUp = isPositive;
  const iconBgClass = {
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50',
    green: 'bg-green-50',
  }[color] || 'bg-gray-50';

  let sentimentClass = '';
  if (mom) {
    if (inverse) {
      sentimentClass = isUp ? 'text-red-600' : 'text-green-600';
    } else {
      sentimentClass = isUp ? 'text-green-600' : 'text-red-600';
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-2.5 ${iconBgClass} rounded-lg group-hover:scale-110 transition`}>
          {icon}
        </div>
        {mom && (
          <div className={`flex items-center gap-1 ${sentimentClass} text-xs font-black tracking-tighter`}>
            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{isUp ? '+' : ''}{mom}%</span>
          </div>
        )}
      </div>
      <div className="relative z-10">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</div>
        <div className="text-2xl font-black text-gray-900">{value}</div>
      </div>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${iconBgClass} opacity-20 rounded-full group-hover:scale-125 transition`}></div>
    </div>
  );
}
