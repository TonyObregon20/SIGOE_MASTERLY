import UserModel from "../models/User.js";
import UserStatusHistory from "../models/UserStatusHistory.js";
import PasswordResetModel from "../models/PasswordReset.js";
import crypto from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { sendPasswordResetCode } from "../services/emailService.js";
import { isMongoConnected, connectionErrorMsg } from "../config/db.js";
import {
  hashPassword,
  comparePassword,
  generateToken,
  sanitizeUser,
  generatePasswordResetToken,
  verifyPasswordResetToken
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
    const { name, email, password, role, creditEnabled, creditLimit, isActive, workerPosition, phone, hourlyRate } = req.body;
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
    const chosenRole = role === "admin"
      ? "admin"
      : role === "worker"
        ? "worker"
        : "customer";

    const newUser = await UserModel.create({
      id: `U-${Date.now()}`,
      name: name || "Usuario",
      email: cleanEmail,
      password: hashedPassword,
      role: chosenRole,
      isActive: isActive !== false,
      creditEnabled: creditEnabled === true || creditEnabled === "true",
      creditLimit: Number(creditLimit) || 0,
      creditUsed: 0,
      workerPosition: chosenRole === "worker" ? String(workerPosition || "") : "",
      phone: String(phone || ""),
      hourlyRate: chosenRole === "worker" ? Math.max(0, Number(hourlyRate) || 0) : 0
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

export const updateMyProfile = async (req, res, next) => {
  try {
    const allowedColors = ["blue", "navy", "emerald", "indigo", "slate"];
    const updateFields = {};

    if (typeof req.body.name === "string" && req.body.name.trim()) {
      updateFields.name = req.body.name.trim();
    }
    if (typeof req.body.phone === "string") {
      updateFields.phone = req.body.phone.trim();
    }
    if (allowedColors.includes(req.body.avatarColor)) {
      updateFields.avatarColor = req.body.avatarColor;
    }
    if (typeof req.body.avatarUrl === "string") {
      if (req.body.avatarUrl.length <= 2_000_000) {
        updateFields.avatarUrl = req.body.avatarUrl;
      }
    }
    if (typeof req.body.invoiceEmailNotifications === "boolean") {
      updateFields.invoiceEmailNotifications = req.body.invoiceEmailNotifications;
    }
    if (typeof req.body.orderStageEmailNotifications === "boolean") {
      updateFields.orderStageEmailNotifications = req.body.orderStageEmailNotifications;
    }

    if (req.body.savedPayment !== undefined) {
      if (req.body.savedPayment === null) {
        updateFields.savedPayment = null;
      } else {
        const payment = req.body.savedPayment;
        const last4 = String(payment.last4 || "").replace(/\D/g, "").slice(-4);
        if (last4.length === 4) {
          updateFields.savedPayment = {
            brand: String(payment.brand || "Tarjeta").slice(0, 30),
            last4,
            expiry: String(payment.expiry || "").replace(/[^\d/]/g, "").slice(0, 5),
            holderName: String(payment.holderName || "").trim().slice(0, 80)
          };
        }
      }
    }

    const user = await UserModel.findOneAndUpdate(
      { id: req.currentUser.id },
      { $set: updateFields },
      { new: true }
    );
    res.json({ success: true, user: sanitizeUser(user) });
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

export const getWorkers = async (req, res, next) => {
  try {
    const list = await UserModel.find({ role: "worker", isActive: { $ne: false } }).sort({ name: 1 }).lean();
    res.json(list.map((worker) => ({
      id: worker.id,
      name: worker.name,
      email: worker.email,
      workerPosition: worker.workerPosition || "",
      hourlyRate: Number(worker.hourlyRate) || 0,
      isActive: worker.isActive !== false
    })));
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id, role, creditEnabled, creditLimit, creditUsed, name, email, isActive, password, workerPosition, phone, hourlyRate, avatarColor, avatarUrl, invoiceEmailNotifications, orderStageEmailNotifications } = req.body;
    
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
    // Los clientes no pueden ser promovidos desde esta edición
    let finalRole = targetUser.role;
    if (targetUser.role === "customer") finalRole = "customer";
    if (targetUser.role === "worker" && role === "worker") finalRole = "worker";
    if (targetUser.role === "admin" && role === "admin") finalRole = "admin";

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
    if (email) updateFields.email = (email || "").trim().toLowerCase();
    if (password) updateFields.password = await hashPassword(password);
    if (targetUser.role === "worker") {
      if (workerPosition !== undefined) updateFields.workerPosition = String(workerPosition);
      if (phone !== undefined) updateFields.phone = String(phone);
      if (hourlyRate !== undefined) updateFields.hourlyRate = Math.max(0, Number(hourlyRate) || 0);
    }
    if (targetUser.role === "customer") {
      if (avatarColor !== undefined) updateFields.avatarColor = String(avatarColor);
      if (avatarUrl !== undefined) updateFields.avatarUrl = String(avatarUrl);
      if (invoiceEmailNotifications !== undefined) updateFields.invoiceEmailNotifications = Boolean(invoiceEmailNotifications);
      if (orderStageEmailNotifications !== undefined) updateFields.orderStageEmailNotifications = Boolean(orderStageEmailNotifications);
    }

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

export const getGoogleConfig = async (req, res) => {
  res.json({
    success: true,
    clientId: process.env.GOOGLE_CLIENT_ID || ""
  });
};

export const googleLogin = async (req, res, next) => {
  try {
    const credential = req.body?.credential;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      return res.status(503).json({ success: false, message: "Google OAuth no está configurado." });
    }
    if (!credential) {
      return res.status(400).json({ success: false, message: "Credencial de Google requerida." });
    }

    const googleClient = new OAuth2Client(clientId);
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();

    if (!payload?.email || payload.email_verified !== true) {
      return res.status(401).json({ success: false, message: "Google no confirmó el correo electrónico." });
    }

    const email = payload.email.trim().toLowerCase();
    let user = await UserModel.findOne({ $or: [{ googleId: payload.sub }, { email }] });

    if (user) {
      const updateFields = {
        googleId: payload.sub,
        googleEmail: email
      };
      if (payload.name && !user.name) updateFields.name = payload.name;
      user = await UserModel.findOneAndUpdate(
        { _id: user._id },
        { $set: updateFields },
        { new: true }
      );
    } else {
      user = await UserModel.create({
        id: `U-${Date.now()}`,
        name: payload.name || "Cliente",
        email,
        googleId: payload.sub,
        googleEmail: email,
        role: "customer",
        isActive: true,
        creditEnabled: false,
        creditLimit: 0,
        creditUsed: 0
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: "Usuario desactivado. Contacte al administrador." });
    }

    const token = generateToken(user);
    res.json({ success: true, token, user: sanitizeUser(user) });
  } catch (err) {
    if (err?.message?.includes("Wrong recipient") || err?.message?.includes("Token used too early")) {
      return res.status(401).json({ success: false, message: "La credencial de Google no es válida." });
    }
    next(err);
  }
};

export const requestPasswordReset = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: "Correo electrónico requerido." });
    }

    const genericMessage = "Si el correo está registrado, recibirás un código de recuperación.";
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.json({ success: true, message: genericMessage });
    }

    await PasswordResetModel.deleteMany({ email });

    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = crypto.createHash("sha256").update(`${email}:${code}`).digest("hex");
    const minutes = Number(process.env.PASSWORD_RESET_MINUTES) || 10;

    await PasswordResetModel.create({
      email,
      codeHash,
      expiresAt: new Date(Date.now() + minutes * 60 * 1000),
      attempts: 0,
      used: false
    });

    await sendPasswordResetCode({ recipient: email, code, name: user.name });
    res.json({ success: true, message: genericMessage });
  } catch (err) {
    next(err);
  }
};

export const verifyPasswordResetCode = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();
    const maxAttempts = Number(process.env.PASSWORD_RESET_MAX_ATTEMPTS) || 5;

    if (!email || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, message: "Correo y código de 6 dígitos requeridos." });
    }

    const reset = await PasswordResetModel.findOne({ email, used: false }).sort({ createdAt: -1 });
    if (!reset) {
      return res.status(400).json({ success: false, message: "El código expiró o no existe." });
    }
    if (reset.expiresAt <= new Date()) {
      await PasswordResetModel.deleteOne({ _id: reset._id });
      return res.status(400).json({ success: false, message: "El código expiró." });
    }
    if (reset.attempts >= maxAttempts) {
      await PasswordResetModel.deleteOne({ _id: reset._id });
      return res.status(429).json({ success: false, message: "Demasiados intentos. Solicita un código nuevo." });
    }

    const submittedHash = crypto.createHash("sha256").update(`${email}:${code}`).digest("hex");
    const submittedBuffer = Buffer.from(submittedHash, "hex");
    const storedBuffer = Buffer.from(reset.codeHash, "hex");
    const matches = submittedBuffer.length === storedBuffer.length && crypto.timingSafeEqual(submittedBuffer, storedBuffer);

    if (!matches) {
      reset.attempts += 1;
      await reset.save();
      return res.status(400).json({ success: false, message: "Código incorrecto." });
    }

    reset.used = true;
    await reset.save();

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Usuario no encontrado." });
    }

    res.json({
      success: true,
      resetToken: generatePasswordResetToken(user.id, email)
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, password } = req.body;
    if (!resetToken) {
      return res.status(400).json({ success: false, message: "Token de recuperación requerido." });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: "La contraseña debe tener al menos 8 caracteres." });
    }

    const payload = verifyPasswordResetToken(resetToken);
    if (!payload) {
      return res.status(401).json({ success: false, message: "El token de recuperación expiró o no es válido." });
    }

    const verifiedReset = await PasswordResetModel.findOne({
      email: payload.email,
      used: true,
      expiresAt: { $gt: new Date() }
    });
    if (!verifiedReset) {
      return res.status(401).json({ success: false, message: "La recuperación ya fue utilizada o expiró." });
    }

    const user = await UserModel.findOne({ id: payload.id, email: payload.email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado." });
    }

    const hashedPassword = await hashPassword(password);
    await UserModel.findOneAndUpdate(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );
    await PasswordResetModel.deleteMany({ email: payload.email });

    res.json({ success: true, message: "Contraseña actualizada correctamente." });
  } catch (err) {
    next(err);
  }
};
