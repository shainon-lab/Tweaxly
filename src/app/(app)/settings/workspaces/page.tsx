// Settings → Workspaces. Lists every workspace the user is a member
// of with the actions they can take: switch, rename (account_admin),
// leave (non-owner), delete (owner only).

import PageHeader from "@/components/PageHeader";
import HowItWorks from "@/components/HowItWorks";
import { Building2, Plus, ArrowLeftRight } from "lucide-react";
import BusinessSettingsTabs from "@/components/BusinessSettingsTabs";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WorkspacesClient } from "./WorkspacesClient";

export const dynamic = "force-dynamic";

export default async function WorkspacesPage() {
  const { user, business } = await requireBusiness();

  const memberships = await prisma.businessMembership.findMany({
    where: { userId: user.id, status: "active" },
    select: {
      id: true,
      role: true,
      joinedAt: true,
      business: {
        select: {
          id: true,
          name: true,
          plan: true,
          status: true,
          createdAt: true,
          ownerId: true,
          _count: { select: { memberships: true, transactions: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const workspaces = memberships.map((m) => ({
    membershipId: m.id,
    role: m.role,
    joinedAt: m.joinedAt ? m.joinedAt.toISOString() : null,
    business: {
      id: m.business.id,
      name: m.business.name,
      plan: m.business.plan,
      status: m.business.status,
      createdAt: m.business.createdAt.toISOString(),
      isOwner: m.business.ownerId === user.id,
      memberCount: m.business._count.memberships,
      transactionCount: m.business._count.transactions,
    },
    isCurrent: m.business.id === business.id,
  }));

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Workspaces under your account. Switch between them, rename, or create a new one."
        help={
          <HowItWorks
            title="How workspaces work"
            intro="Every workspace is a self-contained business - its own subscription, its own AI Credits, its own team, its own data. You can own as many as you need (one per business, or one per client if you're a consultant) and switch between them at any time."
            cards={[
              { icon: <Building2 size={16} strokeWidth={1.7} />,      title: "Independent",  body: "Plans, AI Credits, members, integrations - everything is workspace-scoped. Upgrading workspace A to Pro doesn't change workspace B's plan or credit balance." },
              { icon: <Plus size={16} strokeWidth={1.7} />,           title: "Create more",  body: "Start a new workspace for a new business, side project, or client. Each one gets its own Free plan, 30 starter AI Credits, and the same setup wizard." },
              { icon: <ArrowLeftRight size={16} strokeWidth={1.7} />, title: "Switch fast", body: "The workspace switcher in the sidebar lets you flip between workspaces with one click. The whole app re-scopes - dashboards, signals, forecasts, everything is now in the new workspace's context." },
            ]}
            outro="The same person can be Owner in one workspace, Admin in another, and Viewer in a third. Roles are workspace-scoped, not account-scoped."
          />
        }
      />
      <BusinessSettingsTabs />
      <WorkspacesClient workspaces={workspaces} currentBusinessId={business.id} />
    </>
  );
}
