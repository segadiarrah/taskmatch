"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { API_BASE_URL, ApiError, apiErrorMessage, apiGet, apiPost } from "@/lib/api";

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
  authError: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  retrySession: () => Promise<void>;
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
  const [authError, setAuthError] = useState(false);

  const fetchUser = useCallback(async () => {
    const expectedToken = localStorage.getItem("auth_token");
    setAuthError(false);
    try {
      const userData = await apiGet<User>("/v1/auth/me");
      if (localStorage.getItem("auth_token") === expectedToken) setUser(userData);
    } catch (error) {
      const currentToken = localStorage.getItem("auth_token");
      const sessionExpired = error instanceof ApiError && (error.status === 401 || error.status === 403);
      // The API helper may already have removed this expired token. Every
      // other mismatch belongs to a different session and must be ignored.
      if (currentToken !== expectedToken && !(sessionExpired && currentToken === null)) return;
      setUser(null);
      if (sessionExpired) {
        setToken(null);
        localStorage.removeItem("auth_token");
      } else if (localStorage.getItem("auth_token") === expectedToken) {
        setAuthError(true);
      }
    }
  }, []);

  const retrySession = useCallback(async () => {
    setIsLoading(true);
    await fetchUser();
    setIsLoading(false);
  }, [fetchUser]);

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
    const formData = new URLSearchParams();
    formData.append("username", email.trim());
    formData.append("password", password);

    const res = await fetch(`${API_BASE_URL}/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new ApiError(apiErrorMessage(err, "Login failed"), res.status, err);
    }

    const data = await res.json();
    localStorage.setItem("auth_token", data.access_token);
    setToken(data.access_token);
    const userData = await apiGet<User>("/v1/auth/me");
    setUser(userData);
    setAuthError(false);
    return userData;
  };

  const register = async (data: RegisterData) => {
    await apiPost("/v1/auth/register", data);
    await login(data.email, data.password);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
    setAuthError(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        authError,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        retrySession,
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
