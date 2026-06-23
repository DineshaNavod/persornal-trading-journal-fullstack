// Core domain types for the trading journal.
// These mirror the Supabase schema in supabase/schema.sql.

export type Direction = "buy" | "sell";

export type RiskPercent = 0.25 | 0.5 | 1;

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
  no_overtrading: boolean;
}

export const EMPTY_CHECKLIST: TradeChecklist = {
  setup_valid: false,
  risk_within_limits: false,
  news_checked: false,
  stop_loss_defined: false,
  no_overtrading: false,
};

export interface Trade {
  id: string;
  account_id: string;
  symbol_id: string;
  strategy_id: string | null;
  date: string;
  direction: Direction;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  /** Manually entered: how many dollars the trader risked on this trade. */
  risk_dollar: number;
  /** Manually entered: net profit or loss in dollars (negative = loss). */
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
  // Derived at read time — never stored.
  r_multiple: number;  // profit / risk_dollar
  pnl: number;         // same as profit (alias kept for chart/metrics compatibility)
  is_win: boolean;
}
