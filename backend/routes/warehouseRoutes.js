import { Router } from "express";
import { 
  getWarehouseMovements, 
  acceptWarehouseMovement, 
  createSalidaMovement,
  createIngresoMovement 
} from "../controllers/warehouseController.js";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/warehouse-movements", authenticate, requireAdmin, getWarehouseMovements);
router.post("/warehouse-movements/accept", authenticate, requireAdmin, acceptWarehouseMovement);
router.post("/warehouse-movements/create-salida", authenticate, requireAdmin, createSalidaMovement);
router.post("/warehouse-movements/create-ingreso", authenticate, requireAdmin, createIngresoMovement);

export default router;
