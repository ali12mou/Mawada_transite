import { Expense } from '../models/Expense.model.js';
import Order from '../models/Order.model.js';
import { Employee } from '../models/Employee.model.js';
import { getCollection } from './mongoService.js';

function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthKey(date) {
  const d = toDate(date);
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function lastMonths(count) {
  const months = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: monthKey(d),
      label: d.toLocaleDateString('fr-FR', { month: 'short' }),
    });
  }
  return months;
}

function normalizeFile(doc) {
  return {
    id: String(doc._id),
    jobNumber: doc.job_number || doc.file_number || '—',
    client: doc.company_name || doc.client_name || doc.contact_name || '—',
    status: (doc.status || 'open').toLowerCase(),
    fileType: doc.file_type || 'import',
    createdAt: doc.createdAt || doc.created_at || null,
  };
}

function isPendingStatus(status) {
  const s = String(status || '').toLowerCase();
  return ['pending', 'draft', 'submitted', 'open', 'requested'].includes(s);
}

async function getTransitStats() {
  const [
    logisticsFiles,
    transportations,
    bulkTransports,
    vehicles,
    drivers,
    reservations,
    expenseRequests,
    salesOrders,
    purchaseRequests,
  ] = await Promise.all([
    getCollection('logistics_files').find().toArray(),
    getCollection('transportation_records').find().toArray(),
    getCollection('bulk_transport_records').find().toArray(),
    getCollection('vehicles').find().toArray(),
    getCollection('drivers').find().toArray(),
    getCollection('car_reservations').find().toArray(),
    getCollection('expense_requests').find().toArray(),
    getCollection('sales_orders').find().toArray(),
    getCollection('purchase_requests').find().toArray(),
  ]);

  const fileStatus = {
    open: 0,
    operation_started: 0,
    completed: 0,
    cancelled: 0,
  };

  logisticsFiles.forEach((file) => {
    const status = (file.status || 'open').toLowerCase();
    if (fileStatus[status] !== undefined) {
      fileStatus[status] += 1;
    } else {
      fileStatus.open += 1;
    }
  });

  const activeTransports = [...transportations, ...bulkTransports].filter((row) => {
    const state = String(row.state || '').toLowerCase();
    return !['completed', 'cancelled', 'closed', 'done'].includes(state);
  }).length;

  const pendingExpenseRequests = expenseRequests.filter((row) =>
    isPendingStatus(row.status)
  ).length;

  const pendingPurchases = purchaseRequests.filter((row) =>
    isPendingStatus(row.status)
  ).length;

  const monthlySales = salesOrders.reduce((sum, row) => sum + (Number(row.total_amount) || 0), 0);

  const recentFiles = logisticsFiles
    .map(normalizeFile)
    .sort((a, b) => {
      const da = toDate(a.createdAt)?.getTime() || 0;
      const db = toDate(b.createdAt)?.getTime() || 0;
      return db - da;
    })
    .slice(0, 6);

  const months = lastMonths(6);
  const monthlyActivity = months.map(({ key, label }) => {
    const filesCount = logisticsFiles.filter((file) => monthKey(file.createdAt || file.created_at) === key).length;
    const transportsCount = transportations.filter((row) => monthKey(row.createdAt || row.created_at) === key).length;
    return { label, files: filesCount, transports: transportsCount };
  });

  return {
    logisticsFiles: {
      total: logisticsFiles.length,
      ...fileStatus,
    },
    operations: {
      activeTransports,
      totalTransports: transportations.length + bulkTransports.length,
      reservations: reservations.length,
      pendingExpenseRequests,
      pendingPurchases,
      monthlySales,
    },
    fleet: {
      vehicles: vehicles.length,
      drivers: drivers.length,
    },
    recentFiles,
    monthlyActivity,
  };
}

function yearMonthsToDate() {
  const now = new Date();
  const year = now.getFullYear();
  const maxMonth = now.getMonth(); // 0-based inclusive
  const months = [];
  for (let m = 0; m <= maxMonth; m += 1) {
    const d = new Date(year, m, 1);
    months.push({
      key: monthKey(d),
      label: d.toLocaleDateString('en-US', { month: 'long' }),
      start: d,
      end: new Date(year, m + 1, 1),
    });
  }
  return months;
}

async function getChartsData() {
  const months = yearMonthsToDate();
  const yearStart = months[0]?.start || new Date(new Date().getFullYear(), 0, 1);

  const [ordersInYear, employees] = await Promise.all([
    Order.find({ order_date: { $gte: yearStart } }).lean(),
    Employee.find({}).lean(),
  ]);

  const orderTrends = months.map(({ key, label, start, end }) => {
    const count = ordersInYear.filter((o) => {
      const d = toDate(o.order_date || o.createdAt);
      return d && d >= start && d < end;
    }).length;
    return { label, key, orders: count };
  });

  const revenueProfit = months.map(({ key, label, start, end }) => {
    const rows = ordersInYear.filter((o) => {
      const d = toDate(o.order_date || o.createdAt);
      return d && d >= start && d < end;
    });
    const revenue = rows.reduce(
      (sum, o) => sum + (Number(o.total_services) || Number(o.total) || 0),
      0
    );
    const profit = rows.reduce((sum, o) => sum + (Number(o.profit_amount) || 0), 0);
    return { label, key, revenue, profit };
  });

  let male = 0;
  let female = 0;
  employees.forEach((e) => {
    const g = String(e.gender || '').toLowerCase();
    if (g.startsWith('f') || g.includes('femme') || g.includes('female')) female += 1;
    else male += 1;
  });

  return {
    orderTrends,
    revenueProfit,
    genderDistribution: {
      male,
      female,
      total: male + female,
    },
  };
}

export async function getDashboardStats() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfLastMonth = new Date(startOfMonth);
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

  const [
    totalOrders,
    pendingOrders,
    completedOrders,
    currentMonthOrders,
    lastMonthOrders,
    deliveredThisMonth,
    deliveredLastMonth,
    totalEmployees,
    onLeaveEmployees,
    currentMonthExpenses,
    lastMonthExpenses,
    transit,
    charts,
  ] = await Promise.all([
    Order.countDocuments({}),
    Order.countDocuments({ status: 'PENDING' }),
    Order.countDocuments({ status: 'COMPLETED' }),
    Order.find({ order_date: { $gte: startOfMonth } }),
    Order.find({ order_date: { $gte: startOfLastMonth, $lt: startOfMonth } }),
    Order.countDocuments({
      delivery_status: 'DELIVERED',
      order_date: { $gte: startOfMonth },
    }),
    Order.countDocuments({
      delivery_status: 'DELIVERED',
      order_date: { $gte: startOfLastMonth, $lt: startOfMonth },
    }),
    Employee.countDocuments({ status: 'active' }),
    Employee.countDocuments({ status: 'on_leave' }),
    Expense.find({ expense_date: { $gte: startOfMonth.toISOString().split('T')[0] } }),
    Expense.find({
      expense_date: {
        $gte: startOfLastMonth.toISOString().split('T')[0],
        $lt: startOfMonth.toISOString().split('T')[0],
      },
    }),
    getTransitStats(),
    getChartsData(),
  ]);

  const currentRevenue = currentMonthOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const lastRevenue = lastMonthOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const currentExp = currentMonthExpenses.reduce((sum, e) => sum + (e.total_amount || 0), 0);
  const lastExp = lastMonthExpenses.reduce((sum, e) => sum + (e.total_amount || 0), 0);

  const revenueMoM = lastRevenue === 0 ? (currentRevenue > 0 ? 100 : 0) : ((currentRevenue - lastRevenue) / lastRevenue) * 100;
  const ordersMoM =
    lastMonthOrders.length === 0
      ? currentMonthOrders.length > 0
        ? 100
        : 0
      : ((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100;
  const expenseMoM = lastExp === 0 ? (currentExp > 0 ? 100 : 0) : ((currentExp - lastExp) / lastExp) * 100;
  const deliveredMoM =
    deliveredLastMonth === 0
      ? deliveredThisMonth > 0
        ? 100
        : 0
      : ((deliveredThisMonth - deliveredLastMonth) / deliveredLastMonth) * 100;

  return {
    overview: {
      totalRevenue: currentRevenue,
      lastMonthRevenue: lastRevenue,
      revenueMoM: revenueMoM.toFixed(2),
      totalOrders,
      ordersMoM: ordersMoM.toFixed(2),
      activeEmployees: totalEmployees,
      onLeaveEmployees,
      totalExpenses: currentExp,
      lastMonthExpenses: lastExp,
      expenseMoM: expenseMoM.toFixed(2),
      deliveredOrders: deliveredThisMonth,
      lastMonthDelivered: deliveredLastMonth,
      deliveredMoM: deliveredMoM.toFixed(2),
    },
    orders: {
      total: totalOrders,
      pending: pendingOrders,
      completed: completedOrders,
    },
    charts,
    transit,
  };
}
