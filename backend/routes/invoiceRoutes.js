import { Router } from "express";
import { getInvoices, sendEmail, cancelInvoice } from "../controllers/invoiceController.js";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/invoices", authenticate, getInvoices);
router.post("/invoices/send-email", authenticate, sendEmail);
router.post("/invoices/cancel", authenticate, requireAdmin, cancelInvoice);

export default router;
