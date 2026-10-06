import { Router } from "express";
import { getInvoices, sendEmail, cancelInvoice } from "../controllers/invoiceController.js";

const router = Router();

router.get("/invoices", getInvoices);
router.post("/invoices/send-email", sendEmail);
router.post("/invoices/cancel", cancelInvoice);

export default router;
