import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  id: { type: String, default: () => "U" + Date.now() },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "customer" },
  creditEnabled: { type: Boolean, default: false },
  creditLimit: { type: Number, default: 0 },
  creditUsed: { type: Number, default: 0 },
  joinDate: { type: String, default: () => new Date().toISOString().split("T")[0] }
}, { strict: false });

export const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
export const User = UserModel;
export default UserModel;
