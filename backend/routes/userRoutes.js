import { Router } from "express";
import {
  getStatus,
  login,
  register,
  createUser,
  getMe,
  getUsers,
  updateUser
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

// System / DB connection status
router.get("/status", getStatus);

// Auth routes
router.post("/auth/login", login);
router.post("/auth/register", register);
router.get("/auth/me", authenticate, getMe);

// User management routes
router.get("/users", getUsers);
router.post("/users/create", createUser);
router.post("/users/update", updateUser);

export default router;
