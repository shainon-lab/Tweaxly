// Account page - cross-workspace overview + personal settings.
//
// "Workspaces" is the default tab and renders one card per business
// the user is a member of (plan + AI credits + alerts + activity).
// Per-workspace billing controls (purchases, ledger, plan changes)
// live INSIDE each workspace's Settings → Business Profile - the
// Account surface only shows the at-a-glance status across all of
// them and lets the user switch in.
//
// Server-side fetches mirror the (now-retired) /workspaces overview
// route so a single round-trip hydrates AccountClient.

import PageHeader from "@/components/PageHeader";
import HowItWorks from "@/components/HowItWorks";
import { Briefcase, CreditCard, MailCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getServerT } from "@/lib/i18n/server";
import { detectIpCountry } from "@/lib/geoip";
import {
  ensureMonthlyAllowance, getEffectivePlan, getPlanLimits, type PlanKey,
} from "@/lib/billing";
import { evaluateNotificationRules } from "@/lib/notificationsEval";
import type { WorkspaceCardData } from "../workspaces/WorkspaceCard";
import AccountClient from "./AccountClient";

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

export default async function AccountPage() {
  const user = await requireUser();
  const session = await getSession();
  const currentBusinessId = session.currentBusinessId ?? null;
  const { t } = await getServerT();
  const detectedRegion = detectIpCountry();

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

  const workspaces: WorkspaceCardData[] = await Promise.all(
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
  workspaces.sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      <PageHeader
        title={t("account.title")}
        subtitle={t("account.subtitle")}
        right={
          <HowItWorks
            title="How the account section works"
            intro="Your personal account, separate from any workspace. Workspaces you can switch into, billing across all of them, language and region, communication preferences. Settings here apply across every workspace you own or belong to."
            cards={[
              { icon: <Briefcase size={16} strokeWidth={1.7} />,  title: "Workspaces",  body: "Every workspace you own or belong to. Switch between them, or create a new one for a different business. Each workspace has its own subscription." },
              { icon: <CreditCard size={16} strokeWidth={1.7} />, title: "Orders & Invoices", body: "Every payment across every workspace - your personal billing history. Download invoices directly from Polar." },
              { icon: <MailCheck size={16} strokeWidth={1.7} />,  title: "Communications", body: "Pause marketing channels you don't want. Transactional emails (billing, security) always come through while the account is active." },
            ]}
          />
        }
      />
      <AccountClient
        user={{
          email: user.email,
          createdAt: user.createdAt.toISOString(),
          preferredLanguage: user.preferredLanguage,
          region: user.region,
          detectedRegion,
        }}
        workspaces={workspaces}
      />
    </>
  );
}
