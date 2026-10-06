import { Router } from "express";
import { getKardex, addStock } from "../controllers/kardexController.js";

const router = Router();

router.get("/kardex", getKardex);
router.post("/kardex/add-stock", addStock);

export default router;
