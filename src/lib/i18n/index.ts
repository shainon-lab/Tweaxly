// i18n entry point. Resolves dictionaries by locale and exposes
// a `t(key, locale)` helper for server code. Client code uses the
// React hook from ./client.

import { en } from "./dictionaries/en";
import { he } from "./dictionaries/he";
import { DEFAULT_LOCALE, isLocale, type Dictionary, type Locale } from "./types";

export const DICTIONARIES: Record<Locale, Dictionary> = {
  en,
  he,
};

// Translate a key. Resolution order:
//   1. exact match in target locale
//   2. exact match in English (fallback)
//   3. the key itself, so a missing key is visible to the operator
//      instead of silently disappearing
export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  const dict = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
  return dict[key] ?? DICTIONARIES[DEFAULT_LOCALE][key] ?? key;
}

// Build a curried translator bound to a single locale - handy when
// you want `t(key)` without re-passing the locale every call.
export function translator(locale: Locale) {
  return (key: string) => t(key, locale);
}

export { DEFAULT_LOCALE, isLocale };
export type { Locale, Dictionary };
export { LOCALES, LOCALE_LABEL, RTL_LOCALES, dirFor } from "./types";
