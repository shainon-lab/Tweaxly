// Activity feed builder for the super-admin operational stream.
// Pulls recent events from existing tables (signups, uploads,
// consultations, forecasts, alerts, admin/impersonation, failed
// logins) and merges them into one chronological feed.
//
// No new tables - every event is derived from real product activity.
// Billing / support events will appear here once those systems exist;
// the categories are already wired so the filter UI is ready.

import { prisma } from "./db";

export type ActivityCategory =
  | "signup" | "data" | "ai" | "forecast" | "alert"
  | "security" | "admin" | "billing" | "support";

export type ActivityItem = {
  id: string;
  at: Date;
  category: ActivityCategory;
  // The actor of the event when it makes sense to surface a user
  // (signups, logins, admin actions). Null for system-level events.
  actorEmail?: string | null;
  // Target business - null for tenant-spanning events.
  business?: { id: string; name: string } | null;
  title: string;
  detail?: string | null;
};

const CATEGORY_LABEL: Record<ActivityCategory, string> = {
  signup:   "Signup",
  data:     "Data",
  ai:       "AI",
  forecast: "Forecast",
  alert:    "Alert",
  security: "Security",
  admin:    "Admin",
  billing:  "Billing",
  support:  "Support",
};

export function categoryLabel(c: ActivityCategory) { return CATEGORY_LABEL[c]; }

export const CATEGORY_DOT: Record<ActivityCategory, string> = {
  signup:   "bg-good",
  data:     "bg-accent",
  ai:       "bg-brand-teal",
  forecast: "bg-brand-purple",
  alert:    "bg-warn",
  security: "bg-bad",
  admin:    "bg-slate-400",
  billing:  "bg-slate-500",
  support:  "bg-slate-500",
};

export async function getActivityFeed(opts: {
  category?: ActivityCategory | "all";
  businessId?: string;
  limit?: number;
} = {}): Promise<ActivityItem[]> {
  const limit = opts.limit ?? 100;
  const business = opts.businessId ? { businessId: opts.businessId } : {};
  const businessIdEq = opts.businessId ? { id: opts.businessId } : {};

  // Fan out queries and merge. We deliberately over-fetch each source
  // a bit and then sort + slice client-side; the dataset is small
  // (admin-only view) so this is fine.
  const fetchSize = Math.min(limit, 200);

  const [
    signups,
    uploads,
    consultations,
    forecasts,
    alerts,
    failedLogins,
    audits,
  ] = await Promise.all([
    prisma.business.findMany({
      where: opts.businessId ? businessIdEq : {},
      orderBy: { createdAt: "desc" },
      take: fetchSize,
      select: { id: true, name: true, createdAt: true, owner: { select: { email: true } } },
    }),
    prisma.uploadBatch.findMany({
      where: business,
      orderBy: { createdAt: "desc" },
      take: fetchSize,
      select: { id: true, filename: true, rowCount: true, createdAt: true, business: { select: { id: true, name: true } } },
    }),
    prisma.consultation.findMany({
      where: business,
      orderBy: { createdAt: "desc" },
      take: fetchSize,
      select: { id: true, title: true, createdAt: true, business: { select: { id: true, name: true } } },
    }),
    prisma.forecastAssumption.findMany({
      where: business,
      orderBy: { createdAt: "desc" },
      take: fetchSize,
      select: { id: true, label: true, family: true, createdAt: true, business: { select: { id: true, name: true } } },
    }),
    prisma.notificationRule.findMany({
      where: business,
      orderBy: { createdAt: "desc" },
      take: fetchSize,
      select: { id: true, label: true, metric: true, createdAt: true, business: { select: { id: true, name: true } } },
    }),
    prisma.loginAttempt.findMany({
      where: { success: false },
      orderBy: { createdAt: "desc" },
      take: fetchSize,
      select: { id: true, email: true, createdAt: true, ipAddress: true },
    }),
    prisma.auditLog.findMany({
      where: opts.businessId ? { targetBusinessId: opts.businessId } : {},
      orderBy: { createdAt: "desc" },
      take: fetchSize,
      select: { id: true, action: true, createdAt: true, metadata: true,
        actor: { select: { email: true } },
        targetBusiness: { select: { id: true, name: true } },
      },
    }),
  ]);

  const items: ActivityItem[] = [];

  for (const b of signups) items.push({
    id: `signup:${b.id}`, at: b.createdAt, category: "signup",
    actorEmail: b.owner.email,
    business: { id: b.id, name: b.name },
    title: `New signup · ${b.name}`,
    detail: b.owner.email,
  });
  for (const u of uploads) items.push({
    id: `upload:${u.id}`, at: u.createdAt, category: "data",
    business: u.business,
    title: `CSV uploaded · ${u.filename}`,
    detail: `${u.rowCount.toLocaleString()} rows`,
  });
  for (const c of consultations) items.push({
    id: `consult:${c.id}`, at: c.createdAt, category: "ai",
    business: c.business,
    title: `Consultation created`,
    detail: c.title.slice(0, 120),
  });
  for (const f of forecasts) items.push({
    id: `forecast:${f.id}`, at: f.createdAt, category: "forecast",
    business: f.business,
    title: `Forecast scenario added`,
    detail: `${f.family} · ${f.label}`,
  });
  for (const a of alerts) items.push({
    id: `alert:${a.id}`, at: a.createdAt, category: "alert",
    business: a.business,
    title: `Alert configured`,
    detail: a.label ?? a.metric,
  });
  for (const l of failedLogins) items.push({
    id: `failedlogin:${l.id}`, at: l.createdAt, category: "security",
    actorEmail: l.email,
    title: `Failed login attempt`,
    detail: l.ipAddress ? `from ${l.ipAddress}` : null,
  });
  for (const a of audits) items.push({
    id: `audit:${a.id}`, at: a.createdAt, category: "admin",
    actorEmail: a.actor.email,
    business: a.targetBusiness ?? null,
    title: a.action.replace(/_/g, " "),
    detail: a.metadata ? a.metadata.slice(0, 160) : null,
  });

  const filtered = opts.category && opts.category !== "all"
    ? items.filter((i) => i.category === opts.category)
    : items;

  return filtered
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit);
}
