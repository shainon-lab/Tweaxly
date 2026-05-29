"use client";

// Renders the year's insights 10 at a time. The "Show more insights"
// button reveals the next 10, then the next, until the pool is exhausted.

import { useState } from "react";
import ShareAnalysisButton from "@/components/sharing/ShareAnalysisButton";

type Insight = { text: string; tip: string; importance: number };

function truncateForTitle(text: string, max = 80): string {
  const firstLine = text.split("\n")[0]?.trim() ?? "";
  if (firstLine.length <= max) return firstLine;
  return firstLine.slice(0, max - 1).trimEnd() + "…";
}

const PAGE = 10;

const TONE: Record<string, string> = {
  high:   "border-bad/40",
  med:    "border-warn/40",
  low:    "border-accent/40",
};

function bucket(importance: number): keyof typeof TONE {
  if (importance >= 9) return "high";
  if (importance >= 6) return "med";
  return "low";
}

export default function YearlyInsightsList({
  insights,
  year,
  currency = "USD",
  canShareAnalyses = false,
  currentPlan = "free",
}: {
  insights: Insight[];
  // Year shown alongside the share title so a re-opened share reads
  // as "Insight from <year>" rather than a bare bullet.
  year?: number;
  currency?: string;
  // Pro entitlement passthrough. Defaults are conservative so a
  // caller that doesn't pass them still surfaces the upgrade card on
  // share click rather than the share form.
  canShareAnalyses?: boolean;
  currentPlan?: string;
}) {
  const [visible, setVisible] = useState(PAGE);
  const shown = insights.slice(0, visible);
  const hasMore = visible < insights.length;

  if (insights.length === 0) {
    return (
      <div className="card text-center py-12 text-slate-400 mb-6">
        Not enough data in this year to generate insights.
      </div>
    );
  }

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>
          <div className="font-medium">Top insights & tips</div>
          <div className="text-xs text-slate-400">
            Ranked by importance · {shown.length} of {insights.length} shown
          </div>
        </div>
      </div>
      <ol className="space-y-3">
        {shown.map((i, idx) => (
          <li key={idx} className={`border-l-2 pl-4 py-2 ${TONE[bucket(i.importance)]}`}>
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-ink-700 text-slate-200 text-xs font-semibold shrink-0">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-slate-100 leading-snug">{i.text}</div>
                <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                  <span className="text-slate-500 uppercase tracking-wide text-[10px] mr-2">Tip</span>
                  {i.tip}
                </div>
              </div>
              {/* Per-insight share. sourceId derives from the rank +
                  year so re-opening the share viewer matches the
                  exact row the sender pointed at - the snapshot
                  itself is the source of truth at view-time, but the
                  id is useful for admin/back-tracing. */}
              <ShareAnalysisButton
                sourceType="insight"
                sourceId={`yearly:${year ?? ""}:${idx + 1}`}
                snapshotContent={{
                  text:       i.text,
                  tip:        i.tip,
                  importance: i.importance,
                  tone:       bucket(i.importance),
                  rank:       idx + 1,
                }}
                snapshotMeta={{
                  title:       truncateForTitle(i.text),
                  year:        year ?? null,
                  currency,
                  generatedAt: new Date().toISOString(),
                }}
                canShare={canShareAnalyses}
                currentPlan={currentPlan}
                label=""
                className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-accent hover:bg-ink-700 transition"
              />
            </div>
          </li>
        ))}
      </ol>
      {hasMore ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setVisible((v) => Math.min(insights.length, v + PAGE))}
          >
            Show more insights ({Math.min(PAGE, insights.length - visible)} more)
          </button>
        </div>
      ) : insights.length > PAGE ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setVisible(PAGE)}
          >
            Collapse to top 10
          </button>
        </div>
      ) : null}
    </div>
  );
}
