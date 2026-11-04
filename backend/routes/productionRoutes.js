import { Router } from "express";
import { getProductionOrders, createProductionOrder, updateStage } from "../controllers/productionController.js";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/production-orders", authenticate, requireAdmin, getProductionOrders);
router.post("/production-orders", authenticate, requireAdmin, createProductionOrder);
router.post("/production-orders/update-stage", authenticate, requireAdmin, updateStage);

export default router;
