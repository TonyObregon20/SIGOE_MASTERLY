import { apiClient } from "@/services/api/apiClient";
import { getAuthToken, setAuthToken, removeAuthToken, hasAuthToken, TOKEN_KEY } from "./authUtils";

export { getAuthToken, setAuthToken, removeAuthToken, hasAuthToken, TOKEN_KEY };

/**
 * Authentication API calls for backend communication
 */

export async function loginApi(email, password) {
  return apiClient("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function registerApi(name, email, password) {
  return apiClient("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password })
  });
}

export async function getGoogleConfigApi() {
  return apiClient("/api/auth/google/config");
}

export async function googleLoginApi(credential) {
  return apiClient("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential })
  });
}

export async function requestPasswordResetApi(email) {
  return apiClient("/api/auth/password/request", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export async function verifyPasswordResetCodeApi(email, code) {
  return apiClient("/api/auth/password/verify", {
    method: "POST",
    body: JSON.stringify({ email, code })
  });
}

export async function resetPasswordApi(resetToken, password) {
  return apiClient("/api/auth/password/reset", {
    method: "POST",
    body: JSON.stringify({ resetToken, password })
  });
}

export async function updateProfileApi(updates) {
  return apiClient("/api/auth/profile", {
    method: "POST",
    body: JSON.stringify(updates)
  });
}

export async function getMeApi() {
  const token = getAuthToken();
  if (!token) return { success: false, message: "No token provided" };
  try {
    return await apiClient("/api/auth/me");
  } catch (err) {
    return { success: false, message: err.message };
  }
}

