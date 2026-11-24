import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  workerId: { type: String, required: true, index: true },
  workerName: { type: String, default: "" },
  date: { type: String, required: true, index: true },
  checkIn: { type: String, default: "" },
  checkOut: { type: String, default: "" },
  breakMinutes: { type: Number, default: 0 },
  absent: { type: Boolean, default: false },
  totalHours: { type: Number, default: 0 },
  hourlyRate: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  status: { type: String, enum: ["borrador", "aprobado", "pagado"], default: "borrador" }
}, { strict: false, timestamps: true });

AttendanceSchema.index({ workerId: 1, date: 1 }, { unique: true });

export const AttendanceModel = mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
export default AttendanceModel;
