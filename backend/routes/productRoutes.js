import { Router } from "express";
import { getProducts, createOrUpdateProduct } from "../controllers/productController.js";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/products", getProducts);
router.post("/products", authenticate, requireAdmin, createOrUpdateProduct);

export default router;
