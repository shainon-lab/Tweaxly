"use client";
import { useEffect, useState } from "react";

// Keyboard + button nav for the deck.
// - ← / ↑ / Page Up        → previous slide
// - → / ↓ / Space / Enter  → next slide
// - Home / End             → first / last
// - 1..9, 0                → jump to slide N (0 = 10)
//
// We use scroll-snap on the deck container, so navigation is just calling
// scrollIntoView() on the appropriate <section>.

export default function DeckNav({ total }: { total: number }) {
  const [active, setActive] = useState(1);

  // Track the slide that's currently in view so we can show "03 / 16".
  useEffect(() => {
    const ids = Array.from({ length: total }, (_, i) => `slide-${i + 1}`);
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    const io = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the largest intersection ratio that's in view.
        let best: { i: number; ratio: number } | null = null;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = sections.indexOf(e.target as HTMLElement) + 1;
          if (!best || e.intersectionRatio > best.ratio) {
            best = { i, ratio: e.intersectionRatio };
          }
        }
        if (best) setActive(best.i);
      },
      { threshold: [0.4, 0.6, 0.8] },
    );
    for (const s of sections) io.observe(s);
    return () => io.disconnect();
  }, [total]);

  function go(n: number) {
    const target = Math.max(1, Math.min(total, n));
    const el = document.getElementById(`slide-${target}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Ignore when the user is typing in an input.
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;

      if (["ArrowRight", "ArrowDown", " ", "Enter", "PageDown"].includes(e.key)) {
        e.preventDefault();
        go(active + 1);
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        go(active - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        go(1);
      } else if (e.key === "End") {
        e.preventDefault();
        go(total);
      } else if (/^[0-9]$/.test(e.key)) {
        // 1..9 jump direct; 0 → slide 10.
        const n = e.key === "0" ? 10 : Number(e.key);
        if (n >= 1 && n <= total) {
          e.preventDefault();
          go(n);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, total]);

  return (
    <div className="deck-nav fixed bottom-6 right-6 z-50 flex items-center gap-2 print:hidden">
      <button
        type="button"
        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-line bg-white text-ink-700 shadow-sm hover:bg-ink-50 transition disabled:opacity-40"
        onClick={() => go(active - 1)}
        disabled={active <= 1}
        aria-label="Previous slide"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div className="px-3 py-1 rounded-full border border-line bg-white text-xs font-mono text-ink-600 shadow-sm tabular-nums">
        {String(active).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>
      <button
        type="button"
        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-line bg-white text-ink-700 shadow-sm hover:bg-ink-50 transition disabled:opacity-40"
        onClick={() => go(active + 1)}
        disabled={active >= total}
        aria-label="Next slide"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
