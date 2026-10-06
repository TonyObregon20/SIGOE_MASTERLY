import { Router } from "express";
import { getOrders, createOrder, shipOrder } from "../controllers/orderController.js";

const router = Router();

router.get("/orders", getOrders);
router.post("/orders", createOrder);
router.post("/orders/ship", shipOrder);

export default router;
