"use client";

// Renders the AI-curated suggested questions as a vertical list of
// cards. Each card has the question text + a CONSULT button that
// navigates to /consultation?q=…&auto=1 - the consultation page
// then auto-submits, so the user lands directly on the answer
// (mirroring the previous "click and go" behaviour the deprecated
// hero used to provide on the New Advisory screen).

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface SuggestedQuestion {
  id:       string;
  title:    string;
  question: string;
  blurb:    string;
  tone:     "good" | "warn" | "bad" | "neutral";
  // The single highest-priority recommendation gets a Priority badge
  // and slightly more visual weight. The rest render uniformly.
  priority: boolean;
}

const TONE_STYLES: Record<SuggestedQuestion["tone"], { dot: string; ring: string; chip: string; label: string }> = {
  bad:     { dot: "bg-bad",         ring: "border-bad/40",         chip: "border-bad/40 bg-bad/15 text-bad",       label: "Urgent" },
  warn:    { dot: "bg-warn",        ring: "border-warn/40",        chip: "border-warn/40 bg-warn/15 text-warn",    label: "Attention" },
  good:    { dot: "bg-good",        ring: "border-good/35",        chip: "border-good/35 bg-good/15 text-good",    label: "Positive" },
  neutral: { dot: "bg-slate-400",   ring: "border-line",           chip: "border-line bg-ink-900/50 text-slate-300", label: "Insight" },
};

export default function SuggestedClient({ questions }: { questions: SuggestedQuestion[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  function startConsult(q: SuggestedQuestion) {
    setBusy(q.id);
    const params = new URLSearchParams({ q: q.question, auto: "1" });
    router.push(`/consultation?${params.toString()}`);
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-ink-900/40 px-6 py-12 text-center">
        <div className="text-base font-semibold text-slate-100 mb-2">No suggestions yet</div>
        <div className="text-sm text-slate-400 max-w-md mx-auto">
          Once your workspace has a few months of data, the advisor will surface
          curated questions here - focused on actionable items, abnormal patterns,
          and other moves worth thinking about.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Compact row layout - one line per question (chips + question
          + button) so 10+ suggestions stay scannable. */}
      <div className="divide-y divide-line/40 rounded-xl border border-line bg-ink-900/30 overflow-hidden">
        {questions.map((q) => {
          const tone = TONE_STYLES[q.tone];
          const isBusy = busy === q.id;
          return (
            <article
              key={q.id}
              className={`px-4 py-3 sm:px-5 ${q.priority ? "bg-accent-soft/10" : ""}`}
            >
              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                {/* Tone chip + optional Priority badge */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} aria-hidden="true" title={tone.label} />
                  {q.priority ? (
                    <span className="text-[9px] uppercase tracking-[0.18em] font-semibold px-1.5 py-0.5 rounded border border-accent/40 bg-accent-soft/30 text-accent">
                      Priority
                    </span>
                  ) : null}
                </div>

                {/* Short, owner-voice question - always fully visible.
                    Wraps to a second line on narrow screens; never
                    truncated. */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm sm:text-[15px] text-slate-100 leading-snug">
                    {q.question}
                  </div>
                </div>

                {/* Transparent consult button - same pattern as other
                    secondary actions across the platform (border +
                    accent text, hover fills the soft accent bg). */}
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => startConsult(q)}
                    disabled={isBusy}
                    className="text-xs font-medium px-3 py-1.5 rounded-md border border-accent/40 text-accent bg-transparent hover:bg-accent-soft hover:border-accent hover:text-white transition whitespace-nowrap disabled:opacity-50"
                  >
                    {isBusy ? "Opening…" : "Consult"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <div className="text-[11px] text-slate-500 px-1 pt-3">
        Every question consumes 1 AI Credit when consulted. Answers land in your
        Advisory History.
      </div>
    </div>
  );
}
