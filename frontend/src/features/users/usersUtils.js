/**
 * Pure utility functions for the Users domain
 */

/**
 * Filter users by role and search term
 */
export function filterUsers(users = [], { role = "all", query = "" } = {}) {
  return users.filter((u) => {
    const matchesRole = role === "all" || u.role === role;
    const term = query.toLowerCase();
    const matchesQuery =
      !term ||
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.username?.toLowerCase().includes(term);
    return matchesRole && matchesQuery;
  });
}

/**
 * Normalizes user object
 */
export function normalizeUser(user = {}) {
  return {
    id: user._id || user.id || `u-${Date.now()}`,
    name: user.name || "",
    email: user.email || "",
    username: user.username || user.email?.split("@")[0] || "",
    role: user.role || "client",
    phone: user.phone || "",
    address: user.address || "",
    createdAt: user.createdAt || new Date().toISOString()
  };
}

/**
 * Calculates user role statistics
 */
export function calculateUserMetrics(users = []) {
  let adminCount = 0;
  let clientCount = 0;
  let operatorCount = 0;

  users.forEach((u) => {
    if (u.role === "admin") adminCount += 1;
    else if (u.role === "operator" || u.role === "operario") operatorCount += 1;
    else clientCount += 1;
  });

  return {
    total: users.length,
    adminCount,
    clientCount,
    operatorCount
  };
}
