// PATCH /api/preferences
//   body: { locale: "en" | "he" }
//
// Persists User.preferredLanguage AND sets the tweaxly_locale cookie
// so unauthenticated surfaces (login, register, forgot) honour the
// preference until the user logs out. Cookie is 1-year, lax,
// HTTP-only false so client JS can read it (we don't, but it makes
// the value visible for debugging).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isLocale } from "@/lib/i18n";
import { LOCALE_COOKIE } from "@/lib/i18n/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  let body: { locale?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  if (!isLocale(body.locale)) {
    return NextResponse.json({ error: "invalid_locale" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, locale: body.locale });
  res.cookies.set(LOCALE_COOKIE, body.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const session = await getSession();
  if (session.userId) {
    await prisma.user.update({
      where: { id: session.userId },
      data: { preferredLanguage: body.locale },
    });
  }

  return res;
}
