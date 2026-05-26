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
// Import from the client-safe options module (the main businessProfile
// lib pulls in Prisma + the Anthropic SDK which can't be bundled for
// the browser).
import {
  INDUSTRY_OPTIONS, BUSINESS_CATEGORY_OPTIONS,
  BUSINESS_MODEL_OPTIONS, MAIN_GOAL_OPTIONS,
  CUSTOMER_TYPE_OPTIONS, REVENUE_STAGE_OPTIONS, KPI_OPTIONS,
  AI_PREFERENCE_TOGGLES,
} from "@/lib/businessProfileOptions";

export interface BusinessDnaProps {
  initial: {
    industry:         string | null;
    businessCategory: string | null;
    businessModels:   string[];
    mainGoal:         string | null;
    customerType:     string | null;
    revenueStage:     string | null;
    biggestChallenge: string | null;
    importantKpis:    string[];
    aiSummary:        string | null;
    aiSummaryUpdatedAt: string | null;
    aiContextPreferences: { toggles?: string[]; freeformNote?: string } | null;
    derivedSignals:   string[];
    lastDerivedAt:    string | null;
  } | null;
}

export default function BusinessDnaSection({ initial }: BusinessDnaProps) {
  const [draft, setDraft] = useState(() => ({
    industry:         initial?.industry ?? "",
    businessCategory: initial?.businessCategory ?? "",
    businessModels:   initial?.businessModels ?? [],
    mainGoal:         initial?.mainGoal ?? "",
    customerType:     initial?.customerType ?? "",
    revenueStage:     initial?.revenueStage ?? "",
    biggestChallenge: initial?.biggestChallenge ?? "",
    importantKpis:    initial?.importantKpis ?? [],
    prefToggles:      initial?.aiContextPreferences?.toggles ?? [],
    prefNote:         initial?.aiContextPreferences?.freeformNote ?? "",
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
    // Render order: Business profile (the 7 questions) first → About
    // Your Business (AI summary) → Patterns Tweaxly noticed. Use flex +
    // explicit `order` so the JSX can stay in functional order while the
    // visual order reflects "fill in your data, see the AI take, see
    // what we learned".
    <div className="flex flex-col gap-6">
      {/* ─── About Your Business ─────────────────────────────────── */}
      <div className="card order-2">
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
          <div className="font-medium">About Your Business</div>
          <div className="text-[11px] text-slate-500">
            {summaryUpdatedAt
              ? `Updated ${new Date(summaryUpdatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
              : "Not generated yet"}
          </div>
        </div>
        <div className="text-xs text-slate-400 mb-3 leading-relaxed">
          The AI-generated identity Tweaxly uses across consultation,
          insights and forecasting. Edit freely or regenerate once your
          profile changes.
        </div>
        <textarea
          className="input min-h-[140px] leading-relaxed"
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
          {/* Save button - appears when the textarea has unsaved
              hand-edits. Regenerate auto-saves on its own; this is
              for owner overrides on top of the generated text. */}
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
      </div>

      {/* ─── Patterns Tweaxly noticed (Smart Evolution) ───────────
          Pinned to the bottom of the page (order-5) so it reads as
          the "what the AI has learned" reveal after the owner has
          filled in the form + AI prefs above. */}
      <div className="card order-5">
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
          <div>
            <div className="font-medium">Patterns Tweaxly noticed</div>
            <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Auto-derived from your trailing data + a Claude pass. The advisor uses these alongside your profile on every answer.
            </div>
          </div>
          <button
            type="button"
            onClick={refreshDerivedSignals}
            disabled={derivingSignals}
            className="text-xs px-3 py-1.5 rounded-md border border-accent/40 text-accent bg-transparent hover:bg-accent-soft hover:border-accent hover:text-white transition whitespace-nowrap disabled:opacity-50"
          >
            {derivingSignals ? "Refreshing…" : derivedSignals.length === 0 ? "Run analysis" : "Refresh patterns"}
          </button>
        </div>
        {derivedSignals.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-line bg-ink-950/40 px-4 py-5 text-sm text-slate-400 text-center">
            No patterns analyzed yet. Click <span className="text-slate-200">Run analysis</span> to scan trailing data for seasonality, growth, cash-flow concerns and concentration.
          </div>
        ) : (
          <div className="mt-3 space-y-1.5">
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
      </div>

      {/* ─── Strategic profile fields ────────────────────────────── */}
      <div className="card order-1">
        <div className="font-medium mb-1">Business profile</div>
        <div className="text-xs text-slate-400 mb-5">
          Seven short answers that teach the AI how to think about your
          workspace. The advisor uses these on every question.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Industry */}
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

          {/* Business category - typeahead from a curated SMB list,
              with free-text fallback. Narrower than Industry. */}
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

          {/* Stage */}
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

          {/* Main goal */}
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

          {/* Customer type */}
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

        {/* Business models - multi-select card grid. Cards beat pill
            chips for multi-select: the checkbox + label pattern is
            instantly readable as "click to toggle" and the consistent
            row heights make the section feel orderly even when labels
            wrap. */}
        <div className="mt-5">
          <label className="label">
            How does the business make money? <span className="text-slate-500 normal-case font-normal">(pick any)</span>
          </label>
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
        </div>

        {/* Important KPIs - multi-select card grid (same pattern). */}
        <div className="mt-5">
          <label className="label">
            KPIs that matter most <span className="text-slate-500 normal-case font-normal">(pick any)</span>
          </label>
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
        </div>

        {/* Biggest challenge - free text */}
        <div className="mt-5">
          <label className="label">Biggest current challenge</label>
          <textarea
            className="input min-h-[80px]"
            value={draft.biggestChallenge}
            onChange={(e) => setDraft({ ...draft, biggestChallenge: e.target.value })}
            placeholder="e.g. customer acquisition is getting expensive, churn is creeping up, hiring the right tech is slow…"
          />
        </div>

      </div>

      {/* ─── AI Context Preferences (own card, last on the page) ──
          Pulled out of the Business profile card so the advisor-tuning
          area reads as a distinct decision the owner is making  - 
          "what should the AI keep in mind?" - rather than buried at
          the bottom of the profile form. The Save button lives here
          since this is the last section; saveAll() flushes the whole
          shared draft (profile + AI prefs) in one POST. */}
      <div className="card order-4">
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
          <div className="font-medium">AI Context Preferences</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-brand-purple font-semibold">
            Optional
          </div>
        </div>
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

        <div className="mt-5 flex items-center justify-end gap-3 flex-wrap">
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
    </div>
  );
}

// ─── SelectCard ──────────────────────────────────────────────────────
// Card-style multi-select option. Wraps a checkbox-look indicator + a
// label inside a button so the whole row is the hit target. Used by
// the Business model / KPI / AI preference toggles above to give the
// section a calm grid look instead of a wall of pill chips.
function SelectCard({
  selected, onClick, label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="checkbox"
      aria-checked={selected}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition ${
        selected
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
