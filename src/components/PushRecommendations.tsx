"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, MessageSquareText, X as XIcon } from "lucide-react";
import { CONSULT_OPEN_EVENT, type ConsultOpenDetail } from "./GlobalConsult";

// Open the floating Consult panel pre-loaded with a question and a
// per-signal title/subtitle.
function openConsult(detail: ConsultOpenDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONSULT_OPEN_EVENT, { detail }));
}

export type PushRec = {
  id: string;
  // Stable identifier for the underlying signal. Used as the lifecycle
  // key in localStorage. Optional for backward compat; falls back to id.
  signalKey?: string;
  level: string;
  observation: string;
  interpretation: string;
  recommendation: string;
  impact: number;
  category: string;
  status: string;
  createdAt: string | Date;
};

// ─────────────────────────────────────────────────────────────────────────────
// Badge mapping — the five user-facing chips on every card. Driven by
// severity, with a category nudge for the Opportunity lane.
// ─────────────────────────────────────────────────────────────────────────────

type Badge = "Critical" | "Action Needed" | "Watch" | "Opportunity" | "FYI";

function badgeFor(r: PushRec): Badge {
  if (r.level === "bad")  return "Critical";
  if (r.level === "warn") return "Action Needed";
  if (r.level === "good") return r.category === "growth" ? "Opportunity" : "FYI";
  return "Watch";
}

const CATEGORY_LABEL: Record<string, string> = {
  marketing: "Marketing",
  payroll:   "Payroll",
  vendor:    "Vendor",
  growth:    "Growth",
  accuracy:  "Accuracy",
  cashflow:  "Cash flow",
  other:     "Other",
};

// ─────────────────────────────────────────────────────────────────────────────
// Compact display — 2-4 word title + one key metric per signal, so the
// grid reads as a command center instead of a feed. Pattern-matches
// signalKey prefix; the metric is pulled from the existing observation
// string so the source of truth stays in advisor.ts.
// ─────────────────────────────────────────────────────────────────────────────

type CompactDisplay = {
  title: string;
  metric?: string;
  direction?: "up" | "down" | "flat";
  // One short contextual sentence — the only prose on a collapsed
  // card. Kept under ~8 words so the card stays scannable.
  subtitle?: string;
};

function firstPct(s: string): string | undefined {
  const m = s.match(/-?\d+(?:\.\d+)?%/);
  return m ? m[0] : undefined;
}

function firstMoney(s: string): string | undefined {
  const m = s.match(/[$£€]\s?-?\d[\d,]*(?:\.\d+)?[KMB]?/);
  return m ? m[0] : undefined;
}

function compactDisplay(r: PushRec): CompactDisplay {
  const key = (r.signalKey ?? "").split(":")[0];
  const tail = (r.signalKey ?? "").split(":")[1];
  const obs = r.observation;
  switch (key) {
    case "marketing_intensity_high":
      return { title: "Marketing Pressure", metric: firstPct(obs), direction: "up", subtitle: "Above the 25% revenue guardrail." };
    case "marketing_cut_held":
      return { title: "Marketing Cut", metric: "Held", direction: "flat", subtitle: "Held without hurting revenue." };
    case "vendor_spike":
      return { title: "Vendor Spike", metric: firstPct(obs), direction: "up", subtitle: tail ? `${tail} cost rose sharply.` : "A vendor cost rose sharply." };
    case "forecast_negative_next_month":
      return { title: "Cash Risk", metric: firstMoney(obs), direction: "down", subtitle: "Next month is forecast negative." };
    case "payroll_heavy":
      return { title: "Payroll Pressure", metric: firstPct(obs), subtitle: "Heavy for your current run-rate." };
    case "uncategorized_high": {
      const m = obs.match(/^(\d+)/);
      return { title: "Uncategorized", metric: m ? `${m[1]} txns` : undefined, subtitle: "Needs categorization to sharpen insights." };
    }
    case "growth_headroom":
      return { title: "Growth Headroom", metric: firstPct(obs), subtitle: "Opportunity to scale marketing." };
    case "vendor_concentration":
      return { title: "Vendor Concentration", metric: firstPct(obs), subtitle: tail ? `${tail} dominates spend this month.` : "Single vendor dominates spend." };
    case "revenue_mom_swing": {
      const pct = firstPct(obs);
      const isDown = obs.toLowerCase().includes("down") || (pct?.startsWith("-") ?? false);
      return {
        title: isDown ? "Revenue Decrease" : "Revenue Increase",
        metric: pct,
        direction: isDown ? "down" : "up",
        subtitle: isDown ? "Potential slowdown detected." : "Top-line trending up.",
      };
    }
    case "net_margin_observation":
      return { title: "Net Margin", metric: firstPct(obs), subtitle: "This month's profitability snapshot." };
    case "top_expense_category":
      return { title: "Top Expense", metric: firstMoney(obs), subtitle: tail ? `${tail} leads spend this month.` : "Largest cost category this month." };
    case "expense_mom_jump":
      return { title: "Expense Jump", metric: firstPct(obs), direction: "up", subtitle: "Operating costs rose month-over-month." };
    case "trailing_3_net":
      return { title: "3-mo Net", metric: firstMoney(obs), subtitle: "Trailing three-month performance." };
    case "monthly_revenue_snapshot":
      return { title: "Monthly Revenue", metric: firstMoney(obs), subtitle: "This month's top-line." };
    case "monthly_expense_snapshot":
      return { title: "Monthly Expenses", metric: firstMoney(obs), subtitle: "This month's total spend." };
    case "avg_revenue_trail3":
      return { title: "Avg Revenue", metric: firstMoney(obs), subtitle: "Trailing three-month average." };
    case "recurring_expense_base":
      return { title: "Recurring Base", metric: firstMoney(obs), subtitle: "Locked-in monthly spend." };
    case "ytd_snapshot":
      return { title: "YTD Net", metric: firstMoney(obs), subtitle: "Year-to-date performance." };
    case "headcount_snapshot": {
      const m = obs.match(/^(\d+)/);
      return { title: "Headcount", metric: m ? m[1] : undefined, subtitle: "Active employees on payroll." };
    }
    case "upload_freshness":
      return { title: "Data Freshness", metric: "Stale", subtitle: "Latest upload looks outdated." };
    case "empty_fallback":
      return { title: "All Clear", subtitle: "No urgent issues detected." };
    default:
      return {
        title: CATEGORY_LABEL[r.category] ?? "Signal",
        metric: firstMoney(obs) ?? firstPct(obs),
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle — 'new' / 'ongoing' / 'escalating' / 'improving' / 'resolved'.
// Tracks every signal's first-seen + last-seen severity in localStorage so
// the same dashboard reads as 'what changed since you last looked'.
// ─────────────────────────────────────────────────────────────────────────────

type Lifecycle = "new" | "ongoing" | "escalating" | "improving" | "resolved";

type LifecycleEntry = {
  firstSeenAt: number;
  lastSeenAt: number;
  lastLevel: string;
};

type LifecycleStore = Record<string, LifecycleEntry>;

const LIFECYCLE_LS_KEY = "tweaxly.signal.lifecycle.v1";
const RESOLVED_LS_KEY  = "tweaxly.signal.resolved.v1";
const NEW_WINDOW_MS = 24 * 60 * 60 * 1000;

function severityScore(level: string): number {
  if (level === "bad")  return 3;
  if (level === "warn") return 2;
  if (level === "info") return 1;
  if (level === "good") return 0;
  return 0;
}

function readLifecycleStore(): LifecycleStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LIFECYCLE_LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as LifecycleStore;
  } catch {
    return {};
  }
}

function writeLifecycleStore(s: LifecycleStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LIFECYCLE_LS_KEY, JSON.stringify(s));
  } catch {
    /* full or disabled — ignore */
  }
}

function readResolved(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(RESOLVED_LS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeResolved(keys: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RESOLVED_LS_KEY, JSON.stringify([...keys]));
  } catch {
    /* ignore */
  }
}

const LIFECYCLE_LABEL: Record<Lifecycle, string> = {
  new:        "New",
  escalating: "Escalating",
  improving:  "Improving",
  ongoing:    "Ongoing",
  resolved:   "Resolved",
};
// Text-only lifecycle tone for inline placement in the compact meta
// row — no border/pill chrome, just a colored word.
const LIFECYCLE_TEXT: Record<Lifecycle, string> = {
  new:        "text-accent font-medium",
  escalating: "text-bad font-medium",
  improving:  "text-good font-medium",
  ongoing:    "text-slate-400",
  resolved:   "text-slate-500",
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

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function PushRecommendations({
  initial,
  currency,
}: {
  initial: PushRec[];
  currency: string;
}) {
  const router = useRouter();
  const [recs, setRecs] = useState<PushRec[]>(initial);
  const [pending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);
  const [lifecycles, setLifecycles] = useState<Record<string, Lifecycle>>({});
  const [resolved, setResolvedState] = useState<Set<string>>(new Set());
  // Signal Deck — only one card flipped at a time so the table reads
  // as 'one card open, everything else compact'.
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const prevInitialRef = useRef(initial);

  if (initial !== prevInitialRef.current) {
    prevInitialRef.current = initial;
    setRecs(initial);
  }

  // Hydrate resolved set from localStorage on mount.
  useEffect(() => {
    setResolvedState(readResolved());
  }, []);

  // Compute lifecycle (new / ongoing / escalating / improving / resolved)
  // for each signal by comparing the current snapshot to the last-seen
  // state. Persist the snapshot so next visit can diff against this one.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const store = readLifecycleStore();
    const next: Record<string, Lifecycle> = {};
    const now = Date.now();
    for (const r of recs) {
      const key = r.signalKey ?? r.id;
      const stored = store[key];
      let state: Lifecycle;
      if (resolved.has(key)) {
        state = "resolved";
      } else if (!stored) {
        state = "new";
      } else if (now - stored.firstSeenAt < NEW_WINDOW_MS) {
        state = "new";
      } else if (severityScore(r.level) > severityScore(stored.lastLevel)) {
        state = "escalating";
      } else if (severityScore(r.level) < severityScore(stored.lastLevel)) {
        state = "improving";
      } else {
        state = "ongoing";
      }
      next[r.id] = state;
      store[key] = {
        firstSeenAt: stored?.firstSeenAt ?? now,
        lastSeenAt: now,
        lastLevel: r.level,
      };
    }
    writeLifecycleStore(store);
    setLifecycles(next);
  }, [recs, resolved]);

  function refresh() {
    setRefreshing(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => setRefreshing(false), 600);
    });
  }

  function resolveSignal(r: PushRec) {
    const key = r.signalKey ?? r.id;
    const next = new Set(resolved);
    next.add(key);
    setResolvedState(next);
    writeResolved(next);
    setFlippedId(null);
  }

  function toggleFlip(id: string) {
    setFlippedId((cur) => (cur === id ? null : id));
  }

  function clearResolved() {
    setResolvedState(new Set());
    writeResolved(new Set());
  }

  // Visible pool = everything not user-resolved.
  const visibleRecs = recs.filter((r) => !resolved.has(r.signalKey ?? r.id));

  const newest = visibleRecs[0];
  const stale =
    newest &&
    Date.now() - new Date(newest.createdAt).getTime() > 1000 * 60 * 60 * 24;

  return (
    <div className="card mb-0 flex flex-col min-h-[280px]">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
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
          {resolved.size > 0 ? (
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-slate-200 transition"
              onClick={clearResolved}
              title="Bring back signals you've marked resolved"
            >
              Restore {resolved.size} resolved
            </button>
          ) : null}
          <button
            type="button"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-line text-slate-300 hover:text-white hover:bg-ink-700 transition disabled:opacity-50"
            disabled={refreshing || pending}
            onClick={refresh}
            title={recs.length ? "Refresh signals" : "Generate signals"}
            aria-label={recs.length ? "Refresh signals" : "Generate signals"}
          >
            <RefreshIcon spinning={refreshing} />
          </button>
        </div>
      </div>

      {visibleRecs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
          <div className="text-sm font-medium text-slate-200 mb-1">No signals to show</div>
          <div className="text-xs text-slate-400 max-w-xs">
            {resolved.size > 0
              ? "Everything's marked resolved. Use the Restore link above to bring them back."
              : "Once there's a few months of data, the advisor surfaces revenue, expense, vendor, and cash-flow signals here automatically."}
          </div>
        </div>
      ) : (
        <SignalDeck
          recs={visibleRecs}
          currency={currency}
          lifecycles={lifecycles}
          flippedId={flippedId}
          onToggleFlip={toggleFlip}
          onResolve={resolveSignal}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Three-layer signal layout
// ─────────────────────────────────────────────────────────────────────────────

// Signal Deck — uniform compact-height cards, mixed widths so critical
// signals dominate visually. `grid-auto-flow: dense` packs the grid
// so wide cards don't leave gaps.
function SignalDeck({
  recs,
  currency,
  lifecycles,
  flippedId,
  onToggleFlip,
  onResolve,
}: {
  recs: PushRec[];
  currency: string;
  lifecycles: Record<string, Lifecycle>;
  flippedId: string | null;
  onToggleFlip: (id: string) => void;
  onResolve: (r: PushRec) => void;
}) {
  const severityRank: Record<string, number> = { bad: 0, warn: 1, info: 2, good: 3 };
  const lifecycleRank: Record<Lifecycle, number> = {
    escalating: 0, new: 1, improving: 2, ongoing: 3, resolved: 4,
  };
  const sorted = [...recs].sort((a, b) => {
    const sa = severityRank[a.level] ?? 4;
    const sb = severityRank[b.level] ?? 4;
    if (sa !== sb) return sa - sb;
    const la = lifecycleRank[lifecycles[a.id] ?? "ongoing"];
    const lb = lifecycleRank[lifecycles[b.id] ?? "ongoing"];
    return la - lb;
  });

  return (
    <div
      className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      style={{ gridAutoFlow: "dense" }}
    >
      {sorted.map((r) => (
        <SignalCard
          key={r.id}
          rec={r}
          currency={currency}
          lifecycle={lifecycles[r.id]}
          flipped={flippedId === r.id}
          onToggleFlip={() => onToggleFlip(r.id)}
          onResolve={() => onResolve(r)}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Signal Deck card — a flip card. Front is compact (title · metric ·
// subtitle), back carries the structured detail. Critical cards span
// 2 columns at lg+ so they dominate the deck. Fixed height keeps the
// grid uniform regardless of which side is showing.
// ─────────────────────────────────────────────────────────────────────────────

function SignalCard({
  rec,
  currency,
  lifecycle,
  flipped,
  onToggleFlip,
  onResolve,
}: {
  rec: PushRec;
  currency: string;
  lifecycle?: Lifecycle;
  flipped: boolean;
  onToggleFlip: () => void;
  onResolve: () => void;
}) {
  const display = compactDisplay(rec);
  const badge = badgeFor(rec);

  // Severity-driven styling. Critical gets a soft red glow ring +
  // wider footprint; Action Needed / Opportunity get colored borders
  // without glow; FYI / Watch sit quiet.
  const isCritical = rec.level === "bad";
  const dotColor =
    rec.level === "bad"  ? "bg-bad"    :
    rec.level === "warn" ? "bg-warn"   :
    rec.level === "good" ? (rec.category === "growth" ? "bg-accent" : "bg-good") :
                           "bg-slate-500";
  const borderColor =
    rec.level === "bad"  ? "border-bad/50"  :
    rec.level === "warn" ? "border-warn/40" :
    rec.level === "good" ? (rec.category === "growth" ? "border-accent/30" : "border-good/25") :
                           "border-line";
  const glowShadow = isCritical
    ? "shadow-[0_0_24px_-6px_rgba(239,91,91,0.35)]"
    : "";
  const colSpan = isCritical ? "lg:col-span-2" : "";

  const arrowChar = display.direction === "up" ? "↑" : display.direction === "down" ? "↓" : "";
  const arrowTone =
    display.direction === "up"
      ? (rec.level === "bad" || rec.level === "warn" ? "text-bad" : "text-good")
      : display.direction === "down"
      ? "text-bad"
      : "";

  return (
    <div
      className={`${colSpan} h-56 [perspective:1200px]`}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 ease-out [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
      >
        {/* FRONT — compact hero */}
        <button
          type="button"
          onClick={onToggleFlip}
          aria-pressed={flipped}
          aria-label={`Show details for ${display.title}`}
          className={`absolute inset-0 [backface-visibility:hidden] rounded-2xl border ${borderColor} bg-ink-900/50 ${glowShadow} p-5 text-left flex flex-col gap-3 transition-shadow duration-200 hover:bg-ink-900/70 hover:shadow-lg hover:shadow-black/30 group ${flipped ? "pointer-events-none" : ""}`}
        >
          {/* Meta line — severity dot + badge + category + lifecycle */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span
              className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isCritical ? "animate-pulse" : ""}`}
              aria-hidden="true"
            />
            <span className="font-medium tracking-wide text-slate-300">{badge}</span>
            <span className="text-slate-600">·</span>
            <span>{CATEGORY_LABEL[rec.category] ?? rec.category}</span>
            {lifecycle && lifecycle !== "ongoing" ? (
              <>
                <span className="text-slate-600">·</span>
                <span className={LIFECYCLE_TEXT[lifecycle]}>{LIFECYCLE_LABEL[lifecycle]}</span>
              </>
            ) : null}
          </div>

          {/* Title + metric — the two things the user reads while scanning */}
          <div className={`${isCritical ? "text-xl" : "text-lg"} font-semibold text-slate-50 leading-tight tracking-tight`}>
            {display.title}
          </div>
          {display.metric ? (
            <div className={`${isCritical ? "text-4xl" : "text-3xl"} font-bold text-white leading-none tabular-nums tracking-tight`}>
              {arrowChar ? <span className={`${arrowTone} mr-1`}>{arrowChar}</span> : null}
              {display.metric}
            </div>
          ) : null}

          {/* Optional single-sentence framing */}
          {display.subtitle ? (
            <div className="text-sm text-slate-400 leading-snug line-clamp-2">
              {display.subtitle}
            </div>
          ) : null}

          {/* Flip affordance pinned bottom — quiet by default, lifts on hover */}
          <div className="mt-auto flex items-center justify-between text-[11px] text-slate-500">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Click for details
            </span>
            <ChevronRight
              size={14}
              strokeWidth={1.75}
              className="text-slate-500 group-hover:text-slate-200 transition"
              aria-hidden="true"
            />
          </div>
        </button>

        {/* BACK — structured detail + actions */}
        <div
          className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl border ${borderColor} bg-ink-900/70 ${glowShadow} p-5 flex flex-col gap-3 ${flipped ? "" : "pointer-events-none"}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
                <span className="font-medium tracking-wide text-slate-300">{badge}</span>
                <span className="text-slate-600">·</span>
                <span>{CATEGORY_LABEL[rec.category] ?? rec.category}</span>
              </div>
              <div className="text-base font-semibold text-slate-50 leading-tight tracking-tight truncate">
                {display.title}
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleFlip}
              className="shrink-0 w-7 h-7 inline-flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-ink-700 rounded-md transition"
              aria-label="Flip back"
              title="Flip back"
            >
              <XIcon size={14} strokeWidth={1.75} />
            </button>
          </div>

          {/* Compact 3-line detail. Each line: short label + body. */}
          <div className="flex-1 min-h-0 overflow-auto flex flex-col gap-2 text-xs">
            <DetailLine label="What happened"  body={rec.observation} />
            <DetailLine label="Why it matters" body={rec.interpretation} />
            <DetailLine label="Do this"        body={rec.recommendation} accent />
            {rec.impact > 0 ? (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                  Est. impact
                </span>
                <span className="text-xs font-semibold text-slate-100 tabular-nums">
                  ≈ {fmtMoney(rec.impact, currency)} / mo
                </span>
              </div>
            ) : null}
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-line">
            <button
              type="button"
              onClick={onResolve}
              className="text-[11px] px-2.5 py-1 rounded-md border border-line text-slate-400 hover:text-slate-100 hover:border-slate-500 transition"
              title="Hide — restore from the header to bring back"
            >
              Resolved
            </button>
            <button
              type="button"
              className="text-[11px] px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-accent/40 bg-accent-soft/40 text-accent font-medium shadow-sm hover:bg-accent-soft hover:border-accent hover:text-white hover:shadow-md transition"
              title="Open consultation with this context"
              onClick={() => openConsult({
                prompt: `${rec.observation} ${rec.interpretation} You suggested: ${rec.recommendation} Walk me through this in more depth — is the diagnosis right, and what should I actually do?`,
                contextTitle: `Signal · ${CATEGORY_LABEL[rec.category] ?? rec.category}`,
                contextSubtitle: display.title,
              })}
            >
              <MessageSquareText size={12} strokeWidth={1.75} aria-hidden="true" />
              <span>Consult on this</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailLine({
  label,
  body,
  accent,
}: {
  label: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className={`text-[9px] uppercase tracking-wider ${accent ? "text-accent" : "text-slate-500"} font-medium`}>
        {label}
      </div>
      <div className={`text-xs leading-snug ${accent ? "text-slate-100" : "text-slate-300"} line-clamp-3`}>
        {body}
      </div>
    </div>
  );
}

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
