import { Router } from "express";
import { getKardex, addStock } from "../controllers/kardexController.js";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/kardex", authenticate, requireAdmin, getKardex);
router.post("/kardex/add-stock", authenticate, requireAdmin, addStock);

export default router;
