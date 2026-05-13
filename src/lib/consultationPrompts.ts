// Generates dynamic "suggested consultation prompts" for the Consultation
// screen. Reads a BusinessContext snapshot and surfaces questions phrased
// around the user's actual numbers — revenue/expense swings, forecasted
// runway, payroll burden, top vendor spikes, margin shifts — so the
// suggestions feel like an executive-intelligence prompt list rather than
// a generic chatbot.

import type { BusinessContext } from "./advisor";
import { ymToLabel } from "./format";

const ALWAYS_ON_GENERAL: string[] = [
  "What should I prioritize this week to improve the business?",
  "Where am I overspending right now, and what can I cut without hurting growth?",
  "Which parts of my business are working well — and which are at risk?",
  "If you were my CFO, what would you flag for me today?",
];

function pct(curr: number, prev: number): number | null {
  if (!isFinite(curr) || !isFinite(prev) || prev <= 0) return null;
  return (curr - prev) / prev;
}

export function generateConsultationPrompts(ctx: BusinessContext): string[] {
  const prompts: string[] = [];
  const currLabel = ymToLabel(ctx.ym);

  // ── Revenue movement vs prior month
  const revChange = pct(ctx.current.income, ctx.prev.income);
  if (revChange != null) {
    const dir = revChange >= 0 ? "up" : "down";
    const magnitude = Math.abs(revChange);
    if (magnitude >= 0.1) {
      prompts.push(
        `My revenue is ${dir} ${(magnitude * 100).toFixed(0)}% in ${currLabel} vs last month — what's driving it and is it sustainable?`,
      );
    }
  }

  // ── Expense movement vs prior month
  const expChange = pct(ctx.current.expenses, ctx.prev.expenses);
  if (expChange != null && expChange >= 0.08) {
    prompts.push(
      `My expenses jumped ${(expChange * 100).toFixed(0)}% in ${currLabel}. Where exactly did the increase come from, and should I be worried?`,
    );
  }

  // ── Net / profitability swing
  const netCurr = ctx.current.income - ctx.current.expenses;
  const netPrev = ctx.prev.income - ctx.prev.expenses;
  if (netPrev !== 0 && netCurr < netPrev && netCurr < 0) {
    prompts.push(
      `${currLabel} is running at a loss. What's the fastest path back to profitability for my business?`,
    );
  } else if (netPrev > 0 && netCurr > netPrev * 1.2) {
    prompts.push(
      `Net profit improved in ${currLabel} — what should I double down on to keep this momentum?`,
    );
  }

  // ── Payroll as a share of revenue (uses 3-month averages)
  if (ctx.avgRevenue > 0) {
    const payrollRatio = ctx.avgPayroll / ctx.avgRevenue;
    if (payrollRatio >= 0.5) {
      prompts.push(
        `Payroll is ${(payrollRatio * 100).toFixed(0)}% of my revenue. Is my team too expensive for the revenue I'm generating?`,
      );
    } else if (payrollRatio > 0 && payrollRatio < 0.2 && ctx.employees.length > 0) {
      prompts.push(
        `Payroll is only ${(payrollRatio * 100).toFixed(0)}% of revenue — could I afford to hire and accelerate growth?`,
      );
    }
  }

  // ── Marketing ratio
  if (ctx.avgRevenue > 0 && ctx.marketingRatio > 0) {
    if (ctx.marketingRatio >= 0.15) {
      prompts.push(
        `I'm spending ${(ctx.marketingRatio * 100).toFixed(0)}% of revenue on marketing. Is that giving me a return — and what should I change?`,
      );
    } else if (ctx.marketingRatio < 0.03) {
      prompts.push(
        `My marketing spend is under ${(ctx.marketingRatio * 100).toFixed(1)}% of revenue. Am I under-investing in growth?`,
      );
    }
  }

  // ── Top vendor concentration
  const topVendor = ctx.topVendors[0];
  if (topVendor && ctx.current.expenses > 0) {
    const share = topVendor.amount / ctx.current.expenses;
    if (share >= 0.2) {
      prompts.push(
        `${topVendor.vendor} accounts for ${(share * 100).toFixed(0)}% of my expenses in ${currLabel}. Is there room to negotiate or switch?`,
      );
    }
  }

  // ── Forecast — runway / negative net ahead
  const negativeForecastMonths = ctx.forecast.filter((f) => f.expectedNet < 0);
  if (negativeForecastMonths.length > 0) {
    const first = negativeForecastMonths[0];
    prompts.push(
      `My forecast shows a negative month in ${ymToLabel(first.ym)}. What actions can I take now to avoid it?`,
    );
  } else if (ctx.forecast.length > 0) {
    const totalProjected = ctx.forecast.reduce((s, f) => s + f.expectedNet, 0);
    if (totalProjected > 0) {
      prompts.push(
        `My forecast looks positive for the next ${ctx.forecast.length} months. How should I deploy that surplus — reserves, hires, or growth investment?`,
      );
    }
  }

  // ── Top category concentration
  const topCat = ctx.topCategories.find((c) => c.kind !== "income");
  if (topCat && ctx.current.expenses > 0) {
    const share = topCat.amount / ctx.current.expenses;
    if (share >= 0.25) {
      prompts.push(
        `${topCat.name} is my single biggest expense in ${currLabel}. What's the most realistic way to bring it down?`,
      );
    }
  }

  // ── Data hygiene — uncategorized
  if (ctx.totalThisMonth > 0) {
    const uncatShare = ctx.uncategorizedCount / ctx.totalThisMonth;
    if (uncatShare >= 0.15) {
      prompts.push(
        `${(uncatShare * 100).toFixed(0)}% of my ${currLabel} transactions are uncategorized. How is this distorting my numbers, and where should I look first?`,
      );
    }
  }

  // ── Trailing trend stability
  if (ctx.trailing.length >= 3) {
    const incomes = ctx.trailing.map((t) => t.income).filter((v) => v > 0);
    if (incomes.length >= 3) {
      const avg = incomes.reduce((s, v) => s + v, 0) / incomes.length;
      const variance =
        incomes.reduce((s, v) => s + (v - avg) ** 2, 0) / incomes.length;
      const cv = Math.sqrt(variance) / Math.max(avg, 1);
      if (cv >= 0.3) {
        prompts.push(
          `My revenue swings a lot month to month. How do I smooth it out and make my cashflow more predictable?`,
        );
      }
    }
  }

  // Always add a couple general advisor prompts so there's never fewer
  // than ~4 visible suggestions even on a brand-new account with no
  // numbers yet. We append rather than prepend so the data-driven ones
  // show first.
  prompts.push(...ALWAYS_ON_GENERAL);

  // Dedupe while preserving order, then cap at 10.
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const p of prompts) {
    if (!seen.has(p)) {
      seen.add(p);
      unique.push(p);
      if (unique.length >= 10) break;
    }
  }
  return unique;
}
