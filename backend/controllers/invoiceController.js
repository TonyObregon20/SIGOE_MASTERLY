import { InvoiceModel } from "../models/Invoice.js";
import OrderModel from "../models/Order.js";
import { sendInvoiceEmail } from "../services/emailService.js";

export const getInvoices = async (req, res, next) => {
  try {
    const filter = ["admin", "worker"].includes(req.user?.role)
      ? {}
      : {
          $or: [
            { channel: "presencial", userId: req.currentUser.id },
            ...(req.currentUser.email ? [{ channel: { $ne: "presencial" }, customerEmail: req.currentUser.email }] : []),
            ...(req.currentUser.name ? [{ channel: { $ne: "presencial" }, customerName: req.currentUser.name }] : [])
          ]
        };
    const list = await InvoiceModel.find(filter).sort({ _id: -1 }).lean();
    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const sendEmail = async (req, res, next) => {
  try {
    const { orderId, email, pdfBase64, pdfFileName } = req.body;
    const order = await OrderModel.findOne({ id: orderId });
    if (!order || (req.user?.role !== "admin" && order.userId !== req.currentUser.id)) {
      return res.status(403).json({ success: false, message: "No autorizado para este comprobante." });
    }
    const recipient = typeof email === "string" && email.trim()
      ? email.trim()
      : req.currentUser.email;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      return res.status(400).json({ success: false, message: "Debe indicar un correo electrónico válido." });
    }
    if (pdfBase64 !== undefined && (typeof pdfBase64 !== "string" || pdfBase64.length > 10 * 1024 * 1024)) {
      return res.status(400).json({ success: false, message: "El PDF adjunto no es válido." });
    }

    const invoice = await InvoiceModel.findOne({ orderId }).lean();
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Comprobante no encontrado." });
    }

    await sendInvoiceEmail({ recipient, invoice, order, pdfBase64, pdfFileName });
    res.json({ success: true, message: `Comprobante enviado exitosamente a ${recipient}` });
  } catch (err) {
    if (err.code === "EMAIL_NOT_CONFIGURED") {
      return res.status(503).json({ success: false, message: err.message });
    }
    console.error("Error sending invoice email:", err);
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
