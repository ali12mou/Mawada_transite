import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contact_person: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    tax_id: { type: String, default: '' },
  },
  { timestamps: true, collection: 'suppliers' }
);

export const Supplier =
  mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);
