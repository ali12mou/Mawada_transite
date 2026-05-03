import { Expense } from '../models/Expense.model.js';
import { ExpenseCategory } from '../models/ExpenseCategory.model.js';

// Categories
export async function listCategories() {
  return await ExpenseCategory.find({}).sort({ name: 1 });
}

export async function createCategory(data) {
  return await ExpenseCategory.create(data);
}

export async function updateCategory(id, data) {
  return await ExpenseCategory.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteCategory(id) {
  return await ExpenseCategory.findByIdAndDelete(id);
}

// Expenses
export async function listExpenses() {
  return await Expense.find({}).sort({ createdAt: -1 });
}

export async function getExpense(id) {
  return await Expense.findById(id).populate('items.expense_category_id');
}

export async function generateExpenseRef() {
  const lastExp = await Expense.findOne({}).sort({ createdAt: -1 });
  if (!lastExp || !lastExp.reference_number) {
    return 'EXP0001';
  }
  const lastRef = lastExp.reference_number;
  const lastNumber = parseInt(lastRef.replace('EXP', ''));
  const newNumber = lastNumber + 1;
  return `EXP${String(newNumber).padStart(4, '0')}`;
}

export async function createExpense(data) {
  if (!data.reference_number) {
    data.reference_number = await generateExpenseRef();
  }
  return await Expense.create(data);
}

export async function updateExpense(id, data) {
  return await Expense.findByIdAndUpdate(id, data, { new: true });
}

export async function approveExpense(id) {
  return await Expense.findByIdAndUpdate(id, { status: 'Approved' }, { new: true });
}

export async function deleteExpense(id) {
  return await Expense.findByIdAndDelete(id);
}
