import { Router } from "express";
import { getProductionOrders, createProductionOrder, updateStage } from "../controllers/productionController.js";
import { authenticate, requireAdmin, requireStaff } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/production-orders", authenticate, requireStaff, getProductionOrders);
router.post("/production-orders", authenticate, requireStaff, createProductionOrder);
router.post("/production-orders/update-stage", authenticate, requireStaff, updateStage);

export default router;
