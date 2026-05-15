"use client";

// New Consultation view — the AI business advisor entry point. Layout
// reads top-to-bottom: intro card → example question pills → input area
// with gradient "Start Consultation" CTA → the response cards once an
// answer comes back. No chat bubbles, no sidebar, no clutter.

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { renderMarkdown } from "./markdown";
import type {
  RecommendedConsultation,
  StrategicSituation,
  TodaysFocus,
} from "@/lib/consultationFocus";

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

      {/* Today's AI Focus — calm banner anchoring the whole screen to
          what's most material in the business right now. Picked up
          from the same BusinessContext the dashboard and Business
          Signals use, so the Consultation surface feels like a
          continuation, not a separate module. */}
      {focus && focus.themes.length > 0 ? (
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">
            Today&apos;s AI Focus
          </span>
          <span className="text-sm md:text-base text-slate-100 font-medium">
            {focus.themes.join(" · ")}
          </span>
        </div>
      ) : null}

      {/* LEVEL 1 — Recommended Consultation. The single AI-prioritized
          strategic discussion. Always the visual lead. */}
      {recommended ? (
        <RecommendedConsultationCard
          rec={recommended}
          onConsult={() => void send(recommended.question)}
          disabled={sending}
        />
      ) : null}

      {/* LEVEL 2 — Suggested Strategic Consultations. A small curated
          grid of business-situation cards, each themed (Hiring
          Expansion, Expense Pressure, etc.) rather than phrased as a
          generic question. */}
      {suggested.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-base md:text-lg font-semibold text-slate-100">
              Suggested Strategic Consultations
            </h3>
            <span className="text-xs text-slate-400">
              Curated from your live business data.
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggested.map((s) => (
              <StrategicSituationCard
                key={s.id}
                situation={s}
                onConsult={() => void send(s.question)}
                disabled={sending}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* LEVEL 3 — Freeform Consultation. Always visible, intentionally
          prominent. This is a core product interaction — the user
          should never feel like asking anything is a footer action. */}
      <section
        className="rounded-2xl border border-line p-5 md:p-7 shadow-sm"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(124,92,250,0.10) 0%, rgba(79,125,255,0.06) 50%, rgba(34,211,238,0.06) 100%)",
        }}
      >
        <h3 className="text-lg md:text-xl font-semibold text-slate-100 leading-tight">
          What would you like to understand about your business today?
        </h3>
        <p className="text-xs md:text-sm text-slate-400 mt-1 mb-4 max-w-2xl leading-relaxed">
          Ask anything — performance, growth, profitability, hiring, vendors, operations. The advisor uses your actual data to answer.
        </p>

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
            className="btn-primary text-sm px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
            disabled={sending || !draft.trim()}
            onClick={() => void send()}
          >
            {sending ? "Analyzing…" : "Start Consultation"}
          </button>
        </div>

        {/* Quiet seed prompts under the input — single click pre-fills
            the textarea so the user can edit before sending. */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">Try</span>
          {FREEFORM_EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="text-xs text-slate-400 hover:text-slate-100 border border-line hover:border-accent/40 rounded-full px-3 py-1 transition"
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
      </section>

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

// ─────────────────────────────────────────────────────────────────────────────
// Strategic consultation cards
// ─────────────────────────────────────────────────────────────────────────────

function RecommendedConsultationCard({
  rec,
  onConsult,
  disabled,
}: {
  rec: RecommendedConsultation;
  onConsult: () => void;
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
  return (
    <section
      className={`rounded-2xl border ${borderTone} p-6 md:p-8 shadow-sm`}
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(124,92,250,0.10) 0%, rgba(79,125,255,0.06) 50%, rgba(34,211,238,0.06) 100%)",
      }}
    >
      <div className="flex items-baseline gap-3 flex-wrap mb-3">
        <span className="text-[10px] uppercase tracking-wide text-accent font-semibold">
          Recommended Consultation
        </span>
        <span className="text-[10px] uppercase tracking-wide text-slate-500">
          AI-prioritized for your business
        </span>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-slate-100 leading-tight mb-3">
        {rec.title}
      </h2>

      <div className="space-y-2 max-w-3xl">
        <p className="text-sm md:text-base text-slate-100 leading-relaxed">
          {rec.observation}
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">
          {rec.interpretation}
        </p>
      </div>

      <div className="mt-5">
        <button
          type="button"
          className="btn-primary text-sm md:text-base px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
          onClick={onConsult}
          disabled={disabled}
        >
          {rec.cta} →
        </button>
      </div>
    </section>
  );
}

function StrategicSituationCard({
  situation: s,
  onConsult,
  disabled,
}: {
  situation: StrategicSituation;
  onConsult: () => void;
  disabled: boolean;
}) {
  const borderTone =
    s.tone === "bad"  ? "border-bad/40 hover:border-bad/70"    :
    s.tone === "warn" ? "border-warn/40 hover:border-warn/70"  :
    s.tone === "good" ? "border-good/40 hover:border-good/70"  :
                        "border-line hover:border-accent/50";
  return (
    <button
      type="button"
      onClick={onConsult}
      disabled={disabled}
      className={`text-left rounded-xl border ${borderTone} bg-ink-900/40 hover:bg-accent-soft/10 transition px-4 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed group flex flex-col gap-1.5`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-medium text-sm text-slate-100">{s.title}</div>
        <span className="text-accent text-xs group-hover:translate-x-0.5 transition-transform">
          →
        </span>
      </div>
      <div className="text-xs text-slate-300 leading-relaxed">{s.blurb}</div>
    </button>
  );
}
