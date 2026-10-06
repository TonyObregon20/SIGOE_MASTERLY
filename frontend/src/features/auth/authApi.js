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

export async function getMeApi() {
  const token = getAuthToken();
  if (!token) return { success: false, message: "No token provided" };
  try {
    return await apiClient("/api/auth/me");
  } catch (err) {
    return { success: false, message: err.message };
  }
}

