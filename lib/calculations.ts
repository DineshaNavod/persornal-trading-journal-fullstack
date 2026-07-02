import type { Account, KillZone, Trade, TradeWithRelations } from "@/types/trade";

/**
 * Hydrates a raw trade.
 * risk_dollar and profit are manually entered and stored — no price math.
 * r_multiple = profit / risk_dollar (how many R the trade returned).
 * pnl = profit (alias so charts/metrics work unchanged).
 */
function hydrateTrade(
  trade: Trade
): Pick<TradeWithRelations, "r_multiple" | "pnl" | "is_win"> {
  const r_multiple = trade.risk_dollar > 0 ? trade.profit / trade.risk_dollar : 0;
  return { r_multiple, pnl: trade.profit, is_win: trade.profit > 0 };
}

export function buildHydratedTrades(
  trades: Trade[],
  accounts: Account[]
): { hydrated: TradeWithRelations[]; balances: Map<string, number> } {
  const accountById = new Map(accounts.map((a) => [a.id, a]));
  const balances = new Map<string, number>(accounts.map((a) => [a.id, a.starting_balance]));

  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const hydrated: TradeWithRelations[] = sorted.map((trade) => {
    const account = accountById.get(trade.account_id) ?? null;
    const derived = hydrateTrade(trade);
    if (account) {
      balances.set(trade.account_id, (balances.get(trade.account_id) ?? 0) + derived.pnl);
    }
    return { ...trade, account, symbol: null, strategy: null, ...derived, kill_zone: detectKillZone(trade.entry_time) };
  });

  return { hydrated, balances };
}

export interface PortfolioMetrics {
  accountBalance: number;
  totalPnl: number;
  winRate: number;
  avgR: number;
  profitFactor: number;
  totalTrades: number;
  wins: number;
  losses: number;
}

export function computeMetrics(
  trades: TradeWithRelations[],
  accounts: Account[]
): PortfolioMetrics {
  const startingTotal = accounts.reduce((sum, a) => sum + a.starting_balance, 0);
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const accountBalance = startingTotal + totalPnl;

  const wins   = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);

  const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss   = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));

  const winRate      = trades.length ? (wins.length / trades.length) * 100 : 0;
  const avgR         = trades.length ? trades.reduce((sum, t) => sum + t.r_multiple, 0) / trades.length : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  return {
    accountBalance, totalPnl, winRate, avgR, profitFactor,
    totalTrades: trades.length, wins: wins.length, losses: losses.length,
  };
}

export type CurveMode = "$" | "%" | "R";
export type CurvePeriod = 7 | 30 | 90 | 365 | null;

export interface CurvePoint { date: string; value: number; }

export function buildPerformanceCurve(
  trades: TradeWithRelations[],
  startingBalance: number,
  mode: CurveMode,
  period: CurvePeriod
): CurvePoint[] {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  type Pt = { t: number; date: string; balance: number; cumR: number };
  let balance = startingBalance, cumR = 0;
  const seq: Pt[] = [{
    t: sorted.length ? new Date(sorted[0].date).getTime() - 1 : Date.now(),
    date: "Start", balance, cumR,
  }];

  for (const trade of sorted) {
    balance += trade.pnl;
    cumR    += trade.r_multiple;
    seq.push({ t: new Date(trade.date).getTime(), date: trade.date, balance, cumR });
  }

  let windowed = seq;
  let baseline = seq[0];

  if (period !== null) {
    const cutoff = Date.now() - period * 24 * 60 * 60 * 1000;
    const before = seq.filter((p) => p.t <= cutoff);
    baseline  = before[before.length - 1] ?? seq[0];
    windowed  = [{ ...baseline, date: "Start" }, ...seq.filter((p) => p.t > cutoff)];
  }

  return windowed.map((p) => {
    let value: number;
    if      (mode === "$") value = p.balance;
    else if (mode === "%") value = startingBalance > 0 ? ((p.balance - seq[0].balance) / seq[0].balance) * 100 : 0;
    else                   value = p.cumR - baseline.cumR;
    return { date: p.date, value };
  });
}

export type DayOutcome = "profit" | "loss" | "none";
export function dayOutcomeFor(trades: TradeWithRelations[]): DayOutcome {
  if (!trades.length) return "none";
  const total = trades.reduce((s, t) => s + t.pnl, 0);
  return total > 0 ? "profit" : total < 0 ? "loss" : "none";
}

// ── Killzone detection ────────────────────────────────────────────────────────
// All times are in UTC-4 as entered by the user. No conversion needed.
// Asian  : 17:00 – 00:00  (00:00 inclusive = midnight cutoff)
// London : 02:00 – 05:00
// NY     : 07:00 – 10:00
// Outside: everything else

export function detectKillZone(entryTime: string | null): KillZone {
  if (!entryTime) return "untagged"; // unknown ≠ confirmed outside — don't pollute Outside KZ stats
  const parts = entryTime.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] ?? "0", 10);
  const mins = h * 60 + m;

  // Asian: 17:00 (1020) to 00:00 (0) inclusive — 00:01 onward is outside
  if (mins >= 1020 || mins === 0) return "asian";
  // London: 02:00 (120) to 05:00 (300) inclusive — 05:01 onward is outside
  if (mins >= 120 && mins <= 300) return "london";
  // NY: 07:00 (420) to 10:00 (600) inclusive — 10:01 onward is outside
  if (mins >= 420 && mins <= 600) return "newyork";
  return "outside";
}

// ── Forex day of week ─────────────────────────────────────────────────────────
// Forex day runs 17:00 UTC-4 to 16:59 UTC-4 next calendar day.
// So 18:00 on Monday belongs to Tuesday's forex day.
// Returns "Monday" | "Tuesday" | … | "Friday" (skips weekend edges).

export function getForexDay(tradeDate: string | null, entryTime: string | null): string {
  if (!tradeDate) return "Unknown";
  const h = entryTime ? parseInt(entryTime.split(":")[0], 10) : 0;
  const d = new Date(tradeDate + "T12:00:00"); // noon prevents UTC-shift edge
  if (h >= 17) d.setDate(d.getDate() + 1);    // after 17:00 → next calendar day
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[d.getDay()] ?? "Unknown";
}
