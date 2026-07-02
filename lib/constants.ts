// ── Pairs ────────────────────────────────────────────────────────────────────
// Fixed 4 pairs + Other. "Other" catches any occasional pair not in the list.
export const FIXED_PAIRS = ["GBPUSD", "EURUSD", "AUDUSD", "GBPJPY", "Other"] as const;
export type FixedPair = (typeof FIXED_PAIRS)[number];

export const DEFAULT_SYMBOLS = ["EURUSD", "GBPUSD", "AUDUSD", "GBPJPY", "Other"] as const;

// ── Killzones (UTC-4, hardcoded per spec) ────────────────────────────────────
// Asian KZ  : 17:00 – 00:00  (00:00 is last valid minute, 00:01+ = outside)
// London KZ : 02:00 – 05:00
// NY KZ     : 07:00 – 10:00
// Outside   : everything else
export const KILL_ZONES = {
  asian:   { label: "Asian KZ",    start: 17 * 60,      end: 24 * 60 },  // 17:00 – 24:00 (incl. 00:00)
  london:  { label: "London KZ",   start:  2 * 60,      end:  5 * 60 },  // 02:00 – 05:00
  newyork: { label: "New York KZ", start:  7 * 60,      end: 10 * 60 },  // 07:00 – 10:00
  outside: { label: "Outside KZ",  start: -1,           end: -1      },
} as const;

// ── Market conditions ────────────────────────────────────────────────────────
export const MARKET_CONDITIONS = [
  { value: "buy_premium",  label: "Buy → Premium"  },
  { value: "buy_discount", label: "Buy → Discount" },
  { value: "sell_premium", label: "Sell → Premium" },
  { value: "sell_discount",label: "Sell → Discount"},
] as const;

// ── Checklist items ──────────────────────────────────────────────────────────
export const CHECKLIST_ITEMS: { key: ChecklistKey; label: string }[] = [
  { key: "setup_valid",        label: "Bias Alignment" },
  { key: "risk_within_limits", label: "High Probability POI" },
  { key: "news_checked",       label: "LQ Sweep + Market Shift" },
  { key: "stop_loss_defined",  label: "Asymmetric Risk to Reward" },
];

export type ChecklistKey =
  | "setup_valid"
  | "risk_within_limits"
  | "news_checked"
  | "stop_loss_defined";

export const IMAGE_SLOTS = [
  { key: "htf_image_url", label: "HTF", description: "Higher timeframe" },
  { key: "mtf_image_url", label: "MTF", description: "Middle timeframe" },
  { key: "ltf_image_url", label: "LTF", description: "Lower timeframe" },
] as const;
