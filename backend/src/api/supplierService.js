import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  address: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Supplier = mongoose.model('Supplier', supplierSchema, 'suppliers');

export async function listSuppliers() {
  return await Supplier.find().sort({ createdAt: -1 });
}

export async function getSupplierById(id) {
  return await Supplier.findById(id);
}

export async function createSupplier(payload) {
  const supplier = new Supplier(payload);
  return await supplier.save();
}

export async function updateSupplier(id, payload) {
  return await Supplier.findByIdAndUpdate(
    id,
    { ...payload, updatedAt: new Date() },
    { new: true }
  );
}

export async function deleteSupplier(id) {
  return await Supplier.findByIdAndDelete(id);
}
