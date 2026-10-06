import { verifyJwtToken } from "../utils/authUtils.js";
import UserModel from "../models/User.js";

/**
 * Middleware to authenticate requests using JWT Bearer token
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Token de autenticación no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyJwtToken(token);

    if (!decoded) {
      return res.status(401).json({ success: false, message: "Token inválido o expirado" });
    }

    // Verify if user still exists in database
    const user = await UserModel.findOne({ id: decoded.id });
    if (!user) {
      return res.status(401).json({ success: false, message: "Usuario no encontrado" });
    }

    req.user = decoded;
    req.currentUser = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware to restrict route to admin role only
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Acceso denegado: Se requieren permisos de administrador" });
  }
  next();
}
