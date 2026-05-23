import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getQuota } from "@/lib/billing";

export const runtime = "nodejs";

const METRICS = new Set(["revenue", "expenses", "net", "category"]);
const DIRECTIONS = new Set(["increase", "decrease"]);
const THRESHOLD_TYPES = new Set(["percent", "amount"]);
const PERIODS = new Set(["month", "quarter", "year"]);
const SEVERITIES = new Set(["critical", "important", "info"]);

interface MonitorChannels {
  push?: boolean;
  inApp?: boolean;
  email?: boolean;
}
function cleanChannels(v: unknown): MonitorChannels | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const out: MonitorChannels = {};
  if (typeof o.push  === "boolean") out.push  = o.push;
  if (typeof o.inApp === "boolean") out.inApp = o.inApp;
  if (typeof o.email === "boolean") out.email = o.email;
  return Object.keys(out).length > 0 ? out : undefined;
}

function bad(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const { business } = await requireBusiness();
  const body = await req.json() as {
    metric?: string;
    categoryId?: string | null;
    direction?: string;
    thresholdType?: string;
    thresholdValue?: number;
    period?: string;
    label?: string | null;
    enabled?: boolean;
    severity?: string;
    notificationChannels?: MonitorChannels;
  };

  if (!body.metric || !METRICS.has(body.metric)) return bad("Invalid metric");
  if (!body.direction || !DIRECTIONS.has(body.direction)) return bad("Invalid direction");
  if (!body.thresholdType || !THRESHOLD_TYPES.has(body.thresholdType)) return bad("Invalid thresholdType");
  if (!body.period || !PERIODS.has(body.period)) return bad("Invalid period");
  if (body.thresholdValue == null || !isFinite(Number(body.thresholdValue)) || Number(body.thresholdValue) <= 0) {
    return bad("thresholdValue must be a positive number");
  }
  const severity = body.severity && SEVERITIES.has(body.severity) ? body.severity : "important";
  const channels = cleanChannels(body.notificationChannels);

  // Plan gate: enforce the maxNotificationRules quota server-side so
  // the UI gate is convenience, not security. Free = 1 rule;
  // Pro/Business = unlimited. Returns 402 with a structured body so
  // the client can render an upgrade prompt rather than a generic
  // error.
  const rulesQuota = await getQuota(business.id, "maxNotificationRules");
  if (rulesQuota !== "unlimited") {
    const existingCount = await prisma.notificationRule.count({
      where: { businessId: business.id },
    });
    if (existingCount >= rulesQuota) {
      return NextResponse.json({
        error:   "rule_limit_reached",
        message: `Your plan allows ${rulesQuota} monitoring rule${rulesQuota === 1 ? "" : "s"}. Upgrade to Pro for unlimited.`,
        limit:   rulesQuota,
        used:    existingCount,
      }, { status: 402 });
    }
  }

  let categoryId: string | null = null;
  if (body.metric === "category") {
    if (!body.categoryId) return bad("categoryId is required when metric is 'category'");
    const cat = await prisma.category.findFirst({
      where: { id: body.categoryId, businessId: business.id },
    });
    if (!cat) return bad("Unknown category");
    categoryId = cat.id;
  }

  const rule = await prisma.notificationRule.create({
    data: {
      businessId: business.id,
      metric: body.metric,
      categoryId,
      direction: body.direction,
      thresholdType: body.thresholdType,
      thresholdValue: Number(body.thresholdValue),
      period: body.period,
      label: body.label?.trim() || null,
      enabled: body.enabled !== false,
      severity,
      ...(channels ? { notificationChannels: channels as unknown as object } : {}),
    },
  });
  // New rule can immediately fire and flip the sidebar badge -
  // revalidate the layout so the count updates everywhere.
  revalidatePath("/", "layout");
  return NextResponse.json(rule);
}

export async function PATCH(req: NextRequest) {
  const { business } = await requireBusiness();
  const body = await req.json() as {
    id?: string;
    enabled?: boolean;
    label?: string | null;
    action?: "ack" | "unack";
    severity?: string;
    notificationChannels?: MonitorChannels;
  };
  if (!body.id) return bad("id required");
  const data: Record<string, unknown> = {};
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if ("label" in body) data.label = body.label?.toString().trim() || null;
  if (body.action === "ack")   data.acknowledgedAt = new Date();
  if (body.action === "unack") data.acknowledgedAt = null;
  if (body.severity && SEVERITIES.has(body.severity)) data.severity = body.severity;
  if ("notificationChannels" in body) {
    const c = cleanChannels(body.notificationChannels);
    data.notificationChannels = c ?? null;
  }
  await prisma.notificationRule.updateMany({
    where: { id: body.id, businessId: business.id },
    data,
  });
  // The sidebar's unread-alert badge is computed in the root layout
  // via getSidebarAlerts. Next caches layout RSC payloads across
  // soft navigations, so without an explicit revalidate the badge
  // can keep showing the old count after a 'Mark as read'. Invalidate
  // the layout tree so the next render anywhere in the app rebuilds
  // the sidebar with the fresh unread count.
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { business } = await requireBusiness();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return bad("id required");
  await prisma.notificationRule.deleteMany({
    where: { id, businessId: business.id },
  });
  // Deleted rule no longer contributes to the unread count -
  // revalidate the layout so the badge updates everywhere.
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
