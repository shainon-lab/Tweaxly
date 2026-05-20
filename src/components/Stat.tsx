"use client";
import { createContext, useContext, useState } from "react";

export type StatComparison = {
  // Compared-period's value (already formatted as a string).
  prevValue: React.ReactNode;
  // Decimal percentage change. 0.05 = +5%. Null = no comparable baseline.
  pct: number | null;
  // Does an upward move mean "good for the business"? Revenue/profit/margin
  // up = good. Expenses/payroll/fees/etc up = bad. Used to color the
  // percentage red or green.
  upIsGood: boolean;
  // Optional caption appended after the parens - e.g. "vs Last quarter".
  prevLabel?: string;
};

export type StatExplain = {
  description: string;
  tips?: string[];
};

// Coordinates which Stat's Learn-more panel is open. Only one box can be
// expanded at a time so opening a new one collapses the previous.
type StatGroupCtx = {
  openKey: string | null;
  setOpenKey: (k: string | null) => void;
};
const StatGroupContext = createContext<StatGroupCtx | null>(null);

export function StatGroup({ children }: { children: React.ReactNode }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  return (
    <StatGroupContext.Provider value={{ openKey, setOpenKey }}>
      {children}
    </StatGroupContext.Provider>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = "default",
  comparison,
  explain,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "good" | "bad" | "warn";
  comparison?: StatComparison;
  explain?: StatExplain;
}) {
  const ctx = useContext(StatGroupContext);
  const statKey = label;
  const open = ctx ? ctx.openKey === statKey : false;
  const toggle = () => {
    if (ctx) ctx.setOpenKey(open ? null : statKey);
  };

  const toneClass =
    tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : "text-slate-100";
  // When the Learn-more panel is expanded the entire box outline switches to
  // the accent color so the user can see exactly which metric they opened.
  const wrapperClass = `card-tight relative ${open ? "ring-2 ring-accent ring-offset-0 border-accent/40" : ""}`;
  return (
    <div className={wrapperClass}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
        {explain ? (
          <button
            type="button"
            className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border transition shrink-0 ${
              open
                ? "border-accent/60 bg-accent-soft text-accent"
                : "border-line text-slate-400 hover:text-slate-200 hover:border-slate-500"
            }`}
            onClick={toggle}
            aria-expanded={open}
          >
            {open ? "Close" : "Explain this"}
          </button>
        ) : null}
      </div>
      <div className={`mt-2 text-2xl font-semibold tracking-tight ${toneClass}`}>{value}</div>
      {comparison ? <Comparison c={comparison} /> : sub ? <div className="mt-1 text-xs text-slate-400">{sub}</div> : null}
      {explain && open ? (
        <div className="mt-3 pt-3 border-t border-line">
          <div className="text-xs text-slate-200 leading-relaxed">{explain.description}</div>
          {explain.tips && explain.tips.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {explain.tips.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-accent mt-0.5">•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
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
    c.pct == null ? "-" :
    `${sign}${(Math.abs(c.pct) * 100).toFixed(1)}%`;
  return (
    <div className="mt-1 text-xs text-slate-400 leading-relaxed">
      <span className="text-slate-300">{c.prevValue}</span>{" "}
      <span className={pctClass}>({pctStr})</span>
      {c.prevLabel ? <span className="ml-1 text-slate-500">{c.prevLabel}</span> : null}
    </div>
  );
}
