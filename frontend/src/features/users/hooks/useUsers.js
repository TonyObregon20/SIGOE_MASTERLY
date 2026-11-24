import { useState, useEffect, useCallback } from "react";
import { usersService } from "../usersService";

/**
 * Custom hook to manage Users administration state and operations
 */
export function useUsers(autoLoad = true) {
  const [users, setUsersState] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [userStatusHistory, setUserStatusHistory] = useState([]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersService.fetchUsers();
      if (Array.isArray(data)) {
        setUsersState(data);
      }
      return data;
    } catch (err) {
      console.error("Error loading users:", err);
      setError(err.message || "Error al cargar usuarios");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const result = await usersService.updateUser(id, updates);
      if (result?.success) {
        setUsersState((previousUsers) =>
          previousUsers.map((user) =>
            user.id === id ? { ...user, ...result.user, ...updates } : user
          )
        );
      }
      return result;
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err.message || "Error al actualizar usuario");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadUsers]);


  const updateUserStatus = useCallback(async (actionData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await usersService.updateUserStatus(actionData);

      if (result?.success) {
        setUsersState((previousUsers) =>
          previousUsers.map((user) =>
            user.id === actionData.id
              ? { ...user, ...result.user }
              : user
          )
        );
      }

      return result;
    } catch (err) {
      console.error("Error updating user status:", err);
      setError(err.message || "Error al cambiar el estado del usuario");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);


const loadUserStatusHistory = useCallback(async (id) => {
  setLoading(true);
  setError(null);
  setUserStatusHistory([]);

  try {
    const result = await usersService.getUserStatusHistory(id);

    if (result?.success) {
      setUserStatusHistory(result.history || []);
    }

    return result;
  } catch (err) {
    console.error("Error loading user status history:", err);
    setError(err.message || "Error al cargar el historial");
    throw err;
  } finally {
    setLoading(false);
  }
}, []);


  const createUser = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await usersService.createUser(userData);
      if (result && result.success) {
        await loadUsers();
      }
      return result;
    } catch (err) {
      console.error("Error creating user:", err);
      setError(err.message || "Error al registrar usuario");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadUsers]);

  /**
   * Flexible setUsers supporting direct values and updater functions
   * with automatic domain synchronization.
   */
  const setUsers = useCallback((updaterOrValue) => {
    if (typeof updaterOrValue === "function") {
      setUsersState((prevUsers) => {
        const nextUsers = updaterOrValue(prevUsers);
        if (Array.isArray(nextUsers)) {
          if (nextUsers.length > prevUsers.length) {
            const added = nextUsers[nextUsers.length - 1];
            if (added) {
              createUser(added).catch((err) => console.error("Error creating user:", err));
            }
          } else {
            nextUsers.forEach((u) => {
              const prev = prevUsers.find((x) => x.id === u.id);
              if (prev && JSON.stringify(prev) !== JSON.stringify(u)) {
                updateUser(u.id, u).catch((err) => console.error("Error updating user:", err));
              }
            });
          }
          return nextUsers;
        }
        return prevUsers;
      });
    } else {
      setUsersState(updaterOrValue);
    }
  }, [createUser, updateUser]);

  useEffect(() => {
    if (autoLoad) {
      loadUsers();
    }
  }, [autoLoad, loadUsers]);

return {
  users,
  setUsers,
  loading,
  error,
  loadUsers,
  updateUser,
  updateUserStatus,
  loadUserStatusHistory,
  userStatusHistory,
  createUser
};
}

export default useUsers;
