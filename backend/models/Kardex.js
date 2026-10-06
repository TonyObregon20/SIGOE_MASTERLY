import mongoose from "mongoose";

const KardexSchema = new mongoose.Schema({
  id: { type: String, default: () => "K" + Date.now() },
  productId: { type: String, required: true },
  date: { type: String, default: () => new Date().toISOString().split("T")[0] },
  type: { type: String, enum: ["Ingreso", "Salida"], required: true },
  quantity: { type: Number, required: true },
  reason: { type: String },
  documentRef: { type: String },
  location: { type: String },
  balance: { type: Number, required: true }
}, { strict: false });

export const KardexModel = mongoose.models.Kardex || mongoose.model("Kardex", KardexSchema);
export const Kardex = KardexModel;
export default KardexModel;
