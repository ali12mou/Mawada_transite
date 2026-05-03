import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    employee_id: { type: String, required: true, unique: true },
    full_name: { type: String, required: true },
    gender: { type: String, default: 'Male' },
    birth_place: { type: String },
    nationality: { type: String },
    civil_status: { type: String, default: 'Single' },
    judicial_record: { type: String, default: 'No' },
    residence_status: { type: String, default: 'Citizen' },
    identification_type: { type: String, default: 'Passport Number' },
    identification_number: { type: String },
    address: { type: String },
    phone_number: { type: String },
    email: { type: String },
    emergency_contact: { type: String },
    bank_name: { type: String },
    account_name: { type: String },
    account_number: { type: String },
    employee_type: { type: String, default: 'Taxable' },
    profession: { type: String },
    contract_type: { type: String },
    contract_start_date: { type: String },
    contract_end_date: { type: String },
    employment_date: { type: String },
    allow_end_date: { type: Boolean, default: false },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, default: 'active' }, // active, on_leave, inactive
    absent_days: { type: Number, default: 0 },
    leave_days_remaining: { type: Number, default: 30 }
  },
  { timestamps: true }
);

employeeSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
