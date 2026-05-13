"use client";

// Renders the year's insights 10 at a time. The "Show more insights"
// button reveals the next 10, then the next, until the pool is exhausted.

import { useState } from "react";

type Insight = { text: string; tip: string; importance: number };

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

export default function YearlyInsightsList({ insights }: { insights: Insight[] }) {
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
              <div className="min-w-0">
                <div className="text-sm text-slate-100 leading-snug">{i.text}</div>
                <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                  <span className="text-slate-500 uppercase tracking-wide text-[10px] mr-2">Tip</span>
                  {i.tip}
                </div>
              </div>
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
