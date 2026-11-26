import { Router } from "express";
import { getOrders, createOrder, shipOrder } from "../controllers/orderController.js";
import { createInPersonSale } from "../controllers/inPersonSaleController.js";
import { authenticate, requireStaff, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/orders", authenticate, getOrders);
router.post("/orders", authenticate, createOrder);
router.post("/orders/in-person", authenticate, requireAdmin, createInPersonSale);
router.post("/orders/ship", authenticate, requireStaff, shipOrder);

export default router;
