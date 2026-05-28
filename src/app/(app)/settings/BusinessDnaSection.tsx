"use client";

// "About Your Business" section in Settings → Business Profile.
//
// Two stacked panels:
//   1. AI-generated summary card with Regenerate button + editable
//      textarea (the owner can rewrite the AI's draft).
//   2. The 7 strategic profile fields - dropdown / multi-select chips
//      / free text - that drive the summary + every Claude prompt.
//
// The form auto-saves on Save (one batched PATCH); the summary is
// generated on demand via the Regenerate button. Empty/partial
// profiles still render - the wizard can land users here and they
// can complete it incrementally.

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
// Import from the client-safe options module (the main businessProfile
// lib pulls in Prisma + the Anthropic SDK which can't be bundled for
// the browser).
import {
  INDUSTRY_OPTIONS, BUSINESS_CATEGORY_OPTIONS,
  BUSINESS_MODEL_OPTIONS, MAIN_GOAL_OPTIONS,
  CUSTOMER_TYPE_OPTIONS, REVENUE_STAGE_OPTIONS, KPI_OPTIONS,
  AI_PREFERENCE_TOGGLES,
  BUSINESS_CHALLENGE_OPTIONS, BUSINESS_CHALLENGE_OTHER, BUSINESS_CHALLENGE_MAX,
} from "@/lib/businessProfileOptions";

export interface BusinessDnaProps {
  initial: {
    industry:           string | null;
    businessCategory:   string | null;
    businessModels:     string[];
    mainGoal:           string | null;
    customerType:       string | null;
    revenueStage:       string | null;
    biggestChallenge:   string | null;
    businessChallenges: string[];
    importantKpis:      string[];
    aiSummary:          string | null;
    aiSummaryUpdatedAt: string | null;
    aiContextPreferences: { toggles?: string[]; freeformNote?: string } | null;
    derivedSignals:     string[];
    lastDerivedAt:      string | null;
  } | null;
}

export default function BusinessDnaSection({ initial }: BusinessDnaProps) {
  const [draft, setDraft] = useState(() => ({
    industry:           initial?.industry ?? "",
    businessCategory:   initial?.businessCategory ?? "",
    businessModels:     initial?.businessModels ?? [],
    mainGoal:           initial?.mainGoal ?? "",
    customerType:       initial?.customerType ?? "",
    revenueStage:       initial?.revenueStage ?? "",
    biggestChallenge:   initial?.biggestChallenge ?? "",
    businessChallenges: initial?.businessChallenges ?? [],
    importantKpis:      initial?.importantKpis ?? [],
    prefToggles:        initial?.aiContextPreferences?.toggles ?? [],
    prefNote:           initial?.aiContextPreferences?.freeformNote ?? "",
  }));
  const [summary, setSummary]               = useState(initial?.aiSummary ?? "");
  const [summaryUpdatedAt, setSummaryAt]    = useState(initial?.aiSummaryUpdatedAt ?? null);
  const [saving, setSaving]                 = useState(false);
  const [savedFlash, setSavedFlash]         = useState(false);
  const [generating, setGenerating]         = useState(false);
  const [err, setErr]                       = useState<string | null>(null);
  // summaryDirty - true after a regenerate (the new text is owner-
  // visible but not yet stored as a manual override) AND after any
  // hand-edit. Drives the "Save summary" button + the unsaved-
  // changes hint.
  const [summaryDirty, setSummaryDirty]     = useState(false);
  const [summarySaving, setSummarySaving]   = useState(false);

  async function saveSummary() {
    setSummarySaving(true);
    setErr(null);
    try {
      const res  = await fetch("/api/business/profile/save-summary", {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ summary }),
      });
      const data = await res.json().catch(() => ({} as { aiSummaryUpdatedAt?: string; message?: string }));
      if (!res.ok) {
        setErr(data.message ?? "Couldn't save - try again in a moment.");
        return;
      }
      if (data.aiSummaryUpdatedAt) setSummaryAt(data.aiSummaryUpdatedAt);
      setSummaryDirty(false);
    } finally {
      setSummarySaving(false);
    }
  }

  // Smart Evolution - the auto-derived signals + their refresh state.
  const [derivedSignals, setDerivedSignals]     = useState<string[]>(initial?.derivedSignals ?? []);
  const [lastDerivedAt,  setLastDerivedAt]      = useState<string | null>(initial?.lastDerivedAt ?? null);
  const [derivingSignals, setDerivingSignals]   = useState(false);

  async function refreshDerivedSignals() {
    setDerivingSignals(true);
    setErr(null);
    try {
      const res = await fetch("/api/business/profile/derive-signals", { method: "POST" });
      const data = await res.json().catch(() => ({} as { signals?: string[]; message?: string }));
      if (!res.ok || !Array.isArray(data.signals)) {
        setErr(data.message ?? "Couldn't refresh patterns. Try again in a moment.");
        return;
      }
      setDerivedSignals(data.signals);
      setLastDerivedAt(new Date().toISOString());
    } finally {
      setDerivingSignals(false);
    }
  }

  // Lazy auto-refresh - fire ONCE on first mount when the profile is
  // substantive but has never been analyzed. This gives users their
  // first set of derived patterns the first time they open Settings
  // after completing the wizard, without nagging them on every visit.
  const autoFiredRef = useRef(false);
  const hasMinimumMount = !!(initial?.industry && initial?.businessModels?.length);
  useEffect(() => {
    if (autoFiredRef.current) return;
    if (!hasMinimumMount) return;
    if (lastDerivedAt) return;          // already done at least once
    if (derivingSignals) return;
    autoFiredRef.current = true;
    void refreshDerivedSignals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMinimumMount, lastDerivedAt]);

  const hasMinimum = !!draft.industry && draft.businessModels.length > 0;

  function toggle(field: "businessModels" | "importantKpis" | "prefToggles", value: string) {
    setDraft((d) => {
      const set = new Set(d[field]);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...d, [field]: Array.from(set) };
    });
  }

  // Separate toggle for businessChallenges - enforces the max-3 cap and
  // clears the biggestChallenge free-text when "other" is deselected
  // so we don't keep a hidden value around.
  function toggleChallenge(value: string) {
    setDraft((d) => {
      const set = new Set(d.businessChallenges);
      if (set.has(value)) {
        set.delete(value);
        if (value === BUSINESS_CHALLENGE_OTHER) {
          return { ...d, businessChallenges: Array.from(set), biggestChallenge: "" };
        }
      } else {
        if (set.size >= BUSINESS_CHALLENGE_MAX) return d;
        set.add(value);
      }
      return { ...d, businessChallenges: Array.from(set) };
    });
  }

  async function saveAll() {
    setSaving(true);
    setErr(null);
    try {
      const res  = await fetch("/api/business/profile", {
        method:  "PATCH",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({
          ...draft,
          aiContextPreferences: {
            toggles:      draft.prefToggles,
            freeformNote: draft.prefNote,
          },
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        try { setErr(JSON.parse(t).message ?? t) } catch { setErr(t) }
        return;
      }
      // If the user also edited the summary text, persist that as a
      // manual override. The PATCH endpoint doesn't accept aiSummary
      // (that's generated server-side), so we use a tiny direct
      // override: re-call the API with the summary in a follow-up
      // call. For now we just keep it local - manual summary edits
      // persist via the regenerate endpoint flow once the user hits
      // Regenerate. (TODO: add a dedicated PATCH path for manual
      // summary edits.)
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function regenerate() {
    if (!hasMinimum) {
      setErr("Fill in industry and at least one business model first.");
      return;
    }
    setGenerating(true);
    setErr(null);
    try {
      // Save current fields first so the generator sees fresh values.
      await fetch("/api/business/profile", {
        method:  "PATCH",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({
          ...draft,
          aiContextPreferences: {
            toggles:      draft.prefToggles,
            freeformNote: draft.prefNote,
          },
        }),
      });
      const res = await fetch("/api/business/profile/generate-summary", { method: "POST" });
      const data = await res.json().catch(() => ({} as { summary?: string; message?: string }));
      if (!res.ok || !data.summary) {
        setErr(data.message ?? "Could not generate summary - try again in a moment.");
        return;
      }
      setSummary(data.summary);
      setSummaryAt(new Date().toISOString());
      setSummaryDirty(false);
    } finally {
      setGenerating(false);
    }
  }

  return (
    // Accordion layout. Seven sections, each its own collapsible panel.
    // Order + default-open state per design:
    //   1. Business profile           - OPEN
    //   2. About Your Business        - OPEN
    //   3. Business Biggest Challenges - CLOSED  (pick up to 3 + Other)
    //   4. How does the business make money? - CLOSED
    //   5. KPIs that matter most      - CLOSED
    //   6. AI Context Preferences     - CLOSED
    //   7. Patterns Tweaxly noticed   - CLOSED
    //
    // Save button lives in a footer below all sections so it's always
    // reachable, regardless of which panels are open.
    <div className="flex flex-col gap-3">
      {/* 1. Business profile (open) ─────────────────────────────── */}
      <AccordionCard title="Business profile" defaultOpen>
        <div className="text-xs text-slate-400 mb-5">
          The core answers the AI uses on every question. Pick what fits;
          skip what doesn't.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label">Industry</label>
            <input
              list="industry-list"
              className="input"
              value={draft.industry}
              onChange={(e) => setDraft({ ...draft, industry: e.target.value })}
              placeholder="e.g. SaaS, Retail, Music"
            />
            <datalist id="industry-list">
              {INDUSTRY_OPTIONS.map((i) => <option key={i} value={i} />)}
            </datalist>
          </div>

          <div>
            <label className="label">Specific business category</label>
            <input
              list="business-category-list"
              className="input"
              value={draft.businessCategory}
              onChange={(e) => setDraft({ ...draft, businessCategory: e.target.value })}
              placeholder="e.g. Recording Studio, Jewelry Store, Dental Clinic"
            />
            <datalist id="business-category-list">
              {BUSINESS_CATEGORY_OPTIONS.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div>
            <label className="label">Business stage</label>
            <select
              className="input"
              value={draft.revenueStage}
              onChange={(e) => setDraft({ ...draft, revenueStage: e.target.value })}
            >
              <option value=""> -  pick one  - </option>
              {REVENUE_STAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Main focus right now</label>
            <select
              className="input"
              value={draft.mainGoal}
              onChange={(e) => setDraft({ ...draft, mainGoal: e.target.value })}
            >
              <option value=""> -  pick one  - </option>
              {MAIN_GOAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Primary customers</label>
            <select
              className="input"
              value={draft.customerType}
              onChange={(e) => setDraft({ ...draft, customerType: e.target.value })}
            >
              <option value=""> -  pick one  - </option>
              {CUSTOMER_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

      </AccordionCard>

      {/* 2. About Your Business (open) ──────────────────────────── */}
      <AccordionCard
        title="About Your Business"
        defaultOpen
        aside={
          <span className="text-[11px] text-slate-500">
            {summaryUpdatedAt
              ? `Updated ${new Date(summaryUpdatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
              : "Not generated yet"}
          </span>
        }
      >
        <div className="text-xs text-slate-400 mb-3 leading-relaxed">
          The AI-generated identity Tweaxly uses across consultation,
          insights and forecasting. Edit freely or regenerate once your
          profile changes.
        </div>
        <textarea
          className="input min-h-[140px] leading-[1.7] tracking-[0.01em]"
          value={summary}
          onChange={(e) => { setSummary(e.target.value); setSummaryDirty(true) }}
          placeholder={hasMinimum
            ? "Click Regenerate to have the AI write a summary based on your profile."
            : "Fill in your industry and business model below, then come back to regenerate."}
        />
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={regenerate}
            disabled={generating || !hasMinimum || summarySaving}
            className="text-sm px-4 py-2 rounded-md border border-accent/40 bg-accent-soft/30 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition disabled:opacity-50"
          >
            {generating ? "Analyzing…" : summary ? "Regenerate with AI" : "Generate with AI"}
          </button>
          {summaryDirty ? (
            <>
              <button
                type="button"
                onClick={saveSummary}
                disabled={summarySaving || generating}
                className="btn-primary text-sm px-4 py-2 rounded-md disabled:opacity-50"
              >
                {summarySaving ? "Saving…" : "Save summary"}
              </button>
              <span className="text-[11px] text-warn">
                Unsaved edits - Regenerate will overwrite them.
              </span>
            </>
          ) : null}
        </div>
      </AccordionCard>

      {/* 3. Business Biggest Challenges (closed) ───────────────────
          Multi-select with a max of 3. The final "Other" option, when
          selected, reveals the biggestChallenge free-text field so the
          owner can describe a challenge that doesn't fit a preset. */}
      <AccordionCard
        title="Business Biggest Challenges"
        aside={
          <span className="text-[11px] text-slate-500">
            (up to {BUSINESS_CHALLENGE_MAX}) · {draft.businessChallenges.length}/{BUSINESS_CHALLENGE_MAX}
          </span>
        }
      >
        <div className="text-xs text-slate-400 mb-3 leading-relaxed">
          Pick up to {BUSINESS_CHALLENGE_MAX} that match your reality. The AI weighs every answer against these.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {BUSINESS_CHALLENGE_OPTIONS.map((o) => {
            const selected   = draft.businessChallenges.includes(o.value);
            const atCap      = draft.businessChallenges.length >= BUSINESS_CHALLENGE_MAX;
            const disabled   = !selected && atCap;
            return (
              <SelectCard
                key={o.value}
                selected={selected}
                disabled={disabled}
                onClick={() => toggleChallenge(o.value)}
                label={o.label}
              />
            );
          })}
        </div>
        {draft.businessChallenges.includes(BUSINESS_CHALLENGE_OTHER) ? (
          <div className="mt-4">
            <label className="label">Describe your "other" challenge</label>
            <textarea
              className="input min-h-[80px]"
              value={draft.biggestChallenge}
              onChange={(e) => setDraft({ ...draft, biggestChallenge: e.target.value })}
              placeholder="e.g. customer acquisition is getting expensive, churn is creeping up, hiring the right tech is slow…"
              maxLength={500}
            />
          </div>
        ) : null}
      </AccordionCard>

      {/* 4. How does the business make money? (closed) ──────────── */}
      <AccordionCard
        title="How does the business make money?"
        aside={<span className="text-[11px] text-slate-500">(pick any)</span>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {BUSINESS_MODEL_OPTIONS.map((o) => (
            <SelectCard
              key={o.value}
              selected={draft.businessModels.includes(o.value)}
              onClick={() => toggle("businessModels", o.value)}
              label={o.label}
            />
          ))}
        </div>
      </AccordionCard>

      {/* 5. KPIs that matter most (closed) ──────────────────────── */}
      <AccordionCard
        title="KPIs that matter most"
        aside={<span className="text-[11px] text-slate-500">(pick any)</span>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {KPI_OPTIONS.map((o) => (
            <SelectCard
              key={o.value}
              selected={draft.importantKpis.includes(o.value)}
              onClick={() => toggle("importantKpis", o.value)}
              label={o.label}
            />
          ))}
        </div>
      </AccordionCard>

      {/* 6. AI Context Preferences (closed) ─────────────────────── */}
      <AccordionCard
        title="AI Context Preferences"
        aside={
          <span className="text-[10px] uppercase tracking-[0.18em] text-brand-purple font-semibold">
            Optional
          </span>
        }
      >
        <div className="text-xs text-slate-400 mb-4 leading-relaxed">
          Biases the advisor will honour on every answer - tone, ranking,
          and risk posture. Skip if you want the AI to stay neutral.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {AI_PREFERENCE_TOGGLES.map((o) => (
            <SelectCard
              key={o.value}
              selected={draft.prefToggles.includes(o.value)}
              onClick={() => toggle("prefToggles", o.value)}
              label={o.label}
            />
          ))}
        </div>

        <div className="mt-4">
          <label className="label">Anything else for the AI to keep in mind?</label>
          <textarea
            className="input min-h-[80px]"
            value={draft.prefNote}
            onChange={(e) => setDraft({ ...draft, prefNote: e.target.value })}
            placeholder="e.g. we're bootstrapped - never suggest taking on debt; lean toward retention over new-customer growth."
            maxLength={1000}
          />
        </div>
      </AccordionCard>

      {/* 7. Patterns Tweaxly noticed (closed) ───────────────────── */}
      <AccordionCard
        title="Patterns Tweaxly noticed"
        aside={
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); refreshDerivedSignals(); }}
            disabled={derivingSignals}
            className="text-[11px] px-2.5 py-1 rounded-md border border-accent/40 text-accent bg-transparent hover:bg-accent-soft hover:border-accent hover:text-white transition whitespace-nowrap disabled:opacity-50"
          >
            {derivingSignals ? "Refreshing…" : derivedSignals.length === 0 ? "Run analysis" : "Refresh"}
          </button>
        }
      >
        <div className="text-xs text-slate-400 mb-3 leading-relaxed">
          Auto-derived from your trailing data + a Claude pass. The advisor uses these alongside your profile on every answer.
        </div>
        {derivedSignals.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-ink-950/40 px-4 py-5 text-sm text-slate-400 text-center">
            No patterns analyzed yet. Click <span className="text-slate-200">Run analysis</span> to scan trailing data for seasonality, growth, cash-flow concerns and concentration.
          </div>
        ) : (
          <div className="space-y-1.5">
            {derivedSignals.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-200 leading-snug">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}
        {lastDerivedAt ? (
          <div className="mt-3 text-[11px] text-slate-500">
            Last refreshed {new Date(lastDerivedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </div>
        ) : null}
      </AccordionCard>

      {/* Save footer - lives OUTSIDE the accordions so the primary
          action is always reachable no matter which panels are open.
          saveAll() flushes the whole shared draft (profile + AI prefs)
          in one POST. */}
      <div className="mt-2 flex items-center justify-end gap-3 flex-wrap">
        {err ? <span className="text-sm text-bad mr-auto">{err}</span> : null}
        {savedFlash ? <span className="text-sm text-good">Saved ✓</span> : null}
        <button
          type="button"
          onClick={saveAll}
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>
  );
}

// ─── AccordionCard ──────────────────────────────────────────────────
// Collapsible card with summary row (title + optional aside content +
// chevron) and a children body. Uses native <details>/<summary> so
// open/closed state is per-element and survives without any React
// useState. Aside content stops summary clicks from bubbling so
// interactive controls (like the Patterns "Refresh" button) can live
// in the header without toggling the accordion.
function AccordionCard({
  title, aside, defaultOpen, children,
}: {
  title:        string;
  aside?:       React.ReactNode;
  defaultOpen?: boolean;
  children:     React.ReactNode;
}) {
  return (
    <details open={!!defaultOpen} className="group card !p-0 overflow-hidden">
      <summary className="cursor-pointer list-none select-none px-5 py-4 flex items-center justify-between gap-3 hover:bg-ink-900/40 transition">
        <div className="flex items-baseline gap-3 flex-wrap min-w-0">
          <span className="font-medium text-slate-100 truncate">{title}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {aside}
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-line bg-ink-900/60 text-slate-300 group-hover:text-slate-100 group-hover:border-accent/50 group-hover:bg-accent-soft/20 transition group-open:rotate-180"
          >
            <ChevronDown size={16} strokeWidth={2} />
          </span>
        </div>
      </summary>
      <div className="px-5 pb-5 pt-1 border-t border-line/40">
        {children}
      </div>
    </details>
  );
}

// ─── SelectCard ──────────────────────────────────────────────────────
// Card-style multi-select option. Wraps a checkbox-look indicator + a
// label inside a button so the whole row is the hit target. Used by
// the Business model / KPI / AI preference toggles above to give the
// section a calm grid look instead of a wall of pill chips.
function SelectCard({
  selected, onClick, label, disabled,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  // True when the card is unselected AND a parent max-selection cap is
  // reached. Renders dimmed + non-interactive so the user can see the
  // option exists but understands they're already at the cap.
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      role="checkbox"
      aria-checked={selected}
      aria-disabled={disabled}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition ${
        disabled
          ? "border-line bg-ink-900/20 text-slate-500 cursor-not-allowed opacity-50"
          : selected
          ? "border-accent bg-accent-soft/30 text-slate-100"
          : "border-line bg-ink-900/30 text-slate-300 hover:border-accent/40 hover:text-slate-100"
      }`}
    >
      <span
        aria-hidden="true"
        className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition ${
          selected ? "border-accent bg-accent" : "border-line"
        }`}
      >
        {selected ? (
          <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2.5 6.5 5 9 9.5 3.5" />
          </svg>
        ) : null}
      </span>
      <span className="text-sm leading-tight">{label}</span>
    </button>
  );
}
