import mongoose from 'mongoose';

/**
 * Mongoose model for Chamber Invoices.
 * Collection MongoDB : chamber_invoice_docs
 */
const chamberInvoiceDocumentSchema = new mongoose.Schema(
  {
    header: { type: mongoose.Schema.Types.Mixed, required: true },
    items: { type: [mongoose.Schema.Types.Mixed], default: [] },
    packingList: { type: mongoose.Schema.Types.Mixed, default: {} },
    originalLetter: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

chamberInvoiceDocumentSchema.set('toJSON', {
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

export const ChamberInvoiceDocument =
  mongoose.models.ChamberInvoiceDocument ||
  mongoose.model('ChamberInvoiceDocument', chamberInvoiceDocumentSchema, 'chamber_invoice_docs');
