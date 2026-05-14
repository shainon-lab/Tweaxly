"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
            Once there's a few months of data, the advisor surfaces signals about revenue, expenses, vendor spikes, and cash-flow risks here automatically.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {recs.map((r) => {
            const accent =
              r.level === "bad"  ? "border-bad/40"   :
              r.level === "warn" ? "border-warn/40"  :
              r.level === "good" ? "border-good/40"  :
                                   "border-accent/40";
            // The question pre-filled into the Consultation textarea
            // combines all three parts so the AI advisor has full
            // context for follow-up analysis.
            const consultQuestion = `${r.observation} ${r.interpretation} You suggested: ${r.recommendation} Walk me through this in more depth — is the diagnosis right, and what should I actually do?`;
            return (
              <div
                key={r.id}
                className={`relative border-l-2 pl-4 pr-2 py-3 rounded-r-lg bg-ink-900/40 ${accent}`}
              >
                <button
                  className="absolute top-2 right-2 text-xs text-slate-500 hover:text-slate-200"
                  onClick={() => close(r.id)}
                  title="Dismiss — may reappear on refresh"
                  aria-label="Dismiss"
                >
                  ✕
                </button>

                {/* Level + category pill row */}
                <div className="flex items-center gap-2 flex-wrap mb-2 pr-6">
                  <span className={LEVEL_PILL[r.level] ?? "pill"}>{r.level}</span>
                  <span className="pill text-[10px]">{CATEGORY_LABEL[r.category] ?? r.category}</span>
                  {r.impact > 0 ? (
                    <span className="pill-good text-[10px]">
                      ≈ {fmtMoney(r.impact, currency)}/mo
                    </span>
                  ) : null}
                </div>

                {/* 1. Observation — WHAT happened */}
                <div className="font-semibold text-sm text-slate-100 leading-snug">
                  {r.observation}
                </div>

                {/* 2. Interpretation — WHY it matters */}
                <div className="mt-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">
                    Why this matters
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    {r.interpretation}
                  </div>
                </div>

                {/* 3. Recommendation — WHAT to do */}
                <div className="mt-2">
                  <div className="text-[10px] uppercase tracking-wide text-accent mb-0.5">
                    Recommended action
                  </div>
                  <div className="text-xs text-slate-200 leading-relaxed">
                    {r.recommendation}
                  </div>
                </div>

                {/* 4. CTA — Analyze with AI */}
                <div className="mt-3">
                  <Link
                    href={`/consultation?q=${encodeURIComponent(consultQuestion)}`}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-accent/40 bg-accent-soft/30 text-accent hover:bg-accent-soft hover:text-white transition"
                    title="Open this signal in the AI advisor for deeper analysis"
                  >
                    <span>Analyze with AI</span>
                    <span className="text-[10px]">→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
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
        <Link
          href="/consultation"
          className="btn-primary text-sm px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-transform active:scale-[0.98]"
        >
          Consult on any topic
        </Link>
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
