// GET  /api/unsubscribe?token=...&channel=...   → preview / confirmation page
// POST /api/unsubscribe                          → one-click unsubscribe
//
// Both verbs accept the same parameters. We accept POST because RFC
// 8058 ("One-Click Unsubscribe" for List-Unsubscribe-Post:) requires
// servers to honour a POST sent by the user's MUA without any further
// interaction. GET supports the human "click the link in the email"
// path and redirects to /unsubscribe?... with the result.
//
// Anti-abuse: the token is opaque and per-user, generated at consent
// time. Mass guessing is impractical (32 random bytes).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { suppressEmail, MARKETING_CHANNELS, type MarketingChannel } from "@/lib/communications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isMarketingChannel(s: string | null): s is MarketingChannel {
  return !!s && (MARKETING_CHANNELS as readonly string[]).includes(s);
}

async function handle(req: NextRequest, token: string | null, channelParam: string | null, all: boolean) {
  if (!token) return redirectResult(req, "error", "missing_token");

  const user = await prisma.user.findFirst({
    where: { unsubscribeToken: token },
    select: { id: true, email: true },
  });
  if (!user) return redirectResult(req, "error", "invalid_token");

  // Decide what to flip off. If `all=true`, every marketing channel is
  // disabled. Otherwise the caller specifies a single channel name.
  const updates: Record<string, boolean> = {};
  let suppressed: string[] = [];

  if (all || !channelParam) {
    for (const c of MARKETING_CHANNELS) updates[c] = false;
    suppressed = [...MARKETING_CHANNELS];
  } else if (isMarketingChannel(channelParam)) {
    updates[channelParam] = false;
    suppressed = [channelParam];
  } else {
    return redirectResult(req, "error", "invalid_channel");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...updates,
      marketingConsentTimestamp: new Date(),
      marketingConsentSource:    "unsubscribe",
    },
  });

  // Suppression list - independent of the user's flag so even if they
  // later re-enable, campaign senders can choose to honour it.
  for (const ch of suppressed) {
    await suppressEmail(prisma, user.email, mailChannelKey(ch), "user_unsubscribe", "one_click");
  }

  return redirectResult(req, "success", suppressed.join(","));
}

// Maps the User field name to a stable email-channel identifier used
// in the suppression list. Avoids leaking the schema's internal names
// outside the database.
function mailChannelKey(field: string): string {
  switch (field) {
    case "marketingEmails":      return "marketing_email";
    case "marketingSMS":         return "marketing_sms";
    case "newsletter":           return "newsletter";
    case "productAnnouncements": return "product_announcements";
    default: return field;
  }
}

function redirectResult(req: NextRequest, status: "success" | "error", detail: string): NextResponse {
  const u = new URL("/unsubscribe", req.url);
  u.searchParams.set("status", status);
  u.searchParams.set("detail", detail);
  return NextResponse.redirect(u, { status: 303 });
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  return handle(req, sp.get("token"), sp.get("channel"), sp.get("all") === "1");
}

export async function POST(req: NextRequest) {
  // RFC 8058 - MUAs send a POST with form-encoded params or no body.
  // Accept both query-string and form bodies for robustness.
  const sp = req.nextUrl.searchParams;
  let token   = sp.get("token");
  let channel = sp.get("channel");
  let all     = sp.get("all") === "1";

  if (!token) {
    try {
      const form = await req.formData();
      token   = String(form.get("token") ?? "") || null;
      channel = String(form.get("channel") ?? "") || null;
      all     = String(form.get("all") ?? "") === "1";
    } catch { /* no body - leave as null */ }
  }
  return handle(req, token, channel, all);
}
