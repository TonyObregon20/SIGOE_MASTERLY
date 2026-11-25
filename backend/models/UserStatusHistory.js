
import mongoose from "mongoose";

const UserStatusHistorySchema = new mongoose.Schema({
  targetUserId: {
    type: String,
    required: true,
    index: true
  },
  targetUserName: {
    type: String,
    required: true
  },
  targetUserEmail: {
    type: String,
    required: true
  },
  actionType: {
    type: String,
    enum: ["account_status", "credit_status"],
    required: true
  },
  previousValue: {
    type: Boolean,
    required: true
  },
  newValue: {
    type: Boolean,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  performedBy: {
    adminId: { type: String, required: true },
    adminName: { type: String, required: true },
    adminEmail: { type: String, required: true }
  }
}, {
  timestamps: true
});

const UserStatusHistory =
  mongoose.models.UserStatusHistory ||
  mongoose.model("UserStatusHistory", UserStatusHistorySchema);

export default UserStatusHistory;
