"use client";
import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  payload: string | null;
  createdAt: string;
};

type HistoryEntry = {
  id: string;
  question: string;
  answer: string | null;
  askedAt: string;
};

// Lightweight category classifier — keyword match on the question text.
// Used only for the history accordion badges.
function categorizeQuestion(text: string): string {
  const t = text.toLowerCase();
  if (/save|saving|cut|reduce/.test(t))                       return "Savings";
  if (/runway|cash|burn|reserves/.test(t))                    return "Cash & runway";
  if (/hire|fire|terminate|employee|payroll|headcount|team/.test(t)) return "Workforce";
  if (/forecast|future|project|scenario|model what|model the/.test(t)) return "Forecast";
  if (/vendor|supplier/.test(t))                              return "Vendors";
  if (/market|advertis|campaign|ad spend|ads/.test(t))        return "Marketing";
  if (/grow|growth|expand|scale|increase revenue|new customer/.test(t)) return "Growth";
  if (/margin|profit|net|p&l|pnl/.test(t))                    return "P&L";
  if (/category|categor|breakdown|expense/.test(t))           return "Expenses";
  if (/why|how|what|explain/.test(t))                         return "General";
  return "General";
}

const CATEGORY_PILL: Record<string, string> = {
  "Savings":       "pill-good",
  "Cash & runway": "pill-bad",
  "Workforce":     "pill-warn",
  "Forecast":      "pill-accent",
  "Vendors":       "pill",
  "Marketing":     "pill-accent",
  "Growth":        "pill-good",
  "P&L":           "pill-accent",
  "Expenses":      "pill-warn",
  "General":       "pill",
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

// Minimal markdown-ish renderer. Handles ###, **bold**, _italic_, > blockquote,
// and paragraphs separated by blank lines. Sufficient for advisor output.
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let buf: string[] = [];
  const flushPara = () => {
    if (buf.length) {
      blocks.push(
        <p key={blocks.length} className="text-sm leading-relaxed text-slate-200">
          {inline(buf.join(" "))}
        </p>,
      );
      buf = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("### ")) {
      flushPara();
      blocks.push(
        <h3 key={blocks.length} className="text-base font-semibold mt-2 mb-1">
          {inline(line.slice(4))}
        </h3>,
      );
    } else if (line.startsWith("> ")) {
      flushPara();
      blocks.push(
        <blockquote
          key={blocks.length}
          className="border-l-2 border-accent/60 pl-3 py-1 text-sm text-slate-300 bg-accent-soft/30 rounded-r"
        >
          {inline(line.slice(2))}
        </blockquote>,
      );
    } else if (line === "") {
      flushPara();
    } else {
      buf.push(line);
    }
  }
  flushPara();
  return blocks;
}

function inline(text: string): React.ReactNode {
  // Replace **bold** and _italic_ in a single pass.
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|_[^_]+_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(
        <strong key={parts.length} className="font-semibold text-slate-100">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else {
      parts.push(
        <em key={parts.length} className="text-slate-400">
          {tok.slice(1, -1)}
        </em>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
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
                  <ul className="mt-2 space-y-1">
                    {o.items.map((it, j) => (
                      <li
                        key={j}
                        className="text-xs flex items-start justify-between gap-3 border-t border-line/60 pt-1"
                      >
                        <span>
                          <span className="text-slate-200">{it.label}</span>
                          {it.note ? (
                            <span className="text-slate-500"> — {it.note}</span>
                          ) : null}
                        </span>
                        <span className="text-good shrink-0">
                          {fmtMoney(it.amount, currency)}
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
  history,
  active: initialActive,
  currency,
  claudeEnabled,
}: {
  history: HistoryEntry[];
  active: Active | null;
  currency: string;
  claudeEnabled: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState<Active | null>(initialActive);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [openHistoryItem, setOpenHistoryItem] = useState<string | null>(null);

  useEffect(() => {
    setActive(initialActive);
  }, [initialActive?.id, initialActive?.messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [active?.messages.length]);

  function newConversation() {
    setActive(null);
    setDraft("");
    startTransition(() => {
      router.push("/consultation");
    });
  }

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
      // Sync URL without a full nav, then force a fresh server render so
      // the history accordion picks up the new message.
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
              Right now you'll get the deterministic fallback advisor, which only handles a few canned patterns (savings, growth, runway, basic state). To unlock real free-form answers about your business — strategy, ideas, hiring, market context, anything — get an API key at{" "}
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
    <div className="h-[calc(100vh-260px)] min-h-[500px]">
      {/* Top action row: History toggle + New conversation. Replaces the
          old left-hand thread sidebar. */}
      <div className="flex items-center justify-end gap-2 mb-3 flex-wrap">
        <button
          type="button"
          className="btn-ghost text-xs"
          onClick={newConversation}
          disabled={pending}
        >
          + New conversation
        </button>
        <button
          type="button"
          className="btn-ghost text-xs"
          onClick={() => setHistoryOpen((v) => !v)}
        >
          {historyOpen ? "Hide history" : "Check history"}
          {history.length > 0 ? (
            <span className="ml-1 text-slate-500">({history.length})</span>
          ) : null}
        </button>
      </div>

      {/* History accordion — only mounted when toggled open. Newest
          question first; each card expands to reveal the answer. */}
      {historyOpen ? (
        <div className="card mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Consultation history</div>
            <div className="text-xs text-slate-400">
              {history.length} question{history.length === 1 ? "" : "s"} asked
            </div>
          </div>
          {history.length === 0 ? (
            <div className="text-sm text-slate-400 py-4 text-center">
              No questions yet — once you ask the advisor something it&apos;ll show up here.
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {history.map((h) => {
                const open = openHistoryItem === h.id;
                const cat = categorizeQuestion(h.question);
                const pill = CATEGORY_PILL[cat] ?? "pill";
                return (
                  <div
                    key={h.id}
                    className="rounded-md border border-line bg-ink-800/40"
                  >
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 flex items-start gap-3 hover:bg-ink-700/50 transition"
                      onClick={() => setOpenHistoryItem(open ? null : h.id)}
                    >
                      <span className={`${pill} text-[10px] shrink-0 mt-0.5`}>{cat}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-100 line-clamp-2">{h.question}</div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {new Date(h.askedAt).toLocaleString()}
                        </div>
                      </div>
                      <span className="text-slate-400 text-xs shrink-0 mt-0.5">
                        {open ? "▴" : "▾"}
                      </span>
                    </button>
                    {open ? (
                      <div className="px-3 pb-3 pt-2 border-t border-line">
                        {h.answer ? (
                          <div className="space-y-1.5">{renderMarkdown(h.answer)}</div>
                        ) : (
                          <div className="text-xs text-slate-500 italic">
                            No answer was recorded for this question.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* Conversation pane (now full-width) */}
      <section className="card flex flex-col overflow-hidden h-[calc(100%-3rem)]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 space-y-4">
          {!active ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-12">
              <div className="text-lg font-semibold">
                Ask the advisor anything about your business
              </div>
              <div className="text-sm text-slate-400 max-w-md">
                Answers are computed from your real data — last 3 months of
                transactions, employee roster, top vendors, and forecast.
              </div>
              <div className="flex flex-col gap-2 w-full max-w-md mt-2">
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
              {sending ? "…" : "Send"}
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
    </div>
  );
}
