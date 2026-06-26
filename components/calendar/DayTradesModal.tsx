"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { TradeTable } from "@/components/journal/TradeTable";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { TradeWithRelations } from "@/types/trade";

export function DayTradesModal({ date, trades, onClose, onSelectTrade }: {
  date: string;
  trades: TradeWithRelations[];
  onClose: () => void;
  onSelectTrade: (trade: TradeWithRelations) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const total = trades.reduce((sum, t) => sum + t.pnl, 0);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    /* Backdrop — click outside to close */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-[2px] transition-all duration-200 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        // only close if the click is directly on the backdrop, not the panel
        if (!panelRef.current?.contains(e.target as Node)) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="max-h-[82vh] w-full overflow-hidden rounded-t-2xl bg-white shadow-soft
                   will-change-transform dark:bg-neutral-900
                   sm:max-w-2xl sm:rounded-2xl
                   animate-[slideUp_0.22s_cubic-bezier(0.32,0.72,0,1)]
                   sm:animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              {formatDate(date)}
            </h3>
            <p className="text-xs text-neutral-400">
              {trades.length} trade{trades.length === 1 ? "" : "s"} ·{" "}
              <span className={cn("font-medium", total >= 0 ? "text-profit-dark" : "text-loss-dark")}>
                {formatCurrency(total, { sign: true })}
              </span>
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="btn-ghost">
            <X size={18} />
          </button>
        </div>

        {/* Trades */}
        <div className="overflow-y-auto p-5" style={{ maxHeight: "calc(82vh - 72px)" }}>
          <TradeTable trades={trades} onSelect={onSelectTrade} />
        </div>
      </div>
    </div>
  );
}
