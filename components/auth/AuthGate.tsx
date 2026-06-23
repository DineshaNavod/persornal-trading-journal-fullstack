"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { LoginScreen } from "@/components/auth/LoginScreen";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { checking, isAuthenticated } = useAuth();

  if (checking) {
    return <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950" />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
