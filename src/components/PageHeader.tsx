"use client";

// Sticky page header. Stays pinned at the top of the scroll container
// (the (app) layout's <main>) so users keep page context + actions
// while scrolling long data screens. When the user scrolls past it, a
// compact mode kicks in: smaller title, hidden subtitle, tighter
// padding, subtle border + shadow - the "premium SaaS feeling" pattern
// (Linear / Stripe / Notion / ClickUp).
//
// "Stuck" detection uses an IntersectionObserver on a 1px sentinel
// placed just above the header. When the sentinel scrolls out of view,
// we know the header has reached the top and apply the compact class.
// No scroll-event listener, no rAF throttling needed.

import { useEffect, useRef, useState } from "react";

export default function PageHeader({
  title,
  subtitle,
  right,
}: {
  title:    string;
  subtitle?: string;
  right?:    React.ReactNode;
}) {
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      // Fire as soon as any part of the sentinel leaves the viewport.
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      {/* Detection sentinel. Sits at the natural top of the page
          content; when the user scrolls past it, the header below
          flips into compact mode. */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px -mt-px" />

      <div
        // Sticky + extended background. The negative + positive
        // horizontal padding cancels the inner div's px-* so the
        // header's backdrop spans edge-to-edge of the scroll container
        // (cleaner look during scroll than a floating bar with side
        // gaps).
        className={`sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-ink-950/95 backdrop-blur transition-all duration-200 ${
          stuck
            ? "py-3 border-b border-line/60 shadow-sm mb-3"
            : "py-4 sm:py-5 mb-6"
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1
              className={`font-semibold tracking-tight transition-all duration-200 truncate ${
                stuck ? "text-base sm:text-lg" : "text-xl sm:text-2xl"
              }`}
            >
              {title}
            </h1>
            {/* Subtitle is part of orientation, not action - drops
                away in compact mode to maximise workspace height for
                data. */}
            {subtitle && !stuck ? (
              <div className="text-sm text-slate-400 mt-1 leading-snug">
                {subtitle}
              </div>
            ) : null}
          </div>
          {right ? (
            <div className="flex items-center gap-2 shrink-0">{right}</div>
          ) : null}
        </div>
      </div>
    </>
  );
}
