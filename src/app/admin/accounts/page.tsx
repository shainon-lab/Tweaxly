// Admin · Accounts. The main operational workspace.
//
// Dense table of every business with smart filters across the top.
// Each row carries a health score, owner, plan, data status,
// signup + last-activity dates, and a per-row actions dropdown
// (View / Impersonate / Edit plan / Add note / Suspend / Reactivate).

import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import {
  computeHealthScore,
  HEALTH_BAND_COLOR,
  HEALTH_BAND_LABEL,
} from "@/lib/healthScore";
import RowActions from "@/components/admin/RowActions";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtRel(d: Date | null | undefined) {
  if (!d) return "never";
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}
function daysAgoDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}
function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

const STATUS_PILL: Record<string, string> = {
  active:    "pill-good",
  suspended: "pill-bad",
  demo:      "pill-accent",
  test:      "pill",
};

type Search = {
  q?: string;
  status?: string;
  plan?: string;
  smart?: string;          // needs_onboarding | no_data | inactive_14d | trial_ending | multi_business | churn_risk
  signupWithin?: string;
};

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const where: Prisma.BusinessWhereInput = {};
  const ANDs: Prisma.BusinessWhereInput[] = [];
  const now = new Date();

  if (searchParams.status && searchParams.status !== "all") {
    where.status = searchParams.status;
  }
  if (searchParams.plan && searchParams.plan !== "all") {
    where.plan = searchParams.plan;
  }
  if (searchParams.signupWithin) {
    const m = searchParams.signupWithin.match(/^(\d+)d$/);
    if (m) where.createdAt = { gte: daysAgoDate(Number(m[1])) };
  }

  // Smart filters — operational shortcuts.
  switch (searchParams.smart) {
    case "needs_onboarding":
      // No transactions AND > 1 day old AND active.
      where.transactions = { none: {} };
      where.status = "active";
      ANDs.push({ createdAt: { lt: daysAgoDate(1) } });
      break;
    case "no_data":
      where.transactions = { none: {} };
      break;
    case "inactive_14d":
      where.status = "active";
      ANDs.push({
        OR: [
          { lastActivityAt: null, createdAt: { lt: daysAgoDate(14) } },
          { lastActivityAt: { lt: daysAgoDate(14) } },
        ],
      });
      break;
    case "trial_ending":
      where.trialEndsAt = { gte: now, lt: daysFromNow(7) };
      break;
    case "multi_business":
      // Businesses owned by a user who owns more than one business.
      ANDs.push({
        owner: { businesses: { some: { id: { not: undefined } } } },
      });
      // Will further filter in post-query (Prisma can't directly filter
      // 'count > 1' on a relation in a single query without raw SQL).
      break;
    case "churn_risk":
      where.status = "active";
      ANDs.push({
        OR: [
          { lastActivityAt: { lt: daysAgoDate(21) } },
          { transactions: { none: {} } },
        ],
      });
      break;
  }

  if (searchParams.q) {
    const q = searchParams.q;
    ANDs.push({
      OR: [
        { id:   { contains: q } },
        { name: { contains: q, mode: "insensitive" } },
        { owner: { email: { contains: q, mode: "insensitive" } } },
        { owner: { name:  { contains: q, mode: "insensitive" } } },
      ],
    });
  }
  if (ANDs.length > 0) where.AND = ANDs;

  let businesses = await prisma.business.findMany({
    where,
    orderBy: [{ lastActivityAt: "desc" }, { createdAt: "desc" }],
    take: 300,
    select: {
      id: true,
      name: true,
      status: true,
      plan: true,
      trialEndsAt: true,
      createdAt: true,
      lastActivityAt: true,
      currency: true,
      owner: {
        select: {
          id: true, email: true, name: true, lastLoginAt: true,
          _count: { select: { businesses: true } },
        },
      },
      _count: {
        select: {
          memberships: true,
          transactions: true,
          uploads: true,
          consultations: true,
          forecastAssumptions: true,
          notificationRules: true,
        },
      },
      transactions: { where: { categoryId: { not: null } }, select: { id: true }, take: 0 },
    },
  });

  // Post-filter: multi_business smart filter (owner has > 1 business).
  if (searchParams.smart === "multi_business") {
    businesses = businesses.filter((b) => b.owner._count.businesses > 1);
  }

  // Need categorized counts per business; do a single grouped query.
  const cats = await prisma.transaction.groupBy({
    by: ["businessId"],
    where: { businessId: { in: businesses.map((b) => b.id) }, categoryId: { not: null } },
    _count: { _all: true },
  });
  const categorizedMap = new Map(cats.map((c) => [c.businessId, c._count._all]));

  const statusCounts = await prisma.business.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const totals = Object.fromEntries(statusCounts.map((c) => [c.status, c._count._all]));
  const allCount = statusCounts.reduce((a, c) => a + c._count._all, 0);

  const baseQuery: Record<string, string | undefined> = { ...searchParams };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Accounts</h1>
          <p className="text-xs text-slate-400 mt-1">
            Every workspace in the system. Click any row for the Customer 360.
          </p>
        </div>
        <form className="flex items-center gap-2" action="/admin/accounts">
          <input
            type="search"
            name="q"
            placeholder="Search name, email, account ID"
            defaultValue={searchParams.q ?? ""}
            className="h-8 px-3 rounded-md border border-line bg-ink-900/60 text-[13px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent/50 w-64"
          />
          {Object.entries(baseQuery)
            .filter(([k, v]) => v && k !== "q")
            .map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          <button className="btn-ghost text-xs h-8" type="submit">Search</button>
        </form>
      </div>

      {/* Filter strip — sticks under the admin header */}
      <div className="sticky top-12 z-10 -mx-6 px-6 py-2 bg-ink-950/95 backdrop-blur border-y border-line/40 space-y-2">
        <FilterRow label="Status">
          <Chip name="status" cur={searchParams.status} val={undefined} label="All" count={allCount} base={baseQuery} />
          <Chip name="status" cur={searchParams.status} val="active"    label="Active"    count={totals.active ?? 0} base={baseQuery} />
          <Chip name="status" cur={searchParams.status} val="suspended" label="Suspended" count={totals.suspended ?? 0} base={baseQuery} />
          <Chip name="status" cur={searchParams.status} val="demo"      label="Demo"      count={totals.demo ?? 0} base={baseQuery} />
          <Chip name="status" cur={searchParams.status} val="test"      label="Test"      count={totals.test ?? 0} base={baseQuery} />
        </FilterRow>
        <FilterRow label="Smart">
          <Chip name="smart" cur={searchParams.smart} val={undefined}         label="None" base={baseQuery} />
          <Chip name="smart" cur={searchParams.smart} val="needs_onboarding"  label="Needs onboarding" base={baseQuery} />
          <Chip name="smart" cur={searchParams.smart} val="no_data"           label="No data" base={baseQuery} />
          <Chip name="smart" cur={searchParams.smart} val="inactive_14d"      label="Inactive ≥ 14d" base={baseQuery} />
          <Chip name="smart" cur={searchParams.smart} val="trial_ending"      label="Trial ending · 7d" base={baseQuery} />
          <Chip name="smart" cur={searchParams.smart} val="multi_business"    label="Multi-workspace owner" base={baseQuery} />
          <Chip name="smart" cur={searchParams.smart} val="churn_risk"        label="Churn risk" base={baseQuery} />
        </FilterRow>
      </div>

      <div className="rounded-lg border border-line bg-ink-900/40 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-ink-900/80 text-[10px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="text-left px-3 py-2">Business</th>
              <th className="text-left px-3 py-2">Owner</th>
              <th className="text-left px-3 py-2">Plan</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Health</th>
              <th className="text-left px-3 py-2">Users</th>
              <th className="text-left px-3 py-2">Data</th>
              <th className="text-left px-3 py-2">MRR</th>
              <th className="text-left px-3 py-2">Last activity</th>
              <th className="text-left px-3 py-2">Signup</th>
              <th className="text-right px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {businesses.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-sm text-slate-500">
                  No accounts match these filters.
                </td>
              </tr>
            ) : businesses.map((b) => {
              const total = b._count.transactions;
              const categorized = categorizedMap.get(b.id) ?? 0;
              const pct = total > 0 ? Math.round((categorized / total) * 100) : 0;
              const ageDays = Math.floor((Date.now() - b.createdAt.getTime()) / 86_400_000);
              const verdict = computeHealthScore({
                lastActivityAt: b.lastActivityAt,
                lastLoginAt:    b.owner.lastLoginAt,
                hasUploadedData: total > 0 || b._count.uploads > 0,
                transactionCount: total,
                categorizationPct: pct,
                consultationsCount: b._count.consultations,
                forecastAssumptionsCount: b._count.forecastAssumptions,
                notificationRulesCount: b._count.notificationRules,
                ageDays,
                isSuspended: b.status === "suspended",
              });
              const dataStatus =
                total > 50 ? "active" :
                total > 0  ? "partial" :
                             "none";
              const dataLabel =
                dataStatus === "active"  ? `${total.toLocaleString()}` :
                dataStatus === "partial" ? `${total} · partial` :
                                            "—";
              const dataTone =
                dataStatus === "active"  ? "text-good"  :
                dataStatus === "partial" ? "text-warn"  :
                                            "text-slate-500";
              const trialActive = b.trialEndsAt && b.trialEndsAt.getTime() > Date.now();
              const isMultiOwner = b.owner._count.businesses > 1;
              return (
                <tr key={b.id} className="hover:bg-ink-800/60 transition">
                  <td className="px-3 py-2">
                    <Link href={`/admin/accounts/${b.id}`} className="text-slate-100 font-medium hover:text-accent">
                      {b.name}
                    </Link>
                    <div className="text-[10px] text-slate-600 font-mono">{b.id}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-slate-200 text-[13px] flex items-center gap-1.5">
                      {b.owner.name ?? b.owner.email}
                      {isMultiOwner ? <span className="text-[9px] pill" title={`Owns ${b.owner._count.businesses} workspaces`}>×{b.owner._count.businesses}</span> : null}
                    </div>
                    <div className="text-[11px] text-slate-500">{b.owner.email}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs text-slate-200">{b.plan}</span>
                    {trialActive ? <div className="text-[10px] text-accent">trial · {fmtDate(b.trialEndsAt)}</div> : null}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`${STATUS_PILL[b.status] ?? "pill"} text-[10px]`}>{b.status}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className={`flex items-baseline gap-1.5 ${HEALTH_BAND_COLOR[verdict.band]}`}>
                      <span className="text-sm font-semibold tabular-nums">{verdict.score}</span>
                      <span className="text-[10px] uppercase tracking-wider opacity-80">{HEALTH_BAND_LABEL[verdict.band]}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-300 tabular-nums">{b._count.memberships}</td>
                  <td className={`px-3 py-2 text-xs ${dataTone}`}>{dataLabel}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">—</td>
                  <td className="px-3 py-2 text-xs text-slate-400 tabular-nums">{fmtRel(b.lastActivityAt)}</td>
                  <td className="px-3 py-2 text-xs text-slate-400">{fmtDate(b.createdAt)}</td>
                  <td className="px-3 py-2 text-right">
                    <RowActions businessId={b.id} businessName={b.name} status={b.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-3 py-1.5 text-[10px] text-slate-500 border-t border-line flex items-center justify-between">
          <span>{businesses.length} row{businesses.length === 1 ? "" : "s"}</span>
          <span>MRR · pending billing integration</span>
        </div>
      </div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium w-14 shrink-0">{label}</span>
      {children}
    </div>
  );
}

function Chip({
  name, cur, val, label, count, base,
}: {
  name: string;
  cur: string | undefined;
  val: string | undefined;
  label: string;
  count?: number;
  base: Record<string, string | undefined>;
}) {
  const active = (cur ?? undefined) === (val ?? undefined);
  const next: Record<string, string | undefined> = { ...base, [name]: val };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (v) qs.set(k, v);
  }
  const href = `/admin/accounts${qs.toString() ? `?${qs.toString()}` : ""}`;
  return (
    <Link
      href={href}
      className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
        active
          ? "bg-accent-soft border-accent/40 text-accent"
          : "border-line text-slate-400 hover:text-slate-200 hover:border-slate-500"
      }`}
    >
      {label}
      {typeof count === "number" ? <span className="tabular-nums opacity-60"> · {count}</span> : null}
    </Link>
  );
}
