"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareText } from "lucide-react";
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
          <span className="text-base font-medium">Signals</span>
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Signal card grid
// ─────────────────────────────────────────────────────────────────────────────

// Three-section signal layout, sorted by what the user actually
// needs to do:
//
//   1. PRIORITY SIGNALS — bad + warn merged. Full-size cards. Max 4
//      visible. This is where decisions happen.
//   2. QUICK INSIGHTS — info signals. Compact stacked rows (not
//      cards). Lower visual weight; expand-collapse for any past 3.
//   3. POSITIVE SIGNALS — good signals, consolidated into a single
//      bullet card titled '<N> positive business signals' so good
//      news exists without crowding the page.
//
// The goal: every signal feels meaningful instead of the page
// reading as a content feed.
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

  // Priority pool — bad always first, then warn, ranked by impact
  // within tone. Cap visible at 4 so the section reads decisive
  // rather than overwhelming.
  const priority = [...critical, ...attention].slice(0, 4);

  return (
    <div className="space-y-8">
      {priority.length > 0 ? (
        <PrioritySection
          items={priority}
          currency={currency}
          onClose={onClose}
        />
      ) : null}

      {insight.length > 0 ? (
        <QuickInsights items={insight} currency={currency} />
      ) : null}

      {positive.length > 0 ? (
        <PositiveSummary items={positive} currency={currency} />
      ) : null}
    </div>
  );
}

function PrioritySection({
  items,
  currency,
  onClose,
}: {
  items: PushRec[];
  currency: string;
  onClose: (id: string) => void;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-2 flex-wrap mb-3">
        <h3 className="text-sm md:text-base font-semibold text-bad">
          Priority Signals
        </h3>
        <span className="text-xs text-slate-500">
          · Requires your attention right now.
        </span>
      </div>
      <div className={`grid gap-3 ${items.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}`}>
        {items.map((r) => (
          <SignalCard key={r.id} rec={r} currency={currency} onClose={onClose} />
        ))}
      </div>
    </section>
  );
}

// Compact rows for info-level signals. Each row is single-line
// (title + brief observation) with a small Consult AI affordance on
// hover. Hides past the first three behind a 'Show all' toggle so
// the section stays lightweight.
function QuickInsights({
  items,
  currency,
}: {
  items: PushRec[];
  currency: string;
}) {
  void currency;
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, 3);
  const hidden = Math.max(0, items.length - 3);
  return (
    <section>
      <div className="flex items-baseline gap-2 flex-wrap mb-3">
        <h3 className="text-sm md:text-base font-semibold text-slate-200">
          Quick Insights
        </h3>
        <span className="text-xs text-slate-500">
          · Observations worth knowing — not urgent.
        </span>
      </div>
      <ul className="divide-y divide-line/40 border-y border-line/40">
        {visible.map((r) => {
          const consultQuestion = `${r.observation} ${r.interpretation} What should I know and what should I do about it?`;
          return (
            <li key={r.id} className="py-2.5 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-100 leading-tight">
                  {r.observation}
                </div>
                <div className="text-xs text-slate-500 leading-snug mt-0.5 line-clamp-2">
                  {r.interpretation}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (typeof window === "undefined") return;
                  window.dispatchEvent(new CustomEvent(CONSULT_OPEN_EVENT, {
                    detail: {
                      prompt: consultQuestion,
                      contextTitle: `Insight · ${CATEGORY_LABEL[r.category] ?? r.category}`,
                      contextSubtitle: r.observation,
                    },
                  }));
                }}
                className="shrink-0 text-[11px] px-2.5 py-1 rounded-md border border-line text-slate-400 hover:text-accent hover:border-accent/40 transition duration-200"
                title="Open consultation with this context"
              >
                Consult
              </button>
            </li>
          );
        })}
      </ul>
      {hidden > 0 ? (
        <button
          type="button"
          className="mt-3 text-xs text-slate-500 hover:text-accent transition duration-200"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? "Show fewer" : `Show ${hidden} more →`}
        </button>
      ) : null}
    </section>
  );
}

// Consolidated 'good news' card — collapses every positive signal
// into one bullet card so the page doesn't read as overly
// celebratory. Each bullet is the observation, slightly muted, with
// the category as a tiny lead label.
function PositiveSummary({
  items,
  currency,
}: {
  items: PushRec[];
  currency: string;
}) {
  void currency;
  return (
    <section>
      <div className="flex items-baseline gap-2 flex-wrap mb-3">
        <h3 className="text-sm md:text-base font-semibold text-good">
          {items.length} positive business signal{items.length === 1 ? "" : "s"}
        </h3>
        <span className="text-xs text-slate-500">
          · What&apos;s working — lean into these.
        </span>
      </div>
      <div className="rounded-xl border border-good/30 bg-good/5 p-4">
        <ul className="space-y-2">
          {items.map((r) => (
            <li key={r.id} className="flex items-start gap-2.5">
              <span className="text-good text-xs mt-1 shrink-0" aria-hidden="true">✓</span>
              <div className="min-w-0">
                <span className="text-xs uppercase tracking-wide text-slate-500 mr-1.5">
                  {CATEGORY_LABEL[r.category] ?? r.category}
                </span>
                <span className="text-sm text-slate-200">{r.observation}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
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
      <div className="mt-auto pt-3 flex justify-end">
        <button
          type="button"
          className="text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-accent/40 bg-accent-soft/40 text-accent font-medium shadow-sm hover:bg-accent-soft hover:border-accent hover:text-white hover:shadow-md transition duration-200"
          title="Open consultation with this context"
          onClick={() => openConsult({
            prompt: consultQuestion,
            // Title surfaces the category so the panel header reads
            // 'Signal · Vendor cost spike' instead of the default
            // 'Signals · Active alerts and observations'.
            contextTitle: `Signal · ${CATEGORY_LABEL[r.category] ?? r.category}`,
            contextSubtitle: r.observation,
          })}
        >
          <MessageSquareText
            size={13}
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span>Consult on this</span>
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
