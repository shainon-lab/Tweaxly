// Top-of-page explanation panel for the Signals tab. The product
// spec calls for one shared explainer (not per-card tooltips) so the
// owner learns the lifecycle once and the cards stay clean.

import { Info, CheckCircle2, BadgeCheck, RefreshCw } from "lucide-react";

export default function SignalsExplanation({
  plan,
  cap,
  activeCount,
}: {
  plan:        string;
  cap:         number;
  activeCount: number;
}) {
  const planLabel = plan === "pro" || plan === "business" ? "Pro" : "Free";
  return (
    <section
      className="mb-6 rounded-2xl border border-line p-5 md:p-6 shadow-sm relative overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(124,92,250,0.10) 0%, rgba(79,125,255,0.06) 50%, rgba(34,211,238,0.08) 100%)",
      }}
    >
      <div className="flex items-start gap-4">
        <span className="shrink-0 inline-flex w-10 h-10 rounded-2xl bg-accent-soft/40 border border-brand-purple/30 items-center justify-center text-brand-purple">
          <Info size={18} strokeWidth={1.5} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="text-base md:text-lg font-semibold text-slate-50 leading-tight">
              How your business signals work
            </h2>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">
              {activeCount} of {cap} active · {planLabel} plan
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Signals are the most important business observations from your data right now.
            We only show signals that pass our importance threshold - if there&apos;s nothing meaningful to flag, slots stay empty.
            The {planLabel} plan tops out at <strong className="text-slate-100">{cap}</strong> active signals at a time.
          </p>

          <div className="mt-4 grid sm:grid-cols-3 gap-3">
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

          <p className="mt-4 text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Signals vs. notifications.</strong>{" "}
            Signals are the current state of your business. The bell shows
            notifications - events that happened to a signal. You get notified when a
            signal is created, updated, escalated, or resolved. We never repeat a
            notification for a signal that&apos;s simply still present.
          </p>
        </div>
      </div>
    </section>
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
