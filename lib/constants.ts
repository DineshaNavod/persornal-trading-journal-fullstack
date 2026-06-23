export const DEFAULT_SYMBOLS = ["EURUSD", "GBPUSD", "AUDUSD", "GBPJPY"] as const;

export const CHECKLIST_ITEMS: { key: ChecklistKey; label: string }[] = [
  { key: "setup_valid", label: "Setup is valid against my strategy" },
  { key: "risk_within_limits", label: "Risk is within allowed limits" },
  { key: "news_checked", label: "I have checked upcoming news" },
  { key: "stop_loss_defined", label: "Stop loss is clearly defined" },
  { key: "no_overtrading", label: "This is not overtrading" },
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
