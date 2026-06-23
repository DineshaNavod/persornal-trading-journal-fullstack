"use client";

import { Check } from "lucide-react";
import { CHECKLIST_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TradeChecklist } from "@/types/trade";

export function ChecklistGate({
  checklist,
  onChange,
}: {
  checklist: TradeChecklist;
  onChange: (next: TradeChecklist) => void;
}) {
  const allChecked = CHECKLIST_ITEMS.every((item) => checklist[item.key]);

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-4 transition-colors",
        allChecked
          ? "border-accent/40 bg-accent-light dark:bg-accent/10"
          : "border-neutral-150 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-200">
          Pre-save discipline checklist
        </span>
        <span
          className={cn(
            "pill",
            allChecked ? "pill-accent" : "bg-neutral-150 text-neutral-400 dark:bg-neutral-800"
          )}
        >
          {CHECKLIST_ITEMS.filter((i) => checklist[i.key]).length}/{CHECKLIST_ITEMS.length}
        </span>
      </div>

      <div className="space-y-2.5">
        {CHECKLIST_ITEMS.map((item) => {
          const checked = checklist[item.key];
          return (
            <label
              key={item.key}
              className="flex cursor-pointer items-center gap-2.5 text-[13px] text-neutral-600 dark:text-neutral-300"
            >
              <span
                onClick={() => onChange({ ...checklist, [item.key]: !checked })}
                className={cn(
                  "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors",
                  checked
                    ? "border-accent bg-accent text-white"
                    : "border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-800"
                )}
              >
                {checked && <Check size={12} strokeWidth={3} />}
              </span>
              {item.label}
            </label>
          );
        })}
      </div>

      {!allChecked && (
        <p className="mt-3 text-[11px] text-neutral-400">
          All items must be checked before this trade can be saved.
        </p>
      )}
    </div>
  );
}
