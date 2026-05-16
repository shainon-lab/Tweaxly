"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CONSULT_OPEN_EVENT, type ConsultOpenDetail } from "./GlobalConsult";

// Open the floating Consult panel pre-loaded with a question and a
// per-signal title/subtitle. Keeps the user on /business-signals so
// they can keep seeing the signal while consulting about it.
function openConsult(detail: ConsultOpenDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONSULT_OPEN_EVENT, { detail }));
}

export type PushRec = {
  id: string;
  level: string;
  // Three-part executive signal structure:
  //   observation     — WHAT happened (headline)
  //   interpretation  — WHY it matters (AI analysis)
  //   recommendation  — WHAT to do next (suggested action)
  observation: string;
  interpretation: string;
  recommendation: string;
  impact: number;
  category: string;
  status: string;
  createdAt: string | Date;
};

const LEVEL_PILL: Record<string, string> = {
  bad: "pill-bad",
  warn: "pill-warn",
  info: "pill-accent",
  good: "pill-good",
};

const CATEGORY_LABEL: Record<string, string> = {
  marketing: "Marketing",
  payroll: "Payroll",
  vendor: "Vendor",
  growth: "Growth",
  accuracy: "Accuracy",
  cashflow: "Cash flow",
  other: "Other",
};

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

function relTime(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  const diffMs = Date.now() - date.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export default function PushRecommendations({
  initial,
  currency,
}: {
  initial: PushRec[];
  currency: string;
}) {
  // The dashboard re-rolls the visible 5 signals on every server render,
  // so refresh just re-runs the server transition. Each render samples a
  // fresh random 5 from the ~15-signal pool. `initial` updates between
  // renders because pushRecs is recomputed in the page on every visit.
  const router = useRouter();
  const [recs, setRecs] = useState<PushRec[]>(initial);
  const [pending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);
  const prevInitialRef = useRef(initial);

  // Sync to server-provided initial whenever the parent re-renders with a
  // new sample (e.g. after router.refresh() returns).
  if (initial !== prevInitialRef.current) {
    prevInitialRef.current = initial;
    setRecs(initial);
  }

  function refresh() {
    setRefreshing(true);
    startTransition(() => {
      router.refresh();
      // The new render will swap `initial` underneath us; clear the spinner
      // shortly after to cover the transition.
      setTimeout(() => setRefreshing(false), 600);
    });
  }

  // Close = local-only hide. The row is still active server-side, so the
  // next page reload brings it back. Matches the user-intended behavior:
  // "if it's close, whenever you refresh it may repeat again".
  function close(id: string) {
    setRecs((prev) => prev.filter((r) => r.id !== id));
  }

  const newest = recs[0];
  const stale =
    newest &&
    Date.now() - new Date(newest.createdAt).getTime() > 1000 * 60 * 60 * 24;

  return (
    <div className="card mb-0 flex flex-col min-h-[280px]">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-medium">Business Signals</span>
          <span className="pill-accent">AI advisor</span>
          {newest ? (
            <span
              className={`text-xs ${stale ? "text-warn" : "text-slate-400"}`}
              title={new Date(newest.createdAt).toLocaleString()}
            >
              {stale ? "stale · " : "updated "} {relTime(newest.createdAt)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-line text-slate-300 hover:text-white hover:bg-ink-700 transition disabled:opacity-50"
            disabled={refreshing || pending}
            onClick={refresh}
            title={recs.length ? "Refresh recommendations" : "Generate recommendations"}
            aria-label={recs.length ? "Refresh recommendations" : "Generate recommendations"}
          >
            <RefreshIcon spinning={refreshing} />
          </button>
        </div>
      </div>

      {recs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
          <div className="text-sm font-medium text-slate-200 mb-1">No signals to show</div>
          <div className="text-xs text-slate-400 max-w-xs">
            Once there&apos;s a few months of data, the advisor surfaces signals about revenue, expenses, vendor spikes, and cash-flow risks here automatically.
          </div>
        </div>
      ) : (
        <SignalGroups recs={recs} currency={currency} onClose={close} />
      )}

      <div
        className="mt-4 rounded-xl border border-line p-4 md:p-5 flex items-center justify-between gap-3 flex-wrap"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(124,92,250,0.14) 0%, rgba(79,125,255,0.10) 50%, rgba(34,211,238,0.10) 100%)",
        }}
      >
        <div className="text-sm md:text-base font-semibold text-slate-100 leading-snug max-w-xl">
          Or consult about anything else going on in your business.
        </div>
        <button
          type="button"
          className="btn-primary text-sm px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-transform active:scale-[0.98]"
          onClick={() => openConsult({
            contextTitle: "Business Signals",
            contextSubtitle: "Open consultation",
          })}
        >
          Consult on any topic
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Signal card grid
// ─────────────────────────────────────────────────────────────────────────────

// Four labeled rows of cards, grouped strictly by severity in the
// hierarchy the product spec calls for. Rows with zero items collapse
// out — not all four are populated at the same time:
//   Critical   — level "bad"
//   Attention  — level "warn"
//   Positive   — level "good"
//   Insight    — level "info"
// Each row is a 3-column grid on md+.
function SignalGroups({
  recs,
  currency,
  onClose,
}: {
  recs: PushRec[];
  currency: string;
  onClose: (id: string) => void;
}) {
  const critical  = recs.filter((r) => r.level === "bad");
  const attention = recs.filter((r) => r.level === "warn");
  const positive  = recs.filter((r) => r.level === "good");
  const insight   = recs.filter((r) => r.level === "info");

  const groups: { key: string; title: string; subtitle: string; tone: "bad" | "warn" | "good" | "neutral"; items: PushRec[] }[] = [
    {
      key: "critical",
      title: "Critical",
      subtitle: "Act on these first — risks with material impact.",
      tone: "bad",
      items: critical,
    },
    {
      key: "attention",
      title: "Attention",
      subtitle: "Watch closely — emerging issues worth a look.",
      tone: "warn",
      items: attention,
    },
    {
      key: "positive",
      title: "Positive",
      subtitle: "What's working — lean into these.",
      tone: "good",
      items: positive,
    },
    {
      key: "insight",
      title: "Insight",
      subtitle: "Context and baseline numbers worth knowing.",
      tone: "neutral",
      items: insight,
    },
  ];

  return (
    <div className="space-y-6">
      {groups.map((g) => {
        if (g.items.length === 0) return null;
        const headingClass =
          g.tone === "bad"  ? "text-bad"     :
          g.tone === "warn" ? "text-warn"    :
          g.tone === "good" ? "text-good"    :
                              "text-slate-200";
        return (
          <section key={g.key}>
            <div className="flex items-baseline gap-2 flex-wrap mb-3">
              <h3 className={`text-sm md:text-base font-semibold ${headingClass}`}>
                {g.title}
              </h3>
              <span className="text-xs text-slate-500">· {g.subtitle}</span>
            </div>
            {/* When a severity row has a single signal, let it span
                the full width so it doesn't leave 2/3 of the row
                empty. With 2 or 3 cards, keep the standard 3-col grid
                — the third slot just stays empty when there are 2,
                so cards retain their regular size. */}
            <div className={`grid gap-3 ${g.items.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"}`}>
              {g.items.map((r) => (
                <SignalCard
                  key={r.id}
                  rec={r}
                  currency={currency}
                  onClose={onClose}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SignalCard({
  rec: r,
  currency,
  onClose,
}: {
  rec: PushRec;
  currency: string;
  onClose: (id: string) => void;
}) {
  const border =
    r.level === "bad"  ? "border-bad/40"     :
    r.level === "warn" ? "border-warn/40"    :
    r.level === "good" ? "border-good/40"    :
                         "border-line";
  const consultQuestion = `${r.observation} ${r.interpretation} You suggested: ${r.recommendation} Walk me through this in more depth — is the diagnosis right, and what should I actually do?`;
  return (
    <div
      className={`relative rounded-xl border ${border} bg-ink-900/40 p-4 flex flex-col h-full`}
    >
      <button
        className="absolute top-2 right-2 text-xs text-slate-500 hover:text-slate-200"
        onClick={() => onClose(r.id)}
        title="Dismiss — may reappear on refresh"
        aria-label="Dismiss"
      >
        ✕
      </button>

      {/* Pill row */}
      <div className="flex items-center gap-2 flex-wrap mb-2 pr-6">
        <span className={LEVEL_PILL[r.level] ?? "pill"}>{r.level}</span>
        <span className="pill text-[10px]">{CATEGORY_LABEL[r.category] ?? r.category}</span>
        {r.impact > 0 ? (
          <span className="pill-good text-[10px]">
            ≈ {fmtMoney(r.impact, currency)}/mo
          </span>
        ) : null}
      </div>

      {/* 1. What happened — the observation */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">
          What Happened
        </div>
        <div className="font-semibold text-sm text-slate-100 leading-snug">
          {r.observation}
        </div>
      </div>

      {/* 2. Why it matters — the interpretation */}
      <div className="mt-3">
        <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">
          Why It Matters
        </div>
        <div className="text-xs text-slate-300 leading-relaxed">
          {r.interpretation}
        </div>
      </div>

      {/* 3. Recommended action — the suggested next step */}
      <div className="mt-3">
        <div className="text-[10px] uppercase tracking-wide text-accent mb-0.5">
          Recommended Action
        </div>
        <div className="text-xs text-slate-200 leading-relaxed">
          {r.recommendation}
        </div>
      </div>

      {/* CTA — purple primary button so it matches the rest of the
          system's primary actions. Pinned to the bottom so cards in a
          row line up. */}
      <div className="mt-auto pt-3">
        <button
          type="button"
          className="btn-primary text-xs px-3 py-1.5 rounded-md inline-flex items-center gap-1.5"
          title="Consult the AI advisor about this signal — without leaving this page"
          onClick={() => openConsult({
            prompt: consultQuestion,
            // Title surfaces the category so the panel header reads
            // 'Signal · Vendor cost spike' instead of the default
            // 'Business Signals · Active alerts and observations'.
            contextTitle: `Signal · ${CATEGORY_LABEL[r.category] ?? r.category}`,
            contextSubtitle: r.observation,
          })}
        >
          <span>Consult AI</span>
          <span className="text-[10px]">→</span>
        </button>
      </div>
    </div>
  );
}

// Inline refresh icon. Spins while the parent reports a refresh in flight.
function RefreshIcon({ spinning }: { spinning?: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={spinning ? "animate-spin" : ""}
      aria-hidden="true"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
