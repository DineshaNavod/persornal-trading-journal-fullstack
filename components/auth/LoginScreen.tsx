"use client";

import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/lib/hooks/useAuth";

export function LoginScreen() {
  const { login, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    login(username, password);
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-accent-deep via-accent-dark to-accent px-4">
      <div className="w-full max-w-sm animate-scale-in rounded-2xl bg-white p-7 shadow-soft dark:bg-neutral-900">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 rounded-xl bg-accent p-2.5">
            <Logo className="bg-transparent" />
          </div>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Trading Journal
          </h1>
          <p className="mt-1 text-sm text-neutral-400">Private — sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="field-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>
          <div>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-xs font-medium text-loss-dark">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-accent w-full">
            <Lock size={15} />
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
