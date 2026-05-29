"use client";

// New Consultation view - the AI business advisor entry point. Layout
// reads top-to-bottom: intro card → example question pills → input area
// with gradient "Start Consultation" CTA → the response cards once an
// answer comes back. No chat bubbles, no sidebar, no clutter.

import { useState, useTransition, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import { renderMarkdown } from "./markdown";
import StructuredAdvisoryView from "@/components/advisory/StructuredAdvisoryView";
import ThinkingProgress from "@/components/advisory/ThinkingProgress";
import {
  buildDecisionBriefing,
  type DecisionBriefing,
  type StrategicPath,
} from "@/lib/decisionBriefing";
import UpgradeTriggerButton from "@/components/billing/UpgradeTriggerButton";
import BuyCreditsTriggerButton from "@/components/billing/BuyCreditsTriggerButton";
import { notify } from "@/lib/notify";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  payload: string | null;
  // Optional structured advisory payload (Phase 1). When present the
  // UI renders the multi-card layout instead of plain markdown.
  structured?: import("@/lib/advisorTypes").StructuredAdvice | null;
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

export default function ConsultationClient({
  active: initialActive,
  currency,
  claudeEnabled,
  initialDraft,
  autoSubmit,
}: {
  active: Active | null;
  currency: string;
  claudeEnabled: boolean;
  initialDraft?: string;
  // True when arriving from /consultation/suggested with ?auto=1.
  // The component fires `send()` once on mount so the user lands
  // directly on the answer.
  autoSubmit?: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState<Active | null>(initialActive);
  const [draft, setDraft] = useState(initialDraft ?? "");
  const [sending, setSending] = useState(false);
  const [, startTransition] = useTransition();
  const responseRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // When a response is on screen the textarea collapses so the user
  // isn't staring at a giant empty composer while reading the answer.
  // Clicking "Ask another question" flips this back on. Defaults to
  // true so a fresh page (no response yet) shows the composer.
  const [composerOpen, setComposerOpen] = useState(true);

  // Billing state - populated by /api/billing/credits on mount and
  // by /api/consultation on every successful send (the response
  // carries the post-deduct balance so we don't need a second
  // roundtrip). `outOfCredits` shorts the send path with a proper
  // upgrade card instead of an notify.alert().
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

  // If we landed via ?q= (a "Consult AI" link from a Business Signal,
  // or a CONSULT click on the Suggested tab), focus the textarea so
  // the user can edit immediately.
  useEffect(() => {
    if (initialDraft && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [initialDraft]);

  // ?auto=1 path: the user clicked CONSULT on a Suggested question
  // and expects to land on the answer, not the editor. Fire send()
  // once. Guarded against duplicate fires (React StrictMode dev,
  // re-renders) via a ref flag.
  const autoFiredRef = useRef(false);
  useEffect(() => {
    if (autoSubmit && initialDraft && !autoFiredRef.current && !sending) {
      autoFiredRef.current = true;
      void send(initialDraft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSubmit, initialDraft]);

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
      // upgrade card instead of an notify.alert().
      if (res.status === 402) {
        const data = await res.json().catch(() => null);
        setOutOfCredits({
          balance: data?.balance ?? 0,
          needed:  data?.needed  ?? 1,
          plan:    data?.plan    ?? "free",
        });
        return;
      }
      // 403: server's email-verification gate. Send the user to the
      // banner action without an alert dialog.
      if (res.status === 403) {
        const data = await res.json().catch(() => null);
        if (data?.error === "email_unverified") {
          notify.alert("Please verify your email to use AI consultations. Use the Resend button in the banner at the top of the page.");
          return;
        }
      }
      if (!res.ok) { notify.alert(await res.text()); return; }
      const data = await res.json();
      const fresh = data.consultation as Active;
      setActive(fresh);
      setDraft("");
      // Collapse the composer once the answer lands - the user
      // re-opens it explicitly via "Ask another question" so the
      // screen stays focused on reading the response.
      setComposerOpen(false);
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

      {/* Custom-question surface. Hidden while sending (the loader
          takes its place) and after a response lands (the user
          re-opens it via "Ask another question" - no point showing
          an empty textarea while they read the answer). Hidden via
          CSS rather than unmounted so the textareaRef stays alive
          for the focus-on-reopen flow. */}
      <div className={(!sending && composerOpen) ? "" : "hidden"}>
        <FreeformConsultation
          textareaRef={textareaRef}
          draft={draft}
          setDraft={setDraft}
          sending={sending}
          onSend={() => void send()}
          arrivalMode={!!initialDraft}
        />
      </div>

      {/* Live "thinking" indicator while we wait for the advisor:
          determinate progress bar with percentage, rotating status,
          elapsed timer. Stands in for the composer while in flight. */}
      {sending ? <ThinkingProgress /> : null}

      {/* Response card - the most recent Q&A. Older Q&As live on the
          Consultation History tab; this view keeps focus on the latest. */}
      {hasResponse && lastUserMsg && lastAssistantMsg ? (
        <div ref={responseRef} className="space-y-4">
          {/* Question header. Right-side affordance re-opens the
              composer so the user can ask a follow-up without
              hunting for it - we deliberately collapse the textarea
              after every answer to keep the screen focused on
              reading, so this button is the one way back. */}
          <div className="rounded-xl border border-accent/30 bg-accent-soft/30 px-4 py-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="t-meta uppercase tracking-wide text-accent mb-1">Your question</div>
              <div className="t-body text-slate-100 whitespace-pre-wrap">{lastUserMsg.content}</div>
              <div className="t-meta text-slate-500 mt-1">
                {new Date(lastUserMsg.createdAt).toLocaleString()}
              </div>
            </div>
            {!composerOpen ? (
              <button
                type="button"
                onClick={() => {
                  setComposerOpen(true);
                  setDraft("");
                  // Defer focus until after the composer mounts.
                  setTimeout(() => {
                    textareaRef.current?.focus();
                    textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 0);
                }}
                className="btn-ghost text-sm whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
              >
                <MessageSquareText size={14} strokeWidth={2} />
                Ask another question
              </button>
            ) : null}
          </div>

          {/* When the Claude response includes a structured payload
              (Phase 1 of the advisory UX overhaul), render the rich
              card layout. Otherwise fall back to the legacy
              ResponseBriefing built from markdown content. */}
          {lastAssistantMsg.structured ? (
            <StructuredAdvisoryView data={lastAssistantMsg.structured} />
          ) : (
            <ResponseBriefing
              content={lastAssistantMsg.content}
              payload={lastAssistantMsg.payload}
              currency={currency}
            />
          )}
        </div>
      ) : null}
    </div>
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
    // Larger composition surface than before - this is now the
    // primary surface of the New Advisory tab (the AI-curated
    // questions moved to /consultation/suggested), so the textarea
    // gets noticeably more room to write a real prompt.
    <section className="rounded-2xl border border-line bg-ink-900/30 p-6 md:p-7 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-good font-semibold mb-3">
        {heading}
      </div>

      <textarea
        ref={textareaRef}
        className="w-full bg-ink-900/40 border border-line rounded-xl text-slate-100 placeholder:text-slate-500 text-base md:text-lg leading-relaxed outline-none focus:border-accent/60 focus:bg-ink-900/60 transition duration-200 resize-none min-h-[180px] md:min-h-[220px] px-5 py-4"
        rows={7}
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
            plan === "free" ? (
              <UpgradeTriggerButton
                currentPlan={plan}
                feature="AI consultation"
                className="btn-brand text-sm px-4 py-2 whitespace-nowrap"
              >
                Upgrade to Pro
              </UpgradeTriggerButton>
            ) : (
              <BuyCreditsTriggerButton className="btn-brand text-sm px-4 py-2 whitespace-nowrap">
                Buy more credits
              </BuyCreditsTriggerButton>
            )
          ) : low ? (
            plan === "free" ? (
              <UpgradeTriggerButton
                currentPlan={plan}
                feature="AI consultation"
                className="btn-ghost text-sm px-4 py-2 whitespace-nowrap"
              >
                Upgrade to Pro →
              </UpgradeTriggerButton>
            ) : (
              <BuyCreditsTriggerButton className="btn-ghost text-sm px-4 py-2 whitespace-nowrap">
                Buy more credits →
              </BuyCreditsTriggerButton>
            )
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

