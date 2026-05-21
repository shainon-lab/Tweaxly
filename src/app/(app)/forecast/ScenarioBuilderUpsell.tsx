// Rendered on the Forecast page in place of the ScenarioBuilderPanel
// when the workspace is on Free. Explains what the feature does +
// links to /settings/billing for the upgrade flow.

import Link from "next/link";

export default function ScenarioBuilderUpsell() {
  return (
    <div className="card border-accent/30">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <LockGlyph />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-100">
            Scenario Builder is a Pro feature
          </div>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-xl">
            Free plans show the baseline forecast. Upgrade to Pro or Business
            to layer scenarios on top - hires, contract changes, marketing
            shifts, one-off costs - and see the impact against baseline side
            by side.
          </p>
          <ul className="mt-3 grid sm:grid-cols-2 gap-y-1 text-xs text-slate-400">
            <li className="flex items-center gap-1.5"><Dot /> Hire / cut scenarios</li>
            <li className="flex items-center gap-1.5"><Dot /> Revenue assumptions</li>
            <li className="flex items-center gap-1.5"><Dot /> Multi-scenario compare</li>
            <li className="flex items-center gap-1.5"><Dot /> Long-term horizons</li>
          </ul>
          <div className="mt-4 flex items-center gap-3">
            <Link
              href="/settings/billing"
              className="text-sm px-4 py-1.5 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition"
            >
              Upgrade to unlock
            </Link>
            <Link href="/pricing" className="text-xs text-slate-400 hover:text-slate-200 transition">
              See pricing →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function LockGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true" fill="none" className="text-accent">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function Dot() {
  return <span className="w-1 h-1 rounded-full bg-accent shrink-0" aria-hidden="true" />;
}
