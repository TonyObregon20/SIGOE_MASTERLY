import { getUsersApi, updateUserApi, createUserApi } from "./usersApi";
import { filterUsers, normalizeUser, calculateUserMetrics } from "./usersUtils";

/**
 * Users Domain Service Layer
 */
export const usersService = {
  /**
   * Fetches all registered users from backend
   */
  async fetchUsers() {
    try {
      const data = await getUsersApi();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("usersService.fetchUsers error:", err);
      return [];
    }
  },

  /**
   * Updates an existing user's details, role or password
   */
  async updateUser(id, updates) {
    return updateUserApi(id, updates);
  },

  /**
   * Registers/creates a new user (preserving password even if normalizeUser strips it)
   */
  async createUser(userData) {
    const payload = {
      ...normalizeUser(userData),
      ...(userData?.password ? { password: userData.password } : {})
    };
    return createUserApi(payload);
  },

  /**
   * Helpers
   */
  filterUsers,
  normalizeUser,
  calculateUserMetrics
};

export default usersService;
