// POST   /api/alerts/subscriptions  - register a Web Push subscription
//   body: { endpoint: string, keys: { p256dh: string, auth: string }, userAgent?: string }
// DELETE /api/alerts/subscriptions  - remove (by endpoint)
//   body: { endpoint: string }
//
// Premium-gated against the currently-active workspace. A user can
// register multiple devices/browsers - each one is its own row keyed
// by endpoint (Web Push endpoints are unique per push service +
// subscription).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";
import { canUsePushAlerts } from "@/lib/alerts/premium";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { user, business } = await requireBusiness();
  if (!(await canUsePushAlerts(business.id))) {
    return NextResponse.json({
      error:   "upgrade_required",
      message: "Desktop push notifications are a Pro feature.",
    }, { status: 403 });
  }

  let body: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown }; userAgent?: unknown };
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }

  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  const p256dh   = typeof body.keys?.p256dh === "string" ? body.keys!.p256dh as string : "";
  const auth     = typeof body.keys?.auth   === "string" ? body.keys!.auth   as string : "";
  const ua       = typeof body.userAgent === "string"   ? body.userAgent.slice(0, 500) : null;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where:  { endpoint },
    create: { userId: user.id, endpoint, p256dh, authKey: auth, userAgent: ua },
    update: { userId: user.id, p256dh, authKey: auth, userAgent: ua, lastSeenAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { user } = await requireBusiness();
  let body: { endpoint?: unknown };
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  if (!endpoint) return NextResponse.json({ error: "endpoint_required" }, { status: 400 });
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
  return NextResponse.json({ ok: true });
}
