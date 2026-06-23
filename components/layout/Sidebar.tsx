"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, NotebookPen, CalendarDays, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: NotebookPen },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/strategy", label: "Strategy", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop icon rail — white, separated by a soft shadow rather than a hard border */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-[76px] flex-col items-center bg-white py-5 dark:bg-neutral-900 lg:flex"
        style={{ boxShadow: "1px 0 0 rgba(22,22,31,0.04), 4px 0 16px -8px rgba(22,22,31,0.12)" }}
      >
        <Link href="/" className="mb-7 flex items-center justify-center">
          <Logo />
        </Link>

        <nav className="flex flex-1 flex-col items-center gap-1.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                className="group relative flex items-center justify-center"
              >
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150",
                    active
                      ? "bg-accent-light text-accent dark:bg-accent/15"
                      : "text-neutral-400 group-hover:bg-neutral-100 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:bg-neutral-800 dark:group-hover:text-neutral-300"
                  )}
                >
                  <Icon size={19} strokeWidth={active ? 2.3 : 2} />
                </span>
                {active && (
                  <span className="absolute -left-[13px] h-5 w-[3px] rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-300 dark:text-neutral-600">
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-neutral-150 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95 lg:hidden">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-neutral-400 transition-colors duration-150",
                active && "text-accent"
              )}
            >
              <Icon size={19} strokeWidth={active ? 2.4 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
