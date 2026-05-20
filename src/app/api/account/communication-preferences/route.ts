// GET  /api/account/communication-preferences   → current channel state
// PATCH /api/account/communication-preferences   → update marketing channels
//
// System / transactional emails (billing, security, password reset)
// are NOT exposed here - they're contractually required for active
// accounts and can't be turned off. Only marketing channels are
// editable.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  updateMarketingPreferences, channelStateOf, MARKETING_CHANNELS,
  type MarketingConsentUpdate,
} from "@/lib/communications";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      systemEmails: true,
      marketingEmails: true,
      marketingSMS: true,
      productAnnouncements: true,
      newsletter: true,
      marketingConsentTimestamp: true,
      marketingConsentSource: true,
      marketingPolicyVersion: true,
    },
  });
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({
    systemEmails: user.systemEmails,
    ...channelStateOf(user),
    marketingConsentTimestamp: user.marketingConsentTimestamp,
    marketingConsentSource: user.marketingConsentSource,
    marketingPolicyVersion: user.marketingPolicyVersion,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  // Whitelist - only the four marketing channels are settable here.
  // Any other key in the body is ignored (silently - these are not
  // user errors, they're forward-compat for future channels).
  const update: MarketingConsentUpdate = {};
  for (const k of MARKETING_CHANNELS) {
    if (k in body && typeof body[k] === "boolean") {
      (update as Record<string, boolean>)[k] = body[k] as boolean;
    }
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no_changes" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

  await updateMarketingPreferences(prisma, session.userId, update, {
    source: "settings",
    ipAddress: ip,
  });

  await recordAudit({
    actorUserId: session.userId,
    action:      "consent.marketing_update",
    metadata: { update, source: "settings" },
    request:     req,
  });

  return NextResponse.json({ ok: true });
}
