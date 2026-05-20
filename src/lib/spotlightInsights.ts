// Spotlight insights - randomly-sampled, data-driven cards shown below the
// auto-detected alerts on the /insights page. Each template fetches a slice
// of business data and returns one card (headline + body + chart spec).
// Templates that don't have enough data return null and get skipped.

import { prisma } from "./db";
import { buildMonthSnapshot, trailingMonthsSummary } from "./metrics";
import { fmtMoney, fmtPct, ymToLabel, shiftYM } from "./format";

export type SpotlightChart =
  | { kind: "categoryBars"; data: { name: string; amount: number }[] }
  | { kind: "trend"; data: { ym: string; income: number; expenses: number; net: number }[] }
  | { kind: "cashflow"; data: { ym: string; net: number }[] };

export type SpotlightInsight = {
  id: string;
  headline: string;
  body: string;
  chart: SpotlightChart;
};

type Template = (businessId: string, ym: string, ccy: string) => Promise<SpotlightInsight | null>;

const topOutcomeCategories: Template = async (businessId, ym, ccy) => {
  const snap = await buildMonthSnapshot(businessId, ym);
  const rows = Object.entries(snap.byCategory)
    .filter(([, v]) => v < 0)
    .map(([name, v]) => ({ name, amount: Math.abs(v) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  if (rows.length === 0) return null;
  const top = rows[0];
  return {
    id: "top-outcome-categories",
    headline: `Where your money went in ${ymToLabel(ym)}`,
    body: `Your top spending category was **${top.name}** at ${fmtMoney(top.amount, ccy)}. The chart shows your top ${rows.length} outcome categories for the month.`,
    chart: { kind: "categoryBars", data: rows },
  };
};

const incomeMix: Template = async (businessId, ym, ccy) => {
  const snap = await buildMonthSnapshot(businessId, ym);
  const rows = Object.entries(snap.byCategory)
    .filter(([, v]) => v > 0)
    .map(([name, v]) => ({ name, amount: v }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  if (rows.length === 0) return null;
  const total = rows.reduce((a, b) => a + b.amount, 0);
  const top = rows[0];
  const share = total > 0 ? top.amount / total : 0;
  return {
    id: "income-mix",
    headline: `Where your revenue came from in ${ymToLabel(ym)}`,
    body: `**${top.name}** brought in ${fmtMoney(top.amount, ccy)} - ${fmtPct(share)} of your revenue this month. ${rows.length === 1 ? "All your revenue came from one source - diversifying could reduce risk." : `You had ${rows.length} active revenue sources.`}`,
    chart: { kind: "categoryBars", data: rows },
  };
};

const trendIncomeExpenses: Template = async (businessId, _ym, ccy) => {
  const trail = await trailingMonthsSummary(businessId, 6);
  const filled = trail.filter((r) => r.income > 0 || r.expenses > 0);
  if (filled.length < 2) return null;
  const first = filled[0];
  const last = filled[filled.length - 1];
  const incomeDelta = first.income > 0 ? (last.income - first.income) / first.income : null;
  return {
    id: "trend-income-expenses",
    headline: "Income vs expenses, last 6 months",
    body: `Latest month: income ${fmtMoney(last.income, ccy)}, expenses ${fmtMoney(last.expenses, ccy)}, net ${fmtMoney(last.net, ccy)}. ${incomeDelta != null ? `Income is ${fmtPct(incomeDelta)} vs ${ymToLabel(first.ym)}.` : ""}`,
    chart: { kind: "trend", data: trail },
  };
};

const netCashflow: Template = async (businessId, _ym, ccy) => {
  const trail = await trailingMonthsSummary(businessId, 6);
  const filled = trail.filter((r) => r.income > 0 || r.expenses > 0);
  if (filled.length < 2) return null;
  const positive = trail.filter((r) => r.net > 0).length;
  const negative = trail.filter((r) => r.net < 0).length;
  const last = trail[trail.length - 1];
  return {
    id: "net-cashflow",
    headline: "Monthly net cash flow",
    body: `Of the last 6 months, **${positive}** were profitable and **${negative}** were in the red. ${last.net >= 0 ? `${ymToLabel(last.ym)} netted ${fmtMoney(last.net, ccy)}.` : `${ymToLabel(last.ym)} ran a deficit of ${fmtMoney(Math.abs(last.net), ccy)}.`}`,
    chart: { kind: "cashflow", data: trail.map((r) => ({ ym: r.ym, net: r.net })) },
  };
};

const topVendors: Template = async (businessId, ym, ccy) => {
  const rows = await prisma.transaction.groupBy({
    by: ["vendor"],
    where: {
      businessId,
      accountingMonth: ym,
      isExcludedFromPnl: false,
      type: { in: ["expense", "fee", "tax"] },
    },
    _sum: { amount: true },
  });
  const ranked = rows
    .filter((r) => r.vendor && r._sum.amount != null)
    .map((r) => ({ name: r.vendor as string, amount: Math.abs(r._sum.amount ?? 0) }))
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  if (ranked.length === 0) return null;
  const top = ranked[0];
  return {
    id: "top-vendors",
    headline: `Your top vendors in ${ymToLabel(ym)}`,
    body: `**${top.name}** was your largest vendor this month at ${fmtMoney(top.amount, ccy)}. The chart shows your top ${ranked.length} by spend.`,
    chart: { kind: "categoryBars", data: ranked },
  };
};

const outcomeByKind: Template = async (businessId, ym, ccy) => {
  const snap = await buildMonthSnapshot(businessId, ym);
  const rows = [
    { name: "Fixed", amount: snap.fixed },
    { name: "Variable", amount: snap.variable },
    { name: "Payroll", amount: snap.payroll },
    { name: "Fees", amount: snap.fees },
    { name: "Taxes", amount: snap.taxes },
  ].filter((r) => r.amount > 0).sort((a, b) => b.amount - a.amount);
  if (rows.length < 2) return null;
  const total = rows.reduce((a, b) => a + b.amount, 0);
  const top = rows[0];
  const share = total > 0 ? top.amount / total : 0;
  return {
    id: "outcome-by-kind",
    headline: `Your spending shape in ${ymToLabel(ym)}`,
    body: `**${top.name}** is your dominant cost type at ${fmtMoney(top.amount, ccy)} (${fmtPct(share)} of total expenses). Use this to spot whether you're heavy on fixed costs (less flexible) or variable ones (more dial-able).`,
    chart: { kind: "categoryBars", data: rows },
  };
};

const monthOverMonthTopCategory: Template = async (businessId, ym, ccy) => {
  const [cur, prev] = await Promise.all([
    buildMonthSnapshot(businessId, ym),
    buildMonthSnapshot(businessId, shiftYM(ym, -1)),
  ]);
  const categories = new Set([
    ...Object.keys(cur.byCategory),
    ...Object.keys(prev.byCategory),
  ]);
  let biggestSwing: { name: string; cur: number; prev: number; delta: number } | null = null;
  for (const c of categories) {
    const a = Math.abs(cur.byCategory[c] ?? 0);
    const b = Math.abs(prev.byCategory[c] ?? 0);
    if (a + b < 100) continue;
    const delta = a - b;
    if (biggestSwing == null || Math.abs(delta) > Math.abs(biggestSwing.delta)) {
      biggestSwing = { name: c, cur: a, prev: b, delta };
    }
  }
  if (!biggestSwing) return null;
  const direction = biggestSwing.delta >= 0 ? "rose" : "dropped";
  return {
    id: "mom-top-swing",
    headline: `Biggest category swing vs last month`,
    body: `**${biggestSwing.name}** ${direction} from ${fmtMoney(biggestSwing.prev, ccy)} to ${fmtMoney(biggestSwing.cur, ccy)} (${fmtMoney(Math.abs(biggestSwing.delta), ccy)} ${direction === "rose" ? "increase" : "decrease"}).`,
    chart: {
      kind: "categoryBars",
      data: [
        { name: ymToLabel(shiftYM(ym, -1)), amount: biggestSwing.prev },
        { name: ymToLabel(ym), amount: biggestSwing.cur },
      ],
    },
  };
};

const ALL_TEMPLATES: Template[] = [
  topOutcomeCategories,
  incomeMix,
  trendIncomeExpenses,
  netCashflow,
  topVendors,
  outcomeByKind,
  monthOverMonthTopCategory,
];

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function pickSpotlightInsights(
  businessId: string,
  ym: string,
  count = 3,
): Promise<SpotlightInsight[]> {
  const biz = await prisma.business.findUnique({ where: { id: businessId } });
  const ccy = biz?.currency ?? "USD";

  const order = shuffled(ALL_TEMPLATES);
  const out: SpotlightInsight[] = [];
  for (const template of order) {
    if (out.length >= count) break;
    try {
      const insight = await template(businessId, ym, ccy);
      if (insight) out.push(insight);
    } catch {
      // Skip templates that fail; randomness will just pick a different mix.
    }
  }
  return out;
}
