import { Router } from "express";
import { getProducts, createOrUpdateProduct } from "../controllers/productController.js";

const router = Router();

router.get("/products", getProducts);
router.post("/products", createOrUpdateProduct);

export default router;
