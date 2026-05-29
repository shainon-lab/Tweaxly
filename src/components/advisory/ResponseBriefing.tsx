"use client";

// Shared decision-briefing renderer used by both the New Advisory view
// (immediately after a fresh consultation) and the Advisory History
// viewer (when re-opening a past one). Keeping them on a single
// component means history detail looks identical to "I just asked
// this" instead of a divergent lighter version.
//
// Renders five sections from a markdown answer + optional JSON
// payload:
//   1. Executive Takeaway
//   2. AI Reasoning + Decision Anchors (two-column)
//   3. Strategic Paths (tiered cards)
//   4. Risks & Tradeoffs

import { useMemo } from "react";
import { renderMarkdown } from "@/app/(app)/consultation/markdown";
import {
  buildDecisionBriefing,
  type DecisionBriefing,
  type StrategicPath,
} from "@/lib/decisionBriefing";

export default function ResponseBriefing({
  content,
  payload,
  currency,
}: {
  content: string;
  payload: string | null;
  currency: string;
}) {
  const briefing: DecisionBriefing = useMemo(
    () => buildDecisionBriefing(content, payload, currency),
    [content, payload, currency],
  );
  const hasReasoning = briefing.reasoning.trim().length > 0;
  const hasAnchors = briefing.anchors.length > 0;
  const hasPaths = briefing.paths.length > 0;
  const hasRisks = briefing.risks.length > 0;
  return (
    <div className="space-y-5">
      {/* 1. Executive Takeaway */}
      {briefing.takeaway ? (
        <div className="rounded-xl border border-accent/40 bg-accent-soft/15 p-4 md:p-5">
          <div className="t-meta uppercase tracking-wide text-accent font-semibold mb-1.5">
            Executive Takeaway
          </div>
          <div className="t-card text-slate-100">
            {briefing.takeaway.headline}
          </div>
          {briefing.takeaway.subhead ? (
            <div className="t-body text-slate-300 mt-2 leading-[1.7] tracking-[0.01em]">
              {briefing.takeaway.subhead}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 2 + 3. Anchors (right) + Reasoning (left). On mobile they stack. */}
      {hasReasoning || hasAnchors ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8">
          {hasReasoning ? (
            <div className={hasAnchors ? "lg:col-span-8" : "lg:col-span-12"}>
              <div className="t-meta uppercase tracking-wide text-slate-500 mb-2">
                AI Reasoning
              </div>
              <div className="space-y-1.5 t-body text-slate-200">
                {renderMarkdown(briefing.reasoning)}
              </div>
            </div>
          ) : null}

          {hasAnchors ? (
            <aside className={`lg:col-span-4 ${hasReasoning ? "lg:border-l lg:border-line/60 lg:pl-6" : ""}`}>
              <div className="t-meta uppercase tracking-wide text-slate-500 mb-2">
                Decision Anchors
              </div>
              <ul className="divide-y divide-line/40">
                {briefing.anchors.map((a, i) => (
                  <li key={i} className="py-2.5 flex items-start justify-between gap-3">
                    <span className="t-meta text-slate-400 shrink-0">{a.label}</span>
                    <span
                      className={`t-body font-semibold text-right ${
                        a.tone === "good" ? "text-good" :
                        a.tone === "warn" ? "text-warn" :
                        a.tone === "bad"  ? "text-bad"  :
                                            "text-slate-100"
                      }`}
                    >
                      {a.value}
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      ) : null}

      {/* 4. Strategic Paths */}
      {hasPaths ? (
        <div>
          <div className="t-meta uppercase tracking-wide text-slate-500 mb-3">
            Strategic Paths
          </div>
          <StrategicPathsList paths={briefing.paths} currency={currency} />
        </div>
      ) : null}

      {/* 5. Risks & Tradeoffs */}
      {hasRisks ? (
        <div>
          <div className="t-meta uppercase tracking-wide text-slate-500 mb-2">
            Risks &amp; Tradeoffs
          </div>
          <ul className="space-y-2">
            {briefing.risks.map((r, i) => (
              <li
                key={i}
                className={`rounded-lg border px-3 py-2 ${
                  r.tone === "bad"  ? "border-bad/40 bg-bad/5"  :
                  r.tone === "warn" ? "border-warn/40 bg-warn/5" :
                                      "border-line bg-ink-900/30"
                }`}
              >
                <div className={`t-card ${
                  r.tone === "bad"  ? "text-bad"  :
                  r.tone === "warn" ? "text-warn" :
                                      "text-slate-200"
                }`}>
                  {r.label}
                </div>
                <div className="t-body text-slate-300 mt-1.5">
                  {r.text}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function fmtMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency,
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString("en-US")}`;
  }
}

function StrategicPathsList({
  paths,
  currency,
}: {
  paths: StrategicPath[];
  currency: string;
}) {
  const ordered = [...paths].sort((a, b) => tierRank(a.tier) - tierRank(b.tier));
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {ordered.map((p, i) => (
        <PathCard key={i} path={p} currency={currency} />
      ))}
    </div>
  );
}

function tierRank(t: StrategicPath["tier"]): number {
  if (t === "primary") return 0;
  if (t === "high_impact") return 1;
  return 2;
}

function PathCard({
  path: p,
  currency,
}: {
  path: StrategicPath;
  currency: string;
}) {
  const tone = p.tier;
  const border =
    tone === "primary"     ? "border-accent/40 bg-accent-soft/10" :
    tone === "high_impact" ? "border-warn/40 bg-warn/5"           :
                             "border-line bg-ink-900/30";
  const tierLabel =
    tone === "primary"     ? "Primary"     :
    tone === "high_impact" ? "High Impact" :
                             "Low Impact";
  const tierPill =
    tone === "primary"     ? "pill-accent" :
    tone === "high_impact" ? "pill-warn"   :
                             "pill";
  const o = p.option;
  const coverage = Math.round(p.coveragePct * 100);
  return (
    <div className={`rounded-lg border ${border} p-4 flex flex-col gap-2`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={tierPill}>{tierLabel}</span>
        <div className="pill-good">{fmtMoney(o.monthlySavings, currency)}/mo</div>
      </div>
      <div className="t-card text-slate-100">{o.title}</div>
      <div className="t-meta text-slate-400">
        {fmtMoney(o.annualSavings, currency)} per year · covers {coverage}% over {p.horizonMonths}mo
      </div>
      {o.items.length > 0 ? (
        <ul className="t-body text-slate-300 list-disc pl-5 space-y-1 mt-2">
          {o.items.map((it, ii) => (
            <li key={ii}>
              <span className="font-medium">{it.label}</span>
              <span className="text-slate-400"> - {fmtMoney(it.amount, currency)}/mo{it.note ? <> · {it.note}</> : null}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
