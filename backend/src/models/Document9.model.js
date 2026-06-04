import mongoose from 'mongoose';

const document9Schema = new mongoose.Schema(
  {
    sqn: { type: Number, required: true, unique: true, index: true },
    date: { type: String, default: '' },
    actual_recipient: { type: String, default: '' },
    actual_recipient_nif: { type: String, default: '' },
    declarant: { type: String, default: '' },
    declarant_nif: { type: String, default: '' },
    do_number: { type: String, default: '' },
    container_number: { type: String, default: '' },
    boat: { type: String, default: '' },
    trip_number: { type: String, default: '' },
    bl_number: { type: String, default: '' },
    invoice_count: { type: Number, default: 0 },
    nomenclature: { type: String, default: '' },
    quantity: { type: String, default: '' },
    weight: { type: String, default: '' },
    value: { type: Number, default: 0 },
    exit_point: { type: String, default: '' },
    destination: { type: String, default: '' },
    description: { type: String, default: '' },
    license_code: { type: String, default: '' },
    operator_name: { type: String, default: '' },
    entry_doc_ref: { type: String, default: '' },
    entry_date: { type: String, default: '' },
    sommier_ref: { type: String, default: '' },
    do_date: { type: String, default: '' },
    quantity_entered: { type: String, default: '' },
    arrival_date: { type: String, default: '' },
    country_origin: { type: String, default: '' },
    fiscal_reg: { type: String, default: '' },
    packaging: { type: String, default: '' },
    qty_packages: { type: String, default: '' },
    net_weight: { type: String, default: '' },
    gross_weight: { type: String, default: '' },
    volume: { type: String, default: '' },
    remaining_qty: { type: String, default: '' },
    transaction_types: { type: [String], default: [] },
    transport_modes: { type: [String], default: [] },
    created_by: { type: String, default: '' },
    seller_company: { type: String, default: '' },
    buyer_company: { type: String, default: '' },
    client_name: { type: String, default: '' },
    source_destination_label: { type: String, default: '' },
    closing_date: { type: String, default: '' },
    bill_of_loading: { type: String, default: '' },
    declaration_s: { type: Number, default: 0 },
    declaration_e: { type: Number, default: 0 },
    dossier_fee: { type: Number, default: 0 },
    truck_load_quantity: { type: Number, default: 0 },
    transit_fee: { type: Number, default: 0 },
    service_fee: { type: Number, default: 0 },
    pass_cancel_fee: { type: Number, default: 0 },
    transfer_total: { type: Number, default: 0 },
    doc_sydonia: { type: String, default: '' },
    doc_delivery_order: { type: String, default: '' },
    doc_commercial: { type: String, default: '' },
    doc_packing_list: { type: String, default: '' },
    doc_transfer_declaration_s: { type: String, default: '' },
    doc_full_scan: { type: String, default: '' },
    doc_number_9_file: { type: String, default: '' },
    price_number_9: { type: Number, default: 0 },
    doc_number_4_file: { type: String, default: '' },
    price_number_4: { type: Number, default: 0 },
    doc_ti_cancel_file: { type: String, default: '' },
    price_ti_cancel: { type: Number, default: 0 },
    doc_declaration_se_cancel_file: { type: String, default: '' },
    price_declaration_se_cancel: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'document_9' }
);

document9Schema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Document9 =
  mongoose.models.Document9 || mongoose.model('Document9', document9Schema);
