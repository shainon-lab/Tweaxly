// Rule-based insight generation. Returns plain-English bullets for the CEO.
import { prisma } from "./db";
import { buildMonthSnapshot } from "./metrics";
import { buildForecast } from "./forecast";
import { fmtMoney, fmtPct, shiftYM, ymToLabel } from "./format";

export type Insight = {
  level: "info" | "good" | "warn" | "bad";
  title: string;
  detail: string;
};

export async function generateInsights(businessId: string, ym: string): Promise<Insight[]> {
  const [biz, current, prev, forecast] = await Promise.all([
    prisma.business.findUnique({ where: { id: businessId } }),
    buildMonthSnapshot(businessId, ym),
    buildMonthSnapshot(businessId, shiftYM(ym, -1)),
    buildForecast(businessId, 1),
  ]);
  const ccy = biz?.currency ?? "USD";
  const insights: Insight[] = [];

  // Revenue movement
  if (prev.income > 0) {
    const delta = (current.income - prev.income) / prev.income;
    if (delta <= -0.10) {
      insights.push({
        level: "warn",
        title: `Revenue dropped ${fmtPct(delta)} vs ${ymToLabel(shiftYM(ym, -1))}`,
        detail: `Last month: ${fmtMoney(prev.income, ccy)}, this month: ${fmtMoney(current.income, ccy)}.`,
      });
    } else if (delta >= 0.10) {
      insights.push({
        level: "good",
        title: `Revenue grew ${fmtPct(delta)} vs ${ymToLabel(shiftYM(ym, -1))}`,
        detail: `From ${fmtMoney(prev.income, ccy)} to ${fmtMoney(current.income, ccy)}.`,
      });
    }
  }

  // Marketing decreased while revenue stable
  if (prev.marketing > 0 && current.marketing < prev.marketing * 0.8 && Math.abs(current.income - prev.income) / Math.max(prev.income, 1) < 0.1) {
    insights.push({
      level: "info",
      title: "Marketing spend dropped while revenue stayed flat",
      detail: `Marketing fell from ${fmtMoney(prev.marketing, ccy)} to ${fmtMoney(current.marketing, ccy)}; revenue is roughly unchanged. Worth investigating efficiency.`,
    });
  }

  // One-time distortion
  if (current.oneTime > 0 && current.netProfit !== current.normalizedProfit) {
    insights.push({
      level: "info",
      title: "One-time items distorted this month",
      detail: `One-time costs of ${fmtMoney(current.oneTime, ccy)} reduced reported profit. Normalized profit (excluding one-time): ${fmtMoney(current.normalizedProfit, ccy)}.`,
    });
  }

  // Vendor anomaly: a single vendor's spend grew significantly month over month.
  const vendorAgg = await prisma.transaction.groupBy({
    by: ["vendor", "accountingMonth"],
    where: {
      businessId,
      accountingMonth: { in: [ym, shiftYM(ym, -1)] },
      isExcludedFromPnl: false,
      type: { in: ["expense", "fee", "tax"] },
    },
    _sum: { amount: true },
  });
  const byVendor: Record<string, { cur: number; prev: number }> = {};
  for (const row of vendorAgg) {
    if (!row.vendor) continue;
    const slot = row.accountingMonth === ym ? "cur" : "prev";
    byVendor[row.vendor] ??= { cur: 0, prev: 0 };
    byVendor[row.vendor][slot] += Math.abs(row._sum.amount ?? 0);
  }
  for (const [vendor, v] of Object.entries(byVendor)) {
    if (v.prev > 100 && v.cur > v.prev * 1.4 && v.cur - v.prev > 200) {
      insights.push({
        level: "warn",
        title: `Vendor "${vendor}" cost rose unusually`,
        detail: `Spend grew from ${fmtMoney(v.prev, ccy)} to ${fmtMoney(v.cur, ccy)} (${fmtPct((v.cur - v.prev) / v.prev)}).`,
      });
    }
  }

  // Possible duplicate transactions
  const openDups = await prisma.duplicateGroup.count({ where: { businessId, status: "open" } });
  if (openDups > 0) {
    insights.push({
      level: "warn",
      title: `${openDups} possible duplicate transaction group${openDups === 1 ? "" : "s"} detected`,
      detail: "Open the Transactions tab and look for the red ! badge — review each one and either ignore the duplicate or dismiss the alert.",
    });
  }

  // Payroll change next month
  if (forecast[0]) {
    if (forecast[0].expectedPayroll > 0 && current.payroll > 0) {
      const delta = (forecast[0].expectedPayroll - current.payroll) / current.payroll;
      if (Math.abs(delta) > 0.05) {
        insights.push({
          level: delta < 0 ? "good" : "info",
          title: `Payroll expected to ${delta < 0 ? "decrease" : "increase"} next month`,
          detail: `Forecast payroll: ${fmtMoney(forecast[0].expectedPayroll, ccy)} vs current ${fmtMoney(current.payroll, ccy)} (${fmtPct(delta)}). Driven by employee schedule + events on record.`,
        });
      }
    }
    if (forecast[0].expectedNet < 0) {
      insights.push({
        level: "bad",
        title: "Cash-flow looks negative next month",
        detail: `Expected net: ${fmtMoney(forecast[0].expectedNet, ccy)}. Add expected income or recheck recurring expenses on the Forecast page.`,
      });
    }
  }

  // Uncategorized share
  const uncategorized = await prisma.transaction.count({
    where: { businessId, accountingMonth: ym, OR: [{ categoryId: null }, { category: { name: "Uncategorized" } }] },
  });
  const total = await prisma.transaction.count({ where: { businessId, accountingMonth: ym } });
  if (total > 0 && uncategorized / total > 0.2) {
    insights.push({
      level: "info",
      title: `${uncategorized} transactions still uncategorized`,
      detail: `That's ${fmtPct(uncategorized / total)} of this month. Categorizing them sharpens every other number on this page.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      level: "good",
      title: "Nothing unusual this month",
      detail: "No significant deltas, anomalies, or open duplicates detected by the rules engine.",
    });
  }
  return insights;
}
