const FLAGS: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  AUD: "🇦🇺",
  CAD: "🇨🇦",
  CHF: "🇨🇭",
  NZD: "🇳🇿",
  CNY: "🇨🇳",
  XAU: "🟡", // gold
  XAG: "⚪", // silver
};

/**
 * Splits a 6-letter forex-style symbol (EURUSD, GBPJPY, XAUUSD...) into its
 * two 3-letter currency legs and returns their flags. Falls back to a
 * neutral icon for symbols that don't fit the pattern (custom symbols).
 */
export function getSymbolFlags(symbolName: string): [string, string] {
  const clean = symbolName.toUpperCase().trim();
  if (clean.length === 6) {
    const base = clean.slice(0, 3);
    const quote = clean.slice(3, 6);
    if (FLAGS[base] || FLAGS[quote]) {
      return [FLAGS[base] ?? "💱", FLAGS[quote] ?? "💱"];
    }
  }
  return ["💱", "💱"];
}
