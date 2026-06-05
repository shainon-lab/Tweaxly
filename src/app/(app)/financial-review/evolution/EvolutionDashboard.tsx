import type { EvolutionMetrics, MetricTone } from "@/lib/financialReview/evolution";
import { FINANCIALS_LABELS, type NormalizedFinancials } from "@/lib/financialReview/types";

// Deterministic multi-year dashboard: trend metric cards + a per-year
// financials table. Pure math from the extracted numbers (no AI).

function toneClass(t: MetricTone): string {
  switch (t) {
    case "good": return "text-good";
    case "bad":  return "text-bad";
    case "warn": return "text-warn";
    default:     return "text-slate-100";
  }
}

function fmt(n: number | null | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

const TABLE_FIELDS: (keyof NormalizedFinancials)[] = ["revenue", "netProfit", "cashPosition", "totalAssets", "equity"];

export default function EvolutionDashboard({
  metrics,
  currency,
}: {
  metrics: EvolutionMetrics;
  currency: string;
}) {
  return (
    <div className="space-y-6">
      {/* Trend cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {metrics.cards.map((c) => (
          <div key={c.key} className="card-tight">
            <div className="t-meta text-slate-400">{c.label}</div>
            <div className={`mt-1 text-2xl font-bold ${toneClass(c.tone)}`}>{c.value}</div>
            {c.detail ? <div className="t-meta mt-0.5 text-slate-500">{c.detail}</div> : null}
          </div>
        ))}
      </div>

      {/* Per-year table */}
      <div className="card">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="t-card">Financials by year</h3>
          <span className="t-meta text-slate-500">{currency}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Year</th>
                {TABLE_FIELDS.map((f) => (
                  <th key={f} className="text-right">{FINANCIALS_LABELS[f]}</th>
                ))}
                <th className="text-right">Health</th>
              </tr>
            </thead>
            <tbody>
              {metrics.series.map((p) => (
                <tr key={p.year}>
                  <td className="font-semibold text-slate-100">{p.year}</td>
                  {TABLE_FIELDS.map((f) => (
                    <td key={f} className="text-right text-slate-300">{fmt(p.financials[f])}</td>
                  ))}
                  <td className="text-right font-semibold text-slate-100">{p.score ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
