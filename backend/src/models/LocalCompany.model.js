import mongoose from 'mongoose';

const localCompanySchema = new mongoose.Schema(
  {
    client_id: { type: String, default: '', trim: true },
    client_name: { type: String, default: '', trim: true },
    vendor_company: { type: String, default: '', trim: true },
    purchasing_company: { type: String, default: '', trim: true },
    goods_description: { type: String, default: '', trim: true },
    source_destination: { type: String, default: '', trim: true },
    closure_date: { type: String, default: '' },
    bill_of_loading: { type: String, default: '' },
    declaration_s: { type: String, default: '' },
    declaration_e: { type: String, default: '' },
    file_fee: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    truck_loading_quantity: { type: Number, default: 0 },
    transit_fee: { type: Number, default: 0 },
    service_fee: { type: Number, default: 0 },
    escort_fee: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    numero_9: { type: String, default: '' },
    numero_9_price: { type: Number, default: 0 },
    numero_4: { type: String, default: '' },
    numero_4_price: { type: Number, default: 0 },
    ti_cancellation: { type: String, default: '' },
    declaration_cancellation: { type: String, default: '' },
    transfer: { type: String, default: '' },
    declaration_cancellation_price: { type: Number, default: 0 },
  },
  { timestamps: true }
);

localCompanySchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

/** Collection MongoDB `local_company` */
export const LocalCompany =
  mongoose.models.LocalCompany || mongoose.model('LocalCompany', localCompanySchema, 'local_company');
