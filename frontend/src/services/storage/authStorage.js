/**
 * Authentication & JWT storage utilities
 * Centralizes management of JWT in localStorage using the key 'masterly_token'
 */

export const TOKEN_KEY = "masterly_token";

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.error("Error retrieving token from localStorage:", e);
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.error("Error setting token in localStorage:", e);
  }
}

export function removeAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error("Error removing token from localStorage:", e);
  }
}

export function hasAuthToken() {
  return Boolean(getAuthToken());
}

export default {
  TOKEN_KEY,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  hasAuthToken
};
