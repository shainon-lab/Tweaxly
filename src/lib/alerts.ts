import { prisma } from "./db";
import { evaluateNotificationRules } from "./notificationsEval";

export type SidebarAlertCounts = {
  transactions: number;
  insights: number;
  businessSignals: number;
};

// Cheap counts surfaced as red-! badges in the sidebar.
// Layout renders this on every navigation, so keep it lightweight.
// businessSignals counts the firing threshold rules; layered onto the
// Business Signals sidebar entry so the user notices when one of their
// notification rules has crossed its threshold.
export async function getSidebarAlerts(businessId: string): Promise<SidebarAlertCounts> {
  const [dupTxnCount, openDupGroups, triggered] = await Promise.all([
    prisma.transaction.count({
      where: { businessId, isDuplicateCandidate: true, isExcludedFromPnl: false },
    }),
    prisma.duplicateGroup.count({ where: { businessId, status: "open" } }),
    evaluateNotificationRules(businessId),
  ]);
  return {
    transactions: dupTxnCount,
    insights: openDupGroups,
    businessSignals: triggered.length,
  };
}
