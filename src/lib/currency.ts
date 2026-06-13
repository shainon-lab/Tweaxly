// Currency normalization.
//
// Bank/manual imports often record a currency as a symbol ("₪", "€",
// "$") or a word ("euro", "shekel") rather than an ISO 4217 code. The FX
// service only understands ISO codes, so anything else silently fails to
// convert and gets stored 1:1. normalizeCurrency() maps the common
// variants to their ISO code BEFORE conversion/storage.

// Unambiguous symbols.
const SYMBOL_MAP: Record<string, string> = {
  "₪": "ILS",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  "₾": "GEL",
  "₺": "TRY",
  "₹": "INR",
  "$": "USD", // common default; callers can override per-import if needed
};

// Words / loose abbreviations (compared uppercased, spaces stripped).
const WORD_MAP: Record<string, string> = {
  EURO: "EUR", EUROS: "EUR",
  DOLLAR: "USD", DOLLARS: "USD", USDOLLAR: "USD", US$: "USD",
  SHEKEL: "ILS", SHEKELS: "ILS", NIS: "ILS", NEWSHEKEL: "ILS", NEWSHEQEL: "ILS",
  LEU: "RON", LEI: "RON",
  POUND: "GBP", POUNDS: "GBP", STERLING: "GBP",
  YEN: "JPY", LIRA: "TRY", LARI: "GEL", LEK: "ALL",
};

/**
 * Normalize a raw currency string to an ISO 4217 code.
 *
 * @param raw      the stored/imported currency value (symbol, word or code)
 * @param opts.aliases  per-call overrides for ambiguous values (e.g. { L: "RON" })
 * @param opts.fallback returned when nothing matches (default: cleaned upper-case input)
 */
export function normalizeCurrency(
  raw: string | null | undefined,
  opts: { aliases?: Record<string, string>; fallback?: string } = {},
): string {
  const fallbackOf = (cleaned: string) => opts.fallback ?? cleaned;
  if (raw == null) return opts.fallback ?? "";
  const s = String(raw).trim();
  if (!s) return opts.fallback ?? "";

  // Per-call overrides win - match the raw token and the cleaned upper form.
  const upper = s.toUpperCase().replace(/[\s.]/g, "");
  if (opts.aliases) {
    if (opts.aliases[s] != null) return opts.aliases[s];
    if (opts.aliases[upper] != null) return opts.aliases[upper];
  }

  if (SYMBOL_MAP[s] != null) return SYMBOL_MAP[s];
  // Already an ISO 4217 code.
  if (/^[A-Z]{3}$/.test(upper)) return upper;
  if (WORD_MAP[upper] != null) return WORD_MAP[upper];

  return fallbackOf(upper);
}

/** True when the value is already a clean ISO 4217 code. */
export function isIsoCurrency(raw: string | null | undefined): boolean {
  return typeof raw === "string" && /^[A-Z]{3}$/.test(raw.trim().toUpperCase());
}
