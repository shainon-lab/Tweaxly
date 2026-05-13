"use client";
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

type OptionPayload = {
  horizons?: HorizonBlock[];
};

const SUGGESTIONS = [
  "I need to save $20K this quarter — what's the best way?",
  "How should I think about growing revenue over a year vs 5 years?",
  "What's our cash runway over the next 2 years?",
  "Which vendor or category should I focus on first?",
];

function fmtMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }
  if (!parsed.horizons || parsed.horizons.length === 0) return null;
  const multi = parsed.horizons.length > 1;
  return (
    <div className="mt-3 space-y-4">
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
              <div
                key={i}
                className="rounded-lg border border-line bg-ink-950/40 p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-medium text-sm">{o.title}</div>
                  <div className="pill-good">
                    {fmtMoney(o.monthlySavings, currency)}/mo
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  {fmtMoney(o.annualSavings, currency)} per year ·{" "}
                  covers {Math.round((o.monthlySavings * h.months / Math.max(h.totalTarget, 1)) * 100)}% over {h.months}mo
                </div>
                <div className="text-xs text-slate-300 leading-relaxed mt-1">
                  {o.tradeoff}
                </div>
                {o.items.length > 0 ? (
                  <ul className="text-xs text-slate-300 list-disc pl-4 space-y-0.5 mt-1">
                    {o.items.map((it, ii) => (
                      <li key={ii}>
                        <span className="font-medium">{it.label}</span>
                        <span className="text-slate-400">
                          {" "}— {fmtMoney(it.amount, currency)}/mo
                          {it.note ? <> · {it.note}</> : null}
                        </span>
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
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActive(initialActive);
  }, [initialActive?.id, initialActive?.messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [active?.messages.length]);

  async function send(text?: string) {
    const message = (text ?? draft).trim();
    if (!message || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultationId: active?.id,
          message,
        }),
      });
      if (!res.ok) {
        alert(await res.text());
        return;
      }
      const data = await res.json();
      const fresh = data.consultation as {
        id: string;
        title: string;
        messages: Msg[];
      };
      setActive(fresh);
      setDraft("");
      if (!active || active.id !== fresh.id) {
        startTransition(() => router.push(`/consultation?id=${fresh.id}`));
      } else {
        startTransition(() => router.refresh());
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      {!claudeEnabled ? (
        <div className="card mb-4 border-warn/40 bg-warn/5">
          <div className="flex items-start gap-3">
            <span className="pill-warn shrink-0 mt-0.5">setup needed</span>
            <div className="text-sm text-slate-200 leading-relaxed">
              <span className="font-medium">
                Free-form Q&amp;A needs the Claude API integration enabled.
              </span>{" "}
              Right now you&apos;ll get the deterministic fallback advisor, which only handles a few canned patterns (savings, growth, runway, basic state). To unlock real free-form answers about your business — strategy, ideas, hiring, market context, anything — get an API key at{" "}
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                console.anthropic.com
              </a>
              , uncomment{" "}
              <code className="text-slate-300 bg-ink-700/60 px-1 rounded">
                ANTHROPIC_API_KEY
              </code>{" "}
              in your <code className="text-slate-300 bg-ink-700/60 px-1 rounded">.env</code>{" "}
              file, paste your key, and restart the dev server.
            </div>
          </div>
        </div>
      ) : null}

      {/* Single full-width pane, left-aligned. No top buttons — the
          tab nav above takes the user to Chat history. */}
      <section className="card flex flex-col overflow-hidden h-[calc(100vh-260px)] min-h-[500px]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 space-y-4">
          {!active ? (
            <div className="py-2 text-left">
              <div className="text-lg font-semibold">
                Ask the advisor anything about your business
              </div>
              <div className="text-sm text-slate-400 mt-1 max-w-xl">
                Answers are computed from your real data — last 3 months of
                transactions, employee roster, top vendors, and forecast.
              </div>
              <div className="flex flex-col gap-2 w-full max-w-xl mt-4">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="btn-ghost text-left justify-start text-sm"
                    disabled={sending}
                    onClick={() => send(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            active.messages.map((m) => (
              <div key={m.id} className="flex gap-3">
                <div
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                    m.role === "user"
                      ? "bg-accent text-white"
                      : "bg-ink-700 text-accent border border-accent/40"
                  }`}
                  title={m.role}
                >
                  {m.role === "user" ? "U" : "AI"}
                </div>
                <div className="flex-1 min-w-0">
                  {m.role === "user" ? (
                    <div className="text-sm text-slate-100 whitespace-pre-wrap">
                      {m.content}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        {renderMarkdown(m.content)}
                      </div>
                      <OptionsBlock payload={m.payload} currency={currency} />
                    </>
                  )}
                  <div className="text-[11px] text-slate-500 mt-1">
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
          {sending ? (
            <div className="flex gap-3">
              <div className="shrink-0 w-7 h-7 rounded-full bg-ink-700 text-accent border border-accent/40 flex items-center justify-center text-xs font-medium">
                AI
              </div>
              <div className="text-sm text-slate-400 italic pt-1">
                Analyzing your data…
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-line pt-3 mt-3">
          <div className="flex gap-2">
            <textarea
              className="input resize-none"
              rows={2}
              placeholder={`Ask anything: "I need to save $20K", "How should we grow revenue?", "What's our runway?"`}
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
            <button
              className="btn-primary self-end"
              disabled={sending || !draft.trim()}
              onClick={() => void send()}
            >
              {sending ? "…" : "Ask advisor"}
            </button>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Press ⌘/Ctrl + Enter to send.{" "}
            {claudeEnabled
              ? "Powered by Claude — answers grounded in your actual data, fall back to general knowledge for strategy questions."
              : "Mock advisor active — set ANTHROPIC_API_KEY for free-form Q&A."}
          </div>
        </div>
      </section>
    </div>
  );
}
