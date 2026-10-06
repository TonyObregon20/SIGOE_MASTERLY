import { loginApi, registerApi, getMeApi } from "./authApi";
import { getAuthToken, setAuthToken, removeAuthToken, hasAuthToken } from "./authUtils";

/**
 * Authentication service layer
 * Handles auth business logic, token synchronization and session restoration.
 */
export const authService = {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  hasAuthToken,

  async login(email, password) {
    const data = await loginApi(email, password);
    if (data && data.success && data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async register(name, email, password) {
    const data = await registerApi(name, email, password);
    if (data && data.success && data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async getCurrentUser() {
    const token = getAuthToken();
    if (!token) {
      return { success: false, user: null };
    }
    const data = await getMeApi();
    if (data && data.success && data.user) {
      return data;
    }
    // If token invalid, remove it
    removeAuthToken();
    return { success: false, user: null };
  },

  logout() {
    removeAuthToken();
    return { success: true };
  }
};

export default authService;
