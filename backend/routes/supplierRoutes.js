import { Router } from "express";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  addSupplierRecord,
  deleteSupplierRecord
} from "../controllers/supplierController.js";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/suppliers", authenticate, requireAdmin, getSuppliers);
router.post("/suppliers", authenticate, requireAdmin, createSupplier);
router.put("/suppliers/:id", authenticate, requireAdmin, updateSupplier);
router.delete("/suppliers/:id", authenticate, requireAdmin, deleteSupplier);
router.post("/suppliers/:id/records", authenticate, requireAdmin, addSupplierRecord);
router.delete("/suppliers/:id/records/:recordId", authenticate, requireAdmin, deleteSupplierRecord);

export default router;
