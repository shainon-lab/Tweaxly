"use client";

// 7-step Business Profile (Business DNA) wizard. One question per
// screen, soft fade between steps, persistent progress bar, optional
// Skip on every question except industry + business model (those are
// what makes the AI profile genuinely useful).
//
// After step 7 the user hits Finish → wizard PATCHes the full draft,
// flips into a centered "Analyzing your business…" state, calls the
// generate-summary endpoint, then redirects to /dashboard.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  INDUSTRY_OPTIONS, BUSINESS_CATEGORY_OPTIONS,
  BUSINESS_MODEL_OPTIONS, MAIN_GOAL_OPTIONS,
  CUSTOMER_TYPE_OPTIONS, REVENUE_STAGE_OPTIONS, KPI_OPTIONS,
} from "@/lib/businessProfileOptions";

type Draft = {
  industry:         string;
  businessCategory: string;
  businessModels:   string[];
  mainGoal:         string;
  customerType:     string;
  revenueStage:     string;
  biggestChallenge: string;
  importantKpis:    string[];
};

interface Props {
  businessName: string;
  initial: {
    industry:         string | null;
    businessCategory: string | null;
    businessModels:   string[];
    mainGoal:         string | null;
    customerType:     string | null;
    revenueStage:     string | null;
    biggestChallenge: string | null;
    importantKpis:    string[];
  } | null;
}

const TOTAL_STEPS = 8;

export default function OnboardingWizard({ businessName, initial }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>({
    industry:         initial?.industry ?? "",
    businessCategory: initial?.businessCategory ?? "",
    businessModels:   initial?.businessModels ?? [],
    mainGoal:         initial?.mainGoal ?? "",
    customerType:     initial?.customerType ?? "",
    revenueStage:     initial?.revenueStage ?? "",
    biggestChallenge: initial?.biggestChallenge ?? "",
    importantKpis:    initial?.importantKpis ?? [],
  });
  const [submitting,   setSubmitting]   = useState(false);
  const [analyzing,    setAnalyzing]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // Strict steps - industry (1) + business models (3) drive the AI
  // summary generation, so they can't be skipped. The specific
  // business category (2) is also strict because the typeahead is
  // where the user pins their narrow identity. Everything else has
  // a Skip.
  const STRICT_STEPS = new Set([1, 2, 3]);

  // Auto-save the draft to the server every time the user advances.
  // Best-effort - failures don't block the wizard; the final Finish
  // will retry the full PATCH anyway.
  async function persistDraft(next: Draft) {
    try {
      await fetch("/api/business/profile", {
        method:  "PATCH",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify(next),
      });
    } catch { /* best-effort */ }
  }

  function toggle(field: "businessModels" | "importantKpis", v: string) {
    setDraft((d) => {
      const set = new Set(d[field]);
      if (set.has(v)) set.delete(v);
      else set.add(v);
      return { ...d, [field]: Array.from(set) };
    });
  }

  function stepValid(idx: number): boolean {
    switch (idx) {
      case 1: return !!draft.industry.trim();
      case 2: return !!draft.businessCategory.trim();
      case 3: return draft.businessModels.length > 0;
      default: return true;
    }
  }

  async function next() {
    if (!stepValid(step) && STRICT_STEPS.has(step)) {
      setError("This one helps the AI understand the basics - fill it in to continue.");
      return;
    }
    setError(null);
    void persistDraft(draft);
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      await finish();
    }
  }

  function back() {
    if (step > 1) setStep(step - 1);
  }

  // Skip = advance without requiring the current step's input. Strict
  // steps don't expose Skip at all.
  async function skip() {
    setError(null);
    void persistDraft(draft);
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      await finish();
    }
  }

  async function finish() {
    setSubmitting(true);
    setError(null);
    try {
      const patchRes = await fetch("/api/business/profile", {
        method:  "PATCH",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify(draft),
      });
      if (!patchRes.ok) {
        const t = await patchRes.text();
        try { setError(JSON.parse(t).message ?? t) } catch { setError(t) }
        setSubmitting(false);
        return;
      }
      // Flip to the analyzing state, kick off the summary generation,
      // then redirect regardless of summary success (the user can
      // regenerate later from Settings if it failed).
      setAnalyzing(true);
      try {
        await fetch("/api/business/profile/generate-summary", { method: "POST" });
      } catch { /* non-blocking */ }
      router.push("/dashboard");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950">
      {analyzing ? (
        <AnalyzingState businessName={businessName} />
      ) : (
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold">
              Business Profile · About 2 minutes
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Help Tweaxly understand <span className="gradient-text">{businessName}</span>.
            </h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Your answers shape every insight, recommendation, and
              advisor response across the platform. Nothing here is
              locked in - you can edit any of it later from Settings.
            </p>
          </div>

          {/* Progress */}
          <ProgressBar current={step} total={TOTAL_STEPS} />

          {/* Card */}
          <div
            key={step}
            className="mt-5 rounded-2xl border border-line bg-ink-900/60 backdrop-blur p-6 sm:p-8 shadow-xl shadow-black/30 animate-[fadeInUp_220ms_ease-out]"
          >
            {step === 1 ? (
              <StepFrame title="What industry is your business in?" helper="Pick one from the list - or type your own.">
                <input
                  list="ob-industry-list"
                  className="input text-base"
                  value={draft.industry}
                  onChange={(e) => setDraft({ ...draft, industry: e.target.value })}
                  placeholder="e.g. SaaS, Retail, Boutique guitar shop"
                  autoFocus
                />
                <datalist id="ob-industry-list">
                  {INDUSTRY_OPTIONS.map((i) => <option key={i} value={i} />)}
                </datalist>
              </StepFrame>
            ) : null}

            {step === 2 ? (
              <StepFrame title="What kind of business is it, exactly?" helper="Start typing and pick from the list — or enter your own.">
                <Typeahead
                  options={[...BUSINESS_CATEGORY_OPTIONS]}
                  value={draft.businessCategory}
                  onChange={(v) => setDraft({ ...draft, businessCategory: v })}
                  placeholder="e.g. Recording Studio, Jewelry Store, Dental Clinic"
                />
              </StepFrame>
            ) : null}

            {step === 3 ? (
              <StepFrame title="How does your business make money?" helper="Pick any that apply.">
                <ChipGrid
                  values={BUSINESS_MODEL_OPTIONS}
                  selected={draft.businessModels}
                  onToggle={(v) => toggle("businessModels", v)}
                />
              </StepFrame>
            ) : null}

            {step === 4 ? (
              <StepFrame title="What's your main focus right now?" helper="One choice - the AI uses this to rank recommendations.">
                <RadioGroup
                  values={MAIN_GOAL_OPTIONS}
                  selected={draft.mainGoal}
                  onSelect={(v) => setDraft({ ...draft, mainGoal: v })}
                />
              </StepFrame>
            ) : null}

            {step === 5 ? (
              <StepFrame title="Who are your primary customers?" helper="Shapes sales-cycle assumptions and insight phrasing.">
                <RadioGroup
                  values={CUSTOMER_TYPE_OPTIONS}
                  selected={draft.customerType}
                  onSelect={(v) => setDraft({ ...draft, customerType: v })}
                />
              </StepFrame>
            ) : null}

            {step === 6 ? (
              <StepFrame title="What best describes your business stage?" helper="Sets the growth expectation baseline.">
                <RadioGroup
                  values={REVENUE_STAGE_OPTIONS}
                  selected={draft.revenueStage}
                  onSelect={(v) => setDraft({ ...draft, revenueStage: v })}
                />
              </StepFrame>
            ) : null}

            {step === 7 ? (
              <StepFrame title="What's your biggest business challenge right now?" helper="Plain English. This is one of the most valuable signals you can give the AI.">
                <textarea
                  className="input min-h-[120px] text-base leading-relaxed"
                  value={draft.biggestChallenge}
                  onChange={(e) => setDraft({ ...draft, biggestChallenge: e.target.value })}
                  placeholder="e.g. customer acquisition is getting expensive, hiring the right tech is slow, churn is creeping up…"
                  autoFocus
                />
              </StepFrame>
            ) : null}

            {step === 8 ? (
              <StepFrame title="What metrics matter most to you?" helper="Pick any. The advisor leads with these on every answer.">
                <ChipGrid
                  values={KPI_OPTIONS}
                  selected={draft.importantKpis}
                  onToggle={(v) => toggle("importantKpis", v)}
                />
              </StepFrame>
            ) : null}

            {error ? (
              <div className="mt-4 text-sm text-bad">{error}</div>
            ) : null}

            {/* Footer */}
            <div className="mt-7 flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={back}
                disabled={step === 1 || submitting}
                className="text-sm text-slate-400 hover:text-slate-100 px-3 py-2 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                ← Back
              </button>
              <div className="flex items-center gap-2 flex-wrap">
                {!STRICT_STEPS.has(step) ? (
                  <button
                    type="button"
                    onClick={skip}
                    disabled={submitting}
                    className="text-sm text-slate-400 hover:text-slate-100 px-3 py-2 rounded-md transition disabled:opacity-50"
                  >
                    Skip
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={next}
                  disabled={submitting}
                  className="btn-primary text-sm px-5 py-2.5 rounded-md disabled:opacity-60"
                >
                  {submitting
                    ? "Saving…"
                    : step === TOTAL_STEPS ? "Finish & analyze" : "Next"}
                </button>
              </div>
            </div>
          </div>

          {/* Footnote */}
          <div className="mt-4 text-[11px] text-slate-500 text-center">
            Step {step} of {TOTAL_STEPS} · Edits later from Settings → Business Profile
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Pieces
// ────────────────────────────────────────────────────────────────────

function StepFrame({
  title, helper, children,
}: {
  title:  string;
  helper: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold text-white leading-snug">
        {title}
      </h2>
      <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
        {helper}
      </p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div>
      <div className="h-1 rounded-full bg-ink-700/60 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-teal transition-all duration-300"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function ChipGrid<T extends { value: string; label: string }>({
  values, selected, onToggle,
}: {
  values:   readonly T[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.value)}
            className={`text-sm px-3 py-1.5 rounded-full border transition ${
              on
                ? "border-accent/60 bg-accent-soft/50 text-accent"
                : "border-line bg-ink-950/40 text-slate-300 hover:border-accent/40 hover:text-slate-100"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Filtered-suggestion typeahead. Renders an input that shows a soft
// dropdown of options filtered by substring as the user types. Free
// text is accepted (no validation against the list) - the
// suggestions are just hints. Arrow keys + Enter navigate the list.
function Typeahead({
  options, value, onChange, placeholder,
}: {
  options:     string[];
  value:       string;
  onChange:    (v: string) => void;
  placeholder?: string;
}) {
  const [focused,    setFocused]    = useState(false);
  const [activeIdx,  setActiveIdx]  = useState(-1);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options.slice(0, 8); // show a sampling on first focus
    return options
      .filter((o) => o.toLowerCase().includes(q))
      .slice(0, 8);
  }, [value, options]);

  // Reset highlight when filtered set changes.
  useEffect(() => { setActiveIdx(-1) }, [value]);

  function commit(v: string) {
    onChange(v);
    setFocused(false);
    setActiveIdx(-1);
  }

  return (
    <div className="relative">
      <input
        type="text"
        autoFocus
        className="input text-base"
        value={value}
        onChange={(e) => { onChange(e.target.value); setFocused(true) }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          // Small delay so click on a suggestion fires before blur tears it down.
          window.setTimeout(() => setFocused(false), 120);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
            setFocused(true);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(-1, i - 1));
          } else if (e.key === "Enter") {
            if (activeIdx >= 0 && activeIdx < filtered.length) {
              e.preventDefault();
              commit(filtered[activeIdx]);
            }
          } else if (e.key === "Escape") {
            setFocused(false);
          }
        }}
        placeholder={placeholder}
      />
      {focused && filtered.length > 0 ? (
        <div className="absolute left-0 right-0 mt-1 max-h-64 overflow-auto rounded-lg border border-line bg-ink-900/95 backdrop-blur shadow-xl shadow-black/40 z-20">
          {filtered.map((o, i) => {
            const isActive = i === activeIdx;
            return (
              <button
                key={o}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); commit(o); }}
                onMouseEnter={() => setActiveIdx(i)}
                className={`block w-full text-left px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-accent-soft/40 text-white"
                    : "text-slate-200 hover:bg-ink-700/60"
                }`}
              >
                {o}
              </button>
            );
          })}
          <div className="border-t border-line/50 px-3 py-1.5 text-[11px] text-slate-500">
            {value.trim()
              ? "Pick a suggestion or keep your custom entry."
              : "Type to filter — your own wording is fine too."}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RadioGroup<T extends { value: string; label: string }>({
  values, selected, onSelect,
}: {
  values:   readonly T[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {values.map((o) => {
        const on = selected === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onSelect(o.value)}
            className={`text-left px-4 py-3 rounded-lg border transition ${
              on
                ? "border-accent/60 bg-accent-soft/30 text-white"
                : "border-line bg-ink-950/40 text-slate-300 hover:border-accent/40 hover:bg-ink-900/60"
            }`}
          >
            <span className="text-sm font-medium">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AnalyzingState({ businessName }: { businessName: string }) {
  // Cycling status text so the loading screen feels alive while the
  // summary generation runs (typically 3-8s on Opus 4.7).
  const PHASES = useMemo(() => [
    `Reading what you told us about ${businessName}…`,
    "Cross-checking against your live financial data…",
    "Forming the business profile…",
    "Writing your About Your Business summary…",
    "Almost there…",
  ], [businessName]);
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const i = window.setInterval(() => setPhase((p) => Math.min(p + 1, PHASES.length - 1)), 1800);
    return () => window.clearInterval(i);
  }, [PHASES.length]);

  return (
    <div className="w-full max-w-md text-center">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-purple font-semibold mb-3">
        Analyzing your business
      </div>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
        Building your AI Business DNA…
      </h2>
      <p className="mt-3 text-sm text-slate-400 transition-opacity duration-300">
        {PHASES[phase]}
      </p>
      <div className="mt-6 mx-auto w-48 h-1 rounded-full bg-ink-700/60 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-brand-purple via-accent to-brand-teal advisor-sweep-bar" />
      </div>
      <style jsx>{`
        @keyframes advisor-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        :global(.advisor-sweep-bar) {
          animation: advisor-sweep 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
