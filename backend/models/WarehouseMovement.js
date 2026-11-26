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
  guideNumber: { type: String },
  carrier: { type: String },
  guideIssuedAt: { type: String },
  guideCustomerName: { type: String },
  guideObservations: { type: String },
  date: { type: String, default: () => new Date().toISOString().split("T")[0] },
  createdAt: { type: String, default: () => new Date().toISOString() },
  processedAt: { type: String }
}, { strict: false });

WarehouseMovementSchema.index(
  { guideNumber: 1 },
  { unique: true, partialFilterExpression: { guideNumber: { $type: "string" } } }
);

export const WarehouseMovementModel = mongoose.models.WarehouseMovement || mongoose.model("WarehouseMovement", WarehouseMovementSchema);
export const WarehouseMovement = WarehouseMovementModel;
export default WarehouseMovementModel;
