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

type Badge = "Critical" | "Watch" | "Opportunity" | "Info" | "Good";

function badgeFor(r: PushRec): Badge {
  if (r.level === "bad")  return "Critical";
  if (r.level === "warn") return "Watch";
  if (r.level === "good") return r.category === "growth" ? "Opportunity" : "Good";
  return "Info";
}

const BADGE_PILL: Record<Badge, string> = {
  Critical:    "pill-bad",
  Watch:       "pill-warn",
  Opportunity: "pill-accent",
  Info:        "pill",
  Good:        "pill-good",
};

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolved, setResolvedState] = useState<Set<string>>(new Set());
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
    setExpandedId(null);
  }

  function clearResolved() {
    setResolvedState(new Set());
    writeResolved(new Set());
  }

  function toggleExpand(id: string) {
    setExpandedId((cur) => (cur === id ? null : id));
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
        <SignalGroups
          recs={visibleRecs}
          currency={currency}
          lifecycles={lifecycles}
          expandedId={expandedId}
          onToggleExpand={toggleExpand}
          onResolve={resolveSignal}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Three-layer signal layout
// ─────────────────────────────────────────────────────────────────────────────

function SignalGroups({
  recs,
  currency,
  lifecycles,
  expandedId,
  onToggleExpand,
  onResolve,
}: {
  recs: PushRec[];
  currency: string;
  lifecycles: Record<string, Lifecycle>;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onResolve: (r: PushRec) => void;
}) {
  const critical  = recs.filter((r) => r.level === "bad");
  const attention = recs.filter((r) => r.level === "warn");
  const positive  = recs.filter((r) => r.level === "good");

  // Priority — bad first, then warn, ranked by impact. Capped at 4.
  const priority = [...critical, ...attention].slice(0, 4);
  const priorityIds = new Set(priority.map((r) => r.id));

  // Dynamic Changes — everything not in priority and not positive.
  // The lifecycle pill carries the "what changed" signal; the card
  // itself stays visible so users still have steady context for
  // ongoing-but-not-priority observations.
  const dynamic = recs.filter(
    (r) => !priorityIds.has(r.id) && r.level !== "good"
  );

  return (
    <div className="space-y-8">
      {priority.length > 0 ? (
        <PrioritySection
          items={priority}
          currency={currency}
          lifecycles={lifecycles}
          expandedId={expandedId}
          onToggleExpand={onToggleExpand}
          onResolve={onResolve}
        />
      ) : null}

      {dynamic.length > 0 ? (
        <DynamicSection
          items={dynamic}
          currency={currency}
          lifecycles={lifecycles}
          expandedId={expandedId}
          onToggleExpand={onToggleExpand}
          onResolve={onResolve}
        />
      ) : null}

      {positive.length > 0 ? (
        <PositiveSummary items={positive} />
      ) : null}
    </div>
  );
}

function SectionHeader({
  label,
  hint,
  tone,
}: {
  label: string;
  hint: string;
  tone: "bad" | "accent" | "good" | "slate";
}) {
  const toneClass =
    tone === "bad"    ? "text-bad" :
    tone === "accent" ? "text-accent" :
    tone === "good"   ? "text-good" :
                        "text-slate-200";
  return (
    <div className="flex items-baseline gap-2 flex-wrap mb-3">
      <h3 className={`text-sm md:text-base font-semibold ${toneClass}`}>{label}</h3>
      <span className="text-xs text-slate-500">· {hint}</span>
    </div>
  );
}

function PrioritySection({
  items,
  currency,
  lifecycles,
  expandedId,
  onToggleExpand,
  onResolve,
}: {
  items: PushRec[];
  currency: string;
  lifecycles: Record<string, Lifecycle>;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onResolve: (r: PushRec) => void;
}) {
  const cols = items.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
  return (
    <section>
      <SectionHeader
        label="Priority Signals"
        hint="Requires your attention right now."
        tone="bad"
      />
      <div className={`grid gap-3 ${cols}`}>
        {items.map((r) => (
          <CompactCard
            key={r.id}
            rec={r}
            currency={currency}
            lifecycle={lifecycles[r.id]}
            expanded={expandedId === r.id}
            onToggleExpand={() => onToggleExpand(r.id)}
            onResolve={() => onResolve(r)}
            size="lg"
          />
        ))}
      </div>
    </section>
  );
}

function DynamicSection({
  items,
  currency,
  lifecycles,
  expandedId,
  onToggleExpand,
  onResolve,
}: {
  items: PushRec[];
  currency: string;
  lifecycles: Record<string, Lifecycle>;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onResolve: (r: PushRec) => void;
}) {
  // Order: escalating → new → improving → ongoing. Inside each
  // bucket, original (impact) order is preserved.
  const order: Record<Lifecycle, number> = {
    escalating: 0, new: 1, improving: 2, ongoing: 3, resolved: 4,
  };
  const sorted = [...items].sort((a, b) => {
    const la = lifecycles[a.id] ?? "ongoing";
    const lb = lifecycles[b.id] ?? "ongoing";
    return order[la] - order[lb];
  });
  return (
    <section>
      <SectionHeader
        label="Dynamic Changes"
        hint="What's shifted since you last looked."
        tone="accent"
      />
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((r) => (
          <CompactCard
            key={r.id}
            rec={r}
            currency={currency}
            lifecycle={lifecycles[r.id]}
            expanded={expandedId === r.id}
            onToggleExpand={() => onToggleExpand(r.id)}
            onResolve={() => onResolve(r)}
            size="sm"
          />
        ))}
      </div>
    </section>
  );
}

// Compressed by default. Single row with the count; opens into a
// 2-column list of titles + metrics on demand. Stays out of the way.
function PositiveSummary({ items }: { items: PushRec[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <div className="rounded-xl border border-good/30 bg-good/5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
          aria-expanded={open}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-good text-xs" aria-hidden="true">✓</span>
            <span className="text-sm font-semibold text-good">
              {items.length} positive signal{items.length === 1 ? "" : "s"}
            </span>
            <span className="text-xs text-slate-500">— What&apos;s working.</span>
          </div>
          <ChevronRight
            size={14}
            strokeWidth={1.75}
            className={`text-slate-500 transition-transform ${open ? "rotate-90" : ""}`}
            aria-hidden="true"
          />
        </button>
        {open ? (
          <ul className="px-4 pb-3 grid gap-1.5 sm:grid-cols-2">
            {items.map((r) => {
              const d = compactDisplay(r);
              return (
                <li key={r.id} className="flex items-start gap-2 text-sm">
                  <span className="text-good text-xs mt-1 shrink-0" aria-hidden="true">✓</span>
                  <span className="text-slate-200">
                    <span className="text-[10px] uppercase tracking-wide text-slate-500 mr-1.5">
                      {CATEGORY_LABEL[r.category] ?? r.category}
                    </span>
                    {d.title}
                    {d.metric ? <span className="text-slate-400"> — {d.metric}</span> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact card — collapses to badge + title + metric; expands inline
// (col-span-full in its parent grid) into structured detail sections.
// ─────────────────────────────────────────────────────────────────────────────

function CompactCard({
  rec,
  currency,
  lifecycle,
  expanded,
  onToggleExpand,
  onResolve,
  size,
}: {
  rec: PushRec;
  currency: string;
  lifecycle?: Lifecycle;
  expanded: boolean;
  onToggleExpand: () => void;
  onResolve: () => void;
  size: "lg" | "sm";
}) {
  const display = compactDisplay(rec);
  const badge = badgeFor(rec);

  // Severity tone — quiet by default. Priority cards add a small
  // colored dot indicator and the badge does the heavy lifting on
  // color. We deliberately drop the heavy left-stripe + bg tint so
  // cards read as 'premium SaaS surface' rather than 'colored alert'.
  const tone =
    rec.level === "bad"  ? { dot: "bg-bad",    hoverBorder: "hover:border-bad/50"  } :
    rec.level === "warn" ? { dot: "bg-warn",   hoverBorder: "hover:border-warn/50" } :
    rec.level === "good" ? { dot: "bg-good",   hoverBorder: "hover:border-good/40" } :
                           { dot: "bg-accent", hoverBorder: "hover:border-accent/40" };

  const colSpan = expanded ? "col-span-full" : "";
  const padding = size === "lg" ? "p-5" : "p-4";
  const titleSize = size === "lg" ? "text-lg" : "text-base";
  const metricSize = size === "lg" ? "text-4xl" : "text-3xl";

  // Direction arrow with sentiment-aware colour. An "up" arrow is bad
  // for expense/spike signals (red) and good for revenue/margin/growth.
  const arrowChar = display.direction === "up" ? "↑" : display.direction === "down" ? "↓" : "";
  const arrowTone =
    display.direction === "up"
      ? (rec.level === "bad" || rec.level === "warn" ? "text-bad" : "text-good")
      : display.direction === "down"
      ? "text-bad"
      : "";

  return (
    <div
      className={`group relative rounded-2xl border border-line bg-ink-900/40 ${tone.hoverBorder} ${padding} ${colSpan} transition-all duration-200 ${expanded ? "shadow-lg shadow-black/20" : "hover:shadow-md hover:shadow-black/20 hover:bg-ink-900/60"}`}
    >
      {!expanded ? (
        <button
          type="button"
          onClick={onToggleExpand}
          className="w-full text-left flex flex-col gap-3"
          aria-expanded="false"
        >
          {/* Meta row — single line, very small, low contrast. Dot
              carries severity color so the badge text can be neutral. */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
            <span className="font-medium tracking-wide">{badge}</span>
            <span className="text-slate-600">·</span>
            <span>{CATEGORY_LABEL[rec.category] ?? rec.category}</span>
            {lifecycle && lifecycle !== "ongoing" ? (
              <>
                <span className="text-slate-600">·</span>
                <span className={LIFECYCLE_TEXT[lifecycle]}>{LIFECYCLE_LABEL[lifecycle]}</span>
              </>
            ) : null}
          </div>

          {/* Title — large, premium, single short phrase. */}
          <div className={`${titleSize} font-semibold text-slate-50 leading-tight tracking-tight`}>
            {display.title}
          </div>

          {/* Metric — the hero number. Big, tabular, with sentiment-
              colored arrow when there's direction. */}
          {display.metric ? (
            <div className={`${metricSize} font-bold text-white leading-none tabular-nums tracking-tight`}>
              {arrowChar ? <span className={`${arrowTone} mr-1`}>{arrowChar}</span> : null}
              {display.metric}
            </div>
          ) : null}

          {/* Subtitle — one short sentence. Optional, soft. */}
          {display.subtitle ? (
            <div className="text-sm text-slate-400 leading-snug line-clamp-2">
              {display.subtitle}
            </div>
          ) : null}
        </button>
      ) : (
        <ExpandedDetails
          rec={rec}
          currency={currency}
          display={display}
          badge={badge}
          lifecycle={lifecycle}
          onCollapse={onToggleExpand}
          onResolve={onResolve}
        />
      )}

      {/* Subtle 'Learn more' affordance — only on collapsed cards. */}
      {!expanded ? (
        <div className="absolute top-4 right-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </div>
      ) : null}
    </div>
  );
}

function ExpandedDetails({
  rec,
  currency,
  display,
  badge,
  lifecycle,
  onCollapse,
  onResolve,
}: {
  rec: PushRec;
  currency: string;
  display: CompactDisplay;
  badge: Badge;
  lifecycle?: Lifecycle;
  onCollapse: () => void;
  onResolve: () => void;
}) {
  const arrowChar = display.direction === "up" ? "↑" : display.direction === "down" ? "↓" : "";
  const arrowTone =
    display.direction === "up"
      ? (rec.level === "bad" || rec.level === "warn" ? "text-bad" : "text-good")
      : display.direction === "down"
      ? "text-bad"
      : "";
  const consultQuestion = `${rec.observation} ${rec.interpretation} You suggested: ${rec.recommendation} Walk me through this in more depth — is the diagnosis right, and what should I actually do?`;
  const dot =
    rec.level === "bad"  ? "bg-bad"    :
    rec.level === "warn" ? "bg-warn"   :
    rec.level === "good" ? "bg-good"   :
                           "bg-accent";
  return (
    <div>
      {/* Hero — same visual rhythm as the collapsed card, with a
          close affordance instead of the chevron. */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0 flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden="true" />
            <span className="font-medium tracking-wide">{badge}</span>
            <span className="text-slate-600">·</span>
            <span>{CATEGORY_LABEL[rec.category] ?? rec.category}</span>
            {lifecycle && lifecycle !== "ongoing" ? (
              <>
                <span className="text-slate-600">·</span>
                <span className={LIFECYCLE_TEXT[lifecycle]}>{LIFECYCLE_LABEL[lifecycle]}</span>
              </>
            ) : null}
          </div>
          <div className="text-xl font-semibold text-slate-50 leading-tight tracking-tight">
            {display.title}
          </div>
          {display.metric ? (
            <div className="text-4xl font-bold text-white leading-none tabular-nums tracking-tight">
              {arrowChar ? <span className={`${arrowTone} mr-1`}>{arrowChar}</span> : null}
              {display.metric}
            </div>
          ) : null}
          {display.subtitle ? (
            <div className="text-sm text-slate-400 leading-snug">{display.subtitle}</div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onCollapse}
          className="shrink-0 w-8 h-8 inline-flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-ink-700 rounded-md transition"
          aria-label="Close"
          title="Collapse"
        >
          <XIcon size={16} strokeWidth={1.75} />
        </button>
      </div>

      {/* Structured sections — three columns at lg, stacking on
          smaller widths. Each section is short prose, not paragraphs. */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <DetailSection label="What happened" body={rec.observation} />
        <DetailSection label="Why it matters" body={rec.interpretation} />
        <DetailSection label="Recommended action" body={rec.recommendation} accent />
      </div>

      {rec.impact > 0 ? (
        <div className="mb-6 flex items-center gap-3 text-sm text-slate-300">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">Estimated impact</span>
          <span className="text-base font-semibold text-slate-100 tabular-nums">
            ≈ {fmtMoney(rec.impact, currency)} / month
          </span>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 flex-wrap pt-4 border-t border-line">
        <button
          type="button"
          onClick={onResolve}
          className="text-xs px-3 py-1.5 rounded-md border border-line text-slate-400 hover:text-slate-100 hover:border-slate-500 transition"
          title="Hide from this view — restore from the header to bring back"
        >
          Mark resolved
        </button>
        <button
          type="button"
          className="text-xs px-4 py-2 rounded-full inline-flex items-center gap-1.5 border border-accent/40 bg-accent-soft/40 text-accent font-medium shadow-sm hover:bg-accent-soft hover:border-accent hover:text-white hover:shadow-md transition"
          title="Open consultation with this context"
          onClick={() => openConsult({
            prompt: consultQuestion,
            contextTitle: `Signal · ${CATEGORY_LABEL[rec.category] ?? rec.category}`,
            contextSubtitle: display.title,
          })}
        >
          <MessageSquareText size={13} strokeWidth={1.75} aria-hidden="true" />
          <span>Consult on this</span>
        </button>
      </div>
    </div>
  );
}

function DetailSection({
  label,
  body,
  accent,
}: {
  label: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border ${accent ? "border-accent/30 bg-accent-soft/10" : "border-line bg-ink-900/40"} p-4`}>
      <div className={`text-[10px] uppercase tracking-wider ${accent ? "text-accent" : "text-slate-500"} mb-1.5 font-medium`}>
        {label}
      </div>
      <div className={`text-sm leading-relaxed ${accent ? "text-slate-100" : "text-slate-300"}`}>
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
