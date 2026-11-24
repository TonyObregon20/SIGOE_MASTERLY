import { Router } from "express";
import {
  getStatus,
  login,
  register,
  createUser,
  getMe,
  getUsers,
  updateUser,
  updateUserStatus,
  getUserStatusHistory
} from "../controllers/authController.js";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

// System / DB connection status
router.get("/status", getStatus);

// Auth routes
router.post("/auth/login", login);
router.post("/auth/register", register);
router.get("/auth/me", authenticate, getMe);

// User management routes
router.get("/users", authenticate, requireAdmin, getUsers);
router.post("/users/create", authenticate, requireAdmin, createUser);
router.post("/users/update", authenticate, requireAdmin, updateUser);
router.post("/users/status-action", authenticate, requireAdmin, updateUserStatus);
router.get(
  "/users/:id/status-history",
  authenticate,
  requireAdmin,
  getUserStatusHistory
);
export default router;
