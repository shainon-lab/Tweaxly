import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import GlobalConsult from "@/components/GlobalConsult";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import BillingStatusBanner from "@/components/BillingStatusBanner";
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
  const workspaces = memberships
    .filter((m) => m.business.status !== "suspended")
    .map((m) => ({
      id: m.business.id,
      name: m.business.name,
      role: m.role,
      isCurrent: m.business.id === business.id,
    }));
  return (
    // Lock the outer container to the viewport height and make only the main
    // area scroll - the sidebar stays put no matter how long the page is.
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
          }}
        />
        <main className="flex-1 min-w-0 overflow-y-auto">
          {/* pt-16 on mobile leaves room for the floating hamburger button
              (sidebar lives behind a drawer below the lg breakpoint). */}
          <div className="px-4 sm:px-6 lg:px-8 pt-16 pb-6 lg:py-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
      {/* Global floating Consult button + slide-in panel. Rendered
          once at the layout level so every app screen has the AI
          advisor available without navigating away. */}
      <GlobalConsult />
    </div>
  );
}
