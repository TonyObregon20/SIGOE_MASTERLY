import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "masterly_super_secure_jwt_secret_key_2026_x99";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Hashes a plain text password using bcrypt
 */
export async function hashPassword(plainPassword) {
  if (!plainPassword) return "";
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Compares a plain password with a hashed password.
 * Supports legacy plain-text comparison for backward compatibility with auto-upgrade.
 */
export async function comparePassword(plainPassword, storedPassword) {
  if (!plainPassword || !storedPassword) return false;

  // If storedPassword looks like a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
    return bcrypt.compare(plainPassword, storedPassword);
  }

  // Fallback: direct string comparison for unhashed legacy passwords
  return plainPassword === storedPassword;
}

/**
 * Generates a signed JWT for an authenticated user
 */
export function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role || "customer",
    name: user.name
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifies and decodes a JWT token
 */
export function verifyJwtToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Sanitizes user object to never expose password hashes in API responses
 */
export function sanitizeUser(user) {
  if (!user) return null;
  const u = user.toObject ? user.toObject() : { ...user };
  delete u.password;
  delete u._id;
  delete u.__v;
  return u;
}
