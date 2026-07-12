"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useTradeData } from "@/lib/hooks/useTradeData";
import { getForexDay } from "@/lib/calculations";
import { cn, formatCurrency } from "@/lib/utils";
import { MARKET_CONDITIONS, FIXED_PAIRS } from "@/lib/constants";
import type { TradeWithRelations, KillZone, MarketCondition } from "@/types/trade";

// ── Period filter ────────────────────────────────────────────────────────────
type Period = "weekly" | "monthly" | "yearly" | "all";
const PERIOD_LABELS: Record<Period, string> = {
  weekly: "This Week", monthly: "This Month", yearly: "This Year", all: "All Time",
};

function startOf(period: Period): Date | null {
  const now = new Date();
  if (period === "all") return null;
  if (period === "weekly") {
    const d = new Date(now);
    d.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "monthly") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "yearly")  return new Date(now.getFullYear(), 0, 1);
  return null;
}

function filterByPeriod(trades: TradeWithRelations[], period: Period): TradeWithRelations[] {
  const from = startOf(period);
  if (!from) return trades;
  return trades.filter((t) => new Date(t.date) >= from);
}

// ── Generic stat bucket ──────────────────────────────────────────────────────
interface Bucket { label: string; trades: TradeWithRelations[]; }

function summarize(trades: TradeWithRelations[]) {
  const wins = trades.filter((t) => t.profit > 0).length;
  const winRate = trades.length ? (wins / trades.length) * 100 : 0;
  const totalR = trades.reduce((s, t) => s + t.r_multiple, 0);
  const totalProfit = trades.reduce((s, t) => s + t.profit, 0);
  return { count: trades.length, winRate, totalR, totalProfit };
}

function rowColor(winRate: number) {
  if (winRate > 55) return "text-profit-dark";
  if (winRate < 45) return "text-loss-dark";
  return "text-neutral-500";
}

// ── Panel card wrapper ───────────────────────────────────────────────────────
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card card-pad">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {title}
      </h2>
      {children}
    </div>
  );
}

// ── Generic bucket table — mobile: stacked cards, desktop: table ─────────────
function BucketTable({ buckets }: { buckets: Bucket[] }) {
  const rows = buckets.map((b) => ({ label: b.label, ...summarize(b.trades) }));
  const maxR = Math.max(1, ...rows.map((r) => Math.abs(r.totalR)));

  if (rows.every((r) => r.count === 0)) {
    return <p className="py-6 text-center text-sm text-neutral-400">No trades in this period.</p>;
  }

  return (
    <div className="space-y-2">
      {/* Desktop header */}
      <div className="hidden grid-cols-[1.3fr_0.7fr_0.9fr_0.9fr] gap-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 sm:grid">
        <span>Label</span><span className="text-right">Win Rate</span>
        <span className="text-right">Trades</span><span className="text-right">Total R</span>
      </div>

      {rows.map((r) => (
        <div key={r.label}
          className="rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/50 sm:grid sm:grid-cols-[1.3fr_0.7fr_0.9fr_0.9fr] sm:items-center sm:gap-2 sm:px-2 sm:py-2 sm:bg-transparent sm:border-0 sm:dark:bg-transparent"
        >
          {/* Mobile layout: stacked */}
          <div className="flex items-center justify-between sm:contents">
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{r.label}</span>
            <span className={cn("text-sm font-bold tabular-nums sm:text-right sm:text-[13px]", rowColor(r.winRate))}>
              {r.count > 0 ? `${r.winRate.toFixed(0)}%` : "—"}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-neutral-400 sm:contents sm:mt-0">
            <span className="sm:text-right sm:text-[13px] sm:text-neutral-500 sm:dark:text-neutral-400">
              {r.count} trade{r.count === 1 ? "" : "s"}
            </span>
            <span className={cn("font-semibold tabular-nums sm:text-right sm:text-[13px]",
              r.totalR > 0 ? "text-profit-dark" : r.totalR < 0 ? "text-loss-dark" : "text-neutral-400"
            )}>
              {r.count > 0 ? `${r.totalR >= 0 ? "+" : ""}${r.totalR.toFixed(1)}R` : "—"}
            </span>
          </div>
          {/* Mini bar (mobile + desktop) */}
          {r.count > 0 && (
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-neutral-150 dark:bg-neutral-800 sm:hidden">
              <div
                className={cn("h-full", r.totalR >= 0 ? "bg-profit" : "bg-loss")}
                style={{ width: `${Math.min(100, (Math.abs(r.totalR) / maxR) * 100)}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Binary comparison (FOMO vs Not, Sweep vs Not) ────────────────────────────
function BinaryCompare({
  leftLabel, leftTrades, leftGood,
  rightLabel, rightTrades, rightGood,
}: {
  leftLabel: string; leftTrades: TradeWithRelations[]; leftGood: boolean;
  rightLabel: string; rightTrades: TradeWithRelations[]; rightGood: boolean;
}) {
  const left = summarize(leftTrades);
  const right = summarize(rightTrades);

  const Card = ({ label, stats, good }: { label: string; stats: ReturnType<typeof summarize>; good: boolean }) => (
    <div className={cn(
      "rounded-xl border-2 p-3",
      good ? "border-profit/30 bg-profit-soft/50 dark:bg-profit/10" : "border-loss/30 bg-loss-soft/50 dark:bg-loss/10"
    )}>
      <p className="mb-2 text-xs font-bold text-neutral-700 dark:text-neutral-200">{label}</p>
      <div className="space-y-1">
        <Row label="Trades" value={String(stats.count)} />
        <Row label="Win Rate"
          value={stats.count ? `${stats.winRate.toFixed(0)}%` : "—"}
          valueClass={stats.count ? rowColor(stats.winRate) : undefined} />
        <Row label="Total R"
          value={stats.count ? `${stats.totalR >= 0 ? "+" : ""}${stats.totalR.toFixed(1)}R` : "—"}
          valueClass={stats.count ? (stats.totalR >= 0 ? "text-profit-dark" : "text-loss-dark") : undefined} />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Card label={leftLabel} stats={left} good={leftGood} />
      <Card label={rightLabel} stats={right} good={rightGood} />
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-neutral-400">{label}</span>
      <span className={cn("font-bold tabular-nums text-neutral-700 dark:text-neutral-200", valueClass)}>{value}</span>
    </div>
  );
}

// ── Main Analytics Page ───────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { loading, trades } = useTradeData();
  const [period, setPeriod] = useState<Period>("monthly");

  const filtered = useMemo(() => filterByPeriod(trades, period), [trades, period]);

  // 1. Pair Performance
  const pairBuckets: Bucket[] = useMemo(() => {
    return FIXED_PAIRS.map((pair) => ({
      label: pair,
      trades: filtered.filter((t) => {
        const name = t.symbol?.name ?? null;
        if (pair === "Other") {
          // "Other" catches: explicit "Other" symbol + any unknown pair not in fixed list
          return name === "Other" || name === null || 
            !["GBPUSD","EURUSD","AUDUSD","GBPJPY"].includes(name ?? "");
        }
        return name === pair;
      }),
    })).filter((b) => b.label !== "Other" || b.trades.length > 0);
  }, [filtered]);

  // 2. Session / Killzone Performance
  const sessionBuckets: Bucket[] = useMemo(() => {
    const order: { key: KillZone; label: string }[] = [
      { key: "london",  label: "London KZ" },
      { key: "newyork", label: "New York KZ" },
      { key: "asian",   label: "Asian KZ" },
      { key: "outside", label: "Outside KZ" },
    ];
    return order.map((o) => ({
      label: o.label,
      trades: filtered.filter((t) => t.kill_zone === o.key),
    }));
  }, [filtered]);

  // 3. Day of Week Performance
  const dayBuckets: Bucket[] = useMemo(() => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    return days.map((day) => ({
      label: day,
      trades: filtered.filter((t) => getForexDay(t.trade_date, t.entry_time) === day),
    }));
  }, [filtered]);

  // 4. Market Condition Performance
  const conditionBuckets: Bucket[] = useMemo(() => {
    return MARKET_CONDITIONS.map((mc) => ({
      label: mc.label,
      trades: filtered.filter((t) => t.market_condition === mc.value),
    }));
  }, [filtered]);

  // 5. FOMO vs Not
  const fomoTrades   = filtered.filter((t) => t.is_fomo === true);
  const notFomoTrades = filtered.filter((t) => t.is_fomo === false);

  // 6. LQ Sweep vs Not
  const sweepTrades   = filtered.filter((t) => t.lq_sweep === true);
  const noSweepTrades = filtered.filter((t) => t.lq_sweep === false);

  const untaggedCount = filtered.filter((t) =>
    t.is_fomo === null || t.lq_sweep === null || t.market_condition === null || !t.entry_time
  ).length;

  if (loading) {
    return <div className="py-20 text-center text-sm text-neutral-400">Loading analytics…</div>;
  }

  return (
    <div className="space-y-5 pb-10">

      {/* Period filter */}
      <div className="card card-pad">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold text-neutral-900 dark:text-neutral-50">Journal Analytics</h1>
            <p className="text-xs text-neutral-400">{filtered.length} trades · {PERIOD_LABELS[period]}</p>
          </div>
          <div className="flex w-full gap-1 rounded-xl border border-neutral-150 p-1 dark:border-neutral-800 sm:w-auto">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button key={p} type="button" onClick={() => setPeriod(p)}
                className={cn(
                  "flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors sm:flex-none sm:px-3",
                  period === p ? "bg-accent text-white" : "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                )}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
        {untaggedCount > 0 && (
          <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
            ⚠️ {untaggedCount} trade{untaggedCount === 1 ? "" : "s"} missing time/condition tags — excluded from relevant panels.
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card card-pad py-16 text-center text-sm text-neutral-400">
          No trades logged in this period yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Panel title="📊 Pair Performance"><BucketTable buckets={pairBuckets} /></Panel>
          <Panel title="🕐 Session / Killzone Performance"><BucketTable buckets={sessionBuckets} /></Panel>
          <Panel title="📅 Day of Week Performance"><BucketTable buckets={dayBuckets} /></Panel>
          <Panel title="📈 Market Condition Performance"><BucketTable buckets={conditionBuckets} /></Panel>
          <Panel title="🔥 FOMO vs Not FOMO">
            <BinaryCompare
              leftLabel="Not FOMO"  leftTrades={notFomoTrades}  leftGood={true}
              rightLabel="FOMO"     rightTrades={fomoTrades}    rightGood={false}
            />
          </Panel>
          <Panel title="🌊 Liquidity Sweep vs No Sweep">
            <BinaryCompare
              leftLabel="H/L Sweep"   leftTrades={sweepTrades}    leftGood={true}
              rightLabel="No Sweep"   rightTrades={noSweepTrades} rightGood={false}
            />
          </Panel>
        </div>
      )}
    </div>
  );
}
