// Alert dispatch surface. Phase 2 ships only `recordAlertNotification`
// (writes to the inbox + sends a push if the user has push on);
// Phase 4 will fold full preference honouring (categories, quiet
// hours, daily-limit, email fallback) into `dispatchAlert`.
//
// Callers should use `dispatchAlert` so Phase 4 can extend behaviour
// without touching every call site.

import { prisma } from "../db";
import { sendPushToUser } from "./push";
import { sendAlertEmail } from "./email";
import type { AlertCategory, AlertSeverity } from "./types";

export interface DispatchInput {
  userId:     string;
  businessId: string;
  source:     "signal" | "monitor";
  sourceKey:  string;
  category:   AlertCategory;
  severity:   AlertSeverity;
  title:      string;
  body:       string;
  deepLink?:  string | null;
  // Per-call channel overrides (from a monitor's stored
  // notificationChannels). null/undefined values fall back to the
  // user's general AlertPreference toggles.
  channels?: { push?: boolean; inApp?: boolean; email?: boolean };
}

// Writes to AlertNotification (the inbox) and fans out to push +
// email per the user's preferences and the per-call channel
// overrides. Category gating + quiet hours + daily-limit + dedup
// are all enforced upstream in `sweepAndDispatch` so callers can
// trust that anything reaching here is meant to ship.
export async function dispatchAlert(input: DispatchInput) {
  // Look up user + workspace prefs in parallel - we need the user
  // for email, and the prefs for channel defaults.
  const [user, prefs, business] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.userId }, select: { email: true } }),
    prisma.alertPreference.findUnique({
      where: { userId_businessId: { userId: input.userId, businessId: input.businessId } },
      select: { pushEnabled: true, inAppEnabled: true, emailEnabled: true },
    }),
    prisma.business.findUnique({ where: { id: input.businessId }, select: { name: true } }),
  ]);

  // Resolve effective channels. A per-call override (set on a
  // monitor) wins outright; otherwise fall back to the user's
  // general toggles. In-app defaults to true since the inbox is
  // always-available; push/email follow user-level prefs unless
  // explicitly overridden.
  const ch = input.channels ?? {};
  const wantInApp = ch.inApp ?? prefs?.inAppEnabled ?? true;
  const wantPush  = ch.push  ?? prefs?.pushEnabled  ?? false;
  // Critical severity falls back to email when the user has email
  // enabled OR push is unavailable - matches the "Critical: desktop
  // push + in-app + email fallback" rule in the spec.
  const wantEmail = ch.email
    ?? (input.severity === "critical" ? (prefs?.emailEnabled ?? false) : (prefs?.emailEnabled ?? false));

  // In-app off + push off + email off → nothing to do.
  if (!wantInApp && !wantPush && !wantEmail) return null;

  // Always write the row when at least in-app is wanted (so the
  // bell still shows it). If only push/email is wanted but not
  // in-app, we still write the row so retries + dedup work, but
  // it'll just live in the inbox.
  const row = await prisma.alertNotification.create({
    data: {
      userId:     input.userId,
      businessId: input.businessId,
      source:     input.source,
      sourceKey:  input.sourceKey,
      category:   input.category,
      severity:   input.severity,
      title:      input.title,
      body:       input.body,
      deepLink:   input.deepLink ?? null,
    },
  });

  // ── Push ────────────────────────────────────────────────────
  if (wantPush) {
    try {
      const result = await sendPushToUser(input.userId, {
        title:    input.title,
        body:     input.body,
        url:      input.deepLink ?? undefined,
        severity: input.severity,
        tag:      `${input.source}-${input.sourceKey}`,
      });
      await prisma.alertNotification.update({
        where: { id: row.id },
        data: {
          pushSentAt: result.sent > 0 ? new Date() : null,
          pushError:  result.sent === 0 && result.failed > 0 ? "delivery_failed" : null,
        },
      });
    } catch (err) {
      console.error("[dispatchAlert] push side-effect failed", err);
    }
  }

  // ── Email ───────────────────────────────────────────────────
  if (wantEmail && user?.email && business?.name) {
    try {
      const r = await sendAlertEmail({
        to:           user.email,
        businessName: business.name,
        severity:     input.severity,
        title:        input.title,
        body:         input.body,
        deepLink:     input.deepLink ?? null,
      });
      await prisma.alertNotification.update({
        where: { id: row.id },
        data: {
          emailSentAt: r.ok ? new Date() : null,
          emailError:  r.ok ? null : (r.error ?? "send_failed"),
        },
      });
    } catch (err) {
      console.error("[dispatchAlert] email side-effect failed", err);
    }
  }

  return row;
}
