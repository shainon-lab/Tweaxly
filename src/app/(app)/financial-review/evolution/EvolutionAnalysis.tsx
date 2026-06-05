"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { notify } from "@/lib/notify";
import { DNA_DIMENSIONS, type EvolutionResult } from "@/lib/financialReview/evolution";

function confidencePill(c: string): string {
  if (c === "high") return "pill-good";
  if (c === "medium") return "pill-warn";
  return "pill";
}

export default function EvolutionAnalysis({
  initialResult,
  stale,
}: {
  initialResult: EvolutionResult | null;
  stale: boolean;
}) {
  const [result, setResult] = useState<EvolutionResult | null>(initialResult);
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/financial-review/evolution", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not generate the analysis.");
      setResult(data.result as EvolutionResult);
    } catch (e) {
      await notify.alert(e instanceof Error ? e.message : "Could not generate the analysis.");
    } finally {
      setBusy(false);
    }
  }

  if (!result) {
    return (
      <div className="card flex flex-col items-center justify-center py-12 text-center">
        <Sparkles size={26} className="text-accent" />
        <div className="t-card mt-3">AI Business Story</div>
        <p className="t-meta mt-2 max-w-md text-slate-400">
          Generate a plain-English story of how your business evolved across the years, plus an
          executive timeline, a Business DNA profile, a multi-year forecast and strategic
          recommendations.
        </p>
        <button type="button" onClick={generate} disabled={busy} className="btn-primary mt-5">
          {busy ? <Loader2 size={15} className="mr-1.5 animate-spin" /> : <Sparkles size={15} className="mr-1.5" />}
          {busy ? "Analyzing…" : "Generate analysis"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {stale ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-warn/30 bg-warn/10 p-3.5">
          <p className="t-meta text-slate-300">
            <span className="font-semibold text-warn">Your data changed. </span>
            This analysis was generated for a different set of years. Regenerate to include the latest.
          </p>
          <button type="button" onClick={generate} disabled={busy} className="btn-ghost text-sm">
            {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
            Regenerate
          </button>
        </div>
      ) : null}

      {/* Business Story */}
      <section className="card">
        <h2 className="t-section mb-2">Your business story</h2>
        <p className="t-body whitespace-pre-line text-slate-200">{result.businessStory}</p>
      </section>

      {/* Executive Timeline */}
      {result.timeline.length > 0 ? (
        <section>
          <h2 className="t-section mb-3">Executive timeline</h2>
          <div className="space-y-3">
            {result.timeline.map((t, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-28 shrink-0">
                  <div className="t-meta font-semibold text-accent">{t.period}</div>
                </div>
                <div className="card-tight flex-1">
                  <div className="t-card text-base">{t.phase}</div>
                  <p className="t-meta mt-1 text-slate-300">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Trend Analysis */}
      <section>
        <h2 className="t-section mb-3">Trend analysis</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TrendCard label="Strongest positive trend" value={result.trendAnalysis.strongestPositive} tone="good" />
          <TrendCard label="Strongest negative trend" value={result.trendAnalysis.strongestNegative} tone="bad" />
          <TrendCard label="Largest business change" value={result.trendAnalysis.largestChange} tone="neutral" />
          <TrendCard label="Largest financial risk" value={result.trendAnalysis.largestRisk} tone="warn" />
          <TrendCard label="Most improved area" value={result.trendAnalysis.mostImproved} tone="good" />
        </div>
      </section>

      {/* Evolution Forecast */}
      <section>
        <h2 className="t-section mb-1">Multi-year forecast</h2>
        <p className="t-meta mb-3 text-slate-400">
          Estimates grounded in your multi-year history - more reliable than a single year, but still not guarantees.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ForecastCard label="Revenue" line={result.evolutionForecast.revenue} pill={confidencePill} />
          <ForecastCard label="Profitability" line={result.evolutionForecast.profitability} pill={confidencePill} />
          <ForecastCard label="Cash flow" line={result.evolutionForecast.cashFlow} pill={confidencePill} />
          <ForecastCard label="Risk" line={result.evolutionForecast.risk} pill={confidencePill} />
        </div>
      </section>

      {/* Business DNA */}
      <section>
        <h2 className="t-section mb-3">Business DNA profile</h2>
        <div className="card">
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {DNA_DIMENSIONS.map((d) => {
              const score = Number(result.dna[d.key]) || 0;
              return (
                <div key={d.key}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="t-meta text-slate-300">{d.label}</span>
                    <span className="text-sm font-semibold text-slate-100">{score}/10</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(score / 10) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="t-body mt-5 border-t border-line pt-4 text-slate-200">{result.dna.summary}</p>
        </div>
      </section>

      {/* Strategic Recommendations */}
      <section>
        <h2 className="t-section mb-3">Strategic recommendations</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StrategyList title="What must be fixed" items={result.strategic.mustFix} tone="bad" />
          <StrategyList title="What should be protected" items={result.strategic.shouldProtect} tone="good" />
          <StrategyList title="What should be scaled" items={result.strategic.shouldScale} tone="accent" />
          <StrategyList title="What will likely happen next" items={result.strategic.whatNext} tone="neutral" />
        </div>
      </section>
    </div>
  );
}

function TrendCard({ label, value, tone }: { label: string; value: string; tone: "good" | "bad" | "warn" | "neutral" }) {
  const dot = tone === "good" ? "bg-good" : tone === "bad" ? "bg-bad" : tone === "warn" ? "bg-warn" : "bg-slate-500";
  return (
    <div className="card-tight">
      <div className="mb-1.5 flex items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
        <span className="t-meta uppercase tracking-wide text-slate-400">{label}</span>
      </div>
      <p className="t-body text-slate-200">{value}</p>
    </div>
  );
}

function ForecastCard({
  label, line, pill,
}: {
  label: string;
  line: { outlook: string; confidence: string };
  pill: (c: string) => string;
}) {
  return (
    <div className="card-tight">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="t-card text-base">{label}</h3>
        <span className={pill(line.confidence)}>{line.confidence}</span>
      </div>
      <p className="t-meta text-slate-300">{line.outlook}</p>
    </div>
  );
}

function StrategyList({ title, items, tone }: { title: string; items: string[]; tone: "good" | "bad" | "warn" | "accent" | "neutral" }) {
  const dot =
    tone === "good" ? "bg-good" : tone === "bad" ? "bg-bad" : tone === "accent" ? "bg-accent" : "bg-slate-500";
  return (
    <div className="card">
      <h3 className="t-card mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="t-meta text-slate-500">Nothing flagged.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2.5 t-body text-slate-200">
              <span className={`mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
