import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  id: { type: String, default: () => "U" + Date.now() },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  googleId: { type: String, default: null, index: true },
  googleEmail: { type: String, default: null },
  role: { type: String, default: "customer" },
  workerPosition: { type: String, default: "" },
  phone: { type: String, default: "" },
  hourlyRate: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  creditEnabled: { type: Boolean, default: false },
  creditLimit: { type: Number, default: 0 },
  creditUsed: { type: Number, default: 0 },
  avatarColor: { type: String, default: "blue" },
  avatarUrl: { type: String, default: "" },
  invoiceEmailNotifications: { type: Boolean, default: true },
  orderStageEmailNotifications: { type: Boolean, default: true },
  savedPayment: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  joinDate: { type: String, default: () => new Date().toISOString().split("T")[0] }
}, { strict: false });

export const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
export const User = UserModel;
export default UserModel;
