"use client";

// Shown while the consultation API call is in flight. Replaces the
// previous static skeleton with three signals of liveness:
//
//   1. A continuously-sweeping indeterminate progress bar (CSS only -
//      no JS animation cost).
//   2. A rotating status line that cycles through realistic stages
//      every ~2.4s. Gives the user a sense of what the system is
//      doing without lying about exact phases.
//   3. An elapsed seconds counter ("0:07") so the user knows time is
//      actually passing - especially helpful when a request slows
//      down for any reason.
//
// On unmount, all timers + intervals are cleared so a fast response
// doesn't leak a setInterval into the background.

import { useEffect, useState } from "react";

// Status phrases the rotator cycles through. The first one is shown
// for a beat longer than the rest because most requests resolve
// before the second tick anyway.
const PHASES = [
  "Reading your business data…",
  "Reviewing trends and seasonality…",
  "Cross-checking categories and vendors…",
  "Forming the reasoning…",
  "Drafting the recommendation…",
  "Almost there…",
];

const PHASE_INTERVAL_MS = 2400;

function fmtElapsed(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Asymptote constant: how fast the fake percentage approaches 99%.
// pct(t) = 99 * (1 - exp(-t / TAU)). TAU=12 gives ~48% at 8s, ~81% at
// 20s, ~95% at 36s - close to the real distribution of advisor
// response times - and the curve never reaches 100% so the user
// never sees a stalled "100%" while the request is still in flight.
const TAU_SECONDS = 12;

export default function ThinkingProgress() {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [elapsed,  setElapsed]  = useState(0);

  useEffect(() => {
    const phaseTimer = window.setInterval(() => {
      setPhaseIdx((i) => Math.min(i + 1, PHASES.length - 1));
    }, PHASE_INTERVAL_MS);
    const secondTimer = window.setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);
    return () => {
      window.clearInterval(phaseTimer);
      window.clearInterval(secondTimer);
    };
  }, []);

  const pct = Math.min(99, Math.round(99 * (1 - Math.exp(-elapsed / TAU_SECONDS))));

  return (
    <div className="rounded-2xl border border-accent/30 bg-ink-900/40 p-6 overflow-hidden">
      <div className="flex items-center gap-3">
        <span className="inline-flex w-7 h-7 rounded-full bg-ink-700 text-accent border border-accent/40 items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="animate-spin">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          {/* Rotating status text */}
          <div className="t-body text-slate-200 font-medium truncate">
            {PHASES[phaseIdx]}
          </div>
          <div className="t-meta text-slate-500 mt-0.5">
            Working on your answer · <span className="tabular-nums">{fmtElapsed(elapsed)}</span>
          </div>
        </div>
        {/* Big right-aligned percentage so the user has an unambiguous
            "how far along" signal alongside the elapsed timer. The
            asymptotic curve guarantees this never reaches 100% before
            the answer actually arrives. */}
        <div className="shrink-0 text-right tabular-nums">
          <div className="text-2xl font-semibold text-accent leading-none">{pct}%</div>
          <div className="t-meta text-slate-500 mt-1">complete</div>
        </div>
      </div>

      {/* Determinate progress fill driven by the same percentage shown
          above. Replaces the indeterminate platform-wide LoadingBar
          here because the user explicitly asked for a percentage; the
          shared sweep still lives in LoadingBar.tsx for uploads and
          route transitions. */}
      <div className="mt-5 h-1.5 rounded-full bg-ink-700/60 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-purple via-accent to-brand-teal transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Three faint placeholder lines below the bar so the card
          occupies roughly the same vertical space as the eventual
          hero - prevents a layout shift when the answer arrives. */}
      <div className="mt-5 space-y-2">
        <div className="h-3 rounded bg-ink-700/40 w-5/6 animate-pulse" />
        <div className="h-3 rounded bg-ink-700/40 w-3/4 animate-pulse" />
        <div className="h-3 rounded bg-ink-700/40 w-2/3 animate-pulse" />
      </div>
    </div>
  );
}
