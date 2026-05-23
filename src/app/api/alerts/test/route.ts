// POST /api/alerts/test
//
// Sends a single "Test alert" push to every PushSubscription row the
// current user has. The button on Account → Notifications calls this
// so the user can verify their browser is actually receiving pushes
// before relying on it for real signals.

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { canUsePushAlerts } from "@/lib/alerts/premium";
import { isPushConfigured } from "@/lib/alerts/push";
import { dispatchAlert } from "@/lib/alerts/dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const { user, business } = await requireBusiness();
  if (!isPushConfigured()) {
    return NextResponse.json({
      error:   "not_configured",
      message: "Push notifications haven't been enabled on this deployment yet.",
    }, { status: 503 });
  }
  if (!(await canUsePushAlerts(business.id))) {
    return NextResponse.json({
      error:   "upgrade_required",
      message: "Desktop push notifications are a Pro feature.",
    }, { status: 403 });
  }
  // dispatchAlert writes the AlertNotification (so the Notification
  // Center has a real row) AND attempts the push - one call covers
  // both surfaces and mirrors the path Phase 4 will use for live signals.
  await dispatchAlert({
    userId:     user.id,
    businessId: business.id,
    source:     "signal",
    sourceKey:  `test-${Date.now()}`,
    category:   "ai_recommendation",
    severity:   "info",
    title:      `Test alert · ${business.name}`,
    body:       "If you can see this, real-time alerts are wired up correctly.",
    deepLink:   "/account?tab=notifications",
  });
  return NextResponse.json({ ok: true });
}
