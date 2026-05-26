// The "Summary" hero at the top of the Executive Summary dashboard.
// Two columns: narrative on the left, "Business Bulletins" anchor list
// on the right. The bulletins are an AI-curated digest - never more
// than 5 - surfacing the most material business anchors so the user
// can read the period in 3–5 seconds.
//
// Design rules - important:
//   - Bulletins are NOT KPI cards. No heavy borders, no boxed widgets.
//     The right column is a lightweight vertical list with subtle row
//     dividers, premium and quiet.
//   - The narrative is the primary affordance. The bulletins support
//     scanning, not compete for attention.
//   - Mobile: bulletins stack below the narrative.

import type { Bulletin, ExecutiveSummary } from "@/lib/executiveSummary";
import NarrativeBody from "./NarrativeBody";

const TONE_CLASS: Record<NonNullable<Bulletin["tone"]>, string> = {
  good:    "text-good",
  warn:    "text-warn",
  bad:     "text-bad",
  neutral: "text-slate-100",
};

function trendGlyph(t: Bulletin["trend"]): string {
  if (t === "up")   return "↑";
  if (t === "down") return "↓";
  if (t === "flat") return "→";
  return "";
}

export default function ExecutiveSummaryHero({
  summary,
}: {
  summary: ExecutiveSummary;
}) {
  return (
    <section
      className="mb-6 rounded-2xl border border-line p-6 md:p-8 shadow-sm"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(124,92,250,0.12) 0%, rgba(79,125,255,0.08) 50%, rgba(34,211,238,0.08) 100%)",
      }}
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-100 leading-tight">
            Summary
          </h2>
          <div className="text-xs text-slate-400 mt-0.5">
            AI-generated business overview · {summary.periodLabel}
          </div>
        </div>
        <span
          className="pill-accent text-xs px-3 py-1 font-semibold"
          title={
            summary.source === "claude"
              ? `${summary.tierLabel} - generated from your business data.`
              : "Generated from your business data."
          }
        >
          {summary.source === "claude" ? summary.tierLabel : "From your data"}
        </span>
      </div>

      {/* Two-column layout: narrative on the left, bulletins on the right.
          On mobile they stack with the narrative first. */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
        {/* Shared NarrativeBody handles the lead-paragraph split,
            subtle positive letter-spacing, and roomy line-height. Same
            component used by every long-form text surface on the
            platform so the voice stays consistent. */}
        <NarrativeBody text={summary.narrative} className="md:col-span-8" />

        {summary.bulletins.length > 0 ? (
          <aside className="md:col-span-4">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">
              Business Bulletins
            </div>
            <ul className="divide-y divide-line/60 border-t border-line/60">
              {summary.bulletins.map((b, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-3 py-2.5"
                >
                  <span className="text-xs text-slate-400">{b.label}</span>
                  <span
                    className={`text-sm font-medium tracking-tight ${TONE_CLASS[b.tone ?? "neutral"]}`}
                  >
                    {b.trend ? (
                      <span className="text-xs mr-1 align-middle" aria-hidden="true">
                        {trendGlyph(b.trend)}
                      </span>
                    ) : null}
                    {b.value}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
