"use client";

// React context + hook for client components. The active locale and
// its dictionary are seeded from the server (via I18nProvider in the
// root layout) and stay constant for the page render - switching
// locales triggers a full reload, which is the simplest way to make
// every server-rendered string in the document update without
// touching every layout boundary.

import { createContext, useContext } from "react";
import { DICTIONARIES, t as serverT } from "./index";
import type { Locale } from "./types";

type Ctx = { locale: Locale };

const I18nContext = createContext<Ctx>({ locale: "en" });

export function I18nProvider({
  locale,
  children,
}: { locale: Locale; children: React.ReactNode }) {
  return (
    <I18nContext.Provider value={{ locale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(I18nContext).locale;
}

export function useT(): (key: string) => string {
  const { locale } = useContext(I18nContext);
  // Read from the in-process dictionary so no network hop per call.
  // Falls back through English then key, mirroring the server t().
  return (key: string) => {
    const dict = DICTIONARIES[locale] ?? DICTIONARIES.en;
    return dict[key] ?? DICTIONARIES.en[key] ?? key;
  };
}

// Convenience for places where the caller already has a locale (e.g.
// translating an admin string in a server component that was passed
// the locale via props).
export const tFor = serverT;
