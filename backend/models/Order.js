import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  userId: { type: String },
  customerName: { type: String },
  items: [mongoose.Schema.Types.Mixed],
  total: { type: Number },
  type: { type: String }, // "direct" or "pedido"
  status: { type: String },
  date: { type: String },
  initialPayment: { type: Number },
  estimatedDelivery: { type: String },
  installments: [mongoose.Schema.Types.Mixed]
}, { strict: false });

export const OrderModel = mongoose.models.Order || mongoose.model("Order", OrderSchema);
export const Order = OrderModel;
export default OrderModel;
