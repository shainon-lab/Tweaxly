// Admin · Dashboard. High-level summary cards across the customer
// base. Everything here is computed from the existing tables —
// no fake metrics. Billing-dependent cards (MRR, paying, past-due)
// surface 'no billing connected yet' until Stripe is wired.

import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const RECENT_ACTIVE_DAYS = 7;
const NEW_SIGNUPS_DAYS = 30;
const INACTIVE_DAYS = 30;

function startOfDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export default async function AdminDashboard() {
  const now = new Date();
  const recentCutoff = startOfDaysAgo(RECENT_ACTIVE_DAYS);
  const newSignupsCutoff = startOfDaysAgo(NEW_SIGNUPS_DAYS);
  const inactiveCutoff = startOfDaysAgo(INACTIVE_DAYS);

  const [
    totalAccounts,
    statusCounts,
    planCounts,
    newSignupsCount,
    recentlyActiveCount,
    inactiveCount,
    noDataAccounts,
    failedLogins24h,
    impersonations24h,
    activeTrials,
    mostActive,
  ] = await Promise.all([
    prisma.business.count(),
    prisma.business.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.business.groupBy({ by: ["plan"], _count: { _all: true } }),
    prisma.business.count({ where: { createdAt: { gte: newSignupsCutoff } } }),
    prisma.business.count({ where: { lastActivityAt: { gte: recentCutoff } } }),
    prisma.business.count({
      where: {
        OR: [
          { lastActivityAt: null, createdAt: { lt: inactiveCutoff } },
          { lastActivityAt: { lt: inactiveCutoff } },
        ],
        status: "active",
      },
    }),
    // "no data" = zero transactions
    prisma.business.findMany({
      where: { transactions: { none: {} }, status: "active" },
      select: { id: true, name: true, owner: { select: { email: true } }, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.loginAttempt.count({
      where: { success: false, createdAt: { gte: startOfDaysAgo(1) } },
    }),
    prisma.auditLog.count({
      where: { action: "impersonation.enter", createdAt: { gte: startOfDaysAgo(1) } },
    }),
    prisma.business.count({
      where: { trialEndsAt: { gte: now } },
    }),
    // 5 most recently active accounts
    prisma.business.findMany({
      where: { lastActivityAt: { not: null } },
      orderBy: { lastActivityAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        lastActivityAt: true,
        owner: { select: { email: true } },
        status: true,
      },
    }),
  ]);

  const status = Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all]));
  const plans = Object.fromEntries(planCounts.map((p) => [p.plan, p._count._all]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">
          What&apos;s happening across all customer accounts.
        </p>
      </div>

      {/* Headline tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Tile label="Total accounts"  value={totalAccounts.toString()} href="/admin/accounts" />
        <Tile label="Active"          value={(status.active ?? 0).toString()}   href="/admin/accounts?status=active"    tone="good"   />
        <Tile label="Trial accounts"  value={activeTrials.toString()}            href="/admin/accounts?trial=1"          tone="accent" />
        <Tile label="Suspended"       value={(status.suspended ?? 0).toString()} href="/admin/accounts?status=suspended" tone="bad"    />
        <Tile label="Demo"            value={(status.demo ?? 0).toString()}      href="/admin/accounts?status=demo"      tone="accent" />
        <Tile label="Internal test"   value={(status.test ?? 0).toString()}      href="/admin/accounts?status=test"      tone="slate"  />
      </div>

      {/* Acquisition + engagement */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label={`New signups · last ${NEW_SIGNUPS_DAYS}d`}      value={newSignupsCount.toString()}     href={`/admin/accounts?signupWithin=${NEW_SIGNUPS_DAYS}d`} />
        <Tile label={`Recently active · last ${RECENT_ACTIVE_DAYS}d`} value={recentlyActiveCount.toString()} href="/admin/accounts?activity=recent" tone="good" />
        <Tile label={`Inactive ≥ ${INACTIVE_DAYS}d (active accounts)`} value={inactiveCount.toString()}      href="/admin/accounts?activity=inactive" tone="warn" />
        <Tile label="Accounts without uploaded data" value={noDataAccounts.length === 5 ? "5+" : noDataAccounts.length.toString()} href="/admin/accounts?dataStatus=none" tone="warn" />
      </div>

      {/* Billing — empty state until Stripe is wired */}
      <Section title="Billing">
        <div className="rounded-xl border border-line bg-ink-900/40 p-6 text-sm text-slate-400 flex items-start justify-between gap-4 flex-wrap">
          <div className="max-w-xl">
            <div className="text-slate-100 font-medium mb-1">No payments provider connected yet</div>
            <p>
              MRR, paying customers, past-due, failed payments, and churn metrics will appear here
              automatically once Stripe (or another provider) is wired into the platform.
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-wider pill">not connected</span>
        </div>
      </Section>

      {/* Security */}
      <Section title="Security · last 24h">
        <div className="grid grid-cols-2 gap-3">
          <Tile label="Failed login attempts" value={failedLogins24h.toString()} href="/admin/audit" tone={failedLogins24h > 5 ? "warn" : "slate"} />
          <Tile label="Impersonation sessions" value={impersonations24h.toString()} href="/admin/audit" tone="accent" />
        </div>
      </Section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Most active */}
        <Section title={`Most active · last ${RECENT_ACTIVE_DAYS}d`} action={<Link href="/admin/accounts?activity=recent" className="text-xs text-accent hover:text-white">View all →</Link>}>
          {mostActive.length === 0 ? (
            <Empty>No account activity yet.</Empty>
          ) : (
            <ul className="divide-y divide-line/60">
              {mostActive.map((b) => (
                <li key={b.id} className="py-2.5 flex items-center justify-between gap-2 text-sm">
                  <Link href={`/admin/accounts/${b.id}`} className="text-slate-100 hover:text-accent truncate">
                    {b.name}
                  </Link>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {b.lastActivityAt ? new Date(b.lastActivityAt).toLocaleString() : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* No data yet */}
        <Section title="Accounts without uploaded data" action={<Link href="/admin/accounts?dataStatus=none" className="text-xs text-accent hover:text-white">View all →</Link>}>
          {noDataAccounts.length === 0 ? (
            <Empty>Every active account has uploaded data.</Empty>
          ) : (
            <ul className="divide-y divide-line/60">
              {noDataAccounts.map((b) => (
                <li key={b.id} className="py-2.5 flex items-center justify-between gap-2 text-sm">
                  <Link href={`/admin/accounts/${b.id}`} className="text-slate-100 hover:text-accent truncate">
                    {b.name}
                  </Link>
                  <span className="text-xs text-slate-500 truncate">{b.owner.email}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* Plan mix */}
      <Section title="Plan mix">
        <div className="flex flex-wrap gap-2">
          {Object.entries(plans).map(([p, n]) => (
            <Link
              key={p}
              href={`/admin/accounts?plan=${p}`}
              className="rounded-full border border-line bg-ink-900/40 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-slate-500 transition"
            >
              {p} <span className="tabular-nums opacity-60">· {n}</span>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Tile({
  label, value, href, tone,
}: { label: string; value: string; href: string; tone?: "good" | "bad" | "warn" | "accent" | "slate" }) {
  const accent =
    tone === "good"   ? "text-good"          :
    tone === "bad"    ? "text-bad"           :
    tone === "warn"   ? "text-warn"          :
    tone === "accent" ? "text-accent"        :
                        "text-slate-100";
  return (
    <Link
      href={href}
      className="rounded-xl border border-line bg-ink-900/40 p-4 hover:bg-ink-800/60 hover:border-slate-500 transition block"
    >
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</div>
      <div className={`mt-2 text-2xl font-bold tabular-nums tracking-tight leading-none ${accent}`}>{value}</div>
    </Link>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-line bg-ink-900/40 p-6 text-center text-sm text-slate-500">{children}</div>;
}
