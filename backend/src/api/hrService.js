import { Employee } from '../models/Employee.model.js';
import { Configuration } from '../models/Configuration.model.js';

const DEFAULT_PREFIX = 'MWDA';

async function getEmployeeIdPrefix() {
  try {
    const cfg = await Configuration.findOne({ key: 'employee_id_prefix' }).lean();
    const prefix = String(cfg?.value || '').trim().toUpperCase();
    return prefix || DEFAULT_PREFIX;
  } catch {
    return DEFAULT_PREFIX;
  }
}

function extractSequence(employeeId) {
  const match = String(employeeId || '').match(/(\d+)\s*$/);
  if (!match) return 0;
  const n = parseInt(match[1], 10);
  return Number.isFinite(n) ? n : 0;
}

export async function migrateEmployeeIdsToPrefix(prefix = DEFAULT_PREFIX) {
  const normalized = String(prefix || DEFAULT_PREFIX).trim().toUpperCase() || DEFAULT_PREFIX;
  const employees = await Employee.find({
    employee_id: { $regex: /^(HIML|FRS)/i },
  });

  for (const emp of employees) {
    const current = String(emp.employee_id || '');
    const sequence = extractSequence(current);
    if (!sequence) continue;

    const nextId = `${normalized}${String(sequence).padStart(5, '0')}`;
    if (nextId === current) continue;

    const conflict = await Employee.findOne({ employee_id: nextId, _id: { $ne: emp._id } });
    if (conflict) continue;

    emp.employee_id = nextId;
    await emp.save();
  }
}

export async function listEmployees() {
  const prefix = await getEmployeeIdPrefix();
  await migrateEmployeeIdsToPrefix(prefix);
  return await Employee.find({}).sort({ createdAt: -1 });
}

export async function getEmployee(id) {
  return await Employee.findById(id);
}

export async function generateEmployeeId() {
  const prefix = await getEmployeeIdPrefix();
  const employees = await Employee.find({}, { employee_id: 1 }).lean();
  let maxNumber = 0;

  for (const emp of employees) {
    const n = extractSequence(emp.employee_id);
    if (n > maxNumber) maxNumber = n;
  }

  const next = maxNumber + 1;
  return `${prefix}${String(next).padStart(5, '0')}`;
}

export async function createEmployee(data) {
  if (!data.employee_id) {
    data.employee_id = await generateEmployeeId();
  }
  return await Employee.create(data);
}

export async function updateEmployee(id, data) {
  return await Employee.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteEmployee(id) {
  return await Employee.findByIdAndDelete(id);
}
