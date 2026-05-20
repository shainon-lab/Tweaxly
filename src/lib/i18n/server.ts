// Server-side locale helpers. Resolution order:
//   1. Logged-in User.preferredLanguage (when session exists)
//   2. tweaxly_locale cookie (so unauthenticated pages still
//      respect the choice - login, register, forgot, reset)
//   3. DEFAULT_LOCALE ("en")
//
// All callers go through getServerLocale() so the precedence stays
// consistent. Server components also use getServerT() which curries
// the resolver into a t(key) closure.

import "server-only";
import { cookies } from "next/headers";
import { prisma } from "../db";
import { getSession } from "../session";
import { DEFAULT_LOCALE, isLocale, t, type Locale } from "./index";

export const LOCALE_COOKIE = "tweaxly_locale";

export async function getServerLocale(): Promise<Locale> {
  // 1. Authenticated user preference.
  try {
    const session = await getSession();
    if (session.userId) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { preferredLanguage: true },
      });
      if (user && isLocale(user.preferredLanguage)) {
        return user.preferredLanguage;
      }
    }
  } catch {
    // Session decode failure / missing - fall through to cookie.
  }

  // 2. Cookie (set explicitly by /api/preferences on change).
  const cookieVal = cookies().get(LOCALE_COOKIE)?.value;
  if (cookieVal && isLocale(cookieVal)) return cookieVal;

  // 3. Default.
  return DEFAULT_LOCALE;
}

export async function getServerT(): Promise<{
  locale: Locale;
  t: (key: string) => string;
}> {
  const locale = await getServerLocale();
  return { locale, t: (key: string) => t(key, locale) };
}
