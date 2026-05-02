import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  order_number: { type: String, required: true },
  bl_number: { type: String, required: true },
  client_name: { type: String, required: true },
  client_phone: { type: String },
  source_destination: { type: String, required: true },
  item_price: { type: String, required: true },
  amount_djf: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  recharge_amount: { type: Number, default: 0 },
  maritime_line_fees: { type: Number, default: 0 },
  sgtd_wharfage: { type: Number, default: 0 },
  document_9: { type: Number, default: 0 },
  document_4: { type: Number, default: 0 },
  port_handling: { type: Number, default: 0 },
  port_passage: { type: Number, default: 0 },
  file_fees: { type: Number, required: true, default: 0 },
  escort_fees: { type: Number, default: 0 },
  transport: { type: Number, required: true, default: 0 },
  elevator_cart: { type: Number, default: 0 },
  ctn: { type: Number, default: 0 },
  chamber: { type: Number, default: 0 },
  exit: { type: Number, default: 0 },
  transit: { type: Number, required: true, default: 0 },
  total_services: { type: Number, default: 0 },
  total_item_price: { type: Number, default: 0 },
  profit_amount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  ci_amount: { type: Number, default: 0 },
  order_date: { type: Date, default: Date.now },
  delivery_status: { type: String, default: 'PENDING' },
  status: { type: String, default: 'PENDING' },
  created_by: { type: String }
}, {
  timestamps: true // adds createdAt and updatedAt
});

export default mongoose.model('Order', orderSchema);
