import UserModel from "../models/User.js";
import UserStatusHistory from "../models/UserStatusHistory.js";
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

    // Optional recovery is disabled unless private credentials are configured.
    const bootstrapEmail = (process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
    const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    const isBootstrapCredential = Boolean(bootstrapEmail && bootstrapPassword && cleanEmail === bootstrapEmail && password === bootstrapPassword);

    // Create the initial admin only with the explicitly configured credentials.
    if (!user && isBootstrapCredential) {
      const hashedAdminPassword = await hashPassword(bootstrapPassword);
      const adminUser = await UserModel.create({
        id: "U1",
        name: "Admin Masterly",
        email: bootstrapEmail,
        password: hashedAdminPassword,
        role: "admin",
        isActive: true,
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
    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: "Usuario desactivado. Contacte al administrador." });
    }

    // Check password using bcrypt (with backward-compatible migration)
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      // Recovery requires the explicitly configured private credentials.
      if (isBootstrapCredential) {
        const newHashed = await hashPassword(bootstrapPassword);
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
    const { name, email, password, role, creditEnabled, creditLimit, isActive } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: "Correo electrónico requerido" });
    }

    const existingUser = await UserModel.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "El correo electrónico ya está registrado" });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: "Contraseña requerida para crear el usuario" });
    }
    const hashedPassword = await hashPassword(password);
    // Los admins creados directamente desde el panel administrativo por el admin
    const chosenRole = role === "admin" ? "admin" : "customer";

    const newUser = await UserModel.create({
      id: `U-${Date.now()}`,
      name: name || "Usuario",
      email: cleanEmail,
      password: hashedPassword,
      role: chosenRole,
      isActive: isActive !== false,
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
    const {
      id,
      role,
      creditEnabled,
      creditLimit,
      creditUsed,
      name,
      email,
      isActive
    } = req.body;

    const targetUser = await UserModel.findOne({ id });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    // Los cambios de estado deben utilizar la ruta protegida
    // /users/status-action
    if (
      (isActive !== undefined &&
        (isActive === true || isActive === "true") !== (targetUser.isActive !== false)) ||
      (creditEnabled !== undefined &&
        (creditEnabled === true || creditEnabled === "true") !== (targetUser.creditEnabled === true))
    ) {
      return res.status(403).json({
        success: false,
        message: "Para cambiar el estado de una cuenta o línea de crédito se requiere autorización y motivo."
      });
    }

    // Mantener las restricciones de roles existentes
    let finalRole = targetUser.role;

    if (targetUser.role === "admin" && role === "customer") {
      finalRole = "customer";
    } else if (targetUser.role === "customer") {
      finalRole = "customer";
    }

    const updateFields = {
      role: finalRole,
      creditLimit: creditLimit !== undefined
        ? Number(creditLimit)
        : targetUser.creditLimit,
      creditUsed: creditUsed !== undefined
        ? Number(creditUsed)
        : targetUser.creditUsed
    };

    if (name) updateFields.name = name;
    if (email) updateFields.email = email.trim().toLowerCase();

    const updated = await UserModel.findOneAndUpdate(
      { id },
      { $set: updateFields },
      { new: true }
    );

    res.json({
      success: true,
      user: sanitizeUser(updated)
    });
  } catch (err) {
    next(err);
  }
};





export const updateUserStatus = async (req, res, next) => {
  try {
    const {
      id,
      actionType,
      newValue,
      adminEmail,
      adminPassword,
      reason
    } = req.body;

    // Validar los datos obligatorios
    if (
      !id ||
      !["account_status", "credit_status"].includes(actionType) ||
      typeof newValue !== "boolean" ||
      !adminEmail?.trim() ||
      !adminPassword ||
      !reason?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Todos los datos son obligatorios, incluido el motivo."
      });
    }

    // Verificar las credenciales del administrador
    const admin = await UserModel.findOne({
      email: adminEmail.trim().toLowerCase(),
      role: "admin",
      isActive: { $ne: false }
    });

    if (!admin || !(await comparePassword(adminPassword, admin.password))) {
      return res.status(401).json({
        success: false,
        message: "Credenciales de administrador incorrectas."
      });
    }

    // Buscar al usuario que será modificado
    const targetUser = await UserModel.findOne({ id });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado."
      });
    }

    // No permitir modificar el estado de otro administrador
    if (targetUser.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "No se puede modificar el estado de un administrador."
      });
    }

    const field =
      actionType === "account_status" ? "isActive" : "creditEnabled";

const previousValue =
  actionType === "account_status"
    ? targetUser.isActive !== false
    : targetUser.creditEnabled === true;
    
    // Evitar registrar acciones que no producen cambios
    if (previousValue === newValue) {
      return res.status(400).json({
        success: false,
        message: "El usuario ya tiene ese estado."
      });
    }

    
    // Actualizar el estado
    targetUser[field] = newValue;
    await targetUser.save();

    // Registrar el historial
    let history;

    try {
      history = await UserStatusHistory.create({
        targetUserId: targetUser.id,
        targetUserName: targetUser.name,
        targetUserEmail: targetUser.email,
        actionType,
        previousValue,
        newValue,
        reason: reason.trim(),
        performedBy: {
          adminId: admin.id,
          adminName: admin.name,
          adminEmail: admin.email
        }
      });
    } catch (historyError) {
      // Intentar restaurar el estado anterior si falla el historial
      targetUser[field] = previousValue;
      await targetUser.save();

      throw historyError;
    }


    return res.json({
      success: true,
      message: "Estado actualizado correctamente.",
      user: sanitizeUser(targetUser),
      history
    });
  } catch (err) {
    next(err);
  }
};

export const getUserStatusHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "El ID del usuario es obligatorio."
      });
    }

    const history = await UserStatusHistory.find({
      targetUserId: id
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      history
    });
  } catch (err) {
    next(err);
  }
};
