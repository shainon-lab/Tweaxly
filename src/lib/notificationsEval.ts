// Threshold-alert evaluator. For each enabled NotificationRule on a business,
// compute the chosen metric over the current and previous period, decide
// whether the rule fires, and return one TriggeredAlert per match.
//
// "Period" anchors to the latest month with data, NOT today's calendar month
// — so a rule keeps firing against the user's most recent data even if a
// month or two has gone by without uploads.

import { prisma } from "./db";
import { listAccountingMonths } from "./metrics";
import { buildPeriodAggregate } from "./period";
import { shiftYM, todayYM, fmtMoney, fmtPct, ymToLabel } from "./format";

export type TriggeredAlert = {
  ruleId: string;
  level: "warn" | "bad" | "good" | "info";
  headline: string;
  detail: string;
  firstFiredAt: Date | null;
  acknowledgedAt: Date | null;
};

type Rule = {
  id: string;
  metric: string;
  categoryId: string | null;
  categoryName: string | null;
  direction: string;
  thresholdType: string;
  thresholdValue: number;
  period: string;
  label: string | null;
  enabled: boolean;
};

function periodMonthCount(period: string): number {
  if (period === "quarter") return 3;
  if (period === "year") return 12;
  return 1;
}

function metricValue(
  agg: Awaited<ReturnType<typeof buildPeriodAggregate>>,
  rule: Rule,
): number {
  switch (rule.metric) {
    case "revenue":  return agg.income;
    case "expenses": return agg.expenses;
    case "net":      return agg.netProfit;
    case "category":
      if (!rule.categoryName) return 0;
      // byCategory is signed (revenue positive, outcome negative). For
      // category alerts, we look at the magnitude of activity in that bucket.
      return Math.abs(agg.byCategory[rule.categoryName] ?? 0);
    default: return 0;
  }
}

function describeMetric(rule: Rule): string {
  switch (rule.metric) {
    case "revenue":  return "Revenue";
    case "expenses": return "Expenses";
    case "net":      return "Net profit";
    case "category": return rule.categoryName ?? "Category";
    default: return rule.metric;
  }
}

export async function evaluateNotificationRules(
  businessId: string,
): Promise<TriggeredAlert[]> {
  const [biz, rules, months] = await Promise.all([
    prisma.business.findUnique({ where: { id: businessId } }),
    prisma.notificationRule.findMany({
      where: { businessId, enabled: true },
      include: { category: true },
    }),
    listAccountingMonths(businessId),
  ]);
  if (rules.length === 0) return [];

  const ccy = biz?.currency ?? "USD";
  const anchor = months[0] ?? todayYM();

  const triggered: TriggeredAlert[] = [];

  for (const r of rules) {
    const span = periodMonthCount(r.period);
    const curTo = anchor;
    const curFrom = shiftYM(anchor, -(span - 1));
    const prevTo = shiftYM(curFrom, -1);
    const prevFrom = shiftYM(prevTo, -(span - 1));

    const [cur, prev] = await Promise.all([
      buildPeriodAggregate(businessId, curFrom, curTo),
      buildPeriodAggregate(businessId, prevFrom, prevTo),
    ]);

    const rule: Rule = {
      id: r.id,
      metric: r.metric,
      categoryId: r.categoryId,
      categoryName: r.category?.name ?? null,
      direction: r.direction,
      thresholdType: r.thresholdType,
      thresholdValue: r.thresholdValue,
      period: r.period,
      label: r.label,
      enabled: r.enabled,
    };

    const curVal = metricValue(cur, rule);
    const prevVal = metricValue(prev, rule);
    const delta = curVal - prevVal;
    const deltaPct = prevVal !== 0 ? delta / Math.abs(prevVal) : null;

    let fired = false;
    let movedAmount = "";
    if (rule.thresholdType === "percent") {
      if (deltaPct == null) continue; // no baseline to compare against
      if (rule.direction === "increase" && deltaPct * 100 >= rule.thresholdValue) fired = true;
      if (rule.direction === "decrease" && -deltaPct * 100 >= rule.thresholdValue) fired = true;
      movedAmount = fmtPct(deltaPct);
    } else {
      // amount
      if (rule.direction === "increase" && delta >= rule.thresholdValue) fired = true;
      if (rule.direction === "decrease" && -delta >= rule.thresholdValue) fired = true;
      movedAmount = `${delta >= 0 ? "+" : "−"}${fmtMoney(Math.abs(delta), ccy)}`;
    }

    if (!fired) continue;

    const subject = describeMetric(rule);
    const periodLabel =
      span === 1 ? `${ymToLabel(curFrom)}` :
      `${ymToLabel(curFrom)} → ${ymToLabel(curTo)}`;
    const prevLabel =
      span === 1 ? `${ymToLabel(prevFrom)}` :
      `${ymToLabel(prevFrom)} → ${ymToLabel(prevTo)}`;
    const direction = rule.direction === "increase" ? "rose" : "fell";

    const headline = rule.label
      ? rule.label
      : `${subject} ${direction} by ${movedAmount.replace(/^[+−]/, "")} (${rule.period} over ${rule.period})`;
    const detail =
      `${periodLabel}: ${fmtMoney(curVal, ccy)} · ${prevLabel}: ${fmtMoney(prevVal, ccy)} · change: ${movedAmount}.`;

    triggered.push({
      ruleId: r.id,
      level: rule.direction === "decrease" && rule.metric !== "expenses" ? "bad" :
             rule.direction === "increase" && rule.metric === "expenses" ? "warn" :
             rule.direction === "increase" && rule.metric === "revenue" ? "good" :
             "info",
      headline,
      detail,
      firstFiredAt: r.firstFiredAt,
      acknowledgedAt: r.acknowledgedAt,
    });
  }

  return triggered;
}

// Variant used by the Alerts page (write path). Same evaluation but also:
//   - stamps firstFiredAt on rules that are currently firing without a
//     timestamp (so the Alerts UI can say "appeared X ago").
//   - clears firstFiredAt + acknowledgedAt on rules that have stopped
//     firing — if the alert ever fires again it gets a fresh "appeared"
//     timestamp and a fresh chance to be marked-as-read.
// Side effects are confined to this function so read-only consumers (the
// sidebar badge, the dashboard mini-card) don't accidentally mutate state.
export async function evaluateAndStampNotificationRules(
  businessId: string,
): Promise<TriggeredAlert[]> {
  const triggered = await evaluateNotificationRules(businessId);
  const firingIds = new Set(triggered.map((t) => t.ruleId));
  const now = new Date();

  // 1. Stamp firstFiredAt on currently-firing rules that have none.
  const needsStamp = triggered.filter((t) => t.firstFiredAt == null);
  if (needsStamp.length > 0) {
    await prisma.notificationRule.updateMany({
      where: { businessId, id: { in: needsStamp.map((t) => t.ruleId) } },
      data: { firstFiredAt: now },
    });
    // Reflect on the returned alerts so the UI shows the new timestamp.
    for (const t of triggered) {
      if (t.firstFiredAt == null) t.firstFiredAt = now;
    }
  }

  // 2. Clear stamps on rules that have a firstFiredAt but no longer fire.
  //    Acknowledged "Previous" notifications go away here — which matches
  //    the user's expectation that a rule that stopped firing is no longer
  //    in the Alerts view.
  await prisma.notificationRule.updateMany({
    where: {
      businessId,
      firstFiredAt: { not: null },
      id: { notIn: triggered.map((t) => t.ruleId) },
    },
    data: { firstFiredAt: null, acknowledgedAt: null },
  });
  void firingIds;

  return triggered;
}
