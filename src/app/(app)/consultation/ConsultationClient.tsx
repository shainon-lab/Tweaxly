"use client";

// New Consultation view - the AI business advisor entry point. Layout
// reads top-to-bottom: intro card → example question pills → input area
// with gradient "Start Consultation" CTA → the response cards once an
// answer comes back. No chat bubbles, no sidebar, no clutter.

import { useState, useTransition, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareText } from "lucide-react";
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
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString("en-US")}`;
  }
}

// ResponseBriefing - structured executive briefing built from a
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

// Strategic paths list - single responsive grid so cards sit side
// by side and don't leave empty horizontal space. Tier is still
// communicated per card via a small pill at the top + a border tone
// (primary = accent, high-impact = warn, low-impact = neutral). Cards
// are ordered primary → high-impact → low-impact so the visual flow
// is still tier-aware even without per-tier headings.
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
        <span className={`${tierPill} text-[10px]`}>{tierLabel}</span>
        <div className="pill-good">{fmtMoney(o.monthlySavings, currency)}/mo</div>
      </div>
      <div className="font-medium text-sm text-slate-100">{o.title}</div>
      <div className="text-xs text-slate-400">
        {fmtMoney(o.annualSavings, currency)} per year · covers {coverage}% over {p.horizonMonths}mo
      </div>
      {o.items.length > 0 ? (
        <ul className="text-xs text-slate-300 list-disc pl-4 space-y-0.5 mt-1">
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

  // Billing state - populated by /api/billing/credits on mount and
  // by /api/consultation on every successful send (the response
  // carries the post-deduct balance so we don't need a second
  // roundtrip). `outOfCredits` shorts the send path with a proper
  // upgrade card instead of an alert().
  const [credits, setCredits] = useState<{
    balance: number;
    monthlyAllowance: number;
    plan: string;
    costPerMessage: number;
  } | null>(null);
  const [outOfCredits, setOutOfCredits] = useState<{
    balance: number; needed: number; plan: string;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/billing/credits")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (cancelled || !d) return;
        setCredits({
          balance:          d.balance,
          monthlyAllowance: d.monthlyAllowance,
          plan:             d.plan,
          costPerMessage:   d.creditCosts?.consultationMessage ?? 1,
        });
      })
      .catch(() => { /* widget is best-effort; ignore */ });
    return () => { cancelled = true };
  }, []);

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
      // Every Start Consultation creates a fresh thread - never re-uses
      // a previous one. That way each question shows up as its own row
      // in Consultation History.
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      // 402: out of credits OR workspace is read-only. Surface the
      // upgrade card instead of an alert().
      if (res.status === 402) {
        const data = await res.json().catch(() => null);
        setOutOfCredits({
          balance: data?.balance ?? 0,
          needed:  data?.needed  ?? 1,
          plan:    data?.plan    ?? "free",
        });
        return;
      }
      if (!res.ok) { alert(await res.text()); return; }
      const data = await res.json();
      const fresh = data.consultation as Active;
      setActive(fresh);
      setDraft("");
      // Update the credit widget from the response so we stay in
      // sync without a separate fetch.
      if (data.credits && credits) {
        setCredits({
          ...credits,
          balance: data.credits.balance,
          plan:    data.credits.plan ?? credits.plan,
        });
      }
      setOutOfCredits(null);
      // After a submit we drop any ?q= that came from a Business Signal
      // link so a reload doesn't re-prefill the textarea with the same
      // question. Replace (not push) keeps Back behavior sane.
      if (typeof window !== "undefined" && window.location.search) {
        router.replace("/consultation");
      }
      // Don't push ?id= into the URL - the page is "start a new
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
      {/* AI Credit balance widget. Shows current balance + monthly
          allowance + cost-per-message, plus the Out-of-credits card
          when the user has burnt through their plan allowance.
          Lives above any other content so the user always knows what
          they have available. */}
      {credits ? (
        <CreditsWidget
          balance={credits.balance}
          monthlyAllowance={credits.monthlyAllowance}
          plan={credits.plan}
          costPerMessage={credits.costPerMessage}
          outOfCredits={outOfCredits}
          onCreditsUpdated={(newBalance) => {
            setCredits({ ...credits, balance: newBalance });
            setOutOfCredits(null);
          }}
        />
      ) : null}

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

      {/* Arrival mode - if the user came in with a prefilled question
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
          {/* One unified hero - main AI recommendation on the left,
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

          {/* Freeform consultation - always-visible major element,
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

      {/* Response card - the most recent Q&A. Older Q&As live on the
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

          {/* Structured executive briefing - replaces the old
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
      className={`rounded-2xl border ${borderTone} p-6 md:p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:border-accent/40`}
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(124,92,250,0.10) 0%, rgba(79,125,255,0.06) 50%, rgba(34,211,238,0.06) 100%)",
      }}
    >
      {/* Two-column hero layout. Left: AI focus + main recommendation
          + CTA. Right: lightweight related directions, vertically
          stacked, no heavy chrome - the user reads them as supporting
          AI guidance, not as another section of feature cards. */}
      <div
        className={
          hasSuggestions
            ? "grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10"
            : "block"
        }
      >
        <div className={hasSuggestions ? "lg:col-span-8" : ""}>
          {/* Section anchor - quiet pre-heading that names the block
              instead of describing what's inside it. */}
          <div className="text-xs uppercase tracking-wide text-accent font-semibold mb-2">
            Recommended Consultation
          </div>

          <h2 className="text-xl md:text-2xl font-semibold text-slate-100 leading-tight mb-2.5">
            {rec.title}
          </h2>

          {/* Observation + interpretation form one tight content
              cluster - the interpretation should read as a direct
              continuation of the metric, not a separate paragraph. */}
          <p className="text-sm md:text-base text-slate-100 leading-relaxed max-w-3xl mb-1.5">
            {rec.observation}
          </p>
          <p className="text-sm text-slate-400 leading-relaxed max-w-3xl mb-4">
            {rec.interpretation}
          </p>

          {/* CTA sits flush left under the content cluster - close to
              the recommendation it acts on, no horizontal vacuum. */}
          <button
            type="button"
            className="text-sm px-4 py-2 rounded-full inline-flex items-center gap-1.5 border border-accent/40 bg-accent-soft/40 text-accent font-medium shadow-sm hover:bg-accent-soft hover:border-accent hover:text-white hover:shadow-md transition duration-200 disabled:opacity-50"
            onClick={onConsult}
            disabled={disabled}
            title="Open consultation with this context"
          >
            <MessageSquareText size={14} strokeWidth={1.75} aria-hidden="true" />
            <span>Consult on this</span>
          </button>
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

// RelatedDirections - the right rail of the hero. Fixed at three
// rows so the section feels curated and predictable; any additional
// candidates are dropped at the page level.
function RelatedDirections({
  items,
  onPick,
  disabled,
}: {
  items: StrategicSituation[];
  onPick: (question: string) => void;
  disabled: boolean;
}) {
  const visible = items.slice(0, 3);
  return (
    <aside className="lg:col-span-4 lg:border-l lg:border-line/60 lg:pl-6">
      <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">
        More trends to consult
      </div>
      <ul className="divide-y divide-line/40">
        {visible.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(s.question)}
              className="w-full text-left py-2.5 flex items-start justify-between gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-100 group-hover:text-white transition duration-200 leading-tight">
                  {s.title}
                </div>
                <div className="text-xs text-slate-500 leading-snug mt-1 line-clamp-2">
                  {s.blurb}
                </div>
              </div>
              <span className="shrink-0 mt-1 text-xs text-slate-500 group-hover:text-accent group-hover:translate-x-0.5 transition duration-200">
                →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// FreeformConsultation - lighter container than before (no heavy
// gradient bg, no thick padding). Still prominent - it's a core
// product interaction - but reads as a conversational workspace
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
    // Quieter chrome than the hero - neutral background, no gradient,
    // smaller section heading. The hero is the AI's lead recommendation
    // (proactive); this is the user-input tool (reactive). Visual
    // hierarchy makes that distinction obvious instead of presenting
    // them as competing peer recommendations.
    <section className="rounded-2xl border border-line bg-ink-900/30 p-5 md:p-6 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-good font-semibold mb-3">
        {heading}
      </div>

      <textarea
        ref={textareaRef}
        className="w-full bg-ink-900/40 border border-line rounded-xl text-slate-100 placeholder:text-slate-500 text-sm md:text-base leading-relaxed outline-none focus:border-accent/60 focus:bg-ink-900/60 transition duration-200 resize-none min-h-[88px] px-4 py-3"
        rows={3}
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
            {FREEFORM_EXAMPLES.slice(0, 3).map((ex) => (
              <button
                key={ex}
                type="button"
                className="text-xs text-slate-400 hover:text-slate-100 border border-line/60 hover:border-accent/40 rounded-full px-2.5 py-0.5 transition duration-200"
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
          className="btn-primary text-sm px-5 py-2.5 rounded-md shadow-sm hover:shadow-md transition-transform duration-200 active:scale-[0.98] disabled:opacity-50"
          disabled={sending || !draft.trim()}
          onClick={onSend}
        >
          {sending ? "Analyzing…" : arrivalMode ? "Continue" : "Consult AI"}
        </button>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// CreditsWidget - balance pill + Out-of-credits upgrade card
// ─────────────────────────────────────────────────────────────────────

const PLAN_LABEL: Record<string, string> = {
  free:     "Free",
  pro:      "Pro",
  business: "Business",
};

function CreditsWidget({
  balance, monthlyAllowance, plan, costPerMessage, outOfCredits, onCreditsUpdated,
}: {
  balance: number;
  monthlyAllowance: number;
  plan: string;
  costPerMessage: number;
  outOfCredits: { balance: number; needed: number; plan: string } | null;
  onCreditsUpdated?: (newBalance: number) => void;
}) {
  const pct = monthlyAllowance > 0
    ? Math.max(0, Math.min(100, Math.round((balance / monthlyAllowance) * 100)))
    : 0;
  const low = balance > 0 && balance < Math.max(5, costPerMessage * 2);
  const empty = outOfCredits != null || balance < costPerMessage;

  const [redeemOpen, setRedeemOpen] = useState(false);
  const [code, setCode]             = useState("");
  const [redeeming, setRedeeming]   = useState(false);
  const [redeemMsg, setRedeemMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  async function submitCode() {
    if (!code.trim()) return;
    setRedeeming(true);
    setRedeemMsg(null);
    try {
      const res = await fetch("/api/billing/coupons/redeem", {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json().catch(() => ({} as { message?: string; summary?: string; effect?: { creditsGranted?: number } }));
      if (!res.ok || !data.ok) {
        setRedeemMsg({ ok: false, text: data.message ?? "Couldn't apply that code." });
        return;
      }
      setRedeemMsg({ ok: true, text: `${data.summary ?? "Coupon applied"} ✓` });
      setCode("");
      // For credit coupons, refresh the balance via the same endpoint
      // the page uses on mount. Discount + trial coupons leave balance
      // unchanged but the success message is still shown.
      if (data.effect?.creditsGranted && onCreditsUpdated) {
        const cr = await fetch("/api/billing/credits").then((r) => r.ok ? r.json() : null);
        if (cr) onCreditsUpdated(cr.balance);
      }
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <div className="card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-400 font-semibold">
            <span className="pill text-[10px]">{PLAN_LABEL[plan] ?? plan}</span>
            <span>{plan === "free" ? "Starter AI Credits" : "AI Credits"}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className={`text-2xl font-semibold ${empty ? "text-bad" : low ? "text-warn" : "text-white"}`}>
              {balance.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">
              {plan === "free"
                ? <>starter credits remaining{" · "}{costPerMessage} per question</>
                : <>of {monthlyAllowance.toLocaleString()} this month{" · "}{costPerMessage} per question</>}
            </span>
          </div>
          <div className="mt-2 h-1 rounded-full bg-ink-700/80 overflow-hidden max-w-md">
            <div
              className={`h-full rounded-full ${empty ? "bg-bad" : low ? "bg-warn" : "bg-gradient-to-r from-brand-purple to-brand-teal"}`}
              style={{ width: `${pct}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => { setRedeemOpen((v) => !v); setRedeemMsg(null) }}
            className="text-xs text-slate-400 hover:text-slate-100 transition underline-offset-2 hover:underline"
          >
            Have a code?
          </button>
          {empty ? (
            <a href="/settings/billing" className="btn-brand text-sm px-4 py-2 whitespace-nowrap">
              {plan === "free" ? "Upgrade to Pro" : "Buy more credits"}
            </a>
          ) : low ? (
            <a href="/settings/billing" className="btn-ghost text-sm px-4 py-2 whitespace-nowrap">
              {plan === "free" ? "Upgrade to Pro →" : "Buy more credits →"}
            </a>
          ) : null}
        </div>
      </div>

      {/* Redeem-code drawer. Inline so the user doesn't context-switch. */}
      {redeemOpen ? (
        <div className="mt-4 pt-4 border-t border-line/50">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              className="input font-mono uppercase max-w-xs"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ENTER PROMO CODE"
              disabled={redeeming}
              maxLength={64}
              onKeyDown={(e) => { if (e.key === "Enter") submitCode() }}
            />
            <button
              type="button"
              onClick={submitCode}
              disabled={redeeming || !code.trim()}
              className="btn-primary text-sm px-4 py-2 rounded-md disabled:opacity-50"
            >
              {redeeming ? "Applying…" : "Apply"}
            </button>
            {redeemMsg ? (
              <span className={`text-xs ${redeemMsg.ok ? "text-good" : "text-bad"}`}>
                {redeemMsg.text}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

