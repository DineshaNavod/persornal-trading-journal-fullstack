"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { SymbolIcon } from "@/components/journal/SymbolIcon";
import type { TradeWithRelations } from "@/types/trade";

export function TradeTable({
  trades,
  onSelect,
  emptyLabel = "No trades yet. Log your first trade in the Journal.",
}: {
  trades: TradeWithRelations[];
  onSelect: (trade: TradeWithRelations) => void;
  emptyLabel?: string;
}) {
  if (trades.length === 0) {
    return <div className="py-10 text-center text-sm text-neutral-400">{emptyLabel}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-150 text-left text-[11px] uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
            <th className="py-2.5 pr-3 font-medium">Symbol</th>
            <th className="py-2.5 pr-3 font-medium">Direction</th>
            <th className="py-2.5 pr-3 font-medium">Risk $</th>
            <th className="py-2.5 pr-3 font-medium">R</th>
            <th className="py-2.5 pr-3 font-medium">Profit / Loss</th>
            <th className="py-2.5 pr-3 font-medium">Outcome</th>
            <th className="py-2.5 pr-3 font-medium">Closed at</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr
              key={trade.id}
              onClick={() => onSelect(trade)}
              className="cursor-pointer border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50 dark:border-neutral-800/60 dark:hover:bg-neutral-800/40"
            >
              <td className="py-3 pr-3">
                <span className="flex items-center gap-2 font-medium text-neutral-800 dark:text-neutral-100">
                  <SymbolIcon symbolName={trade.symbol?.name ?? ""} />
                  {trade.symbol?.name ?? "—"}
                </span>
              </td>
              <td className="py-3 pr-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[13px] font-medium",
                    trade.direction === "buy" ? "text-profit-dark" : "text-loss-dark"
                  )}
                >
                  {trade.direction === "buy" ? (
                    <ArrowUpRight size={14} />
                  ) : (
                    <ArrowDownRight size={14} />
                  )}
                  {trade.direction === "buy" ? "Buy" : "Sell"}
                </span>
              </td>
              <td className="py-3 pr-3 font-medium tabular-nums text-loss-dark">
                − {formatCurrency(trade.risk_dollar)}
              </td>
              <td
                className={cn(
                  "py-3 pr-3 font-medium tabular-nums",
                  trade.r_multiple >= 0 ? "text-profit-dark" : "text-loss-dark"
                )}
              >
                {trade.r_multiple >= 0 ? "+" : ""}
                {trade.r_multiple.toFixed(2)}R
              </td>
              <td
                className={cn(
                  "py-3 pr-3 font-semibold tabular-nums",
                  trade.pnl >= 0 ? "text-profit-dark" : "text-loss-dark"
                )}
              >
                {formatCurrency(trade.pnl, { sign: true })}
              </td>
              <td className="py-3 pr-3">
                <span className={trade.pnl >= 0 ? "pill-profit" : "pill-loss"}>
                  {trade.pnl >= 0 ? "Win" : "Loss"}
                </span>
              </td>
              <td className="py-3 pr-3 text-neutral-400">{formatDateTime(trade.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
