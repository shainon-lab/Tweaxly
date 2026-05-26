// The platform-wide animated loading bar. Same sweeping gradient used
// during file uploads and AI consultations — extracted so every
// "something is happening" surface reads as a single visual language.
//
// Use it in three places:
//   1. Route-level loading.tsx files (App Router streaming fallback).
//   2. Client components with their own fetch + loading state — drop
//      <LoadingBar label="Loading sources…" /> where you'd have
//      written "Loading…".
//   3. Wherever an in-card spinner used to live.
//
// The .tweaxly-loading-sweep keyframes live in globals.css so this
// component works in both server and client contexts without pulling
// in styled-jsx. Animates continuously regardless of progress — it's
// a liveness signal, not a determinate %.

export default function LoadingBar({
  label,
  hint,
  className,
}: {
  label?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="h-1 rounded-full bg-ink-700/60 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-brand-purple via-accent to-brand-teal tweaxly-loading-sweep" />
      </div>
      {(label || hint) ? (
        <div className="mt-2 flex items-baseline justify-between gap-3">
          {label ? (
            <div className="text-xs text-slate-300 font-medium">{label}</div>
          ) : <span />}
          {hint ? (
            <div className="text-[11px] text-slate-500">{hint}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// Card-shaped version sized to match the platform's standard card
// chrome. Used by route-level loading.tsx files so navigation always
// shows a consistent affordance in the same vertical position the
// real page will land in.
export function LoadingCard({
  label = "Loading…",
  hint,
}: {
  label?: string;
  hint?: string;
}) {
  return (
    <div className="card">
      <LoadingBar label={label} hint={hint} />
      <div className="mt-5 space-y-2">
        <div className="h-3 rounded bg-ink-700/40 w-5/6 animate-pulse" />
        <div className="h-3 rounded bg-ink-700/40 w-3/4 animate-pulse" />
        <div className="h-3 rounded bg-ink-700/40 w-2/3 animate-pulse" />
      </div>
    </div>
  );
}
