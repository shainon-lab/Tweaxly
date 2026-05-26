// ISO 4217 active currency codes. Each entry: { code, name }.
// Use `PRIORITY_CURRENCIES` to pin the most-likely picks (USD, EUR, GBP) at
// the top of the picker, then `OTHER_CURRENCIES` (alphabetical) below.
//
// IMPORTANT: every currency surfaced as a picker option must be one we
// can actually convert. Frankfurter (our historical-rate provider,
// sourced from ECB reference rates) covers a limited list - see
// FRANKFURTER_SUPPORTED_CODES below. PRIORITY_CURRENCIES and
// OTHER_CURRENCIES are filtered against that set at export time, so
// any consumer of these exports only sees supported currencies. The
// raw RAW_OTHER list is kept for `currencyName()` lookups (so legacy
// records with unsupported codes still get a readable name).

export type Currency = { code: string; name: string };

// Currencies for which Frankfurter publishes historical rates (ECB
// reference rates). Source: https://api.frankfurter.dev/v1/currencies
// - codes are stable; we re-cache this list manually rather than
// hitting the API on every server boot. If the list changes upstream,
// edit it here.
export const FRANKFURTER_SUPPORTED_CODES = new Set<string>([
  "AUD", "BGN", "BRL", "CAD", "CHF", "CNY", "CZK", "DKK", "EUR", "GBP",
  "HKD", "HUF", "IDR", "ILS", "INR", "ISK", "JPY", "KRW", "MXN", "MYR",
  "NOK", "NZD", "PHP", "PLN", "RON", "SEK", "SGD", "THB", "TRY", "USD",
  "ZAR",
]);

export function isSupportedCurrency(code: string): boolean {
  return FRANKFURTER_SUPPORTED_CODES.has(code.toUpperCase());
}

export const PRIORITY_CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
];

const RAW_OTHER: Currency[] = [
  { code: "AED", name: "UAE Dirham" },
  { code: "AFN", name: "Afghan Afghani" },
  { code: "ALL", name: "Albanian Lek" },
  { code: "AMD", name: "Armenian Dram" },
  { code: "ANG", name: "Netherlands Antillean Guilder" },
  { code: "AOA", name: "Angolan Kwanza" },
  { code: "ARS", name: "Argentine Peso" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "AWG", name: "Aruban Florin" },
  { code: "AZN", name: "Azerbaijani Manat" },
  { code: "BAM", name: "Bosnia-Herzegovina Convertible Mark" },
  { code: "BBD", name: "Barbadian Dollar" },
  { code: "BDT", name: "Bangladeshi Taka" },
  { code: "BGN", name: "Bulgarian Lev" },
  { code: "BHD", name: "Bahraini Dinar" },
  { code: "BIF", name: "Burundian Franc" },
  { code: "BMD", name: "Bermudian Dollar" },
  { code: "BND", name: "Brunei Dollar" },
  { code: "BOB", name: "Bolivian Boliviano" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "BSD", name: "Bahamian Dollar" },
  { code: "BTN", name: "Bhutanese Ngultrum" },
  { code: "BWP", name: "Botswanan Pula" },
  { code: "BYN", name: "Belarusian Ruble" },
  { code: "BZD", name: "Belize Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CDF", name: "Congolese Franc" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CLP", name: "Chilean Peso" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "COP", name: "Colombian Peso" },
  { code: "CRC", name: "Costa Rican Colón" },
  { code: "CUP", name: "Cuban Peso" },
  { code: "CVE", name: "Cape Verdean Escudo" },
  { code: "CZK", name: "Czech Koruna" },
  { code: "DJF", name: "Djiboutian Franc" },
  { code: "DKK", name: "Danish Krone" },
  { code: "DOP", name: "Dominican Peso" },
  { code: "DZD", name: "Algerian Dinar" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "ERN", name: "Eritrean Nakfa" },
  { code: "ETB", name: "Ethiopian Birr" },
  { code: "FJD", name: "Fijian Dollar" },
  { code: "FKP", name: "Falkland Islands Pound" },
  { code: "GEL", name: "Georgian Lari" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "GIP", name: "Gibraltar Pound" },
  { code: "GMD", name: "Gambian Dalasi" },
  { code: "GNF", name: "Guinean Franc" },
  { code: "GTQ", name: "Guatemalan Quetzal" },
  { code: "GYD", name: "Guyanaese Dollar" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "HNL", name: "Honduran Lempira" },
  { code: "HRK", name: "Croatian Kuna" },
  { code: "HTG", name: "Haitian Gourde" },
  { code: "HUF", name: "Hungarian Forint" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "ILS", name: "Israeli Shekel" },
  { code: "INR", name: "Indian Rupee" },
  { code: "IQD", name: "Iraqi Dinar" },
  { code: "IRR", name: "Iranian Rial" },
  { code: "ISK", name: "Icelandic Króna" },
  { code: "JMD", name: "Jamaican Dollar" },
  { code: "JOD", name: "Jordanian Dinar" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "KGS", name: "Kyrgystani Som" },
  { code: "KHR", name: "Cambodian Riel" },
  { code: "KMF", name: "Comorian Franc" },
  { code: "KPW", name: "North Korean Won" },
  { code: "KRW", name: "South Korean Won" },
  { code: "KWD", name: "Kuwaiti Dinar" },
  { code: "KYD", name: "Cayman Islands Dollar" },
  { code: "KZT", name: "Kazakhstani Tenge" },
  { code: "LAK", name: "Laotian Kip" },
  { code: "LBP", name: "Lebanese Pound" },
  { code: "LKR", name: "Sri Lankan Rupee" },
  { code: "LRD", name: "Liberian Dollar" },
  { code: "LSL", name: "Lesotho Loti" },
  { code: "LYD", name: "Libyan Dinar" },
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "MDL", name: "Moldovan Leu" },
  { code: "MGA", name: "Malagasy Ariary" },
  { code: "MKD", name: "Macedonian Denar" },
  { code: "MMK", name: "Myanmar Kyat" },
  { code: "MNT", name: "Mongolian Tugrik" },
  { code: "MOP", name: "Macanese Pataca" },
  { code: "MRU", name: "Mauritanian Ouguiya" },
  { code: "MUR", name: "Mauritian Rupee" },
  { code: "MVR", name: "Maldivian Rufiyaa" },
  { code: "MWK", name: "Malawian Kwacha" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "MZN", name: "Mozambican Metical" },
  { code: "NAD", name: "Namibian Dollar" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "NIO", name: "Nicaraguan Córdoba" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "NPR", name: "Nepalese Rupee" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "OMR", name: "Omani Rial" },
  { code: "PAB", name: "Panamanian Balboa" },
  { code: "PEN", name: "Peruvian Sol" },
  { code: "PGK", name: "Papua New Guinean Kina" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "PLN", name: "Polish Zloty" },
  { code: "PYG", name: "Paraguayan Guarani" },
  { code: "QAR", name: "Qatari Rial" },
  { code: "RON", name: "Romanian Leu" },
  { code: "RSD", name: "Serbian Dinar" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "RWF", name: "Rwandan Franc" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "SBD", name: "Solomon Islands Dollar" },
  { code: "SCR", name: "Seychellois Rupee" },
  { code: "SDG", name: "Sudanese Pound" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "SHP", name: "St. Helena Pound" },
  { code: "SLL", name: "Sierra Leonean Leone" },
  { code: "SOS", name: "Somali Shilling" },
  { code: "SRD", name: "Surinamese Dollar" },
  { code: "SSP", name: "South Sudanese Pound" },
  { code: "STN", name: "São Tomé & Príncipe Dobra" },
  { code: "SVC", name: "Salvadoran Colón" },
  { code: "SYP", name: "Syrian Pound" },
  { code: "SZL", name: "Swazi Lilangeni" },
  { code: "THB", name: "Thai Baht" },
  { code: "TJS", name: "Tajikistani Somoni" },
  { code: "TMT", name: "Turkmenistani Manat" },
  { code: "TND", name: "Tunisian Dinar" },
  { code: "TOP", name: "Tongan Paʻanga" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "TTD", name: "Trinidad & Tobago Dollar" },
  { code: "TWD", name: "New Taiwan Dollar" },
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "UAH", name: "Ukrainian Hryvnia" },
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "UYU", name: "Uruguayan Peso" },
  { code: "UZS", name: "Uzbekistani Som" },
  { code: "VES", name: "Venezuelan Bolívar" },
  { code: "VND", name: "Vietnamese Dong" },
  { code: "VUV", name: "Vanuatu Vatu" },
  { code: "WST", name: "Samoan Tala" },
  { code: "XAF", name: "Central African CFA Franc" },
  { code: "XCD", name: "East Caribbean Dollar" },
  { code: "XOF", name: "West African CFA Franc" },
  { code: "XPF", name: "CFP Franc" },
  { code: "YER", name: "Yemeni Rial" },
  { code: "ZAR", name: "South African Rand" },
  { code: "ZMW", name: "Zambian Kwacha" },
  { code: "ZWL", name: "Zimbabwean Dollar" },
];

// Picker-facing list: only currencies Frankfurter can convert.
// Everything else stays in RAW_OTHER for name lookups but never
// surfaces as a selectable option in CurrencyPicker / Settings.
export const OTHER_CURRENCIES: Currency[] = RAW_OTHER
  .filter((c) => !PRIORITY_CURRENCIES.some((p) => p.code === c.code))
  .filter((c) => FRANKFURTER_SUPPORTED_CODES.has(c.code))
  .sort((a, b) => a.code.localeCompare(b.code));

// Selectable in pickers (excludes anything Frankfurter can't convert).
export const ALL_CURRENCIES: Currency[] = [...PRIORITY_CURRENCIES, ...OTHER_CURRENCIES];

// Full ISO 4217 list - used only by currencyName() for displaying
// legacy records that were created before this restriction. Do NOT
// use as a picker source.
const ALL_INCLUDING_UNSUPPORTED: Currency[] = [
  ...PRIORITY_CURRENCIES,
  ...RAW_OTHER.filter((c) => !PRIORITY_CURRENCIES.some((p) => p.code === c.code)),
];

// Resolve a code to its display name. Falls back to the raw code if unknown
// (e.g. the user has a previously-saved code we don't know about).
// Uses the FULL ISO list so legacy records render with their name even
// when the currency isn't selectable for new entries.
export function currencyName(code: string): string {
  return ALL_INCLUDING_UNSUPPORTED.find((c) => c.code === code)?.name ?? code;
}

// ── Name / symbol → ISO code resolution ──────────────────────────────
// Real-world CSVs often label the currency column with the local name
// or the symbol instead of the ISO code (e.g. "שקל", "אירו", "$",
// "Dollar", "Euro"). resolveCurrencyCode normalizes any of these to
// the supported ISO code so the FX pipeline doesn't choke on the raw
// label. Returns null when the input is empty or unrecognizable.
//
// Coverage: every supported (Frankfurter) currency, in English + the
// most common Hebrew aliases. Extend as more locales are encountered.

const CURRENCY_ALIASES: Record<string, string> = {
  // ── English names + ISO codes ──────────────────────────────────
  "usd":          "USD", "dollar":         "USD", "dollars":  "USD",
  "usdollar":     "USD", "usdollars":      "USD",
  "eur":          "EUR", "euro":           "EUR", "euros":    "EUR",
  "gbp":          "GBP", "pound":          "GBP", "pounds":   "GBP",
  "sterling":     "GBP", "britishpound":   "GBP",
  "ils":          "ILS", "shekel":         "ILS", "shekels":  "ILS",
  "israelishekel": "ILS", "newshekel":     "ILS", "nis":      "ILS",
  "jpy":          "JPY", "yen":            "JPY", "japaneseyen": "JPY",
  "chf":          "CHF", "franc":          "CHF", "swissfranc": "CHF",
  "cad":          "CAD", "canadiandollar": "CAD",
  "aud":          "AUD", "australiandollar": "AUD",
  "nzd":          "NZD", "newzealanddollar": "NZD",
  "cny":          "CNY", "yuan":           "CNY", "rmb":      "CNY", "renminbi": "CNY",
  "inr":          "INR", "rupee":          "INR", "indianrupee": "INR",
  "krw":          "KRW", "won":            "KRW", "koreanwon": "KRW",
  "sek":          "SEK", "swedishkrona":   "SEK",
  "nok":          "NOK", "norwegiankrone": "NOK",
  "dkk":          "DKK", "danishkrone":    "DKK",
  "isk":          "ISK", "icelandickrona": "ISK",
  "pln":          "PLN", "zloty":          "PLN", "polishzloty": "PLN",
  "huf":          "HUF", "forint":         "HUF",
  "czk":          "CZK", "koruna":         "CZK",
  "ron":          "RON", "leu":            "RON",
  "try":          "TRY", "lira":           "TRY", "turkishlira": "TRY",
  "brl":          "BRL", "real":           "BRL",
  "mxn":          "MXN", "peso":           "MXN", "mexicanpeso": "MXN",
  "zar":          "ZAR", "rand":           "ZAR",
  "hkd":          "HKD", "hongkongdollar": "HKD",
  "sgd":          "SGD", "singaporedollar": "SGD",
  "thb":          "THB", "baht":           "THB",
  "myr":          "MYR", "ringgit":        "MYR",
  "idr":          "IDR", "rupiah":         "IDR",
  "php":          "PHP", "philippinepeso": "PHP",
  "bgn":          "BGN", "lev":            "BGN",

  // ── Hebrew aliases ─────────────────────────────────────────────
  "שקל":      "ILS", "שקלים":   "ILS",
  "ש\"ח":     "ILS", "שח":      "ILS", "ש״ח": "ILS",
  "שקלחדש":  "ILS",
  "דולר":     "USD", "דולרים":  "USD",
  "אירו":     "EUR", "יורו":    "EUR", "euros ": "EUR",
  "ליש\"ט":   "GBP", "לישט":    "GBP", "ליש״ט": "GBP",
  "פאונד":    "GBP", "פאונדים": "GBP", "פונט":  "GBP",
  "פרנק":     "CHF",
  "ין":       "JPY", "יין":     "JPY",
  "יואן":     "CNY",
};

// Single-character currency symbols → ISO. Kept separate so we can
// match them without stripping the symbol out as punctuation.
const SYMBOL_MAP: Record<string, string> = {
  "$":   "USD",
  "€":   "EUR",
  "£":   "GBP",
  "₪":   "ILS",
  "¥":   "JPY",
  "₹":   "INR",
  "₩":   "KRW",
  "₺":   "TRY",
  "R$":  "BRL",
  "kr":  "SEK",
  "zł":  "PLN",
};

export function resolveCurrencyCode(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s0 = String(raw).trim();
  if (!s0) return null;

  // 1. Direct 3-letter ISO code - the typical, well-formed case.
  const upper = s0.toUpperCase();
  if (/^[A-Z]{3}$/.test(upper) && isSupportedCurrency(upper)) return upper;

  // 2. Single-/short-symbol match (kept case-sensitive for "kr" / "zł").
  if (SYMBOL_MAP[s0]) return SYMBOL_MAP[s0];

  // 3. Strip whitespace + punctuation, try the alias map lowercase.
  //    Quotes / dashes / underscores / dots all get peeled off so
  //    things like `ש"ח`, `ש״ח`, `שח` all collapse to the same key.
  const stripped = s0.replace(/[\s.,;:!?\-_/()\[\]'"’”״“]+/g, "").toLowerCase();
  if (CURRENCY_ALIASES[stripped]) return CURRENCY_ALIASES[stripped];

  // 4. Letters-only fallback for noisy strings like "USD$" or "ILS-".
  const letters = s0.replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (letters.length === 3 && isSupportedCurrency(letters)) return letters;

  // 5. Last-resort: exact ISO name match from the English dictionary.
  const lower = s0.toLowerCase();
  for (const c of ALL_INCLUDING_UNSUPPORTED) {
    if (c.name.toLowerCase() === lower && isSupportedCurrency(c.code)) return c.code;
  }
  return null;
}
