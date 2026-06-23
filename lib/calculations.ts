import type { Account, Trade, TradeWithRelations } from "@/types/trade";

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
    return { ...trade, account, symbol: null, strategy: null, ...derived };
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
    else if (mode === "%") value = startingBalance ? ((p.balance - startingBalance) / startingBalance) * 100 : 0;
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
