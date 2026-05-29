// Settings → Workspaces. Lists every workspace the user is a member
// of with the actions they can take: switch, rename (account_admin),
// leave (non-owner), delete (owner only).

import PageHeader from "@/components/PageHeader";
import SettingsHelp from "@/components/SettingsHelp";
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
        title="Settings - Workspaces"
        subtitle="Workspaces under your account. Switch between them, rename, or create a new one."
        help={<SettingsHelp />}
      />
      <BusinessSettingsTabs />
      <WorkspacesClient workspaces={workspaces} currentBusinessId={business.id} />
    </>
  );
}
