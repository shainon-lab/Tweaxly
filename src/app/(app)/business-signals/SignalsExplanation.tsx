"use client";

// Help trigger + floating modal for the Business Signals page.
//
// The explanation used to render inline under the tabs, which pushed
// the actual signal deck below the fold on narrow viewports. Now it
// lives behind a "?" button at the top right of the tabs strip - the
// content opens in a centered modal with an X to close. Same copy,
// no real estate cost.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, X as XIcon, CheckCircle2, BadgeCheck, RefreshCw } from "lucide-react";

export default function SignalsExplanation({
  plan,
  cap,
  activeCount,
}: {
  plan:        string;
  cap:         number;
  activeCount: number;
}) {
  const [open, setOpen] = useState(false);
  const planLabel = plan === "pro" || plan === "business" ? "Pro" : "Free";

  // Mount target for the portal - body so the modal escapes any
  // ancestor with `transform` / `overflow: hidden`.
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => { setPortalTarget(document.body) }, []);

  // ESC closes + body scroll lock while open. Standard modal behavior.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="How business signals work"
        title="How business signals work"
        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-line text-slate-400 hover:text-accent hover:border-accent/60 hover:bg-accent-soft/20 transition"
      >
        <HelpCircle size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>

      {open && portalTarget ? createPortal(
        <div
          className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signals-help-title"
          onClick={() => setOpen(false)}
        >
          <section
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl border border-line shadow-2xl shadow-black/40 max-w-2xl w-full bg-ink-900 overflow-hidden animate-[slideInRight_180ms_ease-out]"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(124,92,250,0.10) 0%, rgba(79,125,255,0.06) 50%, rgba(34,211,238,0.08) 100%)",
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-5 md:p-6 border-b border-line/40">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <span className="shrink-0 inline-flex w-10 h-10 rounded-2xl bg-accent-soft/40 border border-brand-purple/30 items-center justify-center text-brand-purple">
                  <HelpCircle size={18} strokeWidth={1.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id="signals-help-title" className="text-base md:text-lg font-semibold text-slate-50 leading-tight">
                    How your business signals work
                  </h2>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">
                    {activeCount} of {cap} active · {planLabel} plan
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-md text-slate-400 hover:text-white hover:bg-ink-700 inline-flex items-center justify-center transition shrink-0"
              >
                <XIcon size={16} strokeWidth={1.75} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 md:p-6">
              <p className="text-sm text-slate-300 leading-relaxed">
                Signals are the most important business observations from your data right now. We only show signals that pass our importance threshold - if there&apos;s nothing meaningful to flag, slots stay empty. The {planLabel} plan tops out at <strong className="text-slate-100">{cap}</strong> active signals at a time.
              </p>

              <div className="mt-5 grid sm:grid-cols-3 gap-3">
                <ExplainerCard
                  icon={<BadgeCheck size={16} strokeWidth={1.7} />}
                  title="Mark as read"
                  body="You've seen this insight. The signal stays in the list, just visually muted, until the underlying condition changes or you resolve it."
                />
                <ExplainerCard
                  icon={<CheckCircle2 size={16} strokeWidth={1.7} />}
                  title="Mark as resolved"
                  body="You're closing this out. The signal is removed from the active list. If the same condition re-appears later, a brand-new signal opens automatically."
                />
                <ExplainerCard
                  icon={<RefreshCw size={16} strokeWidth={1.7} />}
                  title="Refresh signals"
                  body="Triggers a fresh AI analysis and uses 3 AI credits from your balance. Automatic updates (after data uploads or the weekly re-evaluation) are always free."
                />
              </div>

              <p className="mt-5 text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-300">Signals vs. notifications.</strong>{" "}
                Signals are the current state of your business. The bell shows notifications - events that happened to a signal. You get notified when a signal is created, updated, escalated, or resolved. We never repeat a notification for a signal that&apos;s simply still present.
              </p>
            </div>
          </section>
        </div>,
        portalTarget,
      ) : null}
    </>
  );
}

function ExplainerCard({
  icon, title, body,
}: {
  icon:  React.ReactNode;
  title: string;
  body:  string;
}) {
  return (
    <div className="rounded-lg border border-line/60 bg-ink-900/40 p-3">
      <div className="flex items-center gap-2 text-slate-200 text-sm font-medium mb-1">
        <span className="text-accent">{icon}</span>
        {title}
      </div>
      <div className="text-xs text-slate-400 leading-relaxed">
        {body}
      </div>
    </div>
  );
}
