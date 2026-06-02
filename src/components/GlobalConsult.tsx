"use client";

// Global floating Consult layer.
//
// A single fixed button bottom-right of every app screen opens a
// right-side sliding panel. The panel is page-aware: it derives the
// current view's title, a subtitle, and 3–5 suggested questions from
// the pathname (and any structured context registered by the page
// itself in the future). The user can type, pick a suggestion, and
// see the advisor's response inline - without ever leaving the page
// they're currently looking at. Background stays visible behind a
// dimmed overlay.
//
// This is intentionally NOT a generic chat widget. The framing,
// suggested prompts, and tone are anchored to the business-intel
// context of the current view.

import { useState, useEffect, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { MessageSquareText, Sparkles, X, Maximize2, Minimize2 } from "lucide-react";
import { renderMarkdown } from "@/app/(app)/consultation/markdown";
import { useT, useLocale } from "@/lib/i18n/client";
import { dirFor } from "@/lib/i18n";
import { notify } from "@/lib/notify";

// ─────────────────────────────────────────────────────────────────────────────
// Proactive nudge configuration. The values here are tuned to feel
// rare and intelligent - not engagement-hacky. If the system fires the
// nudge and the user dismisses twice, it goes silent for the rest of
// the session. If a nudge has just shown anywhere, we wait at least
// MIN_COOLDOWN before considering another.
// ─────────────────────────────────────────────────────────────────────────────
const NUDGE_DWELL_MS    = 15_000;       // idle dwell before nudging
const NUDGE_MIN_COOLDOWN = 5 * 60_000;  // min ms between any two nudges in a session
const NUDGE_MAX_PER_SESSION = 2;        // hard cap per session

const SS_SHOWN_COUNT      = "consult.session.shownCount";
const SS_LAST_SHOWN_AT    = "consult.session.lastShownAt";
const SS_DISMISS_COUNT    = "consult.session.dismissCount";
const SS_PERMA_DISMISSED  = "consult.session.permadismissed";
const SS_DISMISSED_PREFIX = "consult.session.dismissed:";
// localStorage flag - survives across sessions. Set when the user
// picks "Hide forever" from the dismiss menu; the nudge is then
// silenced permanently until the user clears site data.
const LS_FOREVER_DISMISSED = "consult.forever.dismissed";

function ssGetNum(key: string): number {
  if (typeof window === "undefined") return 0;
  return Number(window.sessionStorage.getItem(key) ?? "0");
}
function ssSet(key: string, val: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(key, val);
}
function ssGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(key);
}

// Decide whether the nudge is even eligible to schedule on this path.
function isNudgeEligible(pathname: string): boolean {
  if (typeof window === "undefined") return false;
  // Forever dismissal trumps everything.
  if (window.localStorage.getItem(LS_FOREVER_DISMISSED) === "1") return false;
  if (ssGet(SS_PERMA_DISMISSED) === "1") return false;
  if (ssGetNum(SS_SHOWN_COUNT) >= NUDGE_MAX_PER_SESSION) return false;
  const last = ssGetNum(SS_LAST_SHOWN_AT);
  if (last > 0 && Date.now() - last < NUDGE_MIN_COOLDOWN) return false;
  if (ssGet(SS_DISMISSED_PREFIX + pathname) === "1") return false;
  return true;
}

// Per-view nudge copy. Tighter and more contextual than the panel's
// suggested prompts - the nudge itself is just a one-liner offer.
function deriveNudgeText(pathname: string): string {
  if (pathname.startsWith("/dashboard"))         return "Want help understanding this period?";
  if (pathname.startsWith("/business-signals"))  return "Want help understanding these signals?";
  if (pathname.startsWith("/forecast"))          return "Want to analyze this forecast?";
  if (pathname.startsWith("/insights/yearly"))   return "Want help reading this year?";
  if (pathname.startsWith("/insights"))          return "Want help understanding these charts?";
  if (pathname.startsWith("/report") || pathname.startsWith("/data-flow")) {
    return "Want help understanding this report?";
  }
  if (pathname.startsWith("/transactions"))      return "Want help reviewing these transactions?";
  if (pathname.startsWith("/workforce"))         return "Want to investigate payroll patterns?";
  return "Need deeper analysis here?";
}

type ViewMeta = {
  title: string;       // Short identifier of the view, e.g. "Executive Summary".
  subtitle: string;    // Context phrase: "Current period", "Active signals", etc.
  prompts: string[];   // 3–5 contextual suggested questions.
};

// Detail accepted by the global `tweaxly:consult` window event.
// Any client component can dispatch this to open the floating panel
// preloaded with a question and a contextual title/subtitle override.
//
//   window.dispatchEvent(
//     new CustomEvent("tweaxly:consult", { detail: { prompt, contextTitle, contextSubtitle } })
//   );
//
// The architecture is intentionally event-based rather than provider-
// based so any element on any page can trigger a contextual
// consultation without threading props or context through the layout.
export type ConsultOpenDetail = {
  prompt?: string;          // pre-filled textarea content
  contextTitle?: string;    // overrides the path-derived view title
  contextSubtitle?: string; // overrides the path-derived view subtitle
};

export const CONSULT_OPEN_EVENT = "tweaxly:consult";

// Emitted by feature panels (e.g. the Signals detail panel) so the
// floating Consult button can hide itself while another side panel
// owns the bottom-right corner. Payload: { open: boolean }.
export const DETAIL_PANEL_EVENT = "tweaxly:detail-panel";

// Derive a sensible default ViewMeta from the route. Pages can deepen
// this in future iterations by registering richer context via a
// dedicated provider; for now the pathname carries enough signal to
// make the panel feel embedded rather than generic.
function deriveViewMeta(pathname: string): ViewMeta {
  if (pathname === "/" || pathname.startsWith("/dashboard")) {
    return {
      title: "Overview",
      subtitle: "Current period view",
      prompts: [
        "What's the single most important thing on this page?",
        "Is this trend concerning or normal?",
        "What changed compared to last quarter?",
        "Where should I focus first?",
      ],
    };
  }
  if (pathname.startsWith("/business-signals")) {
    return {
      title: "Signals",
      subtitle: "Active alerts and observations",
      prompts: [
        "Which signal should I prioritize?",
        "Is this critical or noise?",
        "What's the underlying driver behind these signals?",
        "What action would have the highest leverage right now?",
      ],
    };
  }
  if (pathname.startsWith("/forecast")) {
    return {
      title: "Forecast",
      subtitle: "Projection for upcoming periods",
      prompts: [
        "Is this forecast realistic given recent activity?",
        "What's the biggest risk in this projection?",
        "What would change the trajectory most?",
        "Where should I prepare for variance?",
      ],
    };
  }
  if (pathname.startsWith("/insights/yearly")) {
    return {
      title: "Yearly Summary",
      subtitle: "Closed-year retrospective",
      prompts: [
        "What was the most important shift in this year?",
        "Where did the business gain or lose ground?",
        "What pattern from this year should carry forward?",
      ],
    };
  }
  if (pathname.startsWith("/insights")) {
    return {
      title: "Charts",
      subtitle: "Visual breakdowns for this period",
      prompts: [
        "Which chart is the most concerning?",
        "What's the biggest outlier in this view?",
        "What would you investigate first?",
      ],
    };
  }
  if (pathname.startsWith("/report") || pathname.startsWith("/data-flow")) {
    return {
      title: "Reports",
      subtitle: "P&L and category-trend view",
      prompts: [
        "What stands out in this report?",
        "Which category is most off-baseline?",
        "What's the biggest change versus the prior period?",
        "Where is the leverage to improve next period?",
      ],
    };
  }
  if (pathname.startsWith("/transactions")) {
    return {
      title: "Transactions",
      subtitle: "Line-level activity",
      prompts: [
        "Any unusual transactions worth flagging?",
        "Which categories drove the most spend this month?",
        "Is there duplicate or miscategorized data here?",
      ],
    };
  }
  if (pathname.startsWith("/manual-data") || pathname.startsWith("/data-log")) {
    return {
      title: "Data",
      subtitle: "Imported and manually-added entries",
      prompts: [
        "Does my data look complete for this period?",
        "What's missing if I want a clean analysis?",
        "Are there entries I should review for accuracy?",
      ],
    };
  }
  if (pathname.startsWith("/workforce") || pathname.startsWith("/employees")) {
    return {
      title: "Forecast",
      subtitle: "Workforce Planning - payroll impact on profitability",
      prompts: [
        "Is my payroll heavy relative to revenue?",
        "Can I afford to hire another employee?",
        "Which role would deliver the most leverage?",
        "What's the cashflow impact of adding one hire?",
      ],
    };
  }
  if (pathname.startsWith("/settings") || pathname.startsWith("/integration") || pathname.startsWith("/notifications")) {
    return {
      title: "Settings",
      subtitle: "Business profile, categories, integrations, and monitoring rules",
      prompts: [
        "Is my data setup clean enough for accurate insights?",
        "Which categories should I rationalize for better reporting?",
        "What integrations would unlock the most value for me?",
        "What monitoring rules should I have running for my business?",
      ],
    };
  }
  if (pathname.startsWith("/account")) {
    return {
      title: "Account",
      subtitle: "Billing, password, security, and account closure",
      prompts: [
        "What's the difference between the Free, Pro and Executive plans?",
        "How should I think about security best practices for my account?",
        "What's the right cadence for reviewing my account settings?",
        "When does it make sense to upgrade from Free to Pro?",
      ],
    };
  }
  return {
    title: "Your business",
    subtitle: "Current period",
    prompts: [
      "What should I focus on right now?",
      "Where am I overspending?",
      "What's working well?",
      "What deserves immediate attention?",
    ],
  };
}

export default function GlobalConsult() {
  const t = useT();
  // Mirror every fixed-position element when the document direction
  // is RTL so the button + nudge + slide-in panel anchor to the left
  // edge instead of the right.
  const rtl = dirFor(useLocale()) === "rtl";
  const fbPos = rtl ? "left-5"  : "right-5";   // floating button + nudge
  const panelPos = rtl ? "left-0"  : "right-0";   // slide-in panel anchor
  const panelBorder = rtl ? "border-r" : "border-l"; // edge facing the page
  const panelAnim = rtl ? "animate-[slideInLeft_220ms_ease-out]" : "animate-[slideInRight_220ms_ease-out]";
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // True when another feature surface (currently the Signals detail
  // panel) owns the bottom-right corner. Hides the floating button
  // + nudge so the two affordances don't visually collide.
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  useEffect(() => {
    function onPanel(e: Event) {
      const detail = (e as CustomEvent<{ open?: boolean }>).detail;
      setDetailPanelOpen(!!detail?.open);
    }
    window.addEventListener(DETAIL_PANEL_EVENT, onPanel);
    return () => window.removeEventListener(DETAIL_PANEL_EVENT, onPanel);
  }, []);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  // Wide reading mode - expands the side panel to ~75% of the screen
  // (desktop only). Resets whenever the panel closes.
  const [expanded, setExpanded] = useState(false);
  // The ongoing conversation. Each send continues the same thread
  // (consultationId) and shows the full back-and-forth; "Ask another
  // question" starts a fresh thread (consultationId = null, messages = []).
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [showNudge, setShowNudge] = useState(false);
  const [dismissPicker, setDismissPicker] = useState(false);
  // Override values dispatched via the CONSULT_OPEN_EVENT - when set,
  // they replace the path-derived title/subtitle so the panel reads
  // exactly the way the triggering element intended.
  const [overrideMeta, setOverrideMeta] = useState<{ title?: string; subtitle?: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const baseMeta = useMemo(() => deriveViewMeta(pathname ?? ""), [pathname]);
  // Effective meta merges the path default with any per-trigger
  // override. When no override is active the panel reads exactly as
  // before (path-driven).
  const meta: ViewMeta = useMemo(() => ({
    ...baseMeta,
    title:    overrideMeta?.title    ?? baseMeta.title,
    subtitle: overrideMeta?.subtitle ?? baseMeta.subtitle,
  }), [baseMeta, overrideMeta]);
  const nudgeText = useMemo(() => deriveNudgeText(pathname ?? ""), [pathname]);

  // Reset state on path change so the panel doesn't carry stale
  // context if the user navigates while it's open.
  useEffect(() => {
    setMessages([]);
    setConsultationId(null);
    setDraft("");
    setShowNudge(false);
    setDismissPicker(false);
    setOverrideMeta(null);
  }, [pathname]);

  // Listen for app-wide consult-open requests. Any client component
  // can dispatch CONSULT_OPEN_EVENT with a pre-filled prompt and a
  // contextual title/subtitle, and the panel opens with that state.
  // Used by Business Signals so the user can "Consult AI" on a
  // specific signal without leaving the page.
  useEffect(() => {
    function onConsultOpen(e: Event) {
      const detail = (e as CustomEvent<ConsultOpenDetail>).detail ?? {};
      // A contextual "Consult AI" trigger starts a fresh thread.
      setMessages([]);
      setConsultationId(null);
      setDraft(detail.prompt ?? "");
      if (detail.contextTitle || detail.contextSubtitle) {
        setOverrideMeta({
          title:    detail.contextTitle,
          subtitle: detail.contextSubtitle,
        });
      } else {
        setOverrideMeta(null);
      }
      setOpen(true);
    }
    window.addEventListener(CONSULT_OPEN_EVENT, onConsultOpen as EventListener);
    return () => window.removeEventListener(CONSULT_OPEN_EVENT, onConsultOpen as EventListener);
  }, []);

  // Pull focus when the panel opens so the user can start typing.
  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
    // Always return to the compact width when the panel closes.
    if (!open) setExpanded(false);
  }, [open]);

  // Keep the latest turn in view as the conversation grows.
  useEffect(() => {
    if (messages.length > 0) {
      threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, sending]);

  // ESC closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // ─── Proactive nudge scheduler ─────────────────────────────────────
  //
  // Per the spec this is intentionally rare and quiet. We schedule a
  // single-shot timer when the user lands on a new page; meaningful
  // interactions (click / scroll / keydown) reset the activity clock.
  // If the panel is already open, or the user has dismissed the
  // session, we skip entirely.
  useEffect(() => {
    if (open) return;
    if (!pathname) return;
    if (!isNudgeEligible(pathname)) return;

    lastActivityRef.current = Date.now();

    const tick = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current < NUDGE_DWELL_MS) return;
      // Time-up - re-check eligibility (state may have changed in
      // the meantime if the user opened or dismissed elsewhere) and
      // fire the nudge once.
      if (!isNudgeEligible(pathname)) {
        clearInterval(tick);
        return;
      }
      setShowNudge(true);
      ssSet(SS_LAST_SHOWN_AT, String(now));
      ssSet(SS_SHOWN_COUNT, String(ssGetNum(SS_SHOWN_COUNT) + 1));
      clearInterval(tick);
    }, 1_000);

    const onActivity = () => {
      lastActivityRef.current = Date.now();
    };
    // We deliberately don't bind mousemove - it would reset the
    // timer too aggressively and the nudge would never fire while a
    // user reads a report.
    window.addEventListener("scroll",  onActivity, { passive: true });
    window.addEventListener("click",   onActivity);
    window.addEventListener("keydown", onActivity);

    return () => {
      clearInterval(tick);
      window.removeEventListener("scroll",  onActivity);
      window.removeEventListener("click",   onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, [pathname, open]);

  // First tap on the close affordance flips the nudge body into a
  // scope-picker. Nothing is suppressed yet - the user chooses
  // explicitly between "this session" or "forever".
  function startDismiss() {
    setDismissPicker(true);
  }

  // "For this session" - kill nudges for the rest of the current
  // session only. Next time the user signs in we're back to normal.
  function dismissForSession() {
    setShowNudge(false);
    setDismissPicker(false);
    if (pathname) ssSet(SS_DISMISSED_PREFIX + pathname, "1");
    // Pick this scope == one definitive "no" from the user. Take the
    // hint and silence all nudges for the rest of the session.
    ssSet(SS_PERMA_DISMISSED, "1");
  }

  // "Forever" - write a localStorage flag so subsequent sessions
  // never schedule the nudge. The user can re-enable by clearing
  // site data; we don't surface an in-UI re-enable yet.
  function dismissForever() {
    setShowNudge(false);
    setDismissPicker(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_FOREVER_DISMISSED, "1");
    }
    ssSet(SS_PERMA_DISMISSED, "1");
  }

  function openFromNudge() {
    setShowNudge(false);
    setDismissPicker(false);
    setOpen(true);
  }

  // The consultation page itself is the full consultation surface -
  // don't double up the experience there.
  if (pathname?.startsWith("/consultation")) return null;
  // Auth/setup screens don't need it either.
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname?.startsWith("/setup")
  ) {
    return null;
  }

  // Clear the thread and start a brand-new conversation.
  function newChat() {
    setMessages([]);
    setConsultationId(null);
    setDraft("");
    textareaRef.current?.focus();
  }

  async function send(text?: string) {
    const message = (text ?? draft).trim();
    if (!message || sending) return;
    setSending(true);
    setDraft("");
    // Optimistically show the user's turn while the advisor thinks.
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    try {
      // Bundle the current-view context only on the FIRST turn of a
      // thread; later turns ride on the conversation history the API
      // already has, so we don't repeat the prefix every message.
      const contextualized = consultationId
        ? message
        : `[Current view: ${meta.title} - ${meta.subtitle}]\n\n${message}`;
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: contextualized, consultationId: consultationId ?? undefined }),
      });
      if (!res.ok) {
        notify.alert(await res.text());
        // Roll back the optimistic user turn on failure.
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      const data = await res.json();
      const conv = data.consultation;
      if (conv?.id) setConsultationId(conv.id);
      // Replace with the authoritative server thread (full history).
      const msgs: { role: string; content: string }[] = conv?.messages ?? [];
      setMessages(
        msgs.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Proactive nudge - small floating card pinned just above the
          Consult button. Appears once after ~15s of low activity on a
          page, never on top of the open panel, never repeatedly.
          Also suppressed while a feature-level detail panel (Signals)
          owns the bottom-right corner. */}
      {showNudge && !open && !detailPanelOpen ? (
        <div
          style={{ bottom: "calc(max(1.25rem, env(safe-area-inset-bottom)) + 3.25rem)" }}
          className={`fixed ${fbPos} z-40 max-w-[300px] rounded-lg border border-line bg-ink-900/95 backdrop-blur shadow-xl px-3.5 py-2.5 animate-[nudgeIn_220ms_ease-out]`}
          role="status"
          aria-live="polite"
        >
          {dismissPicker ? (
            // Scope picker - shown after the user taps dismiss/X.
            // Explicit choice between session-only and forever
            // suppression, plus a way to back out of the choice.
            <div>
              <div className="text-xs text-slate-300 mb-2 leading-snug">
                Hide this suggestion…
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={dismissForSession}
                  className="text-xs px-2.5 py-1 rounded-md border border-line text-slate-300 hover:text-slate-100 hover:border-accent/40 transition duration-200"
                >
                  For this session
                </button>
                <button
                  type="button"
                  onClick={dismissForever}
                  className="text-xs px-2.5 py-1 rounded-md border border-line text-slate-300 hover:text-slate-100 hover:border-accent/40 transition duration-200"
                >
                  Forever
                </button>
                <button
                  type="button"
                  onClick={() => setDismissPicker(false)}
                  className="text-xs text-slate-500 hover:text-slate-200 transition duration-200 ml-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5">
              <Sparkles
                size={14}
                strokeWidth={1.75}
                className="text-accent shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-slate-100 leading-snug">{nudgeText}</div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openFromNudge}
                    className="text-xs px-2.5 py-1 rounded-md border border-accent/40 bg-accent-soft/30 text-accent hover:bg-accent-soft transition duration-200"
                  >
                    Consult
                  </button>
                  <button
                    type="button"
                    onClick={startDismiss}
                    className="text-xs text-slate-400 hover:text-slate-200 transition duration-200"
                    aria-label="Dismiss suggestion"
                  >
                    Not now
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={startDismiss}
                className="shrink-0 text-slate-500 hover:text-slate-200 transition duration-200"
                aria-label="Dismiss suggestion"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Floating button - anchors bottom-right of every screen, stays
          accessible while scrolling. Quiet pill style, never glowing.
          Hidden when a feature-level detail panel (Signals) owns the
          bottom-right corner so the two affordances don't visually
          collide; the panel's own Consult action covers that case.
          - bottom uses env(safe-area-inset-bottom) so the button clears
            the iPhone home indicator. Falls back to 1.25rem on browsers
            that don't expose safe-area.
          - Below sm (≤640px), renders as an icon-only round button so
            it occupies ~44px instead of ~150px - critical on phones
            where the labeled pill covered a meaningful slice of any
            right-aligned content / table cell. */}
      {!detailPanelOpen ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          className={`fixed ${fbPos} z-40 inline-flex items-center justify-center gap-2 rounded-full border border-accent/40 bg-ink-900/90 backdrop-blur text-accent shadow-lg hover:bg-accent-soft hover:border-accent transition duration-200 w-11 h-11 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5`}
          aria-label="Open AI business consultation"
          title="Consult with your AI advisor about this view"
        >
          <MessageSquareText size={16} strokeWidth={1.75} aria-hidden="true" />
          <span className="hidden sm:inline text-sm font-medium">{t("consult.button")}</span>
        </button>
      ) : null}

      {open ? (
        <>
          {/* Background overlay - subtle dim so the user can still
              read the page behind the panel. NOT a full blackout. */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-in side panel. Full-width on mobile, fixed ~460px
              on sm+. Smooth slide-in from the right via Tailwind's
              built-in transition utilities. */}
          <aside
            className={`consult-panel fixed ${panelPos} top-0 bottom-0 z-50 w-full ${expanded ? "sm:w-[75vw]" : "sm:w-[460px]"} bg-ink-900 ${panelBorder} border-line shadow-2xl flex flex-col ${panelAnim} transition-[width] duration-200 ease-out`}
            role="dialog"
            aria-modal="true"
            aria-label="AI consultation panel"
          >
            <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-line">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-accent font-semibold mb-1">
                  Consult About Current View
                </div>
                <div className="text-base font-semibold text-slate-100 truncate">
                  {meta.title}
                </div>
                <div className="text-xs text-slate-400 truncate">{meta.subtitle}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {/* Expand to ~75% width for easier reading (desktop only),
                    toggles back to the compact panel. */}
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:border-accent/40 transition duration-200"
                  aria-label={expanded ? "Collapse consultation panel" : "Expand consultation panel"}
                  title={expanded ? "Collapse panel" : "Expand panel"}
                >
                  {expanded ? <Minimize2 size={13} strokeWidth={1.75} /> : <Maximize2 size={13} strokeWidth={1.75} />}
                  {expanded ? "Collapse" : "Expand"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-slate-200 transition duration-200"
                  aria-label="Close consultation panel"
                >
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.length > 0 ? (
                <div className="space-y-3">
                  {/* Ongoing conversation: every turn stays on screen and
                      scrolls as it grows. The footer composer continues
                      THIS thread; "Ask another question" starts a new one. */}
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">
                      Conversation
                    </div>
                    <button
                      type="button"
                      className="text-xs text-accent hover:underline transition duration-200"
                      onClick={newChat}
                      disabled={sending}
                    >
                      Ask another question
                    </button>
                  </div>
                  {messages.map((m, i) =>
                    m.role === "user" ? (
                      <div key={i} className="rounded-lg border border-accent/30 bg-accent-soft/20 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wide text-accent mb-1">You</div>
                        <div className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
                          {m.content.replace(/^\[Current view:[^\]]+\]\s*/, "")}
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="rounded-lg border border-line bg-ink-900/40 px-3 py-2.5">
                        <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-1.5">Advisor</div>
                        <div className="text-sm text-slate-200 leading-relaxed">
                          {renderMarkdown(m.content)}
                        </div>
                      </div>
                    ),
                  )}
                  {sending ? (
                    <div className="text-xs text-slate-400 px-1 animate-pulse">Analyzing…</div>
                  ) : null}
                  <div ref={threadEndRef} />
                </div>
              ) : (
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">
                    Suggested questions
                  </div>
                  <div className="space-y-1">
                    {meta.prompts.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className="w-full text-left text-sm text-slate-300 hover:text-slate-50 hover:bg-ink-700/40 rounded-md px-3 py-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => {
                          setDraft(p);
                          textareaRef.current?.focus();
                        }}
                        disabled={sending}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <footer className="px-5 py-4 border-t border-line space-y-3">
              <textarea
                ref={textareaRef}
                rows={3}
                className="w-full bg-ink-900/40 border border-line rounded-lg text-slate-100 placeholder:text-slate-500 text-sm leading-relaxed outline-none focus:border-accent/60 focus:bg-ink-900/60 transition duration-200 resize-none px-3 py-2"
                placeholder={messages.length > 0 ? "Continue the conversation…" : "Ask about this view…"}
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
                type="button"
                onClick={() => void send()}
                disabled={sending || !draft.trim()}
                className="w-full text-sm font-medium px-4 py-2.5 rounded-md bg-accent text-white hover:bg-brand-purple-deep transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Analyzing…" : messages.length > 0 ? "Send" : "Start Consultation"}
              </button>
            </footer>
          </aside>
        </>
      ) : null}
    </>
  );
}
