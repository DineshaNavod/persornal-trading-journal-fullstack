import { v4 as uuid } from "uuid";
import { getSupabaseClient } from "@/lib/supabase/client";
import { DEFAULT_SYMBOLS } from "@/lib/constants";
import type {
  Account,
  Strategy,
  Symbol as TradeSymbol,
  Trade,
  TradeChecklist,
} from "@/types/trade";

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------

const LS_KEYS = {
  account:    "tj_main_account",
  symbols:    "tj_symbols",
  strategies: "tj_strategies",
  trades:     "tj_trades",
  seeded:     "tj_seeded_v2",
} as const;

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

// ---------------------------------------------------------------------------
// Seed — runs once per browser session on fresh installs
// ---------------------------------------------------------------------------

const MAIN_ACCOUNT_ID = "main-account";

const PLACEHOLDER_CHART =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='280'><rect width='100%' height='100%' fill='%231b1b27'/><text x='50%' y='50%' fill='%23555' font-family='sans-serif' font-size='14' text-anchor='middle'>Sample chart</text></svg>`
  );

function daysAgoIso(days: number, hour = 14, minute = 30) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (readLS(LS_KEYS.seeded, false)) return;

  const mainAccount: Account = {
    id: MAIN_ACCOUNT_ID,
    name: "Main Account",
    starting_balance: 6000,
    created_at: daysAgoIso(60),
  };

  const symbols: TradeSymbol[] = DEFAULT_SYMBOLS.map((name) => ({
    id: uuid(),
    name,
    is_custom: false,
    created_at: daysAgoIso(60),
  }));

  const strategy: Strategy = {
    id: uuid(),
    name: "Core Strategy",
    rules: "Trade only the London and New York sessions. Maximum 3 trades per day. Stop trading after 2 consecutive losses.",
    entry_conditions: "Price sweeps a clear liquidity level, then shows a structure shift on the lower timeframe in the direction of the higher-timeframe bias.",
    exit_conditions: "Take profit at the single defined TP level. Move stop to break-even once price reaches 1R in favor.",
    risk_rules: "Risk per trade is fixed at 0.25%, 0.5%, or 1% of current account balance — never sized manually.",
    discipline_checklist: [
      "Setup matches the written strategy",
      "Risk is within allowed limits",
      "High-impact news has been checked",
      "Stop loss is clearly defined before entry",
      "This is not a revenge or overtrade",
    ],
    allowed_risk_levels: [0.25, 0.5, 1],
    created_at: daysAgoIso(60),
  };

  const checklist: TradeChecklist = {
    setup_valid: true,
    risk_within_limits: true,
    news_checked: true,
    stop_loss_defined: true,
    no_overtrading: true,
  };

  const bySymbol = (name: string) => symbols.find((s) => s.name === name)!.id;

  const seedTrades: Trade[] = [
    {
      id: uuid(), account_id: MAIN_ACCOUNT_ID, symbol_id: bySymbol("EURUSD"),
      strategy_id: strategy.id, date: daysAgoIso(12, 9, 42), direction: "buy",
      entry_price: 1.079, stop_loss_price: 1.077, take_profit_price: 1.084,
      risk_dollar: 60, profit: 133,
      notes: "Clean liquidity sweep of Asia low into London open.",
      checklist, htf_image_url: PLACEHOLDER_CHART, mtf_image_url: PLACEHOLDER_CHART,
      ltf_image_url: PLACEHOLDER_CHART, created_at: daysAgoIso(12, 9, 42),
    },
    {
      id: uuid(), account_id: MAIN_ACCOUNT_ID, symbol_id: bySymbol("GBPJPY"),
      strategy_id: strategy.id, date: daysAgoIso(10, 11, 5), direction: "sell",
      entry_price: 196.4, stop_loss_price: 195.85, take_profit_price: 194.2,
      risk_dollar: 30, profit: -30,
      notes: "Faded into resistance too early.",
      checklist: { ...checklist, no_overtrading: false },
      htf_image_url: PLACEHOLDER_CHART, mtf_image_url: PLACEHOLDER_CHART,
      ltf_image_url: PLACEHOLDER_CHART, created_at: daysAgoIso(10, 11, 5),
    },
    {
      id: uuid(), account_id: MAIN_ACCOUNT_ID, symbol_id: bySymbol("AUDUSD"),
      strategy_id: strategy.id, date: daysAgoIso(8, 8, 50), direction: "buy",
      entry_price: 0.652, stop_loss_price: 0.6495, take_profit_price: 0.6585,
      risk_dollar: 30, profit: 52,
      notes: "Textbook continuation off the daily order block.",
      checklist, htf_image_url: PLACEHOLDER_CHART, mtf_image_url: PLACEHOLDER_CHART,
      ltf_image_url: PLACEHOLDER_CHART, created_at: daysAgoIso(8, 8, 50),
    },
    {
      id: uuid(), account_id: MAIN_ACCOUNT_ID, symbol_id: bySymbol("GBPUSD"),
      strategy_id: strategy.id, date: daysAgoIso(6, 13, 15), direction: "sell",
      entry_price: 1.268, stop_loss_price: 1.272, take_profit_price: 1.261,
      risk_dollar: 15, profit: -15,
      notes: "Chopped around news, stopped out for a small loss.",
      checklist: { ...checklist, news_checked: false },
      htf_image_url: PLACEHOLDER_CHART, mtf_image_url: PLACEHOLDER_CHART,
      ltf_image_url: PLACEHOLDER_CHART, created_at: daysAgoIso(6, 13, 15),
    },
    {
      id: uuid(), account_id: MAIN_ACCOUNT_ID, symbol_id: bySymbol("EURUSD"),
      strategy_id: strategy.id, date: daysAgoIso(4, 10, 0), direction: "buy",
      entry_price: 1.082, stop_loss_price: 1.0795, take_profit_price: 1.089,
      risk_dollar: 60, profit: 120,
      notes: "Full TP hit, followed the plan precisely.",
      checklist, htf_image_url: PLACEHOLDER_CHART, mtf_image_url: PLACEHOLDER_CHART,
      ltf_image_url: PLACEHOLDER_CHART, created_at: daysAgoIso(4, 10, 0),
    },
    {
      id: uuid(), account_id: MAIN_ACCOUNT_ID, symbol_id: bySymbol("GBPJPY"),
      strategy_id: strategy.id, date: daysAgoIso(2, 9, 20), direction: "buy",
      entry_price: 195.2, stop_loss_price: 194.4, take_profit_price: 196.6,
      risk_dollar: 30, profit: 71,
      notes: "Good reaction off the 4H demand zone.",
      checklist, htf_image_url: PLACEHOLDER_CHART, mtf_image_url: PLACEHOLDER_CHART,
      ltf_image_url: PLACEHOLDER_CHART, created_at: daysAgoIso(2, 9, 20),
    },
    {
      id: uuid(), account_id: MAIN_ACCOUNT_ID, symbol_id: bySymbol("AUDUSD"),
      strategy_id: strategy.id, date: daysAgoIso(1, 14, 0), direction: "sell",
      entry_price: 0.6605, stop_loss_price: 0.663, take_profit_price: 0.654,
      risk_dollar: 15, profit: -15,
      notes: "Entered against the HTF bias.",
      checklist: { ...checklist, setup_valid: false },
      htf_image_url: PLACEHOLDER_CHART, mtf_image_url: PLACEHOLDER_CHART,
      ltf_image_url: PLACEHOLDER_CHART, created_at: daysAgoIso(1, 14, 0),
    },
  ];

  writeLS(LS_KEYS.account, mainAccount);
  writeLS(LS_KEYS.symbols, symbols);
  writeLS(LS_KEYS.strategies, [strategy]);
  writeLS(LS_KEYS.trades, seedTrades);
  writeLS(LS_KEYS.seeded, true);
}

// ---------------------------------------------------------------------------
// Single Main Account
// ---------------------------------------------------------------------------

export async function getMainAccount(): Promise<Account> {
  const sb = getSupabaseClient();
  if (sb) {
    // Just grab the first (and only) account — no hardcoded ID needed.
    const { data: existing } = await sb
      .from("accounts")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (existing) return existing as Account;

    // First run with Supabase — create the Main Account with an auto UUID.
    const { data: created, error } = await sb
      .from("accounts")
      .insert({ name: "Main Account", starting_balance: 6000 })
      .select()
      .single();
    if (error) throw error;
    return created as Account;
  }

  // Local (localStorage) mode — fixed string ID is fine here.
  ensureSeeded();
  return readLS<Account>(LS_KEYS.account, {
    id: MAIN_ACCOUNT_ID,
    name: "Main Account",
    starting_balance: 6000,
    created_at: new Date().toISOString(),
  });
}

export async function adjustCapital(delta: number): Promise<Account> {
  const account = await getMainAccount();
  const newBalance = Math.max(0, account.starting_balance + delta);

  const sb = getSupabaseClient();
  if (sb) {
    // Use the real UUID returned by Supabase, not the local constant.
    const { data, error } = await sb
      .from("accounts")
      .update({ starting_balance: newBalance })
      .eq("id", account.id)
      .select()
      .single();
    if (error) throw error;
    return data as Account;
  }

  const updated: Account = { ...account, starting_balance: newBalance };
  writeLS(LS_KEYS.account, updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Symbols
// ---------------------------------------------------------------------------

export async function listSymbols(): Promise<TradeSymbol[]> {
  const sb = getSupabaseClient();
  if (sb) {
    const { data, error } = await sb.from("symbols").select("*").order("name");
    if (error) throw error;
    return data as TradeSymbol[];
  }
  ensureSeeded();
  return readLS<TradeSymbol[]>(LS_KEYS.symbols, []);
}

export async function createSymbol(name: string): Promise<TradeSymbol> {
  const sb = getSupabaseClient();
  const clean = name.trim().toUpperCase();
  if (sb) {
    const { data, error } = await sb
      .from("symbols")
      .insert({ name: clean, is_custom: true })
      .select()
      .single();
    if (error) throw error;
    return data as TradeSymbol;
  }
  ensureSeeded();
  const symbols = readLS<TradeSymbol[]>(LS_KEYS.symbols, []);
  const symbol: TradeSymbol = {
    id: uuid(), name: clean, is_custom: true, created_at: new Date().toISOString(),
  };
  writeLS(LS_KEYS.symbols, [...symbols, symbol]);
  return symbol;
}

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------

export async function listStrategies(): Promise<Strategy[]> {
  const sb = getSupabaseClient();
  if (sb) {
    const { data, error } = await sb.from("strategies").select("*").order("created_at");
    if (error) throw error;
    return data as Strategy[];
  }
  ensureSeeded();
  return readLS<Strategy[]>(LS_KEYS.strategies, []);
}

export async function updateStrategy(
  id: string,
  patch: Partial<Omit<Strategy, "id" | "created_at">>
): Promise<Strategy> {
  const sb = getSupabaseClient();
  if (sb) {
    const { data, error } = await sb.from("strategies").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data as Strategy;
  }
  ensureSeeded();
  const strategies = readLS<Strategy[]>(LS_KEYS.strategies, []);
  const updated = strategies.map((s) => (s.id === id ? { ...s, ...patch } : s));
  writeLS(LS_KEYS.strategies, updated);
  return updated.find((s) => s.id === id) as Strategy;
}

// ---------------------------------------------------------------------------
// Trades
// ---------------------------------------------------------------------------

export async function listTrades(): Promise<Trade[]> {
  const sb = getSupabaseClient();
  if (sb) {
    const { data, error } = await sb.from("trades").select("*").order("date", { ascending: false });
    if (error) throw error;
    return data as Trade[];
  }
  ensureSeeded();
  // Migration: trades saved by earlier versions of this app may have
  // exit_price and risk_percent instead of risk_dollar and profit.
  // Convert them transparently so the UI never crashes on old data.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = readLS<any[]>(LS_KEYS.trades, []);
  const migrated: Trade[] = raw.map((t) => {
    if ("profit" in t && "risk_dollar" in t) return t as Trade; // already new format
    // Old format → supply safe defaults so every field the UI needs exists
    return {
      ...t,
      stop_loss_price: t.stop_loss_price ?? t.exit_price ?? 0,
      risk_dollar: t.risk_dollar ?? 0,
      profit: t.profit ?? 0,
    } as Trade;
  });
  // Persist migrated data so the conversion only runs once
  if (raw.some((t) => !("profit" in t))) {
    writeLS(LS_KEYS.trades, migrated);
  }
  return migrated;
}

export async function createTrade(input: Omit<Trade, "id" | "created_at">): Promise<Trade> {
  const sb = getSupabaseClient();
  if (sb) {
    const { data, error } = await sb.from("trades").insert(input).select().single();
    if (error) throw error;
    return data as Trade;
  }
  ensureSeeded();
  const trades = readLS<Trade[]>(LS_KEYS.trades, []);
  const trade: Trade = { id: uuid(), created_at: new Date().toISOString(), ...input };
  writeLS(LS_KEYS.trades, [trade, ...trades]);
  return trade;
}

export async function deleteTrade(id: string): Promise<void> {
  const sb = getSupabaseClient();
  if (sb) {
    const { error } = await sb.from("trades").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const trades = readLS<Trade[]>(LS_KEYS.trades, []);
  writeLS(LS_KEYS.trades, trades.filter((t) => t.id !== id));
}

// ---------------------------------------------------------------------------
// Image upload
// ---------------------------------------------------------------------------

export async function uploadTradeImage(file: File): Promise<string> {
  const sb = getSupabaseClient();
  if (sb) {
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
    const { error } = await sb.storage.from("trade-screenshots").upload(path, file);
    if (error) throw error;
    const { data } = sb.storage.from("trade-screenshots").getPublicUrl(path);
    return data.publicUrl;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
