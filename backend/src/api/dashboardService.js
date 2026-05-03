import { Expense } from '../models/Expense.model.js';
import Order from '../models/Order.model.js';
import { Employee } from '../models/Employee.model.js';

export async function getDashboardStats() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfLastMonth = new Date(startOfMonth);
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

  // Parallel execution for performance
  const [
    totalOrders,
    pendingOrders,
    completedOrders,
    currentMonthOrders,
    lastMonthOrders,
    totalEmployees,
    currentMonthExpenses,
    lastMonthExpenses
  ] = await Promise.all([
    Order.countDocuments({}),
    Order.countDocuments({ status: 'PENDING' }),
    Order.countDocuments({ status: 'COMPLETED' }),
    Order.find({ order_date: { $gte: startOfMonth } }),
    Order.find({ order_date: { $gte: startOfLastMonth, $lt: startOfMonth } }),
    Employee.countDocuments({ status: 'active' }),
    Expense.find({ expense_date: { $gte: startOfMonth.toISOString().split('T')[0] } }),
    Expense.find({ expense_date: { $gte: startOfLastMonth.toISOString().split('T')[0], $lt: startOfMonth.toISOString().split('T')[0] } })
  ]);

  const currentRevenue = currentMonthOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const lastRevenue = lastMonthOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const currentExp = currentMonthExpenses.reduce((sum, e) => sum + (e.total_amount || 0), 0);
  const lastExp = lastMonthExpenses.reduce((sum, e) => sum + (e.total_amount || 0), 0);

  const revenueMoM = lastRevenue === 0 ? 0 : ((currentRevenue - lastRevenue) / lastRevenue) * 100;
  const ordersMoM = lastMonthOrders.length === 0 ? 0 : ((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100;
  const expenseMoM = lastExp === 0 ? 0 : ((currentExp - lastExp) / lastExp) * 100;

  return {
    overview: {
      totalRevenue: currentRevenue,
      revenueMoM: revenueMoM.toFixed(1),
      totalOrders: currentMonthOrders.length,
      ordersMoM: ordersMoM.toFixed(1),
      activeEmployees: totalEmployees,
      totalExpenses: currentExp,
      expenseMoM: expenseMoM.toFixed(1)
    },
    orders: {
      total: totalOrders,
      pending: pendingOrders,
      completed: completedOrders
    }
  };
}
