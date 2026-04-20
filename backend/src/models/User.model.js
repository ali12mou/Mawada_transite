import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    permissions: { type: [String], default: [] },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
