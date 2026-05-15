"use client";

// Global floating Consult layer.
//
// A single fixed button bottom-right of every app screen opens a
// right-side sliding panel. The panel is page-aware: it derives the
// current view's title, a subtitle, and 3–5 suggested questions from
// the pathname (and any structured context registered by the page
// itself in the future). The user can type, pick a suggestion, and
// see the advisor's response inline — without ever leaving the page
// they're currently looking at. Background stays visible behind a
// dimmed overlay.
//
// This is intentionally NOT a generic chat widget. The framing,
// suggested prompts, and tone are anchored to the business-intel
// context of the current view.

import { useState, useEffect, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { MessageSquareText, Sparkles, X } from "lucide-react";
import { renderMarkdown } from "@/app/(app)/consultation/markdown";

// ─────────────────────────────────────────────────────────────────────────────
// Proactive nudge configuration. The values here are tuned to feel
// rare and intelligent — not engagement-hacky. If the system fires the
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
  if (ssGet(SS_PERMA_DISMISSED) === "1") return false;
  if (ssGetNum(SS_SHOWN_COUNT) >= NUDGE_MAX_PER_SESSION) return false;
  const last = ssGetNum(SS_LAST_SHOWN_AT);
  if (last > 0 && Date.now() - last < NUDGE_MIN_COOLDOWN) return false;
  if (ssGet(SS_DISMISSED_PREFIX + pathname) === "1") return false;
  return true;
}

// Per-view nudge copy. Tighter and more contextual than the panel's
// suggested prompts — the nudge itself is just a one-liner offer.
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

// Derive a sensible default ViewMeta from the route. Pages can deepen
// this in future iterations by registering richer context via a
// dedicated provider; for now the pathname carries enough signal to
// make the panel feel embedded rather than generic.
function deriveViewMeta(pathname: string): ViewMeta {
  if (pathname === "/" || pathname.startsWith("/dashboard")) {
    return {
      title: "Executive Summary",
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
      title: "Business Signals",
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
  if (pathname.startsWith("/workforce")) {
    return {
      title: "Workforce",
      subtitle: "Payroll and team composition",
      prompts: [
        "Is my payroll heavy relative to revenue?",
        "Can I afford to hire another employee?",
        "Which role would deliver the most leverage?",
        "Where is payroll trending and why?",
      ],
    };
  }
  if (pathname.startsWith("/settings") || pathname.startsWith("/account") || pathname.startsWith("/integration") || pathname.startsWith("/notifications")) {
    return {
      title: "Your business",
      subtitle: "Settings, integrations, and account",
      prompts: [
        "What should I focus on right now?",
        "Where am I overspending?",
        "What's working well?",
        "What deserves immediate attention?",
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<{ q: string; a: string } | null>(null);
  const [showNudge, setShowNudge] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const meta = useMemo(() => deriveViewMeta(pathname ?? ""), [pathname]);
  const nudgeText = useMemo(() => deriveNudgeText(pathname ?? ""), [pathname]);

  // Reset state on path change so the panel doesn't carry stale
  // context if the user navigates while it's open.
  useEffect(() => {
    setResponse(null);
    setDraft("");
    setShowNudge(false);
  }, [pathname]);

  // Pull focus when the panel opens so the user can start typing.
  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

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
      // Time-up — re-check eligibility (state may have changed in
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
    // We deliberately don't bind mousemove — it would reset the
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

  function dismissNudge() {
    setShowNudge(false);
    if (pathname) ssSet(SS_DISMISSED_PREFIX + pathname, "1");
    const next = ssGetNum(SS_DISMISS_COUNT) + 1;
    ssSet(SS_DISMISS_COUNT, String(next));
    // Two dismissals is enough signal that the user doesn't want
    // these — go silent for the rest of the session.
    if (next >= 2) ssSet(SS_PERMA_DISMISSED, "1");
  }

  function openFromNudge() {
    setShowNudge(false);
    setOpen(true);
  }

  // The consultation page itself is the full consultation surface —
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

  async function send(text?: string) {
    const message = (text ?? draft).trim();
    if (!message) return;
    setSending(true);
    setResponse(null);
    try {
      // Bundle the current view context into the message so the
      // advisor knows what the user is looking at without the user
      // having to spell it out.
      const contextualized = `[Current view: ${meta.title} — ${meta.subtitle}]\n\n${message}`;
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: contextualized }),
      });
      if (!res.ok) {
        alert(await res.text());
        return;
      }
      const data = await res.json();
      const msgs: { role: string; content: string }[] = data.consultation?.messages ?? [];
      const lastAssistant = [...msgs].reverse().find((m) => m.role === "assistant");
      setResponse({ q: message, a: lastAssistant?.content ?? "" });
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Proactive nudge — small floating card pinned just above the
          Consult button. Appears once after ~15s of low activity on a
          page, never on top of the open panel, never repeatedly. */}
      {showNudge && !open ? (
        <div
          className="fixed bottom-[68px] right-5 z-40 max-w-[280px] rounded-lg border border-line bg-ink-900/95 backdrop-blur shadow-xl px-3.5 py-2.5 animate-[nudgeIn_220ms_ease-out]"
          role="status"
          aria-live="polite"
        >
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
                  className="text-xs px-2.5 py-1 rounded-md border border-accent/40 bg-accent-soft/30 text-accent hover:bg-accent-soft hover:text-white transition duration-200"
                >
                  Consult
                </button>
                <button
                  type="button"
                  onClick={dismissNudge}
                  className="text-xs text-slate-400 hover:text-slate-200 transition duration-200"
                  aria-label="Dismiss suggestion"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissNudge}
              className="shrink-0 text-slate-500 hover:text-slate-200 transition duration-200"
              aria-label="Dismiss suggestion"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      ) : null}

      {/* Floating button — anchors bottom-right of every screen, stays
          accessible while scrolling. Quiet pill style, never glowing. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-accent/40 bg-ink-900/90 backdrop-blur text-accent shadow-lg hover:bg-accent-soft hover:text-white hover:border-accent transition duration-200"
        aria-label="Open AI business consultation"
        title="Consult with your AI advisor about this view"
      >
        <MessageSquareText size={16} strokeWidth={1.75} aria-hidden="true" />
        <span className="text-sm font-medium">Consult</span>
      </button>

      {open ? (
        <>
          {/* Background overlay — subtle dim so the user can still
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
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[460px] bg-ink-900 border-l border-line shadow-2xl flex flex-col animate-[slideInRight_220ms_ease-out]"
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
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 text-slate-400 hover:text-slate-200 transition duration-200"
                aria-label="Close consultation panel"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {response ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-accent/30 bg-accent-soft/20 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-accent mb-1">
                      Your question
                    </div>
                    <div className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
                      {response.q.replace(/^\[Current view:[^\]]+\]\s*/, "")}
                    </div>
                  </div>
                  <div className="rounded-lg border border-line bg-ink-900/40 px-3 py-2.5">
                    <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-1.5">
                      Advisor
                    </div>
                    <div className="text-sm text-slate-200 leading-relaxed">
                      {renderMarkdown(response.a)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-accent hover:underline transition duration-200"
                    onClick={() => setResponse(null)}
                  >
                    Ask another question
                  </button>
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
                placeholder="Ask about this view…"
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
                className="w-full text-sm px-4 py-2.5 rounded-md border border-accent/40 bg-accent-soft/30 text-accent hover:bg-accent-soft hover:text-white transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Analyzing…" : "Start Consultation"}
              </button>
            </footer>
          </aside>
        </>
      ) : null}
    </>
  );
}
