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
import LoadingBar from "@/components/LoadingBar";

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
          <div className="text-sm text-slate-200 font-medium truncate">
            {PHASES[phaseIdx]}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Working on your answer · <span className="tabular-nums">{fmtElapsed(elapsed)}</span>
          </div>
        </div>
      </div>

      {/* Indeterminate sweeping bar. Reuses the platform-wide
          LoadingBar animation so consultations, uploads, and route
          transitions all speak the same visual language. */}
      <div className="mt-5">
        <LoadingBar />
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
