"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AUTH_USERNAME, AUTH_PASSWORD } from "@/lib/auth-config";

const SESSION_KEY = "tj_session";

interface AuthContextValue {
  checking: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(SESSION_KEY);
    setIsAuthenticated(stored === "active");
    setChecking(false);
  }, []);

  const login = useCallback((username: string, password: string) => {
    const valid = username.trim() === AUTH_USERNAME && password === AUTH_PASSWORD;
    if (valid) {
      window.localStorage.setItem(SESSION_KEY, "active");
      setIsAuthenticated(true);
      setError(null);
      return true;
    }
    setError("Incorrect username or password.");
    return false;
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ checking, isAuthenticated, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
