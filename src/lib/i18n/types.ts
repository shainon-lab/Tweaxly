// Supported UI locales. Adding a new locale: drop a file under
// src/lib/i18n/dictionaries/<code>.ts that exports a Dictionary,
// add it to LOCALES + DICTIONARIES, and the rest of the system
// picks it up automatically.

export const LOCALES = ["en", "he"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  he: "עברית (Hebrew)",
};

// Layout direction per locale. Anything not listed defaults to LTR.
export const RTL_LOCALES: Locale[] = ["he"];

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

export function isLocale(s: unknown): s is Locale {
  return typeof s === "string" && (LOCALES as readonly string[]).includes(s);
}

// Flat dictionary keyed by 'namespace.key'. We use string keys instead
// of typed nested objects because (a) it lets translators add a new
// key without a TS rebuild, and (b) the fallback path (missing key →
// English → key string) stays simple. The Dictionary type is the
// English dictionary's shape; other locales can be partial - missing
// keys fall back to English at runtime.
export type Dictionary = Record<string, string>;
