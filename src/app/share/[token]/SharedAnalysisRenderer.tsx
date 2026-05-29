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
      ) : (
        // Other source types (signal / forecast_explanation / insight)
        // wire up in later phases. Until then we render a small
        // placeholder so a manually-created share row doesn't crash
        // the viewer.
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
