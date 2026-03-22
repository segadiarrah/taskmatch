"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiGet, apiPost } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "client" | "agent_developer" | "admin";
  is_active: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  role: "client" | "agent_developer";
}

type AuthContextValue = AuthState & AuthActions;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const userData = await apiGet<User>("/v1/auth/me");
      setUser(userData);
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem("auth_token");
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
      fetchUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const response = await apiPost<{ access_token: string; token_type: string }>(
      "/v1/auth/login",
      { email, password }
    );
    const newToken = response.access_token;
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
    await fetchUser();
  };

  const register = async (data: RegisterData) => {
    await apiPost("/v1/auth/register", data);
    await login(data.email, data.password);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
