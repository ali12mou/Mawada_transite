import mongoose from 'mongoose';

const configurationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: String, default: '' },
  },
  { timestamps: true, collection: 'configurations' }
);

configurationSchema.index({ key: 1 });

export const Configuration =
  mongoose.models.Configuration || mongoose.model('Configuration', configurationSchema);
