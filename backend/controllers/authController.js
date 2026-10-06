import UserModel from "../models/User.js";
import { isMongoConnected, connectionErrorMsg } from "../config/db.js";
import {
  hashPassword,
  comparePassword,
  generateToken,
  sanitizeUser
} from "../utils/authUtils.js";

export const getStatus = (req, res) => {
  res.json({
    connected: isMongoConnected,
    error: connectionErrorMsg,
    mode: isMongoConnected ? "MongoDB Atlas" : "Local Memory Fallback"
  });
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, message: "Correo y contraseña requeridos" });
    }

    let user = await UserModel.findOne({ email: cleanEmail });
    if (!user) {
      user = await UserModel.findOne({ email });
    }

    // Auto-fallback for default admin credential if missing
    if (!user && cleanEmail === "admin@masterly.com" && (password === "admin" || !password)) {
      const hashedAdminPassword = await hashPassword("admin");
      const adminUser = await UserModel.create({
        id: "U1",
        name: "Admin Masterly",
        email: "admin@masterly.com",
        password: hashedAdminPassword,
        role: "admin",
        creditEnabled: false,
        creditLimit: 0,
        creditUsed: 0
      });
      const token = generateToken(adminUser);
      return res.json({ success: true, token, user: sanitizeUser(adminUser) });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: "Usuario no encontrado" });
    }

    // Check password using bcrypt (with backward-compatible migration)
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      // Special check for default admin recovery
      if (cleanEmail === "admin@masterly.com" && password === "admin") {
        const newHashed = await hashPassword("admin");
        await UserModel.findOneAndUpdate({ id: user.id }, { $set: { password: newHashed } });
      } else {
        return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
      }
    } else {
      // If stored password was plain text, silently upgrade it to bcrypt hash
      if (user.password && !user.password.startsWith("$2a$") && !user.password.startsWith("$2b$") && !user.password.startsWith("$2y$")) {
        const upgradedHash = await hashPassword(password);
        await UserModel.findOneAndUpdate({ id: user.id }, { $set: { password: upgradedHash } });
      }
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    next(err);
  }
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, message: "Correo y contraseña requeridos" });
    }

    const existingUser = await UserModel.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "El correo electrónico ya está registrado" });
    }

    const hashedPassword = await hashPassword(password);
    
    // Todos los usuarios que se registren por el login son clientes (customer) estrictamente
    const newUser = await UserModel.create({
      id: `U-${Date.now()}`,
      name: name || "Cliente",
      email: cleanEmail,
      password: hashedPassword,
      role: "customer",
      creditEnabled: false,
      creditLimit: 0,
      creditUsed: 0
    });

    const token = generateToken(newUser);

    res.json({
      success: true,
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, creditEnabled, creditLimit } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: "Correo electrónico requerido" });
    }

    const existingUser = await UserModel.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "El correo electrónico ya está registrado" });
    }

    const hashedPassword = await hashPassword(password || "123456");
    // Los admins creados directamente desde el panel administrativo por el admin
    const chosenRole = role === "admin" ? "admin" : "customer";

    const newUser = await UserModel.create({
      id: `U-${Date.now()}`,
      name: name || "Usuario",
      email: cleanEmail,
      password: hashedPassword,
      role: chosenRole,
      creditEnabled: creditEnabled === true || creditEnabled === "true",
      creditLimit: Number(creditLimit) || 0,
      creditUsed: 0
    });

    res.json({
      success: true,
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({ success: false, message: "No autenticado" });
    }
    res.json({ success: true, user: sanitizeUser(req.currentUser) });
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const list = await UserModel.find();
    const sanitizedList = list.map((u) => sanitizeUser(u));
    res.json(sanitizedList);
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id, role, creditEnabled, creditLimit, creditUsed, name, email } = req.body;
    
    const targetUser = await UserModel.findOne({ id });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    // Un cliente no puede ser cambiado a admin
    let finalRole = targetUser.role;
    if (targetUser.role === "admin" && role === "customer") {
      finalRole = "customer";
    } else if (targetUser.role === "customer") {
      // Bloqueado: ningún cliente puede ser promovido a admin por edición
      finalRole = "customer";
    }

    const updateFields = {
      role: finalRole,
      creditEnabled: creditEnabled !== undefined ? (creditEnabled === true || creditEnabled === "true") : targetUser.creditEnabled,
      creditLimit: creditLimit !== undefined ? Number(creditLimit) : targetUser.creditLimit,
      creditUsed: creditUsed !== undefined ? Number(creditUsed) : targetUser.creditUsed
    };

    if (name) updateFields.name = name;
    if (email) updateFields.email = (email || "").trim().toLowerCase();

    const updated = await UserModel.findOneAndUpdate(
      { id },
      { $set: updateFields },
      { new: true }
    );
    res.json({ success: true, user: sanitizeUser(updated) });
  } catch (err) {
    next(err);
  }
};
