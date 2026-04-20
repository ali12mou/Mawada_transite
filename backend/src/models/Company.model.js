import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

companySchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

/** Collection MongoDB `companies` (initMongoCollections) */
export const Company = mongoose.models.Company || mongoose.model('Company', companySchema, 'companies');
