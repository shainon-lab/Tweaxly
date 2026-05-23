"use client";

// Phase-1 structured advisory layout, v2 - reordered + re-weighted.
//
// Hierarchy (top to bottom, biggest to smallest):
//   1. HERO          - Recommendation + Executive headline (one block)
//                       confidence + reasoning category + stance as a thin
//                       meta line under the headline (chips, not full cards)
//   2. WHY           - driver cards, each carrying optional "📊 data" chips
//                       that show exactly which numbers backed it
//   3. BASED ON      - chip row (overall trust footprint)
//      MISSING DATA  - chip row, only when non-empty
//   4. RISKS         - small dimmer cards last
//
// The previous v1 rendered every section as an equal-weight card, which
// flattened the hierarchy. This version keeps every signal visible but
// pushes the eye through the natural reading order: action → why →
// what it's grounded in → what could go wrong.

import {
  type StructuredAdvice, type AdvisoryStance, type ConfidenceBand,
  REASONING_LABEL,
} from "@/lib/advisorTypes";

const STANCE_STYLES: Record<AdvisoryStance, { ring: string; bg: string; pill: string; label: string }> = {
  yes:         { ring: "border-good/50",      bg: "bg-good/10",        pill: "border-good/40 bg-good/15 text-good",     label: "Recommended" },
  no:          { ring: "border-bad/50",       bg: "bg-bad/10",         pill: "border-bad/40 bg-bad/15 text-bad",        label: "Not recommended" },
  conditional: { ring: "border-warn/50",      bg: "bg-warn/10",        pill: "border-warn/40 bg-warn/15 text-warn",     label: "Conditional" },
  wait:        { ring: "border-warn/50",      bg: "bg-warn/10",        pill: "border-warn/40 bg-warn/15 text-warn",     label: "Wait" },
  info:        { ring: "border-accent/40",    bg: "bg-accent-soft/20", pill: "border-accent/40 bg-accent-soft/30 text-accent", label: "Informational" },
};

const BAND_LABEL: Record<ConfidenceBand, string> = { low: "Low", medium: "Medium", high: "High" };

function confTone(score: number): { ring: string; text: string; bar: string } {
  if (score >= 75) return { ring: "border-good/40",  text: "text-good",  bar: "bg-good" };
  if (score >= 50) return { ring: "border-warn/40",  text: "text-warn",  bar: "bg-warn" };
  return            { ring: "border-bad/40",   text: "text-bad",   bar: "bg-bad" };
}

export default function StructuredAdvisoryView({ data }: { data: StructuredAdvice }) {
  const stance = STANCE_STYLES[data.executiveDecision.stance];
  const conf   = confTone(data.confidence.overall);

  return (
    <div className="space-y-5">
      {/* ─── HERO: recommendation + executive headline ─────────────── */}
      <section className={`relative overflow-hidden rounded-2xl border ${stance.ring} ${stance.bg} px-6 py-7 sm:px-8 sm:py-8`}>
        {/* Soft brand gradient wash so the hero pops without screaming */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 60% at 0% 0%, rgba(167,139,250,0.16), transparent 60%)," +
              "radial-gradient(ellipse 50% 50% at 100% 100%, rgba(34,211,238,0.12), transparent 60%)",
          }}
        />
        <div className="relative">
          {/* Meta line: stance + reasoning category + confidence chip */}
          <div className="flex items-center gap-2 mb-4 flex-wrap text-[10px] uppercase tracking-[0.18em] font-semibold">
            <span className={`px-2 py-0.5 rounded-full border ${stance.pill}`}>
              {stance.label}
            </span>
            <span className="text-slate-500">{REASONING_LABEL[data.reasoningCategory]}</span>
            <span className="ml-auto inline-flex items-center gap-2">
              <span className="h-1.5 w-20 rounded-full bg-ink-700/70 overflow-hidden inline-block">
                <span
                  className={`block h-full ${conf.bar}`}
                  style={{ width: `${data.confidence.overall}%` }}
                  aria-hidden="true"
                />
              </span>
              <span className={`tabular-nums ${conf.text} normal-case tracking-normal`}>
                {data.confidence.overall}% confidence
              </span>
            </span>
          </div>

          {/* Headline (large hero type) */}
          <h2 className="text-2xl sm:text-3xl lg:text-[2rem] font-semibold tracking-tight text-white leading-[1.15]">
            {data.executiveDecision.headline}
          </h2>

          {/* Concrete recommendation sentence, slightly smaller */}
          {data.recommendation && data.recommendation !== data.executiveDecision.headline ? (
            <p className="mt-3 text-base sm:text-lg text-slate-200 leading-snug max-w-2xl">
              {data.recommendation}
            </p>
          ) : null}

          {/* Tiny sub-line: data coverage + forecast reliability bands */}
          <div className="mt-4 flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
            <span>
              Data coverage <span className="text-slate-200 font-semibold">{BAND_LABEL[data.confidence.dataCoverage]}</span>
            </span>
            <span className="text-slate-700">·</span>
            <span>
              Forecast reliability <span className="text-slate-200 font-semibold">{BAND_LABEL[data.confidence.forecastReliability]}</span>
            </span>
          </div>
        </div>
      </section>

      {/* ─── WHY: drivers, with optional data-anchor chips per card ──── */}
      {data.drivers.length > 0 ? (
        <section>
          <SectionHeader>Why</SectionHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            {data.drivers.map((d, i) => (
              <div key={i} className="rounded-xl border border-line bg-ink-900/40 p-4">
                <div className="flex items-center gap-1.5 mb-1.5 text-[10px] uppercase tracking-wider text-accent font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
                  {REASONING_LABEL[d.reasoningType]}
                </div>
                <div className="text-sm font-semibold text-white mb-1">{d.category}</div>
                <div className="text-sm text-slate-300 leading-snug">{d.detail}</div>
                {/* Data anchors - show exactly which numbers from the
                    business backed this driver. Empty array = pure
                    reasoning, no chips rendered. */}
                {d.dataAnchors && d.dataAnchors.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {d.dataAnchors.map((a, j) => (
                      <span
                        key={j}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border border-accent/30 bg-accent-soft/20 text-accent"
                        title="Drawn from your business data"
                      >
                        <span aria-hidden="true">📊</span>
                        {a}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ─── BASED ON + MISSING DATA: chip rows under the drivers ───── */}
      {(data.confidence.basedOn.length > 0 || data.confidence.missingInputs.length > 0) ? (
        <section className="rounded-xl border border-line/60 bg-ink-950/30 p-4 space-y-3">
          {data.confidence.basedOn.length > 0 ? (
            <ChipRow label="Based on" items={data.confidence.basedOn} tone="neutral" />
          ) : null}
          {data.confidence.missingInputs.length > 0 ? (
            <ChipRow label="Important missing data" items={data.confidence.missingInputs} tone="warn" />
          ) : null}
        </section>
      ) : null}

      {/* ─── RISKS: smallest, dimmer, last ──────────────────────────── */}
      {data.risks.length > 0 ? (
        <section>
          <SectionHeader>Risks</SectionHeader>
          <div className="grid sm:grid-cols-2 gap-2">
            {data.risks.map((r, i) => (
              <div key={i} className="rounded-lg border border-warn/25 bg-warn/5 px-3 py-2.5">
                <div className="text-[13px] font-semibold text-warn mb-0.5">{r.label}</div>
                <div className="text-xs text-slate-400 leading-snug">{r.detail}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2 px-1">
      {children}
    </div>
  );
}

function ChipRow({
  label, items, tone,
}: {
  label: string;
  items: string[];
  tone:  "neutral" | "warn";
}) {
  const chipCls = tone === "warn"
    ? "border-warn/35 bg-warn/10 text-warn"
    : "border-line bg-ink-900/60 text-slate-300";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s, i) => (
          <span
            key={i}
            className={`text-[11px] px-2 py-0.5 rounded-full border ${chipCls}`}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
