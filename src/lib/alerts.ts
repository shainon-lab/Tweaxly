import { prisma } from "./db";

export type SidebarAlertCounts = { transactions: number; insights: number };

// Cheap counts surfaced as red-! badges in the sidebar.
// Layout renders this on every navigation, so keep it lightweight.
export async function getSidebarAlerts(businessId: string): Promise<SidebarAlertCounts> {
  const [dupTxnCount, openDupGroups] = await Promise.all([
    prisma.transaction.count({
      where: { businessId, isDuplicateCandidate: true, isExcludedFromPnl: false },
    }),
    prisma.duplicateGroup.count({ where: { businessId, status: "open" } }),
  ]);
  return {
    transactions: dupTxnCount,
    insights: openDupGroups,
  };
}
