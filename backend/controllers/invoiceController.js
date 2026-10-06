import { InvoiceModel } from "../models/Invoice.js";

export const getInvoices = async (req, res, next) => {
  try {
    const list = await InvoiceModel.find().sort({ _id: -1 }).lean();
    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const sendEmail = async (req, res, next) => {
  try {
    const { email, orderId, docType, fullInvoiceCode, customerName, total } = req.body;
    console.log(`[EMAIL DISPATCH] Sending ${docType} ${fullInvoiceCode} for order ${orderId} (S/ ${total}) to ${email} (Customer: ${customerName})`);
    
    res.json({
      success: true,
      message: `Comprobante ${docType} ${fullInvoiceCode} enviado exitosamente a ${email}`
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
