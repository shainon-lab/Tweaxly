"use client";

// New Consultation view — the AI business advisor entry point. Layout
// reads top-to-bottom: intro card → example question pills → input area
// with gradient "Start Consultation" CTA → the response cards once an
// answer comes back. No chat bubbles, no sidebar, no clutter.

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { renderMarkdown } from "./markdown";

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

type SavingsOption = {
  title: string;
  monthlySavings: number;
  annualSavings: number;
  tradeoff: string;
  items: { label: string; amount: number; note?: string }[];
};

type HorizonBlock = {
  label: string;
  months: number;
  monthlyTarget: number;
  totalTarget: number;
  options: SavingsOption[];
};

type OptionPayload = { horizons?: HorizonBlock[] };

// Shown as placeholder text inside the textarea so the user has an
// immediate sense of what they can ask. Two examples is plenty.
const PLACEHOLDER =
  "e.g. \"Where can I reduce $20,000 in expenses?\" or \"Can I afford to hire another employee?\"";

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

function OptionsBlock({
  payload,
  currency,
}: {
  payload: string | null;
  currency: string;
}) {
  if (!payload) return null;
  let parsed: OptionPayload;
  try { parsed = JSON.parse(payload); } catch { return null; }
  if (!parsed.horizons || parsed.horizons.length === 0) return null;
  const multi = parsed.horizons.length > 1;
  return (
    <div className="mt-4 space-y-4">
      {parsed.horizons.map((h, hi) => (
        <div key={hi} className="space-y-2">
          {multi ? (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="pill-accent">{h.label}</span>
              <span className="text-xs text-slate-400">
                {h.months} months · ~{fmtMoney(h.monthlyTarget, currency)}/mo target
              </span>
            </div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {h.options.map((o, i) => (
              <div key={i} className="rounded-lg border border-line bg-ink-950/40 p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-medium text-sm">{o.title}</div>
                  <div className="pill-good">{fmtMoney(o.monthlySavings, currency)}/mo</div>
                </div>
                <div className="text-xs text-slate-400">
                  {fmtMoney(o.annualSavings, currency)} per year · covers {Math.round((o.monthlySavings * h.months / Math.max(h.totalTarget, 1)) * 100)}% over {h.months}mo
                </div>
                <div className="text-xs text-slate-300 leading-relaxed mt-1">{o.tradeoff}</div>
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
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ConsultationClient({
  active: initialActive,
  currency,
  claudeEnabled,
  prompts,
  initialDraft,
}: {
  active: Active | null;
  currency: string;
  claudeEnabled: boolean;
  prompts: string[];
  initialDraft?: string;
}) {
  const router = useRouter();
  const [active, setActive] = useState<Active | null>(initialActive);
  // Initial draft is seeded from ?q= when the user arrives from a
  // "Consult AI" link on a Business Signal. We never auto-submit — the
  // user gets to read and edit before clicking Start Consultation.
  const [draft, setDraft] = useState(initialDraft ?? "");
  const [sending, setSending] = useState(false);
  // The free-form question textarea stays collapsed by default — the
  // primary affordance is the trends grid above. Clicking "Consult on
  // any topic" reveals the input. If we landed with ?q= (from a
  // Business Signal), we auto-expand so the prefilled question is
  // visible and editable immediately.
  const [askExpanded, setAskExpanded] = useState(!!initialDraft);
  const [, startTransition] = useTransition();
  const responseRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // When the user clicks "Consult on any topic" to expand the input,
  // pull focus into the textarea so they can start typing immediately.
  useEffect(() => {
    if (askExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [askExpanded]);

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

      {/* Intro card */}
      <div
        className="rounded-2xl p-6 md:p-8 border border-line shadow-sm"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(124,92,250,0.12) 0%, rgba(79,125,255,0.08) 50%, rgba(34,211,238,0.10) 100%)",
        }}
      >
        <div className="text-xl md:text-2xl font-semibold text-slate-100 leading-tight">
          Consult with your AI business advisor.
        </div>
        <p className="mt-2 text-sm md:text-base text-slate-300 max-w-3xl leading-relaxed">
          Tweaxly analyzes your financial activity, payroll, expenses, revenue, and forecasts to help you make smarter business decisions.
        </p>
      </div>

      {/* "Consult About Your Latest Trends" — dynamic suggestion cards
          generated from the user's real BusinessContext. Clicking a card
          auto-submits the question, unlike the ?q= flow from Business
          Signals (which only pre-fills the textarea). */}
      {prompts.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="text-lg md:text-xl font-semibold text-slate-100">
              Consult About Your Latest Trends
            </h2>
            <span className="text-xs text-slate-400">
              Picked from your live business data — tap to ask.
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {prompts.map((p, i) => (
              <button
                key={i}
                type="button"
                disabled={sending}
                onClick={() => void send(p)}
                className="text-left rounded-xl border border-line bg-ink-900/40 hover:border-accent/50 hover:bg-accent-soft/20 transition px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-start gap-2">
                  <span className="text-accent text-xs mt-1 shrink-0 group-hover:translate-x-0.5 transition-transform">→</span>
                  <span className="text-sm text-slate-200 leading-relaxed">{p}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Free-form input area — collapsed by default into a single-line
          CTA matching the Business Signals footer language. Expands into
          the full textarea when the user clicks "Consult on any topic". */}
      {!askExpanded ? (
        <div
          className="rounded-2xl border border-line p-6 md:p-8 shadow-sm flex items-center justify-between gap-4 flex-wrap"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(124,92,250,0.14) 0%, rgba(79,125,255,0.10) 50%, rgba(34,211,238,0.10) 100%)",
          }}
        >
          <div className="text-lg md:text-2xl font-semibold text-slate-100 leading-snug max-w-2xl">
            Or consult about anything else going on in your business.
          </div>
          <button
            type="button"
            className="btn-primary text-sm md:text-base px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-transform active:scale-[0.98]"
            onClick={() => setAskExpanded(true)}
          >
            Consult on any topic
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-ink-900/40 p-4 md:p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-slate-100">
                Ask Any Question About Your Business
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Anything goes — cashflow, hiring, pricing, vendors, runway, growth.
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-slate-200 shrink-0"
              onClick={() => {
                setAskExpanded(false);
                setDraft("");
              }}
              title="Hide the input"
              aria-label="Hide the input"
            >
              ✕
            </button>
          </div>
          <textarea
            ref={textareaRef}
            className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-sm md:text-base leading-relaxed outline-none resize-none min-h-[88px]"
            rows={3}
            placeholder={PLACEHOLDER}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void send();
              }
            }}
            disabled={sending}
          />
          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
            <div className="text-[11px] text-slate-500">
              Press ⌘/Ctrl + Enter to send.
            </div>
            <button
              type="button"
              className="btn-primary text-sm px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-transform active:scale-[0.98]"
              disabled={sending || !draft.trim()}
              onClick={() => void send()}
            >
              {sending ? "Analyzing…" : "Start Consultation"}
            </button>
          </div>
        </div>
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

          {/* Advisor analysis */}
          <div className="rounded-xl border border-line bg-ink-900/40 p-5 md:p-6 shadow-sm">
            <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-3">Advisor analysis</div>
            <div className="space-y-1.5">
              {renderMarkdown(lastAssistantMsg.content)}
            </div>
            <OptionsBlock payload={lastAssistantMsg.payload} currency={currency} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
