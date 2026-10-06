import mongoose from "mongoose";

const ProductionOrderSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  orderId: { type: String },
  items: [mongoose.Schema.Types.Mixed],
  currentStage: { type: String, default: "Tendido" },
  progress: { type: Number, default: 0 },
  startDate: { type: String },
  stages: [mongoose.Schema.Types.Mixed],
  sublots: [mongoose.Schema.Types.Mixed]
}, { strict: false });

export const ProductionOrderModel = mongoose.models.ProductionOrder || mongoose.model("ProductionOrder", ProductionOrderSchema);
export const ProductionOrder = ProductionOrderModel;
export default ProductionOrderModel;
