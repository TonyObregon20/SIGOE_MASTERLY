import mongoose from "mongoose";

const WarehouseMovementSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  type: { type: String, enum: ["Ingreso", "Salida"], required: true },
  originType: {
    type: String,
    enum: ["A Pedido", "Venta Directa", "Autostock", "Producción OP", "Ajuste / Merma"],
    required: true
  },
  status: { type: String, enum: ["Pendiente", "Aceptado", "Rechazado"], default: "Pendiente" },
  opId: { type: String },
  orderId: { type: String },
  items: [mongoose.Schema.Types.Mixed],
  date: { type: String, default: () => new Date().toISOString().split("T")[0] },
  createdAt: { type: String, default: () => new Date().toISOString() },
  processedAt: { type: String },
  // No defaults: missing policy fields identify genuine historical records.
  guideVersion: { type: Number },
  guideMode: { type: String, enum: ["CON_GUIA", "SIN_GUIA"] },
  guideNumber: { type: String },
  guidePhoto: { type: String, select: false },
  dispatchGuideNumber: { type: String },
  dispatchGuidePhoto: { type: String, select: false },
  creationRequestId: { type: String },
  automaticDraft: { type: Boolean },
  stockApplied: { type: Boolean },
  dispatchedAt: { type: String }
}, { strict: false });

export const WarehouseMovementModel = mongoose.models.WarehouseMovement || mongoose.model("WarehouseMovement", WarehouseMovementSchema);
export const WarehouseMovement = WarehouseMovementModel;
export default WarehouseMovementModel;
