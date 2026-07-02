// Core domain types for the trading journal.

export type Direction = "buy" | "sell";

export type MarketCondition =
  | "buy_premium"
  | "buy_discount"
  | "sell_premium"
  | "sell_discount";

// "untagged" = no entry_time recorded (old trade or skipped field) — distinct
// from "outside", which means we DO know the time and it's confirmed outside
// all three killzones. Keeps Killzone analytics honest, same as every other panel.
export type KillZone = "london" | "newyork" | "asian" | "outside" | "untagged";

export interface Account {
  id: string;
  name: string;
  starting_balance: number;
  created_at: string;
}

export interface Symbol {
  id: string;
  name: string;
  is_custom: boolean;
  created_at: string;
}

export interface Strategy {
  id: string;
  name: string;
  rules: string;
  entry_conditions: string;
  exit_conditions: string;
  risk_rules: string;
  discipline_checklist: string[];
  allowed_risk_levels: number[];
  created_at: string;
}

export interface TradeChecklist {
  setup_valid: boolean;
  risk_within_limits: boolean;
  news_checked: boolean;
  stop_loss_defined: boolean;
}

export const EMPTY_CHECKLIST: TradeChecklist = {
  setup_valid: false,
  risk_within_limits: false,
  news_checked: false,
  stop_loss_defined: false,
};

export interface Trade {
  id: string;
  account_id: string;
  symbol_id: string;
  strategy_id: string | null;
  date: string; // journal submission timestamp
  // ── New analytical fields (nullable for backward compat) ──
  trade_date: string | null;          // actual trade date YYYY-MM-DD (UTC-4)
  entry_time: string | null;          // actual entry time HH:MM (UTC-4)
  market_condition: MarketCondition | null;
  is_fomo: boolean | null;
  lq_sweep: boolean | null;           // true = sweep, false = no sweep
  // ─────────────────────────────────────────────────────────
  direction: Direction;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  risk_dollar: number;
  profit: number;
  notes: string | null;
  checklist: TradeChecklist;
  htf_image_url: string;
  mtf_image_url: string;
  ltf_image_url: string;
  created_at: string;
}

export interface TradeWithRelations extends Trade {
  account: Account | null;
  symbol: Symbol | null;
  strategy: Strategy | null;
  r_multiple: number;
  pnl: number;
  is_win: boolean;
  kill_zone: KillZone;       // derived from entry_time
}
