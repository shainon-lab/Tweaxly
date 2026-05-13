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

const EXAMPLES = [
  "Where can I reduce $20,000 in expenses?",
  "Can I afford to hire another employee?",
  "Why did profitability decrease last quarter?",
  "What happens if revenue drops 15%?",
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
}: {
  active: Active | null;
  currency: string;
  claudeEnabled: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState<Active | null>(initialActive);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [, startTransition] = useTransition();
  const responseRef = useRef<HTMLDivElement | null>(null);

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
      // Don't push ?id= into the URL — the page is "start a new
      // consultation", not "edit consultation X". On reload we'll
      // happily land back on the empty intro screen.
      startTransition(() => router.refresh());
    } finally {
      setSending(false);
    }
  }

  function pickExample(q: string) {
    setDraft(q);
    void send(q);
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

      {/* Example questions */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">Suggested questions</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {EXAMPLES.map((q) => (
            <button
              key={q}
              type="button"
              disabled={sending}
              onClick={() => pickExample(q)}
              className="group relative rounded-xl border border-line bg-ink-900/40 px-4 py-3 text-left text-sm text-slate-200 hover:border-accent/40 hover:bg-accent-soft/40 transition disabled:opacity-50"
            >
              {/* Subtle gradient border on hover */}
              <span
                aria-hidden
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(124,92,250,0.18) 0%, rgba(34,211,238,0.18) 100%)",
                  mixBlendMode: "overlay",
                }}
              />
              <span className="relative">{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="rounded-2xl border border-line bg-ink-900/40 p-4 md:p-5 shadow-sm">
        <textarea
          className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-sm md:text-base leading-relaxed outline-none resize-none min-h-[88px]"
          rows={3}
          placeholder="Ask about cashflow, payroll, expenses, forecasts, profitability, hiring decisions, or business performance…"
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
            className="btn-brand text-sm px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-transform active:scale-[0.98]"
            disabled={sending || !draft.trim()}
            onClick={() => void send()}
          >
            {sending ? "Analyzing…" : "Start Consultation"}
          </button>
        </div>
      </div>

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
