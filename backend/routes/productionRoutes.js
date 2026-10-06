import { Router } from "express";
import { getProductionOrders, createProductionOrder, updateStage } from "../controllers/productionController.js";

const router = Router();

router.get("/production-orders", getProductionOrders);
router.post("/production-orders", createProductionOrder);
router.post("/production-orders/update-stage", updateStage);

export default router;
