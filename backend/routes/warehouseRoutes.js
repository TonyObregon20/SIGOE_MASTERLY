import { Router } from "express";
import { 
  getWarehouseMovements, 
  acceptWarehouseMovement, 
  getNextGuideNumber,
  createSalidaMovement,
  createIngresoMovement 
} from "../controllers/warehouseController.js";
import { authenticate, requireAdmin, requireStaff } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/warehouse-movements", authenticate, requireStaff, getWarehouseMovements);
router.get("/warehouse-movements/next-guide-number", authenticate, requireStaff, getNextGuideNumber);
router.post("/warehouse-movements/accept", authenticate, requireAdmin, acceptWarehouseMovement);
router.post("/warehouse-movements/create-salida", authenticate, requireStaff, createSalidaMovement);
router.post("/warehouse-movements/create-ingreso", authenticate, requireStaff, createIngresoMovement);

export default router;
