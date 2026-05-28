import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import GlobalConsult from "@/components/GlobalConsult";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import BillingStatusBanner from "@/components/BillingStatusBanner";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { gracePeriodStatus } from "@/lib/auth/verificationGate";
import { NotificationCenterProvider } from "@/components/notifications/NotificationCenterContext";
import NotificationCenterMount from "@/components/notifications/NotificationCenterMount";
import NotifyProvider from "@/components/notify/NotifyProvider";
import { requireBusiness } from "@/lib/auth";
import { getSidebarAlerts } from "@/lib/alerts";
import { prisma } from "@/lib/db";
import { getEffectivePlan, ensureMonthlyAllowance, getPlanLimits } from "@/lib/billing";

export async function generateMetadata(): Promise<Metadata> {
  const { business } = await requireBusiness();
  return {
    title: business.name,
    icons: business.faviconData ? { icon: business.faviconData } : undefined,
  };
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, business, isImpersonating, impersonationAllowWrites } = await requireBusiness();
  const alerts = await getSidebarAlerts(business.id);

  // Billing context for the status banner + sidebar pill. Lazy-
  // bootstrap the wallet so legacy businesses get one on first
  // load. Both calls are cheap (single Prisma reads) and safe to
  // run on every app navigation.
  const billingCtx = await ensureMonthlyAllowance(business.id);
  const effectivePlan = await getEffectivePlan(business.id);
  const planMonthlyAllowance = getPlanLimits(effectivePlan.plan).monthlyAICredits;
  // The sidebar credits bar needs a non-zero denominator to render.
  // Free plans have monthlyAICredits = 0 (no recurring allowance), so
  // fall back to the one-time starter grant so the bar visualises
  // remaining-vs-used against the right ceiling.
  const planCreditTotal = planMonthlyAllowance > 0
    ? planMonthlyAllowance
    : getPlanLimits(effectivePlan.plan).starterAICredits;
  // Workspaces the user can switch into. Excludes disabled memberships.
  // Skipped while impersonating - the switcher is for the actual user's
  // workspaces, not the customer's.
  const memberships = isImpersonating
    ? []
    : await prisma.businessMembership.findMany({
        where: { userId: user.id, status: "active" },
        select: {
          role: true,
          business: { select: { id: true, name: true, status: true } },
        },
        orderBy: { createdAt: "asc" },
      });
  const activeMemberships = memberships.filter((m) => m.business.status !== "suspended");
  // Per-workspace plan + credit balance so the BusinessSwitcher can
  // show a plan badge + AI credits line for every business the user
  // can switch into. The current workspace reads from billingCtx +
  // effectivePlan computed above; the rest hit their own wallet/
  // override rows. All scoped by businessId so each workspace is
  // billed and metered independently (the spec's core rule).
  const otherIds = activeMemberships.map((m) => m.business.id).filter((id) => id !== business.id);
  const [otherWallets, otherOverrides, otherSubs] = await Promise.all([
    otherIds.length
      ? prisma.aiCreditWallet.findMany({ where: { businessId: { in: otherIds } } })
      : Promise.resolve([]),
    otherIds.length
      ? prisma.adminPlanOverride.findMany({
          where: {
            businessId:    { in: otherIds },
            effectiveFrom: { lte: new Date() },
            revokedAt:     null,
            OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: new Date() } }],
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    otherIds.length
      ? prisma.subscription.findMany({
          where: { businessId: { in: otherIds }, status: { in: ["active", "trialing"] } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);
  const walletByBiz   = new Map(otherWallets.map((w) => [w.businessId, w.balance]));
  const overrideByBiz = new Map(otherOverrides.map((o) => [o.businessId, o.plan]));
  const subByBiz      = new Map(otherSubs.map((s) => [s.businessId, s.plan]));

  const workspaces = activeMemberships.map((m) => {
    const isCurrent = m.business.id === business.id;
    const plan = isCurrent
      ? effectivePlan.plan
      : (overrideByBiz.get(m.business.id) ?? subByBiz.get(m.business.id) ?? "free");
    const balance = isCurrent
      ? billingCtx.balance
      : (walletByBiz.get(m.business.id) ?? 0);
    return {
      id:        m.business.id,
      name:      m.business.name,
      role:      m.role,
      isCurrent,
      plan,
      balance,
    };
  });
  return (
    // Lock the outer container to the viewport height and make only the main
    // area scroll - the sidebar stays put no matter how long the page is.
    <NotificationCenterProvider>
    <NotifyProvider>
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Persistent impersonation banner - shown only when a super_admin
          is viewing this account as a customer. Sits above the layout so
          it's visible on every page. */}
      {isImpersonating ? (
        <ImpersonationBanner
          businessName={business.name}
          actorEmail={user.email}
          allowWrites={impersonationAllowWrites}
        />
      ) : null}
      {/* Email-verification banner - persistent (no dismiss) until the
          user clicks the link in the welcome email. Sits above the
          billing banner so the most-recent + most-actionable nudge
          is highest. Auto-disappears once `user.emailVerified` is
          stamped by the verification flow. After the 72-hour grace
          period, the banner flips to its "restricted" variant
          (stronger tone, sharper copy) to match the server-side
          gates that are now blocking uploads + AI. */}
      {!user.emailVerified ? (
        <EmailVerificationBanner
          email={user.email}
          restricted={!gracePeriodStatus(user).withinGrace}
        />
      ) : null}

      {/* Billing status - read-only banner or out-of-credits notice.
          Renders null when the workspace is healthy. */}
      <BillingStatusBanner
        readOnly={effectivePlan.readOnly}
        plan={effectivePlan.plan}
        balance={billingCtx.balance}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          businessName={business.name}
          businessId={business.id}
          logoData={business.logoData ?? null}
          alerts={alerts}
          systemRole={user.systemRole}
          workspaces={workspaces}
          billing={{
            plan:             effectivePlan.plan,
            balance:          billingCtx.balance,
            monthlyAllowance: planMonthlyAllowance,
            total:            planCreditTotal,
          }}
        />
        <main className="flex-1 min-w-0 overflow-y-auto">
          {/* pt-16 on mobile leaves room for the floating hamburger button
              (sidebar lives behind a drawer below the lg breakpoint).
              The generous bottom padding reserves clear space for the
              always-visible <GlobalConsult /> floating button so primary
              action buttons (Save profile, Continue, Import, etc.) sit
              well above it instead of crowding the same corner. The
              padding also extends with env(safe-area-inset-bottom) so
              iPhone-style home-indicator devices get extra room. */}
          <div
            style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}
            className="px-4 sm:px-6 lg:px-8 pt-16 lg:pt-8 max-w-[1400px] mx-auto"
          >
            {children}
          </div>
        </main>
      </div>
      {/* Global floating Consult button + slide-in panel. Rendered
          once at the layout level so every app screen has the AI
          advisor available without navigating away. */}
      <GlobalConsult />
      {/* Notification Center side panel - mounted here (NOT inside the
          Sidebar) so its fixed positioning is relative to the viewport,
          not the Sidebar's transform containing block. */}
      <NotificationCenterMount />
    </div>
    </NotifyProvider>
    </NotificationCenterProvider>
  );
}
