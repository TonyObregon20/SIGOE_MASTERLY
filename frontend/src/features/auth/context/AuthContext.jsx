import React, { createContext, useState, useEffect, useCallback } from "react";
import { authService } from "../authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restore session on mount if JWT exists in localStorage
  const refreshUser = useCallback(async () => {
    try {
      const res = await authService.getCurrentUser();
      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        setIsLoggedIn(true);
        return res.user;
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
        return null;
      }
    } catch (error) {
      console.error("Error restoring/refreshing auth session:", error);
      setCurrentUser(null);
      setIsLoggedIn(false);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res && res.success && res.user) {
      setCurrentUser(res.user);
      setIsLoggedIn(true);
    }
    return res;
  };

  const register = async (name, email, password) => {
    const res = await authService.register(name, email, password);
    if (res && res.success && res.user) {
      setCurrentUser(res.user);
      setIsLoggedIn(true);
    }
    return res;
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  const value = {
    currentUser,
    setCurrentUser,
    isLoggedIn,
    setIsLoggedIn,
    loading,
    login,
    register,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
