export type StatComparison = {
  // Compared-period's value (already formatted as a string).
  prevValue: React.ReactNode;
  // Decimal percentage change. 0.05 = +5%. Null = no comparable baseline.
  pct: number | null;
  // Does an upward move mean "good for the business"? Revenue/profit/margin
  // up = good. Expenses/payroll/fees/etc up = bad. Used to color the
  // percentage red or green.
  upIsGood: boolean;
  // Optional caption appended after the parens — e.g. "vs Last quarter".
  prevLabel?: string;
};

export function Stat({
  label,
  value,
  sub,
  tone = "default",
  comparison,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "good" | "bad" | "warn";
  comparison?: StatComparison;
}) {
  const toneClass =
    tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : "text-slate-100";
  return (
    <div className="card-tight">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tracking-tight ${toneClass}`}>{value}</div>
      {comparison ? <Comparison c={comparison} /> : sub ? <div className="mt-1 text-xs text-slate-400">{sub}</div> : null}
    </div>
  );
}

function Comparison({ c }: { c: StatComparison }) {
  // Polarity colors the percent based on what the move means for the
  // business. For metrics where "down is good" (expenses, payroll, fees…)
  // a -5% MoM lights up green, +5% lights up red.
  const pctClass =
    c.pct == null
      ? "text-slate-500"
      : c.pct === 0
        ? "text-slate-400"
        : (c.pct > 0) === c.upIsGood
          ? "text-good"
          : "text-bad";
  const sign = c.pct == null ? "" : c.pct > 0 ? "+" : c.pct < 0 ? "−" : "";
  const pctStr =
    c.pct == null ? "—" :
    `${sign}${(Math.abs(c.pct) * 100).toFixed(1)}%`;
  return (
    <div className="mt-1 text-xs text-slate-400 leading-relaxed">
      <span className="text-slate-300">{c.prevValue}</span>{" "}
      <span className={pctClass}>({pctStr})</span>
      {c.prevLabel ? <span className="ml-1 text-slate-500">{c.prevLabel}</span> : null}
    </div>
  );
}
