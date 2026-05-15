import PageHeader from "@/components/PageHeader";
import { Stat, StatGroup } from "@/components/Stat";
import DashboardPeriodPicker from "@/components/DashboardPeriodPicker";
import ExecutiveSummaryHero from "@/components/ExecutiveSummaryHero";
import { requireBusiness } from "@/lib/auth";
import { activeEmployeeCost, trailingMonthsSummary } from "@/lib/metrics";
import {
  resolveDashboardRange,
  resolveCompareRange,
  buildPeriodAggregate,
  DASHBOARD_RANGE_LABEL,
  type DashboardRange,
  type CompareMode,
} from "@/lib/period";
import {
  buildExecutiveSummary,
  timeframeForRange,
  periodLabelForHero,
} from "@/lib/executiveSummary";
import { fmtMoney, fmtMoneyWhole, fmtMoneyExact, fmtPct } from "@/lib/format";
import { prisma } from "@/lib/db";
import Link from "next/link";

const VALID_RANGES: DashboardRange[] = [
  "this_month",
  "last_month",
  "this_quarter",
  "last_quarter",
  "this_year",
  "last_year",
  "custom",
];

const VALID_COMPARES: CompareMode[] = ["none", "previous", "last_year", "two_years_ago"];

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

// Percent change between two values. Returns null when prior is 0 (no
// baseline to compare against). Sign is preserved so callers can render
// "+/−" and color it.
function pctDelta(current: number, prior: number): number | null {
  if (prior === 0) return null;
  return (current - prior) / Math.abs(prior);
}

// Gross margin delta: ((cur_margin) - (prev_margin)) / |prev_margin|.
// Used only when both periods have positive revenue.
function marginPctDelta(
  cur: { income: number; expenses: number },
  prev: { income: number; expenses: number },
): number | null {
  if (cur.income <= 0 || prev.income <= 0) return null;
  const curMargin = (cur.income - cur.expenses) / cur.income;
  const prevMargin = (prev.income - prev.expenses) / prev.income;
  if (prevMargin === 0) return null;
  return (curMargin - prevMargin) / Math.abs(prevMargin);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    start?: string;
    end?: string;
    compare?: string;
  }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;
  // Default landing view: "This year" — gives the owner a year-to-date view
  // by default. They can narrow to a month/quarter via the picker.
  const range = (VALID_RANGES.includes(sp.range as DashboardRange)
    ? (sp.range as DashboardRange)
    : "this_year") as DashboardRange;

  const compare = (VALID_COMPARES.includes(sp.compare as CompareMode)
    ? (sp.compare as CompareMode)
    : "none") as CompareMode;

  const resolved = resolveDashboardRange(range, sp.start, sp.end);
  // When the user picks an explicit comparison, use it for both the stat-tile
  // delta subtitles AND the new comparison column in the P&L breakdown. When
  // "none", fall back to the immediate-prior period so the existing subtitle
  // deltas keep working.
  const compareRange = resolveCompareRange(resolved, compare);
  const compareFromYM = compareRange ? compareRange.fromYM : resolved.prevFromYM;
  const compareToYM   = compareRange ? compareRange.toYM   : resolved.prevToYM;
  const compareLabel  = compareRange ? compareRange.label  : resolved.prevLabel;

  const [current, prev, employeeCost, trailing] = await Promise.all([
    buildPeriodAggregate(business.id, resolved.fromYM, resolved.toYM),
    buildPeriodAggregate(business.id, compareFromYM, compareToYM),
    activeEmployeeCost(business.id, resolved.toYM),
    // Pull six trailing months so the Executive Summary can talk about
    // when a trend began (e.g. "weakening since March") instead of
    // reading like a single-period snapshot.
    trailingMonthsSummary(business.id, 6, resolved.toYM),
  ]);

  const ccy = business.currency;
  const incomeDelta =
    prev.income > 0 ? (current.income - prev.income) / prev.income : null;
  const expDelta =
    prev.expenses > 0 ? (current.expenses - prev.expenses) / prev.expenses : null;
  const netDelta =
    prev.netProfit !== 0
      ? (current.netProfit - prev.netProfit) / Math.abs(prev.netProfit)
      : null;

  // Empty data is when the business has zero transactions at all
  const totalTxnCount = await prisma.transaction.count({
    where: { businessId: business.id },
  });
  const empty = totalTxnCount === 0;

  // AI-generated executive narrative. Built server-side so it lands
  // with the rest of the page. Falls back to a deterministic narrative
  // when no API key is configured or the model call errors. We skip the
  // call entirely when the business has no data — there's nothing to
  // narrate yet, and the empty-state card below covers that case.
  const summary = empty
    ? null
    : await buildExecutiveSummary({
        ccy,
        businessName: business.name,
        rangeLabel: DASHBOARD_RANGE_LABEL[range],
        periodLabel: periodLabelForHero(resolved.fromYM, resolved.toYM),
        timeframe: timeframeForRange(range),
        current,
        prev,
        trailing,
        employeeCostMonthly: employeeCost.total,
      });

  // Default custom-range start/end fed into the picker — used when user
  // switches to "custom" and we need initial values.
  const initialStart = sp.start ?? todayISODate();
  const initialEnd = sp.end ?? todayISODate();

  // Has the user explicitly chosen a comparison? When "none", we hide
  // the prior-value + percent line on every stat tile and switch each
  // tile's Learn-more copy to the generic flavor instead of the
  // comparison-flavored one.
  const comparing = compare !== "none";

  return (
    <>
      <PageHeader
        title="Executive Summary"
        subtitle={`${DASHBOARD_RANGE_LABEL[range]}: ${resolved.label} (${current.monthCount} month${current.monthCount === 1 ? "" : "s"}) — ${business.name}`}
        right={
          <DashboardPeriodPicker
            range={range}
            start={initialStart}
            end={initialEnd}
            compare={compare}
            controls="period"
          />
        }
      />

      {empty ? (
        <div className="card text-center py-12">
          <div className="text-lg font-medium">No data yet</div>
          <div className="text-sm text-slate-400 mt-1">
            Add a manual entry or bulk-upload a CSV from your bank/PayPal/Stripe to get started.
          </div>
          <div className="flex gap-2 justify-center mt-4">
            <Link href="/manual-data" className="btn-primary">
              Add data
            </Link>
            <Link href="/integration" className="btn-ghost">
              See integrations
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Summary hero — the AI-generated executive narrative is the
              primary entry point of the dashboard. Sits above the stat
              tiles so the user reads the interpretation before the
              numbers. */}
          {summary ? <ExecutiveSummaryHero summary={summary} /> : null}

          {/* Comparison control lives here — between the AI summary
              and the metrics. The summary is AI-led interpretation and
              doesn't take direction from this dropdown; the KPI tiles
              and category deltas below do. */}
          <div className="mb-4 flex items-end justify-end gap-3 flex-wrap">
            <DashboardPeriodPicker
              range={range}
              start={initialStart}
              end={initialEnd}
              compare={compare}
              controls="compare"
            />
          </div>

          {/* All Overview tiles share a single StatGroup so opening one
              Learn-more panel automatically closes any other. Comparison
              data is only rendered when the user has explicitly chosen
              a comparison; the Learn-more copy also swaps to its
              comparison-flavored variant in that case. */}
          <StatGroup>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat
              label="Revenue"
              value={fmtMoneyWhole(current.income, ccy)}
              tone="good"
              comparison={comparing ? {
                prevValue: fmtMoneyWhole(prev.income, ccy),
                pct: pctDelta(current.income, prev.income),
                upIsGood: true,
                prevLabel: `vs ${compareLabel}`,
              } : undefined}
              explain={comparing ? {
                description:
                  "The change in revenue between periods is the headline growth signal. The absolute prior value gives you the scale; the colored percentage tells you the direction. Green here = the business is bringing in more than it used to.",
                tips: [
                  "Compare against the expense change side-by-side — revenue up by 10% while expenses are up 15% means margin shrank.",
                  "A big revenue swing usually traces back to one customer or one channel. Open Insights → Top vendors / Revenue channel to find the driver.",
                ],
              } : {
                description:
                  "Total income recognized in the selected period — every Stripe payout, invoice payment, and other inbound transaction tagged as a revenue category.",
                tips: [
                  "Pick a Compare to option in the picker above to see how this period stacks against another.",
                  "Concentration in a small number of customers is the most common quiet risk — keep an eye on the top vendor / channel split in Insights.",
                  "Use Forecast to project where this line is heading over the next 3-12 months.",
                ],
              }}
            />
            <Stat
              label="Expenses"
              value={fmtMoneyWhole(current.expenses, ccy)}
              tone="bad"
              comparison={comparing ? {
                prevValue: fmtMoneyWhole(prev.expenses, ccy),
                pct: pctDelta(current.expenses, prev.expenses),
                upIsGood: false,
                prevLabel: `vs ${compareLabel}`,
              } : undefined}
              explain={comparing ? {
                description:
                  "Change in total outflow between periods. Green = expenses are down; red = they grew. Compare with the revenue tile — costs growing faster than revenue is the warning sign.",
                tips: [
                  "If expenses grew, open Insights → Top expense categories to see which specific line drove the increase.",
                  "Watch one-time costs separately (their own tile) — a big one-time hit can make this number look worse than the steady state.",
                ],
              } : {
                description:
                  "Sum of every outflow — payroll, rent, software, marketing, fees, taxes, one-time costs. Down is good. Up needs a why.",
                tips: [
                  "Strip one-time costs (the dedicated tile) to see the recurring base — that's your monthly floor.",
                  "Concentrated cost (one category > 30% of total) is where 10% efficiency moves the P&L the most.",
                  "Pick a Compare to option above to see whether this period's spend is in line with history.",
                ],
              }}
            />
            <Stat
              label="Net profit"
              value={fmtMoneyWhole(current.netProfit, ccy)}
              tone={current.netProfit >= 0 ? "good" : "bad"}
              comparison={comparing ? {
                prevValue: fmtMoneyWhole(prev.netProfit, ccy),
                pct: pctDelta(current.netProfit, prev.netProfit),
                upIsGood: true,
                prevLabel: `vs ${compareLabel}`,
              } : undefined}
              explain={comparing ? {
                description:
                  "Change in bottom-line profit between periods. This is the single most important number on the page — did the business actually keep more cash than before?",
                tips: [
                  "A big swing here without a matching revenue swing usually means one-time items hit on either side. Check the Normalized profit tile.",
                  "Net profit growth that lags revenue growth means margin is shrinking. Open Gross margin's Learn-more for the diagnosis.",
                ],
              } : {
                description:
                  "Revenue minus every expense for the period. Positive = the business produced more cash than it consumed; negative = it lost ground that month/quarter/year.",
                tips: [
                  "One bad month is noise; three in a row is a trend.",
                  "Below break-even? Use the Forecast tab to model a path back into the black with hires, cuts, and revenue moves.",
                  "Healthy SMB net margin sits in the 10–20%+ band — see Gross margin for that ratio.",
                ],
              }}
            />
            <Stat
              label="Normalized profit"
              value={fmtMoneyWhole(current.normalizedProfit, ccy)}
              comparison={comparing ? {
                prevValue: fmtMoneyWhole(prev.normalizedProfit, ccy),
                pct: pctDelta(current.normalizedProfit, prev.normalizedProfit),
                upIsGood: true,
                prevLabel: `vs ${compareLabel}`,
              } : undefined}
              explain={comparing ? {
                description:
                  "Comparing normalized profit isolates the operating engine — a clean read on whether the recurring business actually improved versus the prior period, free of one-time noise on either side.",
                tips: [
                  "If raw Net profit changed dramatically but Normalized profit barely moved, the swing is one-time, not structural.",
                  "Use this number as the base for next-period budgeting — it's the closest thing to your run-rate profit.",
                ],
              } : {
                description:
                  "Net profit with one-time / non-recurring expenses added back. This is the cleaner read of the operating engine — what the business would earn if no unusual costs hit the period.",
                tips: [
                  "Use this number for trend reading; use raw net profit for the period's actual cash impact.",
                  "If Normalized profit is healthy but raw Net profit is weak, the gap is the one-time hit — find it in Insights → Top expense categories.",
                ],
              }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat
              label="Fixed expenses"
              value={fmtMoneyWhole(current.fixed, ccy)}
              comparison={comparing ? {
                prevValue: fmtMoneyWhole(prev.fixed, ccy),
                pct: pctDelta(current.fixed, prev.fixed),
                upIsGood: false,
                prevLabel: `vs ${compareLabel}`,
              } : undefined}
              explain={comparing ? {
                description:
                  "Change in baseline overhead — rent, insurance, subscriptions. Fixed costs should grow slowly and deliberately; a sharp uptick usually means a new long-term commitment landed in the period.",
                tips: [
                  "Big jump? Trace it to a specific contract — a new lease, software upgrade, or insurance renewal.",
                  "Fixed-cost growth permanently raises your monthly break-even, so any increase needs a matching revenue plan.",
                ],
              } : {
                description:
                  "Costs that don't move with sales volume — rent, insurance, subscriptions you'd pay even on a zero-revenue month. These set the floor on what the business has to cover.",
                tips: [
                  "Watch the ratio of Fixed to Variable: heavy fixed = less flex in a slow quarter.",
                  "Renegotiate or convert to variable/usage-based contracts to lower this without cutting capability.",
                ],
              }}
            />
            <Stat
              label="Variable expenses"
              value={fmtMoneyWhole(current.variable, ccy)}
              comparison={comparing ? {
                prevValue: fmtMoneyWhole(prev.variable, ccy),
                pct: pctDelta(current.variable, prev.variable),
                upIsGood: false,
                prevLabel: `vs ${compareLabel}`,
              } : undefined}
              explain={comparing ? {
                description:
                  "Variable costs should scale with revenue. The percentage change here only makes sense alongside the Revenue change — if variable went up 20% and revenue went up 5%, you're losing efficiency per dollar.",
                tips: [
                  "Healthy: variable cost % growth ≤ revenue % growth.",
                  "Compare each variable category individually in Insights → Spending shape to find the inefficient ones.",
                ],
              } : {
                description:
                  "Costs that scale with activity — contractors, marketing campaigns, raw materials, transaction fees, anything that grows when the business does.",
                tips: [
                  "Variable costs are easier to dial down in a slow period — they're your shock absorber.",
                  "If they're growing faster than revenue, you're losing efficiency per dollar of sales.",
                ],
              }}
            />
            <Stat
              label="Payroll (txns + roster)"
              value={fmtMoneyWhole(
                Math.max(current.payroll, employeeCost.recurring),
                ccy,
              )}
              comparison={comparing ? {
                prevValue: fmtMoneyWhole(prev.payroll, ccy),
                pct: pctDelta(current.payroll, prev.payroll),
                upIsGood: false,
                prevLabel: `vs ${compareLabel}`,
              } : undefined}
              explain={comparing ? {
                description:
                  "Period-over-period payroll change captures hires, raises, terminations, and bonus payouts. Pair with the revenue change — payroll growing faster than revenue is the most common SMB cash trap.",
                tips: [
                  "Use Workforce Overview to see which months added or shed headcount.",
                  "If payroll grew >15% versus the compared period, there's at least one structural change worth understanding.",
                ],
              } : {
                description:
                  "Total fully-loaded compensation cost — salaries plus employer taxes, pension, benefits, and any extras. We use the larger of the booked payroll transactions and the roster-computed cost so missing payroll uploads don't understate it.",
                tips: [
                  "Healthy payroll-to-revenue ratio sits under 50%; below 35% is comfortable, above 50% is risky.",
                  "Use Workforce Overview to see per-employee cost and model the impact of one more hire.",
                ],
              }}
            />
            <Stat
              label="Marketing"
              value={fmtMoneyWhole(current.marketing, ccy)}
              comparison={comparing ? {
                prevValue: fmtMoneyWhole(prev.marketing, ccy),
                pct: pctDelta(current.marketing, prev.marketing),
                upIsGood: false,
                prevLabel: `vs ${compareLabel}`,
              } : undefined}
              explain={comparing ? {
                description:
                  "Change in marketing spend versus the compared period. Pair with the Revenue change to gauge marketing efficiency: revenue rose with less spend = you got more efficient.",
                tips: [
                  "Cutting marketing improves the P&L immediately but the revenue hit lags 60–90 days. Watch the next period.",
                  "If marketing rose but revenue didn't, the campaigns probably aren't paying back yet — model timing in Forecast.",
                ],
              } : {
                description:
                  "Spend in any category tagged for marketing or advertising — Google/Meta/LinkedIn ads, agencies, content writers, sponsorships, events.",
                tips: [
                  "Most growth-stage SMBs run 10–20% of revenue on marketing. Above 25% is aggressive — confirm payback and CAC trend.",
                  "Cutting marketing improves the P&L immediately but the revenue hit lags 60–90 days, so model the trade-off in Forecast first.",
                ],
              }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat
              label="Processing fees"
              value={fmtMoneyWhole(current.fees, ccy)}
              comparison={comparing ? {
                prevValue: fmtMoneyWhole(prev.fees, ccy),
                pct: pctDelta(current.fees, prev.fees),
                upIsGood: false,
                prevLabel: `vs ${compareLabel}`,
              } : undefined}
              explain={comparing ? {
                description:
                  "Fee changes should roughly track revenue changes (they're proportional). If fees grew faster than revenue, your effective rate is creeping up — time to renegotiate.",
                tips: [
                  "Divide the period's fees by revenue — if that ratio rose, the cost of taking each dollar of revenue went up.",
                  "Most processors will negotiate at $100k/year in volume. Bring usage numbers to the call.",
                ],
              } : {
                description:
                  "Payment processor and bank fees — Stripe, PayPal, card networks, ACH, wires. Typically 2-3% of revenue for SMBs taking online payments.",
                tips: [
                  "Above 3.5% of revenue means it's worth shopping rates with a different processor.",
                  "Mostly invisible because they're skimmed off the top — surface them here so they don't quietly grow.",
                ],
              }}
            />
            <Stat
              label="Taxes"
              value={fmtMoneyWhole(current.taxes, ccy)}
              comparison={comparing ? {
                prevValue: fmtMoneyWhole(prev.taxes, ccy),
                pct: pctDelta(current.taxes, prev.taxes),
                upIsGood: false,
                prevLabel: `vs ${compareLabel}`,
              } : undefined}
              explain={comparing ? {
                description:
                  "Tax payments lag revenue by roughly a quarter, so a change here usually reflects the prior period's activity, not the current one. Don't read it as a same-period efficiency signal.",
                tips: [
                  "If taxes spiked, look at the period two months back — that's usually what's being settled now.",
                  "Wild swings often mean a missing reconciliation — make sure the tax category was tagged correctly on imports.",
                ],
              } : {
                description:
                  "Quarterly estimates, sales tax remittances, payroll taxes, and any other tax payments inside the period.",
                tips: [
                  "Taxes lag revenue by a quarter — a big revenue quarter often shows up here a couple of months later.",
                  "If this number swings wildly, double-check that bookkeeping reconciled the right tax category before the next forecast.",
                ],
              }}
            />
            <Stat
              label="One-time costs"
              value={fmtMoneyWhole(current.oneTime, ccy)}
              tone={current.oneTime > 0 ? "warn" : "default"}
              comparison={comparing ? {
                prevValue: fmtMoneyWhole(prev.oneTime, ccy),
                pct: pctDelta(current.oneTime, prev.oneTime),
                upIsGood: false,
                prevLabel: `vs ${compareLabel}`,
              } : undefined}
              explain={comparing ? {
                description:
                  "One-time costs vary wildly between periods — a big swing here is normal. The number to watch is the recurring base (Normalized profit), not this line.",
                tips: [
                  "Use this tile's percent change to explain a confusing Net profit move — if both moved together, the swing was one-time.",
                  "If neither period had one-times, you'll see —; that's the cleanest read of recurring health.",
                ],
              } : {
                description:
                  "Costs flagged as non-recurring — equipment purchases, legal fees, severance, audits, etc. These distort the period's net profit because they won't repeat.",
                tips: [
                  "Strip these out to read the run-rate — that's what Normalized profit shows.",
                  "If one-time costs are >15% of total expenses, the period's headline numbers don't reflect the steady state.",
                ],
              }}
            />
            <Stat
              label="Gross margin"
              value={
                current.income > 0
                  ? fmtPct((current.income - current.expenses) / current.income)
                  : "—"
              }
              comparison={
                comparing && current.income > 0 && prev.income > 0
                  ? {
                      prevValue: fmtPct((prev.income - prev.expenses) / prev.income),
                      pct: marginPctDelta(current, prev),
                      upIsGood: true,
                      prevLabel: `vs ${compareLabel}`,
                    }
                  : undefined
              }
              explain={comparing ? {
                description:
                  "Margin change is the single best efficiency signal. Up = the business kept more of each dollar than before; down = costs grew faster than revenue.",
                tips: [
                  "Margin can rise even when revenue falls — that means costs fell faster. Look at the Expenses tile to confirm.",
                  "A small margin drop on a big revenue jump is usually an OK trade — you bought growth.",
                ],
              } : {
                description:
                  "Net profit as a percentage of revenue. Tells you how much of every dollar earned actually stays with the business.",
                tips: [
                  "Healthy SMB margins typically sit in the 10–20% band; sub-10% is workable but thin; above 30% is excellent.",
                  "Falling margin while revenue grows means costs are growing faster than sales — surface where in the Insights → Spending shape chart.",
                ],
              }}
            />
          </div>
          </StatGroup>

        </>
      )}
    </>
  );
}

// Always-visible P&L breakdown for the selected period: Total revenue at the
// top, every outcome category beneath, then Net profit. Works for month /
// quarter / year / custom ranges because it reads from the same period
// aggregate already used for the stat tiles and charts above.
function PnlBreakdown({
  label,
  byCategory,
  currency,
  compareLabel,
  compareByCategory,
}: {
  label: string;
  byCategory: Record<string, number>;
  currency: string;
  compareLabel?: string | null;
  compareByCategory?: Record<string, number> | null;
}) {
  const compareOn = !!compareByCategory;

  // Split a byCategory map into income / outcome row arrays + totals.
  function split(map: Record<string, number>) {
    const income: { name: string; amount: number }[] = [];
    const outcome: { name: string; amount: number }[] = [];
    for (const [name, signed] of Object.entries(map)) {
      if (signed > 0) income.push({ name, amount: signed });
      else if (signed < 0) outcome.push({ name, amount: -signed });
    }
    income.sort((a, b) => b.amount - a.amount);
    outcome.sort((a, b) => b.amount - a.amount);
    const totalRevenue = income.reduce((a, b) => a + b.amount, 0);
    const totalOutcome = outcome.reduce((a, b) => a + b.amount, 0);
    const netProfit = totalRevenue - totalOutcome;
    return { income, outcome, totalRevenue, totalOutcome, netProfit };
  }

  const cur = split(byCategory);
  const cmp = compareByCategory ? split(compareByCategory) : null;

  // Union of category names, sorted by current outcome desc (or compare's
  // outcome if current has zero) — keeps the table consistent across periods.
  const incomeNames = Array.from(new Set([
    ...cur.income.map((r) => r.name),
    ...(cmp ? cmp.income.map((r) => r.name) : []),
  ]));
  const outcomeNames = Array.from(new Set([
    ...cur.outcome.map((r) => r.name),
    ...(cmp ? cmp.outcome.map((r) => r.name) : []),
  ]));
  function lookup(rows: { name: string; amount: number }[], name: string) {
    return rows.find((r) => r.name === name)?.amount ?? 0;
  }
  // Sort by max(current, compare) magnitude so the biggest movers stay at the top.
  outcomeNames.sort((a, b) => {
    const aMax = Math.max(lookup(cur.outcome, a), cmp ? lookup(cmp.outcome, a) : 0);
    const bMax = Math.max(lookup(cur.outcome, b), cmp ? lookup(cmp.outcome, b) : 0);
    return bMax - aMax;
  });
  incomeNames.sort((a, b) => {
    const aMax = Math.max(lookup(cur.income, a), cmp ? lookup(cmp.income, a) : 0);
    const bMax = Math.max(lookup(cur.income, b), cmp ? lookup(cmp.income, b) : 0);
    return bMax - aMax;
  });

  const margin = cur.totalRevenue > 0 ? cur.netProfit / cur.totalRevenue : null;

  function deltaText(curVal: number, prevVal: number, isOutcome: boolean): React.ReactNode {
    if (!cmp) return null;
    if (curVal === 0 && prevVal === 0) return null;
    const diff = curVal - prevVal;
    const pct = prevVal !== 0 ? diff / Math.abs(prevVal) : null;
    // For outcomes: an INCREASE is bad. For revenue/net: an INCREASE is good.
    const goodWhen: "up" | "down" = isOutcome ? "down" : "up";
    const isGood = (goodWhen === "up" && diff > 0) || (goodWhen === "down" && diff < 0);
    const cls =
      diff === 0       ? "text-slate-500" :
      isGood           ? "text-good"      :
                         "text-bad";
    const sign = diff > 0 ? "+" : diff < 0 ? "−" : "";
    return (
      <span className={`text-[11px] ml-1 ${cls}`}>
        {pct != null ? `${sign}${Math.abs(pct * 100).toFixed(1)}%` : `${sign}${fmtMoney(Math.abs(diff), currency)}`}
      </span>
    );
  }

  if (cur.income.length === 0 && cur.outcome.length === 0 && (!cmp || (cmp.income.length === 0 && cmp.outcome.length === 0))) {
    return (
      <div className="card">
        <div className="font-medium mb-2">P&amp;L breakdown — {label}</div>
        <div className="text-sm text-slate-400 py-8 text-center">
          No categorized activity for this period yet.{" "}
          <Link className="text-accent" href="/transactions">
            Categorize transactions
          </Link>
          .
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <div className="font-medium">
          P&amp;L breakdown — {label}
          {compareOn ? (
            <span className="text-slate-400 font-normal ml-2 text-xs">
              vs <span className="text-slate-200">{compareLabel}</span>
            </span>
          ) : null}
        </div>
        <div className="text-xs text-slate-400">
          {cur.income.length === 0
            ? "No revenue recorded"
            : cur.income.length === 1
              ? "1 revenue source"
              : `${cur.income.length} revenue sources`}
          {" · "}
          {cur.outcome.length === 0
            ? "no outcomes"
            : cur.outcome.length === 1
              ? "1 outcome category"
              : `${cur.outcome.length} outcome categories`}
        </div>
      </div>
      <table className="table-base">
        <thead>
          <tr>
            <th className="!normal-case !text-sm !text-slate-500 !font-medium">Line</th>
            <th className="!normal-case !text-sm !text-slate-100 !font-semibold text-right whitespace-nowrap">
              {label}
            </th>
            {compareOn ? (
              <th className="!normal-case !text-sm !text-slate-100 !font-semibold text-right whitespace-nowrap">
                {compareLabel}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {/* Revenue total */}
          <tr>
            <td className="font-medium text-slate-100">Revenue</td>
            <td className="text-right font-medium text-good whitespace-nowrap">
              +{fmtMoneyExact(cur.totalRevenue, currency)}
              {deltaText(cur.totalRevenue, cmp?.totalRevenue ?? 0, false)}
            </td>
            {compareOn ? (
              <td className="text-right text-slate-300 whitespace-nowrap">
                +{fmtMoneyExact(cmp!.totalRevenue, currency)}
              </td>
            ) : null}
          </tr>
          {incomeNames.length > 1
            ? incomeNames.map((name) => {
                const curAmt = lookup(cur.income, name);
                const prevAmt = cmp ? lookup(cmp.income, name) : 0;
                return (
                  <tr key={`inc-${name}`} className="text-slate-400">
                    <td className="pl-6">{name}</td>
                    <td className="text-right whitespace-nowrap">
                      {curAmt > 0 ? `+${fmtMoneyExact(curAmt, currency)}` : "—"}
                      {deltaText(curAmt, prevAmt, false)}
                    </td>
                    {compareOn ? (
                      <td className="text-right whitespace-nowrap">
                        {prevAmt > 0 ? `+${fmtMoneyExact(prevAmt, currency)}` : "—"}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            : null}

          {/* Outcomes */}
          <tr>
            <td className="pt-4 text-xs uppercase tracking-wide text-slate-500">
              Outcomes
            </td>
            <td></td>
            {compareOn ? <td></td> : null}
          </tr>
          {outcomeNames.map((name) => {
            const curAmt = lookup(cur.outcome, name);
            const prevAmt = cmp ? lookup(cmp.outcome, name) : 0;
            return (
              <tr key={`out-${name}`}>
                <td className="pl-6 text-slate-200">{name}</td>
                <td className="text-right text-bad whitespace-nowrap">
                  {curAmt > 0 ? `−${fmtMoneyExact(curAmt, currency)}` : "—"}
                  {deltaText(curAmt, prevAmt, true)}
                </td>
                {compareOn ? (
                  <td className="text-right text-slate-300 whitespace-nowrap">
                    {prevAmt > 0 ? `−${fmtMoneyExact(prevAmt, currency)}` : "—"}
                  </td>
                ) : null}
              </tr>
            );
          })}
          <tr className="border-t border-line">
            <td className="font-medium text-slate-200">Total outcome</td>
            <td className="text-right font-medium text-bad whitespace-nowrap">
              −{fmtMoneyExact(cur.totalOutcome, currency)}
              {deltaText(cur.totalOutcome, cmp?.totalOutcome ?? 0, true)}
            </td>
            {compareOn ? (
              <td className="text-right text-slate-300 whitespace-nowrap">
                −{fmtMoneyExact(cmp!.totalOutcome, currency)}
              </td>
            ) : null}
          </tr>

          {/* Net profit */}
          <tr className="border-t border-line">
            <td className="font-semibold text-slate-100">Net profit</td>
            <td
              className={`text-right font-semibold whitespace-nowrap ${
                cur.netProfit >= 0 ? "text-good" : "text-bad"
              }`}
            >
              {cur.netProfit >= 0 ? "+" : "−"}
              {fmtMoneyExact(Math.abs(cur.netProfit), currency)}
              {margin != null ? (
                <span className="text-xs text-slate-400 ml-2">
                  ({fmtPct(margin)} margin)
                </span>
              ) : null}
              {deltaText(cur.netProfit, cmp?.netProfit ?? 0, false)}
            </td>
            {compareOn ? (
              <td
                className={`text-right text-slate-300 whitespace-nowrap`}
              >
                {cmp!.netProfit >= 0 ? "+" : "−"}
                {fmtMoneyExact(Math.abs(cmp!.netProfit), currency)}
              </td>
            ) : null}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
