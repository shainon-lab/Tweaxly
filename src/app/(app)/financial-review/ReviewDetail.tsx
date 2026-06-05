import {
  type FinancialReviewResult,
  type ReviewFlag,
  type StatusLevel,
  priorityLabel,
  timeHorizonLabel,
} from "@/lib/financialReview/types";
import HealthScore from "@/components/financial-review/HealthScore";
import ReviewDisclaimer from "@/components/financial-review/Disclaimer";
import { CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";

// Full read-only render of a completed Financial Review. Server
// component - pure presentation from the stored structured result.

function priorityPill(p: string): string {
  if (p === "high") return "pill-bad";
  if (p === "medium") return "pill-warn";
  return "pill";
}
function confidencePill(c: string): string {
  if (c === "high") return "pill-good";
  if (c === "medium") return "pill-warn";
  return "pill";
}

export default function ReviewDetail({
  result,
  level,
}: {
  result: FinancialReviewResult;
  level:  StatusLevel | string | null | undefined;
}) {
  const so = result.secondOpinion;
  const hasSecondOpinion =
    so.classificationReview.length + so.unusualChanges.length + so.newCategories.length + so.outliers.length > 0;

  return (
    <div className="space-y-8 pb-12">
      <ReviewDisclaimer />

      {/* ── Section 1: Business Health Assessment ──
          Executive summary leads (full width); the compact health score
          sits as the first box directly underneath it. */}
      <section className="space-y-4">
        <div className="card">
          <h2 className="t-card mb-2">Executive summary</h2>
          <p className="t-body whitespace-pre-line text-slate-200">{result.executiveSummary}</p>
          {result.keyFinancials.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {result.keyFinancials.map((k, i) => (
                <div key={i} className="rounded-md border border-line bg-ink-800/60 px-3 py-2">
                  <div className="t-meta text-slate-400">{k.label}</div>
                  <div className="text-sm font-semibold text-slate-100">{k.value}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <HealthScore score={Math.round(result.healthScore)} level={level} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <FindingList title="Strengths" icon={<CheckCircle2 size={16} className="text-good" />} items={result.strengths} tone="good" />
        <FindingList title="Risks" icon={<AlertTriangle size={16} className="text-bad" />} items={result.risks} tone="bad" />
        <FindingList title="Opportunities" icon={<Lightbulb size={16} className="text-warn" />} items={result.opportunities} tone="warn" />
      </div>

      {/* ── Section 2: AI Second Opinion ── */}
      {hasSecondOpinion ? (
        <section>
          <SectionTitle n={2} title="AI Second Opinion" />
          <p className="t-meta mb-4 text-slate-400">
            Areas that may deserve a closer look or a conversation with your accountant. These are discussion points, not corrections.
          </p>
          <div className="space-y-5">
            <FlagGroup title="Classification review" flags={so.classificationReview} />
            <FlagGroup title="Unusual financial changes" flags={so.unusualChanges} />
            <FlagGroup title="Significant new categories" flags={so.newCategories} />
            <FlagGroup title="Financial outliers" flags={so.outliers} />
          </div>
        </section>
      ) : null}

      {/* ── Section 3: Questions To Ask Your CPA ── */}
      {result.cpaQuestions.length > 0 ? (
        <section>
          <SectionTitle n={3} title="Questions to ask your accountant" />
          <ol className="card space-y-3">
            {result.cpaQuestions.map((q, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">
                  {i + 1}
                </span>
                <span className="t-body text-slate-200">{q}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* ── Section 4: Action Plan ── */}
      {result.recommendedActions.length > 0 ? (
        <section>
          <SectionTitle n={4} title="Action plan" />
          <div className="grid gap-4 md:grid-cols-2">
            {result.recommendedActions.map((a, i) => (
              <div key={i} className="card">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={priorityPill(a.priority)}>{priorityLabel(a.priority)} priority</span>
                  <span className="pill">{timeHorizonLabel(a.timeHorizon)}</span>
                </div>
                <div className="t-card mb-2">{a.action}</div>
                <p className="t-body text-slate-300">
                  <span className="font-semibold text-slate-200">Why it matters: </span>{a.whyItMatters}
                </p>
                <p className="t-body mt-1.5 text-slate-300">
                  <span className="font-semibold text-slate-200">Potential impact: </span>{a.potentialImpact}
                </p>
              </div>
            ))}
          </div>

          <h3 className="t-card mb-3 mt-6">90-day business action plan</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <PlanColumn title="Next 30 days" items={result.actionPlan90Day.next30Days} />
            <PlanColumn title="Days 31-60" items={result.actionPlan90Day.days31to60} />
            <PlanColumn title="Days 61-90" items={result.actionPlan90Day.days61to90} />
          </div>
        </section>
      ) : null}

      {/* ── Section 5: Forecast ── */}
      <section>
        <SectionTitle n={5} title="Forecast - 12-month outlook" />
        <p className="t-meta mb-4 text-slate-400">
          Estimates based on the uploaded report - not guarantees. Actual results depend on execution and market conditions.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <ForecastCard label="Revenue" line={result.forecast.revenue} pill={confidencePill} />
          <ForecastCard label="Profitability" line={result.forecast.profitability} pill={confidencePill} />
          <ForecastCard label="Cash flow" line={result.forecast.cashFlow} pill={confidencePill} />
        </div>
        {(result.forecast.assumptions.growth.length +
          result.forecast.assumptions.expenses.length +
          result.forecast.assumptions.risks.length) > 0 ? (
          <div className="card mt-4">
            <h3 className="t-card mb-3">Assumptions behind this outlook</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <AssumptionList title="Growth" items={result.forecast.assumptions.growth} />
              <AssumptionList title="Expenses" items={result.forecast.assumptions.expenses} />
              <AssumptionList title="Risk factors" items={result.forecast.assumptions.risks} />
            </div>
          </div>
        ) : null}
      </section>

      <ReviewDisclaimer />
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────
function SectionTitle({ n, title }: { n?: number; title: string }) {
  return (
    <h2 className="t-section mb-1.5">
      {n ? <span className="text-accent">Section {n} · </span> : null}
      {title}
    </h2>
  );
}

function FindingList({
  title, icon, items, tone,
}: {
  title: string; icon: React.ReactNode; items: string[]; tone: "good" | "bad" | "warn";
}) {
  const dot = tone === "good" ? "bg-good" : tone === "bad" ? "bg-bad" : "bg-warn";
  return (
    <div className="card">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="t-card">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="t-meta text-slate-500">None identified.</p>
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

function FlagGroup({ title, flags }: { title: string; flags: ReviewFlag[] }) {
  if (flags.length === 0) return null;
  return (
    <div>
      <div className="t-meta mb-2 uppercase tracking-wide text-slate-400">{title}</div>
      <div className="grid gap-3 md:grid-cols-2">
        {flags.map((f, i) => (
          <div key={i} className="card-tight">
            <div className="t-body font-semibold text-slate-100">{f.observation}</div>
            <p className="t-meta mt-1.5 text-slate-300">
              <span className="font-semibold text-slate-200">Why it matters: </span>{f.whyItMatters}
            </p>
            <p className="t-meta mt-1.5 text-accent">
              <span className="font-semibold">Discuss with your CPA: </span>{f.discussionPoint}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="card">
      <h4 className="t-meta mb-2 uppercase tracking-wide text-accent">{title}</h4>
      {items.length === 0 ? (
        <p className="t-meta text-slate-500">No items.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2.5 t-body text-slate-200">
              <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
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
    <div className="card">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="t-card">{label}</h3>
        <span className={pill(line.confidence)}>{line.confidence} confidence</span>
      </div>
      <p className="t-body text-slate-200">{line.outlook}</p>
    </div>
  );
}

function AssumptionList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="t-meta mb-2 uppercase tracking-wide text-slate-400">{title}</div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2.5 t-meta text-slate-300">
            <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-slate-500" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
