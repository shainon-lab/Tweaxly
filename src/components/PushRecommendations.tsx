"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, MessageSquareText, X as XIcon } from "lucide-react";
import { CONSULT_OPEN_EVENT, DETAIL_PANEL_EVENT, type ConsultOpenDetail } from "./GlobalConsult";
import NarrativeBody from "./NarrativeBody";
import { notify } from "@/lib/notify";

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
// Badge mapping - the five user-facing chips on every card. Driven by
// severity, with a category nudge for the Opportunity lane.
// ─────────────────────────────────────────────────────────────────────────────

type Badge = "Critical" | "Action Needed" | "Watch" | "Opportunity" | "FYI";

// Owner-voice consult prompt for a signal. Maps the signal type to a
// short, plain-English question the user would actually ask. Falls
// back to null when the signal doesn't have a mapping - caller uses
// the raw recommendation as a fallback.
function signalOwnerQuestion(r: PushRec): string | null {
  if (!r.signalKey) return null;
  const key    = r.signalKey.split(":")[0];
  const target = r.signalKey.includes(":") ? r.signalKey.split(":")[1] : null;
  switch (key) {
    case "vendor_spike":
      return target ? `Why did my spend with ${target} jump?` : `Why did one of my vendors suddenly cost more?`;
    case "vendor_concentration":
      return target ? `Am I too dependent on ${target}?` : `Am I too dependent on one vendor?`;
    case "forecast_negative_next_month":
      return `Should I be worried about next month's cash?`;
    case "expense_mom_jump":
      return `Why are my costs up this month?`;
    case "marketing_intensity_high":
      return `Am I overspending on marketing?`;
    case "payroll_heavy":
      return `Is my payroll too heavy for what I'm bringing in?`;
    case "revenue_mom_swing":
      return r.level === "good"
        ? `What's driving the jump in revenue?`
        : `Why is my revenue slowing down?`;
    case "net_margin_observation":
      return `Why is my margin tightening?`;
    case "growth_headroom":
      return `Should I be spending more to grow?`;
    case "uncategorized_high":
      return `How do I clean up my uncategorized transactions?`;
    case "top_expense_category":
      return target ? `Is ${target} eating too much of my budget?` : `Which category is eating too much of my budget?`;
    case "marketing_cut_held":
      return `Did cutting marketing actually hurt me?`;
    case "trailing_3_net":
      return `Am I in a sustained dip?`;
    case "ytd_snapshot":
      return `Am I tracking behind for the year?`;
    default:
      return null;
  }
}

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
// Compact display - 2-4 word title + one key metric per signal, so the
// grid reads as a command center instead of a feed. Pattern-matches
// signalKey prefix; the metric is pulled from the existing observation
// string so the source of truth stays in advisor.ts.
// ─────────────────────────────────────────────────────────────────────────────

type CompactDisplay = {
  title: string;
  metric?: string;
  direction?: "up" | "down" | "flat";
  // One short contextual sentence - the only prose on a collapsed
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
// Lifecycle - 'new' / 'ongoing' / 'escalating' / 'improving' / 'resolved'.
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
    /* full or disabled - ignore */
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
// row - no border/pill chrome, just a colored word.
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString("en-US")}`;
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
  initialSelectedId,
}: {
  initial: PushRec[];
  currency: string;
  // When the page is hit with ?signal=ID (bell-notification deeplink)
  // we pre-open that signal's detail panel on first render.
  initialSelectedId?: string | null;
}) {
  const router = useRouter();
  const [recs, setRecs] = useState<PushRec[]>(initial);
  const [pending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);
  const [lifecycles, setLifecycles] = useState<Record<string, Lifecycle>>({});
  const [resolved, setResolvedState] = useState<Set<string>>(new Set());
  // Selected signal - drives the slide-in detail panel. Null = closed.
  // If the page passed initialSelectedId AND that id exists in the
  // current set, open the panel for it. Falls back to closed if the
  // signal has since been resolved / out-of-scope.
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId && initial.some((r) => r.id === initialSelectedId) ? initialSelectedId : null,
  );
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

  // User-initiated refresh consumes 3 AI Credits. Confirmation modal
  // states the cost; on 402 we route to upgrade (Free) or buy credits
  // (Pro) based on the fallback the server returns. Automatic
  // refreshes (data upload / weekly cron) are free and don't pass
  // through here.
  async function refresh() {
    const ok = await notify.confirm({
      title:        "Refresh signals?",
      body:         "Refreshing runs a fresh AI signal analysis and uses 3 AI Credits from your balance. Automatic updates after a data upload or the weekly evaluation are always free.",
      confirmLabel: "Use 3 credits",
      cancelLabel:  "Cancel",
    });
    if (!ok) return;

    setRefreshing(true);
    try {
      const res  = await fetch("/api/signals/refresh", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (res.status === 402) {
        // Out of credits - branch on the plan-aware fallback.
        const isUpgrade = data.fallback === "upgrade";
        await notify.alert({
          title: isUpgrade ? "Out of AI Credits" : "Not enough AI Credits",
          body:  isUpgrade
            ? `You're on the Free plan and don't have enough AI Credits to refresh signals. Upgrade to Pro for 100 AI Credits every month plus the ability to buy more anytime.`
            : `You need ${data.cost ?? 3} AI Credits to refresh signals. Your current balance is ${data.balance ?? 0}. Buy a credit pack from Settings -> Business Plan to top up.`,
        });
        // Pop the user over to the right surface so the next action
        // is one click away. Both surfaces are on /settings?tab=plan.
        router.push("/settings?tab=plan");
        return;
      }

      if (!res.ok) {
        await notify.alert({
          title: "Couldn't refresh signals",
          body:  "Something went wrong - your credits were not charged. Please try again in a moment.",
        });
        return;
      }

      // Success: re-render the server component so the new signal
      // set is shown.
      startTransition(() => {
        router.refresh();
        setTimeout(() => setRefreshing(false), 600);
      });
      return;
    } catch {
      await notify.alert({
        title: "Couldn't refresh signals",
        body:  "Network error - please check your connection and try again.",
      });
    } finally {
      setRefreshing(false);
    }
  }

  // Server-backed "Mark as resolved". Drops the card from the active
  // list immediately (optimistic), then asks the server. On a 404 /
  // bad-id we still keep the local resolution so the UI stays in
  // sync with the user's intent; the next sweep will reconcile.
  async function resolveSignal(r: PushRec) {
    const next = new Set(resolved);
    next.add(r.signalKey ?? r.id);
    setResolvedState(next);
    writeResolved(next);
    setSelectedId(null);
    // Update server state - zero AI credits, idempotent.
    void fetch(`/api/signals/${encodeURIComponent(r.id)}`, {
      method:  "PATCH",
      headers: { "content-type": "application/json" },
      body:    JSON.stringify({ action: "mark_resolved" }),
    }).catch(() => {});
  }

  // Server-backed "Mark as read". The card stays visible but flips
  // its local lifecycle to "ongoing-acknowledged" so the deck can
  // de-emphasise it. Zero AI credits.
  async function markSignalRead(r: PushRec) {
    setRecs((prev) => prev.map((x) => x.id === r.id ? { ...x, status: "acknowledged" } : x));
    void fetch(`/api/signals/${encodeURIComponent(r.id)}`, {
      method:  "PATCH",
      headers: { "content-type": "application/json" },
      body:    JSON.stringify({ action: "mark_read" }),
    }).catch(() => {});
  }

  function selectSignal(id: string) {
    setSelectedId((cur) => (cur === id ? null : id));
  }

  function closePanel() {
    setSelectedId(null);
  }

  // ESC closes the panel - standard SaaS panel behavior.
  useEffect(() => {
    if (selectedId == null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  // Tell the global Consult layer that a feature-level detail panel
  // is open so it can hide its own floating button + nudge while we
  // own the bottom-right corner. Fires on every transition so the
  // listener sees both open and close.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(DETAIL_PANEL_EVENT, { detail: { open: selectedId != null } }));
    return () => {
      window.dispatchEvent(new CustomEvent(DETAIL_PANEL_EVENT, { detail: { open: false } }));
    };
  }, [selectedId]);

  const selectedRec = selectedId ? recs.find((r) => r.id === selectedId) ?? null : null;

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
        // Deck + detail panel live in a flex row so the two columns
        // naturally share the same height. Was: panel was a `fixed`
        // overlay anchored to top-0/right-0, which made its height
        // independent of (and visually mismatched with) the signals
        // card on the left. Now opening a card grows / shrinks both
        // columns together.
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          <div className={selectedRec ? "flex-1 min-w-0" : "w-full"}>
            <SignalDeck
              recs={visibleRecs}
              currency={currency}
              lifecycles={lifecycles}
              selectedId={selectedId}
              onSelect={selectSignal}
            />
          </div>
          {selectedRec ? (
            <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0">
              <SignalDetailPanel
                rec={selectedRec}
                lifecycle={lifecycles[selectedRec.id]}
                currency={currency}
                onClose={closePanel}
                onResolve={() => resolveSignal(selectedRec)}
                onMarkRead={() => markSignalRead(selectedRec)}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Three-layer signal layout
// ─────────────────────────────────────────────────────────────────────────────

// Signal Deck - uniform compact-height cards, mixed widths so critical
// signals dominate visually. `grid-auto-flow: dense` packs the grid
// so wide cards don't leave gaps.
function SignalDeck({
  recs,
  currency,
  lifecycles,
  selectedId,
  onSelect,
}: {
  recs: PushRec[];
  currency: string;
  lifecycles: Record<string, Lifecycle>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  void currency;
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

  // The detail panel is now an inline flex sibling (see the parent
  // PushRecommendations layout), so we no longer need to pad the deck
  // to avoid a fixed-positioned overlay. Just reflow the columns:
  // when the panel is open the deck has less horizontal room, so we
  // drop from 3 cols → 2 cols at lg+. Without the panel we use the
  // full 3-col layout.
  const panelOpen = selectedId != null;
  const cols = panelOpen
    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div>
      <div
        className={`grid gap-4 transition-[grid-template-columns] duration-200 ${cols}`}
        style={{ gridAutoFlow: "dense" }}
      >
      {sorted.map((r) => (
        <SignalCard
          key={r.id}
          rec={r}
          lifecycle={lifecycles[r.id]}
          selected={selectedId === r.id}
          onSelect={() => onSelect(r.id)}
        />
      ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Signal Deck card - compact, scannable, click-to-open. Renders only
// the hero (meta · title · metric · subtitle). Detail lives in the
// slide-in panel. Critical cards span 2 columns at lg+ so they
// dominate the deck.
// ─────────────────────────────────────────────────────────────────────────────

function SignalCard({
  rec,
  lifecycle,
  selected,
  onSelect,
}: {
  rec: PushRec;
  lifecycle?: Lifecycle;
  selected: boolean;
  onSelect: () => void;
}) {
  const display = compactDisplay(rec);
  const badge = badgeFor(rec);
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
  // Critical signals stay distinct via the red border + pulsing dot
  // + "Critical" badge + subtle red wash, but render at the SAME size
  // as every other card. Previously they spanned 2 columns and used
  // larger type, which broke the uniform grid rhythm.
  const criticalWash = isCritical ? "bg-bad/10" : "";
  const selectedRing = selected ? "ring-2 ring-accent/60 ring-offset-2 ring-offset-ink-900" : "";

  const arrowChar = display.direction === "up" ? "↑" : display.direction === "down" ? "↓" : "";
  const arrowTone =
    display.direction === "up"
      ? (rec.level === "bad" || rec.level === "warn" ? "text-bad" : "text-good")
      : display.direction === "down"
      ? "text-bad"
      : "";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Open details for ${display.title}`}
      className={`h-48 rounded-2xl border ${borderColor} ${isCritical ? criticalWash : "bg-ink-900/50"} ${selectedRing} p-5 text-left flex flex-col gap-2.5 transition-all duration-200 hover:bg-ink-900/70 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5 group`}
    >
      {/* Meta line - severity dot + badge + category + lifecycle */}
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

      {/* Title */}
      <div className="text-lg font-semibold text-slate-50 leading-tight tracking-tight">
        {display.title}
      </div>

      {/* Hero metric */}
      {display.metric ? (
        <div className="text-3xl font-bold text-slate-50 leading-none tabular-nums tracking-tight">
          {arrowChar ? <span className={`${arrowTone} mr-1`}>{arrowChar}</span> : null}
          {display.metric}
        </div>
      ) : null}

      {/* Optional framing sentence */}
      {display.subtitle ? (
        <div className="text-sm text-slate-400 leading-snug line-clamp-2">
          {display.subtitle}
        </div>
      ) : null}

      {/* Click affordance - a pill button pinned at the bottom of every
          card. Always visible (not hover-only) so the card never reads
          as 'static info', and it lifts/brightens on hover. The button
          is non-interactive markup - the whole card is the click
          target - but it gives the eye a clear 'open this' signal. */}
      <div className="mt-auto flex items-center justify-end">
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border border-accent/40 bg-accent-soft/30 text-accent group-hover:bg-accent-soft group-hover:border-accent group-hover:text-white group-hover:translate-x-0.5 transition duration-200"
          aria-hidden="true"
        >
          <span>View details</span>
          <ChevronRight size={12} strokeWidth={2} />
        </span>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Slide-in detail panel - non-blocking, ~38% desktop width. The deck
// stays visible behind it so users can pivot between signals without
// closing the panel. Consult action lives here, contextual to the
// selected signal.
// ─────────────────────────────────────────────────────────────────────────────

function SignalDetailPanel({
  rec,
  lifecycle,
  currency,
  onClose,
  onResolve,
  onMarkRead,
}: {
  rec: PushRec | null;
  lifecycle?: Lifecycle;
  currency: string;
  onClose: () => void;
  onResolve: () => void;
  onMarkRead: () => void;
}) {
  const router = useRouter();
  // When the user closes the panel, unmount it immediately - no exit
  // slide, no stale snapshot lingering on the side of the screen.
  // (The entry animation still plays via the slideInRight keyframe
  // applied on mount.)
  if (!rec) return null;
  const r = rec;

  const display = compactDisplay(r);
  const badge = badgeFor(r);
  const dotColor =
    r.level === "bad"  ? "bg-bad"    :
    r.level === "warn" ? "bg-warn"   :
    r.level === "good" ? (r.category === "growth" ? "bg-accent" : "bg-good") :
                         "bg-slate-500";
  const arrowChar = display.direction === "up" ? "↑" : display.direction === "down" ? "↓" : "";
  const arrowTone =
    display.direction === "up"
      ? (r.level === "bad" || r.level === "warn" ? "text-bad" : "text-good")
      : display.direction === "down"
      ? "text-bad"
      : "";
  // Owner-voice question per signal so the New Advisory screen lands
  // with a short, scannable prompt the user can edit before consulting
  // (no auto-submit - they hit Analyze themselves). Falls back to the
  // raw recommendation when the signal type isn't in our mapping.
  const consultQuestion = signalOwnerQuestion(r) ?? r.recommendation;

  return (
    <aside
      role="dialog"
      aria-label={`Signal details - ${display.title}`}
      // Sits as a flex sibling next to the signals deck inside the
      // outer card, so it shares the deck's height naturally and stops
      // overhanging the bottom edge. The parent wrapper controls width;
      // `h-full` makes the aside fill that flex column. Inner overflow
      // keeps long content scrollable without growing the parent.
      className="h-full bg-ink-900/60 border border-line rounded-xl shadow-lg shadow-black/30 overflow-y-auto animate-[slideInRight_220ms_ease-out]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 border-b border-line">
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
            <span className="font-medium tracking-wide text-slate-300">{badge}</span>
            <span className="text-slate-600">·</span>
            <span>{CATEGORY_LABEL[r.category] ?? r.category}</span>
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
            <div className="text-4xl font-bold text-slate-50 leading-none tabular-nums tracking-tight">
              {arrowChar ? <span className={`${arrowTone} mr-1`}>{arrowChar}</span> : null}
              {display.metric}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 w-8 h-8 inline-flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-ink-700 rounded-md transition"
          aria-label="Close panel"
          title="Close (Esc)"
        >
          <XIcon size={16} strokeWidth={1.75} />
        </button>
      </div>

      {/* Body - natural height so the action buttons below sit
          immediately under the text instead of being pushed to the
          bottom of the viewport with empty space in between. */}
      <div className="p-5 flex flex-col gap-5">
        <PanelSection label="What happened"      body={r.observation} />
        <PanelSection label="Why it matters"     body={r.interpretation} />
        <PanelSection label="Recommended action" body={r.recommendation} accent />

        {r.impact > 0 ? (
          <div className="rounded-xl border border-line bg-ink-900/40 px-4 py-3 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              Estimated impact
            </span>
            <span className="text-base font-semibold text-slate-100 tabular-nums">
              ≈ {fmtMoney(r.impact, currency)} / month
            </span>
          </div>
        ) : null}
      </div>

      {/* Footer - immediately under the body content. No flex pinning;
          when content is short the buttons sit tight under the text,
          when content is long the user scrolls to reach them. */}
      <div className="border-t border-line p-4 flex items-center justify-between gap-2 bg-ink-900 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onMarkRead}
            disabled={rec.status === "acknowledged"}
            className="text-xs px-3 py-1.5 rounded-md border border-line text-slate-300 hover:text-slate-100 hover:border-slate-500 transition disabled:opacity-50"
          >
            {rec.status === "acknowledged" ? "Read" : "Mark as read"}
          </button>
          <button
            type="button"
            onClick={onResolve}
            className="text-xs px-3 py-1.5 rounded-md border border-line text-slate-400 hover:text-good hover:border-good/60 transition"
          >
            Mark as resolved
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            // Drop the question into the New Advisory textarea without
            // submitting - the user clicks Consult themselves so the
            // flow + UI match every other consultation entry point.
            onClose();
            router.push(`/consultation?q=${encodeURIComponent(consultQuestion)}`);
          }}
          className="text-sm px-4 py-2 rounded-full inline-flex items-center gap-2 border border-accent/40 bg-accent-soft/40 text-accent font-medium shadow-sm hover:bg-accent-soft hover:border-accent hover:text-white hover:shadow-md transition"
          title="Send this question to the advisor"
        >
          <MessageSquareText size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>Consult about this signal</span>
        </button>
      </div>
    </aside>
  );
}

function PanelSection({
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
      <div className={`text-[10px] uppercase tracking-wider mb-1.5 font-medium ${accent ? "text-accent" : "text-slate-500"}`}>
        {label}
      </div>
      {/* Shared NarrativeBody: same paragraph-split + tracking + leading
          as the dashboard summary. Three sections in the panel already
          give the user vertical rhythm, so we leave the per-section
          splitting on - long observations still get a break. */}
      <NarrativeBody
        text={body}
        size="sm"
        className={accent ? "text-slate-100" : "text-slate-300"}
      />
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
