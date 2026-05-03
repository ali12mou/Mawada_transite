import mongoose from 'mongoose';

const expenseItemSchema = new mongoose.Schema({
  expense_category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  check_number: { type: String }
});

const expenseSchema = new mongoose.Schema(
  {
    reference_number: { type: String, required: true, unique: true },
    expense_date: { type: String, required: true },
    initial_balance: { type: Number, default: 0 },
    total_amount: { type: Number, default: 0 },
    final_balance: { type: Number, default: 0 },
    status: { type: String, default: 'Pending' },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [expenseItemSchema]
  },
  { timestamps: true }
);

expenseSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
