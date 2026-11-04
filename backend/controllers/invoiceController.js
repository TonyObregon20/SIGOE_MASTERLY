import { InvoiceModel } from "../models/Invoice.js";
import OrderModel from "../models/Order.js";

export const getInvoices = async (req, res, next) => {
  try {
    const filter = req.user?.role === "admin"
      ? {}
      : { customerName: req.currentUser.name };
    const list = await InvoiceModel.find(filter).sort({ _id: -1 }).lean();
    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const sendEmail = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await OrderModel.findOne({ id: orderId });
    if (!order || (req.user?.role !== "admin" && order.userId !== req.currentUser.id)) {
      return res.status(403).json({ success: false, message: "No autorizado para este comprobante." });
    }
    const email = req.currentUser.email;
    console.log(`[EMAIL DISPATCH] Sending invoice for order ${orderId} to ${email}`);
    
    res.json({
      success: true,
      message: `Comprobante enviado exitosamente a ${email}`
    });
  } catch (err) {
    next(err);
  }
};

export const cancelInvoice = async (req, res, next) => {
  try {
    const { invoiceId } = req.body;
    const invoice = await InvoiceModel.findOne({ id: invoiceId });
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Comprobante no encontrado" });
    }

    const updatedInvoice = await InvoiceModel.findOneAndUpdate(
      { id: invoiceId },
      { $set: { status: "Anulado" } },
      { new: true }
    );

    res.json({ success: true, invoice: updatedInvoice });
  } catch (err) {
    next(err);
  }
};
