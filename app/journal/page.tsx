"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { Plus, BarChart2, X, TrendingUp, TrendingDown } from "lucide-react";
import { useTradeData } from "@/lib/hooks/useTradeData";
import { TradeTable } from "@/components/journal/TradeTable";
import { TradeFormModal } from "@/components/journal/TradeFormModal";
import { TradeReviewModal } from "@/components/review/TradeReviewModal";
import { cn, formatCurrency } from "@/lib/utils";
import type { TradeWithRelations } from "@/types/trade";

// ─── Period filter ────────────────────────────────────────────────────────────
type Period = "weekly" | "monthly" | "yearly" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  weekly:  "This Week",
  monthly: "This Month",
  yearly:  "This Year",
  all:     "All Time",
};

function startOf(period: Period): Date | null {
  const now = new Date();
  if (period === "all") return null;
  if (period === "weekly") {
    const d = new Date(now);
    // Forex week runs Mon–Fri. (day+6)%7 maps Sun→6, Mon→0 … Sat→5
    d.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "monthly") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "yearly")  return new Date(now.getFullYear(), 0, 1);
  return null;
}

function filterTrades(trades: TradeWithRelations[], period: Period): TradeWithRelations[] {
  const from = startOf(period);
  if (!from) return trades;
  return trades.filter((t) => new Date(t.date) >= from);
}

// ─── Performance metrics ──────────────────────────────────────────────────────
interface PerfMetrics {
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  netR: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  avgWinR: number;
  avgLossR: number;
  bestTrade: number;
  worstTrade: number;
  netPnl: number;
}

function calcPerf(trades: TradeWithRelations[]): PerfMetrics {
  const wins   = trades.filter((t) => t.profit > 0);
  const losses = trades.filter((t) => t.profit < 0);
  const breakeven = trades.filter((t) => t.profit === 0);

  const grossProfit = wins.reduce((s, t) => s + t.profit, 0);
  const grossLoss   = Math.abs(losses.reduce((s, t) => s + t.profit, 0));
  const netPnl      = trades.reduce((s, t) => s + t.profit, 0);
  const netR        = trades.reduce((s, t) => s + t.r_multiple, 0);

  const winRate = trades.length ? (wins.length / trades.length) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const avgWinR  = wins.length   ? wins.reduce((s, t) => s + t.r_multiple, 0)   / wins.length   : 0;
  const avgLossR = losses.length ? losses.reduce((s, t) => s + t.r_multiple, 0) / losses.length : 0;

  const profits = trades.map((t) => t.profit);
  const bestTrade  = profits.length ? Math.max(...profits) : 0;
  const worstTrade = profits.length ? Math.min(...profits) : 0;

  return {
    totalTrades: trades.length, wins: wins.length, losses: losses.length,
    breakeven: breakeven.length, winRate, netR, grossProfit, grossLoss,
    profitFactor, avgWinR, avgLossR, bestTrade, worstTrade, netPnl,
  };
}

// ─── Performance popup ────────────────────────────────────────────────────────
function PerformancePopup({
  trades,
  anchorRef,
  onClose,
}: {
  trades: TradeWithRelations[];
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const [period, setPeriod] = useState<Period>("monthly");
  const popupRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => filterTrades(trades, period), [trades, period]);
  const m = useMemo(() => calcPerf(filtered), [filtered]);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) onClose();
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, anchorRef]);

  const pf = m.profitFactor === Infinity ? "Perfect" : m.profitFactor === 0 ? "—" : m.profitFactor.toFixed(2);

  return (
    <div
      ref={popupRef}
      className="absolute right-0 top-full z-50 mt-2 w-[340px] animate-scale-in rounded-2xl border border-neutral-150 bg-white shadow-soft dark:border-neutral-800 dark:bg-neutral-900 sm:w-[380px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-accent" />
          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Performance</span>
        </div>
        <button type="button" onClick={onClose} className="btn-ghost !p-1">
          <X size={15} />
        </button>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              "flex-1 rounded-lg px-1 py-1.5 text-[11px] font-semibold transition-colors",
              period === p
                ? "bg-accent text-white"
                : "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            )}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {m.totalTrades === 0 ? (
        <div className="py-10 text-center text-sm text-neutral-400">
          No trades in this period.
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {/* Net PnL hero */}
          <div className={cn(
            "flex items-center justify-between rounded-xl px-4 py-3",
            m.netPnl > 0 ? "bg-profit-soft dark:bg-profit/10" : m.netPnl < 0 ? "bg-loss-soft dark:bg-loss/10" : "bg-neutral-50 dark:bg-neutral-800"
          )}>
            <div>
              <p className="text-[11px] font-medium text-neutral-400">Net P&amp;L</p>
              <p className={cn("text-xl font-bold tabular-nums",
                m.netPnl > 0 ? "text-profit-dark" : m.netPnl < 0 ? "text-loss-dark" : "text-neutral-500"
              )}>
                {formatCurrency(m.netPnl, { sign: true })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-medium text-neutral-400">Net R</p>
              <p className={cn("text-xl font-bold tabular-nums",
                m.netR > 0 ? "text-profit-dark" : m.netR < 0 ? "text-loss-dark" : "text-neutral-500"
              )}>
                {m.netR >= 0 ? "+" : ""}{m.netR.toFixed(2)}R
              </p>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-2">
            <MetricRow label="Total Trades"  value={String(m.totalTrades)} />
            <MetricRow label="Win Rate"
              value={`${m.winRate.toFixed(1)}%`}
              valueClass={m.winRate > 50 ? "text-profit-dark" : m.winRate < 50 ? "text-loss-dark" : undefined} />
            <MetricRow label="Wins"   value={String(m.wins)}   valueClass={m.wins > 0 ? "text-profit-dark" : undefined} />
            <MetricRow label="Losses" value={String(m.losses)} valueClass={m.losses > 0 ? "text-loss-dark" : undefined} />
            {m.breakeven > 0 && (
              <MetricRow label="Breakeven" value={String(m.breakeven)} />
            )}
            <MetricRow label="Profit Factor"
              value={pf}
              valueClass={m.profitFactor === 0 ? undefined : m.profitFactor > 1 ? "text-profit-dark" : "text-loss-dark"} />
            <MetricRow label="Avg Win R"
              value={m.wins > 0 ? `+${m.avgWinR.toFixed(2)}R` : "—"}
              valueClass={m.wins > 0 ? "text-profit-dark" : undefined} />
            <MetricRow label="Avg Loss R"
              value={m.losses > 0 ? `${m.avgLossR.toFixed(2)}R` : "—"}
              valueClass={m.losses > 0 ? "text-loss-dark" : undefined} />
            <MetricRow label="Best Trade"
              value={formatCurrency(m.bestTrade, { sign: true })}
              valueClass={m.bestTrade > 0 ? "text-profit-dark" : m.bestTrade < 0 ? "text-loss-dark" : "text-neutral-500"} />
            <MetricRow label="Worst Trade"
              value={formatCurrency(m.worstTrade, { sign: true })}
              valueClass={m.worstTrade > 0 ? "text-profit-dark" : m.worstTrade < 0 ? "text-loss-dark" : "text-neutral-500"} />
          </div>

          {/* Win/loss bar */}
          {m.totalTrades > 0 && (
            <div>
              <div className="mb-1 flex justify-between text-[10px] text-neutral-400">
                <span className="flex items-center gap-1"><TrendingUp size={10} className="text-profit"/>Wins {m.wins}</span>
                <span className="flex items-center gap-1">Losses {m.losses}<TrendingDown size={10} className="text-loss"/></span>
              </div>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div
                  className="h-full bg-profit transition-all duration-500"
                  style={{ width: `${(m.wins / m.totalTrades) * 100}%` }}
                />
                {m.breakeven > 0 && (
                  <div
                    className="h-full bg-neutral-300 dark:bg-neutral-600"
                    style={{ width: `${(m.breakeven / m.totalTrades) * 100}%` }}
                  />
                )}
                <div className="h-full flex-1 bg-loss" />
              </div>
            </div>
          )}

          <p className="text-center text-[10px] text-neutral-300 dark:text-neutral-600">
            {filtered.length} trade{filtered.length === 1 ? "" : "s"} · {PERIOD_LABELS[period]}
          </p>
        </div>
      )}
    </div>
  );
}

function MetricRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/50">
      <span className="text-[11px] text-neutral-400">{label}</span>
      <span className={cn("text-[13px] font-bold tabular-nums text-neutral-700 dark:text-neutral-200", valueClass)}>
        {value}
      </span>
    </div>
  );
}

// ─── Journal page ─────────────────────────────────────────────────────────────
export default function JournalPage() {
  const { loading, trades, account, removeTrade } = useTradeData();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<TradeWithRelations | null>(null);
  const [showPerf, setShowPerf] = useState(false);
  const perfBtnRef = useRef<HTMLButtonElement>(null);
  // Stable ref so PerformancePopup's useEffect doesn't re-subscribe every render
  const closePerf = useRef(() => setShowPerf(false));
  closePerf.current = () => setShowPerf(false);
  const stableClosePerf = useRef(() => closePerf.current()).current;

  return (
    <div className="space-y-5">
      <div className="card card-pad">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
              All trades
            </h2>
            <p className="text-xs text-neutral-400">
              {trades.length} logged · all metrics computed from this data
            </p>
          </div>

          <div className="relative flex items-center gap-2">
            {/* Performance button */}
            <button
              ref={perfBtnRef}
              type="button"
              onClick={() => setShowPerf((v) => !v)}
              className={cn(
                "btn-outline gap-1.5 text-sm",
                showPerf && "border-accent bg-accent-light text-accent dark:bg-accent/15"
              )}
            >
              <BarChart2 size={15} />
              Performance
            </button>

            {/* New trade button */}
            <button
              type="button"
              onClick={() => setShowForm(true)}
              disabled={!account}
              className="btn-accent"
            >
              <Plus size={16} /> New trade
            </button>

            {/* Performance popup */}
            {showPerf && (
              <PerformancePopup
                trades={trades}
                anchorRef={perfBtnRef}
                onClose={stableClosePerf}
              />
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-neutral-400">Loading…</div>
        ) : (
          <TradeTable trades={trades} onSelect={setSelected} />
        )}
      </div>

      {showForm && <TradeFormModal onClose={() => setShowForm(false)} />}

      {selected && (
        <TradeReviewModal
          trade={selected}
          onClose={() => setSelected(null)}
          onDelete={(id) => { removeTrade(id); setSelected(null); }}
        />
      )}
    </div>
  );
}
