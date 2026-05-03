import { Employee } from '../models/Employee.model.js';

export async function listEmployees() {
  return await Employee.find({}).sort({ createdAt: -1 });
}

export async function getEmployee(id) {
  return await Employee.findById(id);
}

export async function generateEmployeeId() {
  const lastEmp = await Employee.findOne({}).sort({ createdAt: -1 });
  if (!lastEmp || !lastEmp.employee_id) {
    return 'HIML00001';
  }
  const lastId = lastEmp.employee_id;
  const lastNumber = parseInt(lastId.replace('HIML', ''));
  const newNumber = lastNumber + 1;
  return `HIML${String(newNumber).padStart(5, '0')}`;
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
