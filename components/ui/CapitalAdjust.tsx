"use client";

import { useState } from "react";
import { Minus, Plus, Check, X } from "lucide-react";
import { useTradeData } from "@/lib/hooks/useTradeData";
import { formatCurrency, cn } from "@/lib/utils";

export function CapitalAdjust() {
  const { account, adjustCapital } = useTradeData();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"add" | "sub">("add");

  if (!account) return null;

  async function apply() {
    const amount = Number(input);
    if (!amount || amount <= 0) return;
    setSaving(true);
    try {
      await adjustCapital(mode === "add" ? amount : -amount);
      setInput("");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-outline gap-1.5 text-xs"
      >
        <span className="flex items-center gap-0.5">
          <Plus size={11} /><Minus size={11} />
        </span>
        Adjust capital
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 animate-scale-in rounded-2xl border border-neutral-150 bg-white p-4 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-200">
                Adjust capital
              </span>
              <button onClick={() => setOpen(false)} className="btn-ghost !p-1">
                <X size={15} />
              </button>
            </div>

            <p className="mb-3 text-xs text-neutral-400">
              Starting balance:{" "}
              <span className="font-semibold text-neutral-600 dark:text-neutral-300">
                {formatCurrency(account.starting_balance)}
              </span>
            </p>

            <div className="mb-3 flex rounded-xl border border-neutral-150 p-0.5 dark:border-neutral-800">
              {(["add", "sub"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
                    mode === m
                      ? m === "add" ? "bg-profit text-white" : "bg-loss text-white"
                      : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  )}>
                  {m === "add" ? <><Plus size={13} /> Add funds</> : <><Minus size={13} /> Withdraw</>}
                </button>
              ))}
            </div>

            {/* FIX: flex row so $ never overlaps placeholder */}
            <div className="flex gap-2">
              <div className="flex flex-1 overflow-hidden rounded-xl border border-neutral-200 bg-white focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10 dark:border-neutral-700 dark:bg-neutral-900">
                <span className="flex items-center pl-3 pr-1 text-sm font-semibold text-neutral-400 select-none">$</span>
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent py-2.5 pr-3 text-sm text-neutral-900 placeholder:text-neutral-300 outline-none dark:text-neutral-100"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0.00"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && apply()}
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={apply}
                disabled={saving || !input || Number(input) <= 0}
                className={cn(
                  "btn flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                  mode === "add"
                    ? "bg-profit text-white hover:bg-profit-dark disabled:opacity-40"
                    : "bg-loss text-white hover:bg-loss-dark disabled:opacity-40"
                )}
              >
                <Check size={16} />
              </button>
            </div>

            {input && Number(input) > 0 && (
              <p className={cn("mt-2 text-center text-[11px] font-medium",
                mode === "add" ? "text-profit-dark" : "text-loss-dark"
              )}>
                New balance:{" "}
                {formatCurrency(
                  mode === "add"
                    ? account.starting_balance + Number(input)
                    : Math.max(0, account.starting_balance - Number(input))
                )}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
