import { Router } from "express";
import { getOrders, createOrder, shipOrder } from "../controllers/orderController.js";
import { authenticate, requireStaff } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/orders", authenticate, getOrders);
router.post("/orders", authenticate, createOrder);
router.post("/orders/ship", authenticate, requireStaff, shipOrder);

export default router;
