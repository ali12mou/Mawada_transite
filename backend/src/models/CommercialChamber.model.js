import mongoose from 'mongoose';

const commercialChamberSchema = new mongoose.Schema(
  {
    commercial_no: { type: String, required: true, trim: true },
    client_name: { type: String, required: true, trim: true },
    responsible: { type: String, default: '', trim: true },
    goods_description: { type: String, default: '', trim: true },
    chamber_service_amount: { type: Number, default: 0 },
    service_charge: { type: Number, default: 0 },
    bank_commission_fee: { type: Number, default: 0 },
    transport_dhl: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    commercial_invoice_no: { type: String, default: '', trim: true },
    commercial_invoice_date: { type: String, default: '', trim: true },
    purchase_order_no: { type: String, default: '', trim: true },
    purchase_order_date: { type: String, default: '', trim: true },
    quantity: { type: Number, default: 0 },
    unit_price: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    tell: { type: String, default: '', trim: true },
    timno: { type: String, default: '', trim: true },
    certificate_fee: { type: Number, default: 0 },
  },
  { timestamps: true }
);

commercialChamberSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    ret.created_at = ret.createdAt;
    ret.updated_at = ret.updatedAt;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const CommercialChamber =
  mongoose.models.CommercialChamber ||
  mongoose.model('CommercialChamber', commercialChamberSchema, 'commercial_chamber');
