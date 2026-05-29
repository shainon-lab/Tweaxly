"use client";

// Renders a SharedAnalysis snapshot through the same components used
// in the New Advisory view (StructuredAdvisoryView for rich payloads,
// ResponseBriefing for the markdown fallback). That way a re-opened
// share looks identical to "I just asked this question in Tweaxly"
// without any code drift between the in-app and public surfaces.

import StructuredAdvisoryView from "@/components/advisory/StructuredAdvisoryView";
import ResponseBriefing from "@/components/advisory/ResponseBriefing";
import type { StructuredAdvice } from "@/lib/advisorTypes";

// Snapshot shape produced by the Consultation Share button (Phase 3).
// Shaped identically to the assistant-side fields on
// ConsultationMessage so reuse is one-to-one.
type ConsultationSnapshotContent = {
  content:    string;
  payload:    string | null;
  structured: StructuredAdvice | null;
};
type ConsultationSnapshotMeta = {
  title?:    string;
  question?: string;
  askedAt?:  string;
  currency?: string;
};

export default function SharedAnalysisRenderer({
  sourceType,
  snapshotContent,
  snapshotMeta,
  createdAt,
  expiresAt,
}: {
  sourceType:      string;
  snapshotContent: Record<string, unknown>;
  snapshotMeta:    Record<string, unknown>;
  createdAt:       string;
  expiresAt:       string;
}) {
  const title = typeof snapshotMeta.title === "string" ? snapshotMeta.title : undefined;
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top metadata strip - mirrors the "Shared / Expires" lines
          in the spec. Sits above the analysis itself so the
          recipient always knows the temporal context. */}
      <div className="flex items-center justify-between gap-3 flex-wrap t-meta text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span>
            <span className="uppercase tracking-wide text-slate-500">Shared</span>
            {" "}
            <span className="text-slate-300">
              {new Date(createdAt).toLocaleDateString(undefined, {
                month: "short", day: "numeric", year: "numeric",
              })}
            </span>
          </span>
          <span>
            <span className="uppercase tracking-wide text-slate-500">Expires</span>
            {" "}
            <span className="text-slate-300">
              {new Date(expiresAt).toLocaleDateString(undefined, {
                month: "short", day: "numeric", year: "numeric",
              })}
            </span>
          </span>
        </div>
        <span className="pill-accent">{labelFor(sourceType)}</span>
      </div>

      {/* Optional title - the consultation snapshot carries a derived
          title (the question, truncated). Surfaces it as a page-level
          heading so the recipient sees what the analysis is about
          before reading the answer. */}
      {title ? (
        <h1 className="t-page text-slate-100 leading-tight">
          {title}
        </h1>
      ) : null}

      {sourceType === "consultation" ? (
        <ConsultationBody
          snapshotContent={snapshotContent as unknown as ConsultationSnapshotContent}
          snapshotMeta={snapshotMeta as unknown as ConsultationSnapshotMeta}
        />
      ) : sourceType === "signal" ? (
        <SignalBody
          snapshotContent={snapshotContent as unknown as SignalSnapshotContent}
          snapshotMeta={snapshotMeta as unknown as { currency?: string }}
        />
      ) : sourceType === "forecast_explanation" ? (
        <ForecastBody
          snapshotContent={snapshotContent as unknown as ForecastSnapshotContent}
          snapshotMeta={snapshotMeta as unknown as { currency?: string }}
        />
      ) : sourceType === "insight" ? (
        <InsightBody
          snapshotContent={snapshotContent as unknown as InsightSnapshotContent}
          snapshotMeta={snapshotMeta as unknown as { year?: number | null }}
        />
      ) : (
        // Unknown sourceType - render a small placeholder so a
        // manually-created share row doesn't crash the viewer.
        <div className="card t-body text-slate-300">
          This analysis type isn&apos;t supported by the public viewer yet.
        </div>
      )}
    </div>
  );
}

function ConsultationBody({
  snapshotContent,
  snapshotMeta,
}: {
  snapshotContent: ConsultationSnapshotContent;
  snapshotMeta:    ConsultationSnapshotMeta;
}) {
  const currency = snapshotMeta.currency ?? "USD";
  const question = snapshotMeta.question ?? "";
  const askedAt  = snapshotMeta.askedAt;
  return (
    <div className="space-y-4">
      {/* Question header - same accent border, "Your question"
          eyebrow, t-body content as the in-app consultation view. */}
      {question ? (
        <div className="rounded-xl border border-accent/30 bg-accent-soft/30 px-4 py-3">
          <div className="t-meta uppercase tracking-wide text-accent mb-1">Your question</div>
          <div className="t-body text-slate-100 whitespace-pre-wrap">{question}</div>
          {askedAt ? (
            <div className="t-meta text-slate-500 mt-1">
              {new Date(askedAt).toLocaleString()}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Identical branching to ConsultationClient + HistoryClient:
          rich card layout when a structured payload exists,
          ResponseBriefing fallback otherwise. */}
      {snapshotContent.structured ? (
        <StructuredAdvisoryView data={snapshotContent.structured} />
      ) : snapshotContent.content ? (
        <ResponseBriefing
          content={snapshotContent.content}
          payload={snapshotContent.payload}
          currency={currency}
        />
      ) : (
        <div className="t-body text-slate-400 italic">
          No answer was captured in this share.
        </div>
      )}
    </div>
  );
}

function labelFor(sourceType: string): string {
  switch (sourceType) {
    case "consultation":          return "Consultation answer";
    case "signal":                return "Business signal";
    case "forecast_explanation":  return "Forecast explanation";
    case "insight":               return "Insight";
    default:                      return "Analysis";
  }
}

// ─────────────────────────────────────────────────────────────────────
// Signal body
// ─────────────────────────────────────────────────────────────────────

type SignalSnapshotContent = {
  title?:          string;
  level?:          string;          // "good" | "warn" | "bad"
  category?:       string;
  signalKey?:      string | null;
  observation?:    string;
  interpretation?: string;
  recommendation?: string;
  impact?:         number;
};

function SignalBody({
  snapshotContent: s,
  snapshotMeta,
}: {
  snapshotContent: SignalSnapshotContent;
  snapshotMeta:    { currency?: string };
}) {
  const currency = snapshotMeta.currency ?? "USD";
  const dot =
    s.level === "bad"  ? "bg-bad"  :
    s.level === "warn" ? "bg-warn" :
    s.level === "good" ? "bg-good" :
                         "bg-slate-500";
  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2 t-meta text-slate-400">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden="true" />
        {s.category ? <span className="uppercase tracking-wide">{s.category}</span> : null}
        {s.signalKey ? (
          <>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-slate-500">{s.signalKey}</span>
          </>
        ) : null}
      </div>

      <SectionBlock label="What happened"      body={s.observation} />
      <SectionBlock label="Why it matters"     body={s.interpretation} />
      <SectionBlock label="Recommended action" body={s.recommendation} accent />

      {typeof s.impact === "number" && s.impact > 0 ? (
        <div className="rounded-xl border border-line bg-ink-900/40 px-4 py-3 flex items-center justify-between">
          <span className="t-meta uppercase tracking-wider text-slate-500">Estimated impact</span>
          <span className="t-card text-slate-100 tabular-nums">
            ≈ {fmtMoney(s.impact, currency)} / month
          </span>
        </div>
      ) : null}
    </div>
  );
}

function SectionBlock({ label, body, accent }: { label: string; body?: string; accent?: boolean }) {
  if (!body) return null;
  return (
    <div>
      <div className={`t-meta uppercase tracking-wider mb-2 ${accent ? "text-accent" : "text-slate-500"}`}>
        {label}
      </div>
      <div className={`t-body ${accent ? "text-accent" : "text-slate-200"} whitespace-pre-wrap leading-relaxed`}>
        {body}
      </div>
    </div>
  );
}

function fmtMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency,
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString("en-US")}`;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Forecast explanation body
// ─────────────────────────────────────────────────────────────────────

type ForecastDriver = { title: string; impact: "positive" | "warning" | "neutral"; detail: string };
type ForecastSnapshotContent = {
  title?:              string;
  confidence?:         "high" | "medium" | "low";
  confidenceScore?:    number;
  baselinePeriod?:     { label: string; fromYM: string; toYM: string; monthsResolved: number; monthsWithData: number };
  forecastHorizon?:    { months: number };
  actualsUsed?:        number;
  scenariosApplied?:   number;
  explanationText?:    string;
  drivers?:            ForecastDriver[];
  recurringDetected?:  { description: string; monthlyAmount: number }[];
  outliersDetected?:   { ym: string; metric: string; reason: string }[];
  excludedRecords?:    { count: number; reason: string }[];
  seasonalityApplied?: boolean;
  seasonalityNote?:    string;
  warnings?:           string[];
  basedOn?:            string;
};

const FORECAST_TONE: Record<NonNullable<ForecastDriver["impact"]>, { dot: string; text: string }> = {
  warning:  { dot: "bg-warn",   text: "text-warn"   },
  positive: { dot: "bg-good",   text: "text-good"   },
  neutral:  { dot: "bg-slate-500", text: "text-slate-400" },
};

function ForecastBody({
  snapshotContent: f,
  snapshotMeta,
}: {
  snapshotContent: ForecastSnapshotContent;
  snapshotMeta:    { currency?: string };
}) {
  const currency = snapshotMeta.currency ?? "USD";
  const confTone =
    f.confidence === "high"   ? "text-good" :
    f.confidence === "medium" ? "text-slate-300" :
                                "text-warn";

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="t-section text-slate-100">Why this forecast?</div>
        <div className="flex items-center gap-3 rounded-md border border-line bg-ink-900/50 px-3 py-1.5">
          <div className="text-right">
            <div className="t-meta uppercase tracking-wide text-slate-500 leading-tight">Confidence</div>
            <div className={`t-section font-bold leading-tight ${confTone}`}>
              {f.confidenceScore ?? "—"}%
            </div>
          </div>
          {f.basedOn ? (
            <div className="t-meta text-slate-400 leading-snug max-w-[260px]">{f.basedOn}</div>
          ) : null}
        </div>
      </div>

      {f.drivers && f.drivers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {f.drivers.map((d, i) => {
            const tone = FORECAST_TONE[d.impact] ?? FORECAST_TONE.neutral;
            return (
              <div key={i} className="rounded-lg border border-line bg-ink-900/40 px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${tone.dot}`} />
                  <div className={`t-card truncate ${tone.text}`}>{d.title}</div>
                </div>
                <div className="t-body text-slate-300">{d.detail}</div>
              </div>
            );
          })}
        </div>
      ) : null}

      {f.baselinePeriod || f.forecastHorizon ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-line">
          {f.baselinePeriod ? (
            <>
              <ForecastRow label="Baseline period"  value={f.baselinePeriod.label} />
              <ForecastRow label="Range"            value={`${f.baselinePeriod.fromYM} → ${f.baselinePeriod.toYM}`} />
              <ForecastRow label="Months resolved" value={String(f.baselinePeriod.monthsResolved)} />
              <ForecastRow label="Months with data" value={String(f.baselinePeriod.monthsWithData)} />
            </>
          ) : null}
          {f.forecastHorizon ? (
            <ForecastRow label="Forecast horizon" value={`Next ${f.forecastHorizon.months} months`} />
          ) : null}
          {typeof f.actualsUsed === "number" ? (
            <ForecastRow label="Actuals used" value={`${f.actualsUsed.toLocaleString("en-US")} transactions`} />
          ) : null}
          {typeof f.scenariosApplied === "number" ? (
            <ForecastRow label="Scenarios applied" value={String(f.scenariosApplied)} />
          ) : null}
        </div>
      ) : null}

      {f.explanationText ? (
        <div className="t-body text-slate-200 whitespace-pre-wrap leading-relaxed">
          {f.explanationText}
        </div>
      ) : null}

      {f.recurringDetected && f.recurringDetected.length > 0 ? (
        <div>
          <div className="t-meta uppercase tracking-wide text-slate-400 mb-2">Recurring items projected forward</div>
          <ul className="t-body text-slate-300 space-y-1.5">
            {f.recurringDetected.slice(0, 8).map((r, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3">
                <span>{r.description}</span>
                <span className="text-slate-500 tabular-nums">≈{fmtMoney(r.monthlyAmount, currency)} / mo</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {f.outliersDetected && f.outliersDetected.length > 0 ? (
        <div>
          <div className="t-meta uppercase tracking-wide text-slate-400 mb-2">Outliers excluded from trend</div>
          <ul className="t-body text-slate-300 space-y-1.5">
            {f.outliersDetected.slice(0, 8).map((o, i) => <li key={i}>{o.reason}</li>)}
          </ul>
        </div>
      ) : null}

      {f.seasonalityNote ? (
        <div className="t-body text-slate-400">{f.seasonalityNote}</div>
      ) : null}

      {f.warnings && f.warnings.length > 0 ? (
        <div className="rounded-md border border-warn/30 bg-warn/10 p-4">
          <div className="t-meta uppercase tracking-wide text-warn mb-2">Warnings</div>
          <ul className="t-body text-slate-200 space-y-1.5">
            {f.warnings.map((w, i) => <li key={i}>• {w}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ForecastRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="t-meta uppercase tracking-wide text-slate-400">{label}</div>
      <div className="t-body text-slate-100 mt-1 font-semibold">{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Yearly insight body
// ─────────────────────────────────────────────────────────────────────

type InsightSnapshotContent = {
  text?:       string;
  tip?:        string;
  importance?: number;
  tone?:       "high" | "med" | "low";
  rank?:       number;
};

const INSIGHT_BORDER: Record<NonNullable<InsightSnapshotContent["tone"]>, string> = {
  high: "border-bad/40",
  med:  "border-warn/40",
  low:  "border-accent/40",
};

function InsightBody({
  snapshotContent: i,
  snapshotMeta,
}: {
  snapshotContent: InsightSnapshotContent;
  snapshotMeta:    { year?: number | null };
}) {
  const border = INSIGHT_BORDER[i.tone ?? "low"];
  return (
    <div className="card">
      <div className={`border-l-2 pl-4 py-2 ${border}`}>
        <div className="flex items-start gap-3">
          {typeof i.rank === "number" ? (
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-ink-700 text-slate-200 t-meta font-semibold shrink-0">
              {i.rank}
            </span>
          ) : null}
          <div className="min-w-0">
            {i.text ? (
              <div className="t-body text-slate-100 leading-relaxed">{i.text}</div>
            ) : null}
            {i.tip ? (
              <div className="t-body text-slate-300 mt-3 leading-relaxed">
                <span className="t-meta uppercase tracking-wider text-slate-500 mr-2">Tip</span>
                {i.tip}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {snapshotMeta.year ? (
        <div className="mt-4 pt-4 border-t border-line t-meta text-slate-500">
          From the {snapshotMeta.year} yearly summary
          {typeof i.importance === "number" ? ` · importance ${i.importance}/10` : ""}
        </div>
      ) : null}
    </div>
  );
}
