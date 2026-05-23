// GET   /api/alerts/preferences  - read the current user's prefs for
//                                  the active workspace
// PATCH /api/alerts/preferences  - upsert any subset of prefs
//
// Scoped to (userId × businessId) so the same person gets independent
// settings per workspace. Free plans can read + update non-push
// settings but the API rejects pushEnabled=true without Pro.

import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import {
  getAlertPreferences, upsertAlertPreferences,
} from "@/lib/alerts/prefs";
import { canUsePushAlerts } from "@/lib/alerts/premium";
import {
  ALERT_CATEGORIES, SENSITIVITY_OPTIONS,
  type AlertCategory, type AlertSensitivity,
} from "@/lib/alerts/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORY_KEYS = new Set<string>(ALERT_CATEGORIES.map((c) => c.value));
const SENSITIVITY_KEYS = new Set<string>(SENSITIVITY_OPTIONS.map((o) => o.value));

function asBool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}
function asTime(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  return /^\d{2}:\d{2}$/.test(v.trim()) ? v.trim() : undefined;
}
function asString(v: unknown, max = 100): string | undefined {
  return typeof v === "string" ? v.trim().slice(0, max) : undefined;
}
function asPositiveInt(v: unknown, max: number): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  const n = Math.floor(v);
  if (n < 0 || n > max) return undefined;
  return n;
}

export async function GET() {
  const { user, business } = await requireBusiness();
  const prefs = await getAlertPreferences(user.id, business.id);
  const premium = await canUsePushAlerts(business.id);
  return NextResponse.json({ prefs, premium });
}

export async function PATCH(req: Request) {
  const { user, business } = await requireBusiness();
  const premium = await canUsePushAlerts(business.id);

  let body: Record<string, unknown>;
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }

  // Validate categories - keep only known keys, coerce to boolean.
  let categories: Record<AlertCategory, boolean> | undefined;
  if (body.categories && typeof body.categories === "object") {
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(body.categories as Record<string, unknown>)) {
      if (CATEGORY_KEYS.has(k) && typeof v === "boolean") out[k] = v;
    }
    if (Object.keys(out).length > 0) categories = out as Record<AlertCategory, boolean>;
  }

  const sensitivityRaw = asString(body.sensitivity, 32);
  const sensitivity: AlertSensitivity | undefined =
    sensitivityRaw && SENSITIVITY_KEYS.has(sensitivityRaw)
      ? (sensitivityRaw as AlertSensitivity)
      : undefined;

  let pushEnabled = asBool(body.pushEnabled);
  if (pushEnabled === true && !premium) {
    return NextResponse.json({
      error:   "upgrade_required",
      message: "Desktop push notifications are a Pro feature.",
    }, { status: 403 });
  }

  const updated = await upsertAlertPreferences(user.id, business.id, {
    pushEnabled,
    inAppEnabled:       asBool(body.inAppEnabled),
    emailEnabled:       asBool(body.emailEnabled),
    categories,
    sensitivity,
    quietHoursEnabled:  asBool(body.quietHoursEnabled),
    quietHoursStart:    asTime(body.quietHoursStart) ?? null,
    quietHoursEnd:      asTime(body.quietHoursEnd) ?? null,
    quietHoursTimezone: asString(body.quietHoursTimezone, 100) ?? null,
    criticalBypass:     asBool(body.criticalBypass),
    dailyLimit:         asPositiveInt(body.dailyLimit, 200),
  });
  return NextResponse.json({ ok: true, prefs: await getAlertPreferences(user.id, business.id) });
}
