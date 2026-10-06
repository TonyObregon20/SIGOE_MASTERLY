import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  orderId: { type: String },
  type: { type: String }, // "Boleta" or "Factura"
  series: { type: String },
  number: { type: String },
  customerName: { type: String },
  customerDocument: { type: String },
  date: { type: String },
  items: [mongoose.Schema.Types.Mixed],
  subtotal: { type: Number },
  igv: { type: Number },
  total: { type: Number },
  status: { type: String }
}, { strict: false });

export const InvoiceModel = mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);
export const Invoice = InvoiceModel;
export default InvoiceModel;
