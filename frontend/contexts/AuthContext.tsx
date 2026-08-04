"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  login as authLogin,
  logout as authLogout,
  getStoredUser,
  isAuthenticated as checkAuth,
  type AuthUser,
  type LoginCredentials,
  type AuthError,
} from "@/lib/auth";

// ========================== TIPOS ==========================================

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

// ========================== CONTEXT ========================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ========================== PROVIDER =======================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sessão do localStorage ao montar
  useEffect(() => {
    const stored = getStoredUser();
    if (stored && checkAuth()) {
      setUser(stored);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const loggedUser = await authLogin(credentials);
    setUser(loggedUser);
  }, []);

  const logout = useCallback(() => {
    authLogout();
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ========================== HOOK ===========================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
