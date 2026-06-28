"use client";

import { useEffect, useState } from "react";
import { X, ArrowUpRight, ArrowDownRight, Trash2, AlertTriangle, Check } from "lucide-react";
import { ImageViewer } from "@/components/review/ImageViewer";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { CHECKLIST_ITEMS } from "@/lib/constants";
import type { TradeWithRelations } from "@/types/trade";

export function TradeReviewModal({
  trade,
  onClose,
  onDelete,
}: {
  trade: TradeWithRelations;
  onClose: () => void;
  onDelete?: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const images = [
    { label: "HTF", description: "Higher timeframe", url: trade.htf_image_url },
    { label: "MTF", description: "Middle timeframe", url: trade.mtf_image_url },
    { label: "LTF", description: "Lower timeframe", url: trade.ltf_image_url },
  ];

  const isWin  = trade.pnl > 0;
  const isBreak = trade.pnl === 0;

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-neutral-150 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              trade.direction === "buy" ? "bg-profit-soft text-profit-dark" : "bg-loss-soft text-loss-dark"
            )}
          >
            {trade.direction === "buy" ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-semibold text-neutral-900 dark:text-neutral-50">
                {trade.symbol?.name ?? "Trade"}
              </h2>
              <span className={isWin ? "pill-profit" : isBreak ? "pill-neutral" : "pill-loss"}>{isWin ? "Win" : isBreak ? "B/E" : "Loss"}</span>
            </div>
            <p className="truncate text-xs text-neutral-400">{formatDateTime(trade.date)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              "hidden text-xl font-bold tabular-nums sm:block",
              isWin ? "text-profit-dark" : "text-loss-dark"
            )}
          >
            {formatCurrency(trade.pnl, { sign: true })}
          </div>
          {onDelete && (
            confirming ? (
              <div className="flex flex-col gap-1.5 rounded-xl border border-loss/30 bg-loss-soft p-2.5 dark:bg-loss/10 sm:flex-row sm:items-center sm:gap-2 sm:py-1.5">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={14} className="shrink-0 text-loss-dark" />
                  <span className="text-xs font-medium text-loss-dark">Delete this trade?</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onDelete(trade.id)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-loss px-3 py-1.5 text-xs font-semibold text-white hover:bg-loss-dark sm:flex-none sm:px-2 sm:py-1"
                  >
                    <Check size={12} /> Yes, delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:flex-none sm:px-2 sm:py-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                aria-label="Delete trade"
                className="btn-ghost text-neutral-400 hover:text-loss-dark"
              >
                <Trash2 size={17} />
              </button>
            )
          )}
          <button type="button" onClick={onClose} aria-label="Close review" className="btn-ghost">
            <X size={19} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[340px_1fr]">
          {/* Details */}
          <div className="space-y-4">
            <div className="card card-pad">
              <div className="label-eyebrow mb-3">Trade details</div>
              <dl className="space-y-2.5 text-sm">
                <Row label="Account"     value={trade.account?.name ?? "—"} />
                <Row label="Strategy"    value={trade.strategy?.name ?? "—"} />
                <Row label="Direction"   value={trade.direction === "buy" ? "Buy" : "Sell"} />
                <Row label="Entry"       value={trade.entry_price.toString()} />
                <Row label="Stop loss"   value={trade.stop_loss_price.toString()} />
                <Row label="Take profit" value={trade.take_profit_price.toString()} />
                <Row label="Risk $"      value={formatCurrency(trade.risk_dollar)}
                  valueClassName="text-loss-dark font-semibold" />
                <Row
                  label="R-multiple"
                  value={`${trade.r_multiple >= 0 ? "+" : ""}${trade.r_multiple.toFixed(2)}R`}
                  valueClassName={trade.r_multiple >= 0 ? "text-profit-dark" : "text-loss-dark"}
                />
                <Row
                  label="Profit / Loss"
                  value={formatCurrency(trade.pnl, { sign: true })}
                  valueClassName={cn("font-semibold", isWin ? "text-profit-dark" : "text-loss-dark")}
                />
              </dl>
            </div>

            <div className="card card-pad">
              <div className="label-eyebrow mb-3">Pre-trade checklist</div>
              <ul className="space-y-2 text-sm">
                {CHECKLIST_ITEMS.map((item) => {
                  const checked = trade.checklist[item.key];
                  return (
                    <li key={item.key} className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] text-[10px] font-bold",
                          checked ? "bg-accent text-white" : "bg-neutral-150 text-transparent dark:bg-neutral-800"
                        )}
                      >
                        ✓
                      </span>
                      <span
                        className={cn(
                          "text-[13px]",
                          checked
                            ? "text-neutral-600 dark:text-neutral-300"
                            : "text-neutral-400 line-through decoration-neutral-300"
                        )}
                      >
                        {item.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {trade.notes && (
              <div className="card card-pad">
                <div className="label-eyebrow mb-2">Notes</div>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {trade.notes}
                </p>
              </div>
            )}
          </div>

          {/* Screenshot viewer */}
          <div className="card card-pad">
            <div className="label-eyebrow mb-3">Screenshot review</div>
            <ImageViewer images={images} />
            <p className="mt-3 text-[11px] text-neutral-400">
              Click an image to zoom, use the arrows to step between timeframes, or expand to
              fullscreen for a distraction-free review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-neutral-400">{label}</dt>
      <dd className={cn("font-medium text-neutral-700 dark:text-neutral-200", valueClassName)}>
        {value}
      </dd>
    </div>
  );
}
