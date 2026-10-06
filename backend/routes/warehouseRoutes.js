import { Router } from "express";
import { 
  getWarehouseMovements, 
  acceptWarehouseMovement, 
  createSalidaMovement,
  createIngresoMovement 
} from "../controllers/warehouseController.js";

const router = Router();

router.get("/warehouse-movements", getWarehouseMovements);
router.post("/warehouse-movements/accept", acceptWarehouseMovement);
router.post("/warehouse-movements/create-salida", createSalidaMovement);
router.post("/warehouse-movements/create-ingreso", createIngresoMovement);

export default router;
