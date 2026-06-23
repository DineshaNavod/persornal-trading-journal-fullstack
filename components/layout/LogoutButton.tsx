"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

export function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      type="button"
      onClick={logout}
      aria-label="Log out"
      title="Log out"
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-150 bg-white text-neutral-500 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      <LogOut size={16} />
    </button>
  );
}
