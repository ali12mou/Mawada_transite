import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  description_of_goods: { type: String, default: '' },
  origin: { type: String, default: '' },
  hs_code: { type: String, default: '' },
  quantity: { type: Number, default: 0 },
  unit_price: { type: Number, default: 0 },
  total_unit_price: { type: Number, default: 0 },
});

const performaSchema = new mongoose.Schema(
  {
    performa_code: { type: String, required: true, unique: true },
    invoice_date: { type: String, default: '' },
    vendor: { type: String, default: '' },
    vendor_address: { type: String, default: '' },
    vendor_tel: { type: String, default: '' },
    buyer: { type: String, default: '' },
    buyer_tin: { type: String, default: '' },
    buyer_tel: { type: String, default: '' },
    source_destination: { type: String, default: '' },
    origin: { type: String, default: '' },
    expedition: { type: String, default: '' },
    swift_code: { type: String, default: '' },
    loading_port: { type: String, default: '' },
    final_destination: { type: String, default: '' },
    bank: { type: String, default: '' },
    payment: { type: String, default: '' },
    fiscal_id_number: { type: String, default: '' },
    items: [itemSchema],
  },
  { timestamps: true, collection: 'performa' }
);

export const Performa =
  mongoose.models.Performa || mongoose.model('Performa', performaSchema);
