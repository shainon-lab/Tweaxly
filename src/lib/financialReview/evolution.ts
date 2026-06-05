import { z } from "zod";
import type { NormalizedFinancials } from "./types";

// ── V2 Business Evolution ────────────────────────────────────────
// Types + the deterministic multi-year trend engine. The metric cards
// (CAGR, trends, growth) are pure math from the per-year financials and
// are computed on the fly. The AI narrative (story, timeline, DNA,
// strategic recs) is generated separately and cached.

// One financial year's data point in the series.
export interface YearPoint {
  year:       number;
  score:      number | null;
  financials: NormalizedFinancials;
}

export type MetricTone = "good" | "bad" | "warn" | "neutral";

export interface MetricCard {
  key:    string;
  label:  string;
  value:  string;
  detail?: string;
  tone:   MetricTone;
}

export interface EvolutionMetrics {
  years:  number[];
  series: YearPoint[];
  cards:  MetricCard[];
}

// ── AI narrative result (cached) ──
const Confidence = z.enum(["high", "medium", "low"]);
const EvoLine = z.object({ outlook: z.string(), confidence: Confidence });

export const EvolutionResultSchema = z.object({
  businessStory: z.string(),
  timeline: z
    .array(z.object({ period: z.string(), phase: z.string(), description: z.string() }))
    .default([]),
  trendAnalysis: z.object({
    strongestPositive: z.string(),
    strongestNegative: z.string(),
    largestChange:     z.string(),
    largestRisk:       z.string(),
    mostImproved:      z.string(),
  }),
  evolutionForecast: z.object({
    revenue:       EvoLine,
    profitability: EvoLine,
    cashFlow:      EvoLine,
    risk:          EvoLine,
  }),
  dna: z.object({
    growthOrientation:     z.number().min(0).max(10),
    financialDiscipline:   z.number().min(0).max(10),
    cashManagement:        z.number().min(0).max(10),
    operationalEfficiency: z.number().min(0).max(10),
    riskExposure:          z.number().min(0).max(10),
    stability:             z.number().min(0).max(10),
    scalability:           z.number().min(0).max(10),
    summary:               z.string(),
  }),
  strategic: z.object({
    mustFix:       z.array(z.string()).default([]),
    shouldProtect: z.array(z.string()).default([]),
    shouldScale:   z.array(z.string()).default([]),
    whatNext:      z.array(z.string()).default([]),
  }),
});
export type EvolutionResult = z.infer<typeof EvolutionResultSchema>;

export const DNA_DIMENSIONS: { key: keyof EvolutionResult["dna"]; label: string }[] = [
  { key: "growthOrientation",     label: "Growth orientation" },
  { key: "financialDiscipline",   label: "Financial discipline" },
  { key: "cashManagement",        label: "Cash management" },
  { key: "operationalEfficiency", label: "Operational efficiency" },
  { key: "riskExposure",          label: "Risk exposure" },
  { key: "stability",             label: "Stability" },
  { key: "scalability",           label: "Scalability" },
];

// ── Series builder ──
// One review per year (latest wins on ties); ascending by year. Only
// completed reviews with a year are eligible.
export function buildYearSeries(
  reviews: { financialYear: number | null; status: string; score: number | null; financials: unknown; createdAt: Date }[],
): YearPoint[] {
  const byYear = new Map<number, { createdAt: Date; point: YearPoint }>();
  for (const r of reviews) {
    if (r.status !== "complete" || r.financialYear == null) continue;
    const f = (r.financials ?? {}) as NormalizedFinancials;
    const existing = byYear.get(r.financialYear);
    if (!existing || r.createdAt > existing.createdAt) {
      byYear.set(r.financialYear, {
        createdAt: r.createdAt,
        point: { year: r.financialYear, score: r.score ?? null, financials: f },
      });
    }
  }
  return [...byYear.values()].map((v) => v.point).sort((a, b) => a.year - b.year);
}

export function yearsKeyOf(series: YearPoint[]): string {
  return series.map((p) => p.year).join(",");
}

// ── Metric helpers ──
function num(v: number | null | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function pctChange(first: number, last: number): number {
  if (first === 0) return last === 0 ? 0 : 100;
  return ((last - first) / Math.abs(first)) * 100;
}
function fmtPct(n: number): string {
  const r = Math.round(n);
  return `${r > 0 ? "+" : ""}${r}%`;
}
function cagr(first: number, last: number, periods: number): number | null {
  if (first <= 0 || last <= 0 || periods < 1) return null;
  return (Math.pow(last / first, 1 / periods) - 1) * 100;
}

// Build the deterministic evolution dashboard cards.
export function computeEvolutionMetrics(series: YearPoint[]): EvolutionMetrics {
  const years = series.map((p) => p.year);
  const first = series[0];
  const last  = series[series.length - 1];
  const cards: MetricCard[] = [];

  cards.push({
    key: "years",
    label: "Years analyzed",
    value: String(series.length),
    detail: years.length ? `${years[0]} - ${years[years.length - 1]}` : undefined,
    tone: "neutral",
  });

  if (first && last && first !== last) {
    const periods = last.year - first.year || series.length - 1;

    // Revenue CAGR
    const rev0 = num(first.financials.revenue);
    const rev1 = num(last.financials.revenue);
    if (rev0 != null && rev1 != null) {
      const c = cagr(rev0, rev1, periods);
      cards.push({
        key: "revenueCagr",
        label: "Revenue CAGR",
        value: c != null ? fmtPct(c) : fmtPct(pctChange(rev0, rev1)),
        detail: c != null ? "Compound annual growth" : "Total change",
        tone: (c ?? pctChange(rev0, rev1)) >= 0 ? "good" : "bad",
      });
    }

    // Profitability (net margin) trend
    const margin = (p: YearPoint) => {
      const r = num(p.financials.revenue), n = num(p.financials.netProfit);
      return r && n != null ? (n / r) * 100 : null;
    };
    const m0 = margin(first), m1 = margin(last);
    if (m0 != null && m1 != null) {
      cards.push({
        key: "profitability",
        label: "Profitability trend",
        value: `${Math.round(m0)}% → ${Math.round(m1)}%`,
        detail: "Net profit margin",
        tone: m1 >= m0 ? "good" : "bad",
      });
    }

    // Simple endpoint trends for the remaining metrics.
    const trend = (
      key: string, label: string, field: keyof NormalizedFinancials,
      goodWhenUp: boolean,
    ) => {
      const a = num(first.financials[field]), b = num(last.financials[field]);
      if (a == null || b == null) return;
      const ch = pctChange(a, b);
      const up = ch >= 0;
      cards.push({
        key, label, value: fmtPct(ch),
        tone: up === goodWhenUp ? "good" : up ? "warn" : "warn",
      });
    };
    trend("cash",      "Cash position trend", "cashPosition",     true);
    trend("debt",      "Debt trend",          "totalLiabilities", false);
    trend("expenses",  "Expense trend",       "expenses",         false);
    trend("assets",    "Asset growth",        "totalAssets",      true);
    trend("equity",    "Equity growth",       "equity",           true);
  }

  return { years, series, cards };
}

// Compact per-year table for the prompt + the dashboard series view.
export function seriesForPrompt(series: YearPoint[]): Record<string, unknown>[] {
  return series.map((p) => ({ year: p.year, healthScore: p.score, ...p.financials }));
}
