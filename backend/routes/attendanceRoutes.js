import { Router } from "express";
import { authenticate, requireAdmin, requireStaff } from "../middlewares/authMiddleware.js";
import { getAttendance, upsertAttendance, getAttendanceSummary } from "../controllers/attendanceController.js";

const router = Router();

router.get("/attendance", authenticate, requireStaff, getAttendance);
router.post("/attendance", authenticate, requireAdmin, upsertAttendance);
router.get("/attendance/summary", authenticate, requireStaff, getAttendanceSummary);
router.put("/attendance/:id", authenticate, requireAdmin, upsertAttendance);

export default router;
