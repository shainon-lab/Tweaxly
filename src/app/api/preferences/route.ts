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
import { isRegionCode } from "@/lib/regions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  let body: { locale?: string; region?: string | null };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  const data: { preferredLanguage?: string; region?: string | null } = {};
  if ("locale" in body && body.locale !== undefined) {
    if (!isLocale(body.locale)) {
      return NextResponse.json({ error: "invalid_locale" }, { status: 400 });
    }
    data.preferredLanguage = body.locale;
  }
  if ("region" in body) {
    if (body.region === null || body.region === "") {
      data.region = null;
    } else if (typeof body.region === "string" && isRegionCode(body.region)) {
      data.region = body.region;
    } else {
      return NextResponse.json({ error: "invalid_region" }, { status: 400 });
    }
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, ...data });
  if (data.preferredLanguage) {
    res.cookies.set(LOCALE_COOKIE, data.preferredLanguage, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  const session = await getSession();
  if (session.userId) {
    await prisma.user.update({
      where: { id: session.userId },
      data,
    });
  }

  return res;
}
