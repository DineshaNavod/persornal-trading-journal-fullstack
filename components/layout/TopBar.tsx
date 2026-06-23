"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { CapitalAdjust } from "@/components/ui/CapitalAdjust";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/":         { title: "Dashboard",  subtitle: "Your trading performance at a glance, calculated straight from your journal." },
  "/journal":  { title: "Journal",    subtitle: "Log every trade. Every number downstream is computed from what you enter here." },
  "/calendar": { title: "Calendar",   subtitle: "Green days made money, red days lost it — click any date to review." },
  "/strategy": { title: "Strategy",   subtitle: "Your locked trading plan. Edit it from the admin view only." },
};

export function TopBar() {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? { title: "", subtitle: "" };

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-150 bg-white/90 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            {meta.title}
          </h1>
          <p className="hidden text-[12px] text-neutral-400 dark:text-neutral-500 sm:block">
            {meta.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CapitalAdjust />
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
