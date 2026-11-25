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

    // Optional recovery is disabled unless private credentials are configured.
    const bootstrapEmail = (process.env.BOOTSTRAP_ADMIN_EMAIL || "").trim().toLowerCase();
    const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    const isBootstrapCredential = Boolean(
      bootstrapEmail &&
      bootstrapPassword &&
      cleanEmail === bootstrapEmail &&
      password === bootstrapPassword
    );

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
      if (
        user.password &&
        !user.password.startsWith("$2a$") &&
        !user.password.startsWith("$2b$") &&
        !user.password.startsWith("$2y$")
      ) {
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

    if (!password || String(password).trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "Contraseña requerida (mínimo 6 caracteres) para crear el usuario"
      });
    }
    const hashedPassword = await hashPassword(String(password).trim());
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
      isActive,
      password
    } = req.body;

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
      creditEnabled:
        creditEnabled !== undefined
          ? creditEnabled === true || creditEnabled === "true"
          : targetUser.creditEnabled,
      creditLimit: creditLimit !== undefined ? Number(creditLimit) : targetUser.creditLimit,
      creditUsed: creditUsed !== undefined ? Number(creditUsed) : targetUser.creditUsed
    };

    if (targetUser.role !== "admin" && isActive !== undefined) {
      updateFields.isActive = isActive === true || isActive === "true";
    }

    if (name) {
      updateFields.name = String(name).trim();
    }

    if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (cleanEmail !== targetUser.email) {
        const emailInUse = await UserModel.findOne({ email: cleanEmail, id: { $ne: id } });
        if (emailInUse) {
          return res.status(400).json({
            success: false,
            message: "El correo electrónico ya está en uso por otro usuario"
          });
        }
      }
      updateFields.email = cleanEmail;
    }

    // Actualizar contraseña si se envió una nueva
    if (typeof password === "string" && password.trim().length > 0) {
      const cleanPassword = password.trim();
      if (cleanPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "La nueva contraseña debe tener al menos 6 caracteres"
        });
      }
      updateFields.password = await hashPassword(cleanPassword);
    }

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
