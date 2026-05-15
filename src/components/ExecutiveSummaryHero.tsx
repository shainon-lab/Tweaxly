// The "Summary" hero at the top of the Executive Summary dashboard.
// Renders a calm, premium block with an AI-generated business
// narrative followed by a row of supporting insight chips.
//
// Design notes:
//   - This is a strategic overview layer, NOT an alert card. No loud
//     borders, no harsh colors, no notification styling.
//   - The narrative is the main affordance — chips are secondary.
//   - The card uses the same gradient family as the consultation
//     intro and the Business Signals footer so it reads as part of
//     the same "intelligence" surface.

import type { ExecutiveSummary, SummaryChip } from "@/lib/executiveSummary";

const CHIP_CLASS: Record<SummaryChip["tone"], string> = {
  good:    "pill-good",
  warn:    "pill-warn",
  bad:     "pill-bad",
  neutral: "pill-accent",
};

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
        {/* Source attribution — pill-styled so the user can clearly see
            that the narrative is grounded in their own data, not stock
            copy. Sized larger than typical microcopy. */}
        <span
          className="pill-accent text-xs px-3 py-1 font-semibold"
          title="The summary above is generated from your business's own data."
        >
          {summary.source === "claude" ? "Analyzed by Claude AI" : "Analyzed from your data"}
        </span>
      </div>

      <p className="text-sm md:text-base text-slate-200 leading-relaxed max-w-4xl whitespace-pre-line">
        {summary.narrative}
      </p>

      {summary.chips.length > 0 ? (
        <div className="mt-5 flex items-center gap-2 flex-wrap">
          {summary.chips.map((c, i) => (
            <span key={i} className={`${CHIP_CLASS[c.tone]} text-[11px]`}>
              {c.label}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
