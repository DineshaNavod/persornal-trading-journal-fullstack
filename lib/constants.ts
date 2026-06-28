export const DEFAULT_SYMBOLS = ["EURUSD", "GBPUSD", "AUDUSD", "GBPJPY"] as const;

export const CHECKLIST_ITEMS: { key: ChecklistKey; label: string }[] = [
  { key: "setup_valid",        label: "Bias Alignment" },
  { key: "risk_within_limits", label: "High Probability POI" },
  { key: "news_checked",       label: "LQ Sweep + Market Shift" },
  { key: "stop_loss_defined",  label: "During Killzone" },
  { key: "no_overtrading",     label: "Asymmetric Risk to Reward" },
];

export type ChecklistKey =
  | "setup_valid"
  | "risk_within_limits"
  | "news_checked"
  | "stop_loss_defined"
  | "no_overtrading";

export const IMAGE_SLOTS = [
  { key: "htf_image_url", label: "HTF", description: "Higher timeframe" },
  { key: "mtf_image_url", label: "MTF", description: "Middle timeframe" },
  { key: "ltf_image_url", label: "LTF", description: "Lower timeframe" },
] as const;
