import { apiClient } from "@/services/api/apiClient";

/**
 * Users Management HTTP Communication Layer
 * Interacts with backend /api/users and registration endpoints
 */

export async function getUsersApi() {
  return apiClient("/api/users");
}

export async function updateUserApi(id, updates) {
  return apiClient("/api/users/update", {
    method: "POST",
    body: JSON.stringify({ id, ...updates })
  });
}


export async function updateUserStatusApi(actionData) {
  return apiClient("/api/users/status-action", {
    method: "POST",
    body: JSON.stringify(actionData)
  });
}

export async function getUserStatusHistoryApi(id) {
  return apiClient(`/api/users/${id}/status-history`);
}


export async function createUserApi(userData) {
  return apiClient("/api/users/create", {
    method: "POST",
    body: JSON.stringify(userData)
  });
}

