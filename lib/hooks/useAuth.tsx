"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AUTH_USERNAME, AUTH_PASSWORD, SESSION_HOURS } from "@/lib/auth-config";

// ---------------------------------------------------------------------------
// Session storage schema
// {
//   token: string,        // random token tied to this login
//   expiresAt: number,    // Date.now() + SESSION_HOURS in ms
// }
// ---------------------------------------------------------------------------

const SESSION_KEY    = "tj_session";
const ATTEMPTS_KEY   = "tj_login_attempts";
const MAX_ATTEMPTS   = 5;
const LOCKOUT_MS     = 15 * 60 * 1000; // 15 minutes

interface SessionData {
  token: string;
  expiresAt: number;
}

interface AttemptsData {
  count: number;
  lockedUntil: number; // 0 = not locked
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateToken(): string {
  // Crypto-random hex string — not easily guessable
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function readSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SessionData;
    if (!data.token || !data.expiresAt) return null;
    return data;
  } catch {
    return null;
  }
}

function writeSession(): string {
  const token = generateToken();
  const session: SessionData = {
    token,
    expiresAt: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return token;
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function refreshSession(token: string) {
  // Slide the expiry window on each page visit (activity keeps you logged in)
  const session: SessionData = {
    token,
    expiresAt: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function readAttempts(): AttemptsData {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    if (!raw) return { count: 0, lockedUntil: 0 };
    return JSON.parse(raw) as AttemptsData;
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

function recordFailedAttempt(): AttemptsData {
  const attempts = readAttempts();
  const count = attempts.count + 1;
  const lockedUntil = count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;
  const next: AttemptsData = { count, lockedUntil };
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(next));
  return next;
}

function clearAttempts() {
  localStorage.removeItem(ATTEMPTS_KEY);
}

function lockoutMessage(lockedUntil: number): string {
  const remaining = Math.ceil((lockedUntil - Date.now()) / 60000);
  return `Too many failed attempts. Try again in ${remaining} minute${remaining === 1 ? "" : "s"}.`;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AuthContextValue {
  checking: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [checking, setChecking]         = useState(true);
  const [isAuthenticated, setIsAuth]    = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // On mount: validate existing session and refresh its expiry if still valid
  useEffect(() => {
    const session = readSession();
    if (session && Date.now() < session.expiresAt) {
      refreshSession(session.token); // slide expiry window
      setIsAuth(true);
    } else {
      clearSession();
    }
    setChecking(false);
  }, []);

  const login = useCallback((username: string, password: string): boolean => {
    // Check lockout first
    const attempts = readAttempts();
    if (attempts.lockedUntil > Date.now()) {
      setError(lockoutMessage(attempts.lockedUntil));
      return false;
    }

    // Constant-time-ish comparison (both checks always run)
    const userMatch = username.trim() === AUTH_USERNAME;
    const passMatch = password === AUTH_PASSWORD;

    if (userMatch && passMatch) {
      clearAttempts();
      writeSession();
      setIsAuth(true);
      setError(null);
      return true;
    }

    const next = recordFailedAttempt();
    const remaining = MAX_ATTEMPTS - next.count;
    if (next.lockedUntil > 0) {
      setError(lockoutMessage(next.lockedUntil));
    } else {
      setError(
        `Incorrect username or password.${remaining > 0 ? ` ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` : ""}`
      );
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    clearAttempts();
    setIsAuth(false);
    setError(null);
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
