import { Router } from "express";
import {
  getStatus,
  login,
  register,
  createUser,
  getMe,
  getUsers,
  updateUser,
  getGoogleConfig,
  googleLogin,
  requestPasswordReset,
  verifyPasswordResetCode,
  resetPassword,
  getWorkers,
  updateMyProfile
} from "../controllers/authController.js";
import { authenticate, requireAdmin, requireStaff } from "../middlewares/authMiddleware.js";

const router = Router();

// System / DB connection status
router.get("/status", getStatus);

// Auth routes
router.post("/auth/login", login);
router.post("/auth/register", register);
router.get("/auth/me", authenticate, getMe);
router.post("/auth/profile", authenticate, updateMyProfile);
router.get("/auth/google/config", getGoogleConfig);
router.post("/auth/google", googleLogin);
router.post("/auth/password/request", requestPasswordReset);
router.post("/auth/password/verify", verifyPasswordResetCode);
router.post("/auth/password/reset", resetPassword);

// User management routes
router.get("/users", authenticate, requireAdmin, getUsers);
router.get("/workers", authenticate, requireStaff, getWorkers);
router.post("/users/create", authenticate, requireAdmin, createUser);
router.post("/users/update", authenticate, requireAdmin, updateUser);

export default router;
