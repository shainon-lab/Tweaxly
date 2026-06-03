import { statusLabel, type StatusLevel } from "@/lib/financialReview/types";

// Large business-health score card (Section 1 headline). Colour follows
// the status band: good (excellent/healthy), warn (needs attention),
// bad (high risk). Pure presentation - takes a 0-100 score + band.
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
    <div className={`flex flex-col items-center justify-center rounded-xl border ${t.ring} ${t.bg} p-6 text-center`}>
      <div className="t-meta uppercase tracking-wide text-slate-400">Business Health</div>
      <div className={`mt-1 text-6xl font-bold leading-none ${t.text}`}>
        {score}
        <span className="text-2xl font-semibold text-slate-400"> / 100</span>
      </div>
      <div className={`mt-3 inline-flex items-center rounded-full border ${t.ring} px-3 py-1 text-sm font-semibold ${t.text}`}>
        {statusLabel(level)}
      </div>
    </div>
  );
}
