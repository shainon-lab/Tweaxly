"use client";

// New Consultation view — the AI business advisor entry point. Layout
// reads top-to-bottom: intro card → example question pills → input area
// with gradient "Start Consultation" CTA → the response cards once an
// answer comes back. No chat bubbles, no sidebar, no clutter.

import { useState, useTransition, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { renderMarkdown } from "./markdown";
import type {
  RecommendedConsultation,
  StrategicSituation,
  TodaysFocus,
} from "@/lib/consultationFocus";
import {
  buildDecisionBriefing,
  type DecisionBriefing,
  type StrategicPath,
} from "@/lib/decisionBriefing";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  payload: string | null;
  createdAt: string;
};

type Active = {
  id: string;
  title: string;
  messages: Msg[];
};

// Placeholder for the freeform consultation textarea. The conversational
// framing reinforces the AI-advisor positioning over a generic chat box.
const PLACEHOLDER =
  "e.g. \"Why did profitability decline this quarter?\" or \"Can I safely hire another employee?\"";

// Example prompts shown under the freeform input to seed thinking
// without committing the user to any specific question.
const FREEFORM_EXAMPLES = [
  "Why did profitability decline this quarter?",
  "Can I safely hire another employee?",
  "What is currently hurting growth the most?",
  "Where is my biggest unnecessary expense?",
];

function fmtMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency,
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

// ResponseBriefing — structured executive briefing built from a
// consultation response. Replaces the old single-blob "Advisor
// analysis" render. Splits the response into:
//   - Executive Takeaway (top)
//   - Decision Anchors + AI Reasoning (two-column)
//   - Strategic Paths (tiered cards)
//   - Risks & Tradeoffs (collected from option tradeoffs + warnings)
function ResponseBriefing({
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
          <div className="text-[10px] uppercase tracking-wide text-accent font-semibold mb-1">
            Executive Takeaway
          </div>
          <div className="text-base md:text-lg font-semibold text-slate-100 leading-snug">
            {briefing.takeaway.headline}
          </div>
          {briefing.takeaway.subhead ? (
            <div className="text-sm text-slate-300 mt-1.5 leading-relaxed">
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
              <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">
                AI Reasoning
              </div>
              <div className="space-y-1.5 text-sm text-slate-200">
                {renderMarkdown(briefing.reasoning)}
              </div>
            </div>
          ) : null}

          {hasAnchors ? (
            <aside className={`lg:col-span-4 ${hasReasoning ? "lg:border-l lg:border-line/60 lg:pl-6" : ""}`}>
              <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">
                Decision Anchors
              </div>
              <ul className="divide-y divide-line/40">
                {briefing.anchors.map((a, i) => (
                  <li key={i} className="py-2.5 flex items-start justify-between gap-3">
                    <span className="text-xs text-slate-400 shrink-0">{a.label}</span>
                    <span
                      className={`text-sm font-medium text-right ${
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
          <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-3">
            Strategic Paths
          </div>
          <StrategicPathsList paths={briefing.paths} currency={currency} />
        </div>
      ) : null}

      {/* 5. Risks & Tradeoffs */}
      {hasRisks ? (
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">
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
                <div className={`text-xs font-medium ${
                  r.tone === "bad"  ? "text-bad"  :
                  r.tone === "warn" ? "text-warn" :
                                      "text-slate-200"
                }`}>
                  {r.label}
                </div>
                <div className="text-xs text-slate-300 leading-relaxed mt-0.5">
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

// Strategic paths list — tiered visual hierarchy so the user
// immediately sees which path is primary vs high-impact vs low-impact.
function StrategicPathsList({
  paths,
  currency,
}: {
  paths: StrategicPath[];
  currency: string;
}) {
  const primary    = paths.filter((p) => p.tier === "primary");
  const highImpact = paths.filter((p) => p.tier === "high_impact");
  const lowImpact  = paths.filter((p) => p.tier === "low_impact");
  return (
    <div className="space-y-4">
      {primary.length > 0 ? (
        <PathTierBlock label="Primary Recommendation" paths={primary} currency={currency} tone="primary" />
      ) : null}
      {highImpact.length > 0 ? (
        <PathTierBlock label="High-Impact Options" paths={highImpact} currency={currency} tone="warn" />
      ) : null}
      {lowImpact.length > 0 ? (
        <PathTierBlock label="Low-Impact Options" paths={lowImpact} currency={currency} tone="neutral" />
      ) : null}
    </div>
  );
}

function PathTierBlock({
  label,
  paths,
  currency,
  tone,
}: {
  label: string;
  paths: StrategicPath[];
  currency: string;
  tone: "primary" | "warn" | "neutral";
}) {
  const labelClass =
    tone === "primary" ? "text-accent" :
    tone === "warn"    ? "text-warn"   :
                         "text-slate-400";
  return (
    <div>
      <div className={`text-[10px] uppercase tracking-wide font-semibold mb-2 ${labelClass}`}>
        {label}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {paths.map((p, i) => (
          <PathCard key={i} path={p} currency={currency} tone={tone} />
        ))}
      </div>
    </div>
  );
}

function PathCard({
  path: p,
  currency,
  tone,
}: {
  path: StrategicPath;
  currency: string;
  tone: "primary" | "warn" | "neutral";
}) {
  const border =
    tone === "primary" ? "border-accent/40 bg-accent-soft/10" :
    tone === "warn"    ? "border-warn/40 bg-warn/5"           :
                         "border-line bg-ink-900/30";
  const o = p.option;
  const coverage = Math.round(p.coveragePct * 100);
  return (
    <div className={`rounded-lg border ${border} p-4 flex flex-col gap-2`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="font-medium text-sm text-slate-100">{o.title}</div>
        <div className="pill-good">{fmtMoney(o.monthlySavings, currency)}/mo</div>
      </div>
      <div className="text-xs text-slate-400">
        {fmtMoney(o.annualSavings, currency)} per year · covers {coverage}% over {p.horizonMonths}mo
      </div>
      {o.items.length > 0 ? (
        <ul className="text-xs text-slate-300 list-disc pl-4 space-y-0.5 mt-1">
          {o.items.map((it, ii) => (
            <li key={ii}>
              <span className="font-medium">{it.label}</span>
              <span className="text-slate-400"> — {fmtMoney(it.amount, currency)}/mo{it.note ? <> · {it.note}</> : null}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function ConsultationClient({
  active: initialActive,
  currency,
  claudeEnabled,
  focus,
  recommended,
  suggested,
  initialDraft,
}: {
  active: Active | null;
  currency: string;
  claudeEnabled: boolean;
  focus: TodaysFocus | null;
  recommended: RecommendedConsultation | null;
  suggested: StrategicSituation[];
  initialDraft?: string;
}) {
  const router = useRouter();
  const [active, setActive] = useState<Active | null>(initialActive);
  const [draft, setDraft] = useState(initialDraft ?? "");
  const [sending, setSending] = useState(false);
  const [, startTransition] = useTransition();
  const responseRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // If we landed via ?q= (a "Consult AI" link from a Business Signal),
  // focus the textarea so the user can edit immediately.
  useEffect(() => {
    if (initialDraft && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [initialDraft]);

  useEffect(() => {
    setActive(initialActive);
  }, [initialActive?.id, initialActive?.messages.length]);

  // Auto-scroll into view when a fresh response arrives.
  useEffect(() => {
    if (active && responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [active?.messages.length]);

  async function send(text?: string) {
    const message = (text ?? draft).trim();
    if (!message || sending) return;
    setSending(true);
    try {
      // Every Start Consultation creates a fresh thread — never re-uses
      // a previous one. That way each question shows up as its own row
      // in Consultation History.
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) { alert(await res.text()); return; }
      const data = await res.json();
      const fresh = data.consultation as Active;
      setActive(fresh);
      setDraft("");
      // After a submit we drop any ?q= that came from a Business Signal
      // link so a reload doesn't re-prefill the textarea with the same
      // question. Replace (not push) keeps Back behavior sane.
      if (typeof window !== "undefined" && window.location.search) {
        router.replace("/consultation");
      }
      // Don't push ?id= into the URL — the page is "start a new
      // consultation", not "edit consultation X". On reload we'll
      // happily land back on the empty intro screen.
      startTransition(() => router.refresh());
    } finally {
      setSending(false);
    }
  }

  // The most recent question + the most recent assistant reply for display.
  const lastUserMsg = active?.messages.slice().reverse().find((m) => m.role === "user") ?? null;
  const lastAssistantMsg = active?.messages.slice().reverse().find((m) => m.role === "assistant") ?? null;
  const hasResponse = lastAssistantMsg != null;

  return (
    <div className="space-y-6">
      {!claudeEnabled ? (
        <div className="card border-warn/40 bg-warn/5">
          <div className="flex items-start gap-3">
            <span className="pill-warn shrink-0 mt-0.5">setup needed</span>
            <div className="text-sm text-slate-200 leading-relaxed">
              <span className="font-medium">Free-form Q&amp;A needs the Claude API integration enabled.</span>{" "}
              Right now you&apos;ll get the deterministic fallback advisor (savings / growth / runway / general). To unlock real free-form answers, get an API key at{" "}
              <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="text-accent hover:underline">console.anthropic.com</a>,
              set <code className="text-slate-300 bg-ink-700/60 px-1 rounded">ANTHROPIC_API_KEY</code>, and restart.
            </div>
          </div>
        </div>
      ) : null}

      {/* Arrival mode — if the user came in with a prefilled question
          (?q= from Analyze / Investigate / Explain This elsewhere),
          the screen pivots: the freeform conversation leads, and the
          hero is tucked behind a disclosure. The user's intent is the
          priority, not the AI's. */}
      {initialDraft ? (
        <>
          <FreeformConsultation
            textareaRef={textareaRef}
            draft={draft}
            setDraft={setDraft}
            sending={sending}
            onSend={() => void send()}
            arrivalMode
          />

          {recommended ? (
            <details className="rounded-xl border border-line bg-ink-900/30 px-4 py-3">
              <summary className="cursor-pointer text-sm text-slate-300 hover:text-slate-100">
                Or pivot to what the AI flagged today
              </summary>
              <div className="mt-3">
                <RecommendedConsultationCard
                  rec={recommended}
                  suggested={suggested}
                  onConsult={() => void send(recommended.question)}
                  onPickSuggested={(q) => void send(q)}
                  disabled={sending}
                />
              </div>
            </details>
          ) : null}
        </>
      ) : (
        <>
          {/* One unified hero — main AI recommendation on the left,
              lightweight related directions on the right. Replaces
              the previous stacked Recommended + Suggested sections. */}
          {recommended ? (
            <RecommendedConsultationCard
              rec={recommended}
              suggested={suggested}
              onConsult={() => void send(recommended.question)}
              onPickSuggested={(q) => void send(q)}
              disabled={sending}
            />
          ) : null}

          {/* Freeform consultation — always-visible major element,
              calm container so it doesn't compete with the hero. */}
          <FreeformConsultation
            textareaRef={textareaRef}
            draft={draft}
            setDraft={setDraft}
            sending={sending}
            onSend={() => void send()}
          />
        </>
      )}

      {/* Loading shimmer while we wait for the advisor */}
      {sending ? (
        <div className="rounded-2xl border border-line bg-ink-900/40 p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex w-7 h-7 rounded-full bg-ink-700 text-accent border border-accent/40 items-center justify-center text-xs font-medium">AI</span>
            <div className="text-sm text-slate-300 italic">Analyzing your data…</div>
          </div>
          <div className="mt-4 space-y-2 animate-pulse">
            <div className="h-3 rounded bg-ink-700/60 w-5/6" />
            <div className="h-3 rounded bg-ink-700/60 w-3/4" />
            <div className="h-3 rounded bg-ink-700/60 w-2/3" />
          </div>
        </div>
      ) : null}

      {/* Response card — the most recent Q&A. Older Q&As live on the
          Consultation History tab; this view keeps focus on the latest. */}
      {hasResponse && lastUserMsg && lastAssistantMsg ? (
        <div ref={responseRef} className="space-y-4">
          {/* Question header */}
          <div className="rounded-xl border border-accent/30 bg-accent-soft/30 px-4 py-3">
            <div className="text-[10px] uppercase tracking-wide text-accent mb-1">Your question</div>
            <div className="text-sm md:text-base text-slate-100 whitespace-pre-wrap">{lastUserMsg.content}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {new Date(lastUserMsg.createdAt).toLocaleString()}
            </div>
          </div>

          {/* Structured executive briefing — replaces the old
              advisor-analysis blob. Builds takeaway + anchors + reasoning
              + paths + risks from the same content + payload, then
              renders each section with its own visual weight. */}
          <ResponseBriefing
            content={lastAssistantMsg.content}
            payload={lastAssistantMsg.payload}
            currency={currency}
          />
        </div>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Strategic consultation cards
// ─────────────────────────────────────────────────────────────────────────────

function RecommendedConsultationCard({
  rec,
  suggested,
  onConsult,
  onPickSuggested,
  disabled,
}: {
  rec: RecommendedConsultation;
  suggested: StrategicSituation[];
  onConsult: () => void;
  onPickSuggested: (question: string) => void;
  disabled: boolean;
}) {
  // Tone drives a subtle border accent so the card carries the same
  // severity language the dashboard uses, but in a calmer hero form
  // (no heavy fill, no alert chrome).
  const borderTone =
    rec.tone === "bad"  ? "border-bad/40"     :
    rec.tone === "warn" ? "border-warn/40"    :
    rec.tone === "good" ? "border-good/40"    :
                          "border-accent/30";
  const hasSuggestions = suggested.length > 0;
  return (
    <section
      className={`rounded-2xl border ${borderTone} p-6 md:p-8 shadow-sm`}
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(124,92,250,0.10) 0%, rgba(79,125,255,0.06) 50%, rgba(34,211,238,0.06) 100%)",
      }}
    >
      {/* Two-column hero layout. Left: AI focus + main recommendation
          + CTA. Right: lightweight related directions, vertically
          stacked, no heavy chrome — the user reads them as supporting
          AI guidance, not as another section of feature cards. */}
      <div
        className={
          hasSuggestions
            ? "grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10"
            : "block"
        }
      >
        <div className={hasSuggestions ? "lg:col-span-8" : ""}>
          {/* Section anchor — quiet pre-heading that names the block
              instead of describing what's inside it. */}
          <div className="text-xs uppercase tracking-wide text-accent font-semibold mb-2">
            Recommended Consultation
          </div>

          <h2 className="text-xl md:text-2xl font-semibold text-slate-100 leading-tight mb-3">
            {rec.title}
          </h2>

          <div className="space-y-2 max-w-3xl">
            <p className="text-sm md:text-base text-slate-100 leading-relaxed">
              {rec.observation}
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              {rec.interpretation}
            </p>
          </div>

          {/* CTA right-aligned so the eye lands on the action after
              reading the recommendation. Label is just 'Consult' —
              the section title already says what it is. */}
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              className="btn-primary text-sm md:text-base px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
              onClick={onConsult}
              disabled={disabled}
            >
              Consult →
            </button>
          </div>
        </div>

        {hasSuggestions ? (
          <RelatedDirections
            items={suggested}
            onPick={onPickSuggested}
            disabled={disabled}
          />
        ) : null}
      </div>
    </section>
  );
}

// RelatedDirections — the right rail of the hero. Lightweight stacked
// list of optional AI follow-ups. Intentionally not styled as cards,
// not bordered, no equal weight to the main recommendation.
function RelatedDirections({
  items,
  onPick,
  disabled,
}: {
  items: StrategicSituation[];
  onPick: (question: string) => void;
  disabled: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, 3);
  const hidden = Math.max(0, items.length - 3);
  return (
    <aside className="lg:col-span-4 lg:border-l lg:border-line/60 lg:pl-6">
      <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">
        More trends to consult
      </div>
      <ul className="divide-y divide-line/40">
        {visible.map((s) => (
          <li key={s.id} className="py-2.5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm text-slate-200 leading-tight">
                {s.title}
              </div>
              <div className="text-xs text-slate-500 leading-snug mt-0.5 line-clamp-2">
                {s.blurb}
              </div>
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(s.question)}
              className="shrink-0 mt-0.5 text-[11px] px-2.5 py-1 rounded-md border border-accent/40 bg-accent-soft/30 text-accent hover:bg-accent-soft hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Consult
            </button>
          </li>
        ))}
      </ul>
      {hidden > 0 ? (
        <button
          type="button"
          className="mt-3 text-xs text-slate-500 hover:text-accent transition"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? "Show fewer" : `Show ${hidden} more →`}
        </button>
      ) : null}
    </aside>
  );
}

// FreeformConsultation — lighter container than before (no heavy
// gradient bg, no thick padding). Still prominent — it's a core
// product interaction — but reads as a conversational workspace
// rather than a large dashboard widget.
//
// arrivalMode = true means the user arrived from elsewhere with a
// prefilled question. In that mode we lead the screen with this
// component, so the framing copy reflects that it's a continuation.
function FreeformConsultation({
  textareaRef,
  draft,
  setDraft,
  sending,
  onSend,
  arrivalMode = false,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  draft: string;
  setDraft: (v: string) => void;
  sending: boolean;
  onSend: () => void;
  arrivalMode?: boolean;
}) {
  const heading = arrivalMode
    ? "Continue this consultation"
    : "Ask the AI advisor";
  return (
    // Same card chrome (border + gradient + padding) as the hero so
    // the two blocks read as visual peers.
    <section
      className="rounded-2xl border border-line p-6 md:p-8 shadow-sm"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(124,92,250,0.10) 0%, rgba(79,125,255,0.06) 50%, rgba(34,211,238,0.06) 100%)",
      }}
    >
      <h3 className="text-xl md:text-2xl font-semibold text-slate-100 leading-tight mb-3">
        {heading}
      </h3>

      <textarea
        ref={textareaRef}
        className="w-full bg-ink-900/40 border border-line rounded-xl text-slate-100 placeholder:text-slate-500 text-sm md:text-base leading-relaxed outline-none focus:border-accent/60 focus:bg-ink-900/60 transition resize-none min-h-[120px] px-4 py-3"
        rows={4}
        placeholder={PLACEHOLDER}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSend();
          }
        }}
        disabled={sending}
      />

      <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
        {!arrivalMode ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {FREEFORM_EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                className="text-xs text-slate-400 hover:text-slate-100 border border-line/60 hover:border-accent/40 rounded-full px-2.5 py-0.5 transition"
                disabled={sending}
                onClick={() => {
                  setDraft(ex);
                  if (textareaRef.current) textareaRef.current.focus();
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        ) : <span />}
        <button
          type="button"
          className="btn-primary text-sm md:text-base px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
          disabled={sending || !draft.trim()}
          onClick={onSend}
        >
          {sending ? "Analyzing…" : arrivalMode ? "Continue" : "Ask"}
        </button>
      </div>
    </section>
  );
}

