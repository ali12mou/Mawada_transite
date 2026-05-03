import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  description_of_goods: { type: String, default: '' },
  origin: { type: String, default: '' },
  hs_code: { type: String, default: '' },
  unit: { type: String, default: '' },
  quantity: { type: Number, default: 0 },
  unit_price: { type: Number, default: 0 },
  total_amount: { type: Number, default: 0 },
});

const chamberInvoiceSchema = new mongoose.Schema(
  {
    consignee_name: { type: String, default: '' },
    tin: { type: String, default: '' },
    tel: { type: String, default: '' },
    source_destination: { type: String, default: '' },
    commercial_relation: { type: String, default: '' },
    consignment_location: { type: String, default: '' },
    invoice_number: { type: String, default: '' },
    invoice_date: { type: String, default: '' },
    sales_conditions: { type: String, default: '' },
    purchase_order: { type: String, default: '' },
    app_reference_number: { type: String, default: '' },
    payment_conditions: { type: String, default: '' },
    invoice_currency: { type: String, default: '' },
    expedition: { type: String, default: '' },
    swift_code: { type: String, default: '' },
    loading_port: { type: String, default: '' },
    final_destination: { type: String, default: '' },
    bank_details: { type: String, default: '' },
    bank_account: { type: String, default: '' },
    intermediate_bank: { type: String, default: '' },
    swift_code_2: { type: String, default: '' },
    currency: { type: String, default: '' },
    header: mongoose.Schema.Types.Mixed,
    items: [itemSchema],
    packingList: mongoose.Schema.Types.Mixed,
    originalLetter: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true, collection: 'chamber_invoice' }
);

export const ChamberInvoice =
  mongoose.models.ChamberInvoice || mongoose.model('ChamberInvoice', chamberInvoiceSchema);
