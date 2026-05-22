// Workspace Overview Mode.
//
// Cross-workspace dashboard for users with more than one business -
// accountants, consultants, fractional CFOs, agencies, multi-business
// owners. Renders one card per workspace the user is a member of,
// each showing plan + AI credits + alert count + last activity, with
// quick switch + per-workspace billing links.
//
// All data is fetched server-side per workspace. Independent rules:
//   • plan / balance / monthlyAllowance come from each workspace's
//     own AdminPlanOverride / Subscription / AiCreditWallet rows
//   • alerts come from each workspace's NotificationRule evaluation
//   • activity comes from each workspace's lastActivityAt
//
// Switching is a POST to /api/workspaces/switch that flips the
// session cookie and redirects to /dashboard.

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { requireUser } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  ensureMonthlyAllowance, getEffectivePlan, getPlanLimits, type PlanKey,
} from "@/lib/billing";
import { evaluateNotificationRules } from "@/lib/notificationsEval";
import { WorkspaceCard, type WorkspaceCardData } from "./WorkspaceCard";

export const dynamic = "force-dynamic";

function fmtRel(d: Date | null | undefined): string {
  if (!d) return "no activity yet";
  const ms = Date.now() - d.getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export default async function WorkspacesOverviewPage() {
  const user = await requireUser();
  const session = await getSession();
  const currentBusinessId = session.currentBusinessId ?? null;

  const memberships = await prisma.businessMembership.findMany({
    where: { userId: user.id, status: "active" },
    include: {
      business: {
        select: {
          id:             true,
          name:           true,
          status:         true,
          lastActivityAt: true,
          createdAt:      true,
          _count:         { select: { transactions: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const active = memberships.filter((m) => m.business.status !== "suspended");

  // Fan-out the per-workspace billing + alert fetches in parallel.
  // Idempotent ensureMonthlyAllowance also lazy-bootstraps the wallet
  // for any legacy workspace that doesn't have one yet.
  const cards: WorkspaceCardData[] = await Promise.all(
    active.map(async (m) => {
      const businessId = m.business.id;
      await ensureMonthlyAllowance(businessId);
      const [eff, wallet, firing] = await Promise.all([
        getEffectivePlan(businessId),
        prisma.aiCreditWallet.findUnique({ where: { businessId } }),
        evaluateNotificationRules(businessId).catch(() => []),
      ]);
      const limits = getPlanLimits(eff.plan as PlanKey);
      const firingActive = firing.filter((a) => a.acknowledgedAt == null).length;
      return {
        id:                m.business.id,
        name:              m.business.name,
        role:              m.role,
        isCurrent:         m.business.id === currentBusinessId,
        plan:              eff.plan,
        planSource:        eff.source,
        readOnly:          eff.readOnly,
        balance:           wallet?.balance ?? 0,
        monthlyAllowance:  limits.monthlyAICredits,
        firingAlerts:      firingActive,
        transactions:      m.business._count.transactions,
        lastActivityLabel: fmtRel(m.business.lastActivityAt ?? m.business.createdAt),
        hasActivity:       !!m.business.lastActivityAt,
      };
    }),
  );

  // Sort: current workspace first, then by lastActivityAt desc fall-
  // back to name. Keeps the user's primary surface at the top.
  cards.sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  // Aggregate banner stats.
  const totalCredits   = cards.reduce((s, c) => s + c.balance, 0);
  const totalAllowance = cards.reduce((s, c) => s + c.monthlyAllowance, 0);
  const totalAlerts    = cards.reduce((s, c) => s + c.firingAlerts, 0);
  const totalWorkspaces = cards.length;

  return (
    <>
      <PageHeader
        title="All Workspaces"
        subtitle="Cross-workspace health for everyone you're a member of - plan, AI Credits, alerts and last activity per business."
      />

      {/* Aggregate strip - useful for accountants/agencies. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Workspaces"          value={totalWorkspaces.toString()} />
        <Stat label="AI Credits balance"  value={totalCredits.toLocaleString()} sub={`of ${totalAllowance.toLocaleString()} monthly`} />
        <Stat label="Firing alerts"       value={totalAlerts.toString()} tone={totalAlerts > 0 ? "warn" : undefined} />
        <Stat label="Read-only"           value={cards.filter((c) => c.readOnly).length.toString()} tone={cards.filter((c) => c.readOnly).length > 0 ? "bad" : undefined} />
      </div>

      {/* Workspace cards */}
      {cards.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-sm text-slate-300">You aren&apos;t a member of any workspaces yet.</div>
          <Link
            href="/settings/workspaces"
            className="inline-block mt-4 text-sm px-4 py-1.5 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition"
          >
            Create your first workspace
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <WorkspaceCard key={c.id} card={c} />
          ))}
        </div>
      )}

      <div className="mt-8 text-xs text-slate-500 flex items-center gap-4 flex-wrap">
        <Link href="/settings/workspaces" className="text-accent hover:underline">
          Manage workspaces (rename / leave / delete) →
        </Link>
        <span className="text-slate-700">·</span>
        <span>Each workspace is billed and metered independently - upgrading one never affects another.</span>
      </div>
    </>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "warn" | "bad" }) {
  const valueCls = tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "text-slate-100";
  return (
    <div className="card-tight">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${valueCls}`}>{value}</div>
      {sub ? <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div> : null}
    </div>
  );
}
