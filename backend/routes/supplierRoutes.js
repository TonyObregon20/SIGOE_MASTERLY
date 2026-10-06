import { Router } from "express";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  addSupplierRecord,
  deleteSupplierRecord
} from "../controllers/supplierController.js";

const router = Router();

router.get("/suppliers", getSuppliers);
router.post("/suppliers", createSupplier);
router.put("/suppliers/:id", updateSupplier);
router.delete("/suppliers/:id", deleteSupplier);
router.post("/suppliers/:id/records", addSupplierRecord);
router.delete("/suppliers/:id/records/:recordId", deleteSupplierRecord);

export default router;
