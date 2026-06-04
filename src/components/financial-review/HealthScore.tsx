import { statusLabel, type StatusLevel } from "@/lib/financialReview/types";

// Compact business-health score box (Section 1). Colour follows the
// status band: good (excellent/healthy), warn (needs attention), bad
// (high risk). Sized to its content so it reads as a small summary chip
// under the executive summary rather than a large hero card.
function tone(level: StatusLevel | string | null | undefined): { text: string; ring: string; bg: string } {
  switch (level) {
    case "excellent":
    case "healthy":
      return { text: "text-good", ring: "border-good/40", bg: "bg-good/10" };
    case "needs_attention":
      return { text: "text-warn", ring: "border-warn/40", bg: "bg-warn/10" };
    case "high_risk":
      return { text: "text-bad", ring: "border-bad/40", bg: "bg-bad/10" };
    default:
      return { text: "text-slate-200", ring: "border-line", bg: "bg-ink-800" };
  }
}

export default function HealthScore({
  score,
  level,
}: {
  score: number;
  level: StatusLevel | string | null | undefined;
}) {
  const t = tone(level);
  return (
    <div className={`inline-flex items-center gap-4 rounded-xl border ${t.ring} ${t.bg} px-5 py-3.5`}>
      <div className={`text-4xl font-bold leading-none ${t.text}`}>
        {score}
        <span className="text-base font-semibold text-slate-400"> / 100</span>
      </div>
      <div>
        <div className="t-meta uppercase tracking-wide text-slate-400">Business Health</div>
        <div className={`mt-1 inline-flex items-center rounded-full border ${t.ring} px-2.5 py-0.5 text-sm font-semibold ${t.text}`}>
          {statusLabel(level)}
        </div>
      </div>
    </div>
  );
}
