import mongoose from "mongoose";

const PasswordResetSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  attempts: { type: Number, default: 0 },
  used: { type: Boolean, default: false }
}, { strict: false, timestamps: true });

export const PasswordResetModel = mongoose.models.PasswordReset || mongoose.model("PasswordReset", PasswordResetSchema);
export default PasswordResetModel;
