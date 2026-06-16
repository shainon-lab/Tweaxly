"use client";

// Difficulty filter for the Business Glossary landing page.
//
// Renders four filter chips (ALL / BEGINNER / INTERMEDIATE / ADVANCED)
// above a responsive grid of glossary entries. Filtering is purely
// client-side: the full list is passed in from the server, and the
// active filter just hides non-matching entries. Cheap and immediate.

import Link from "next/link";
import { useState, useMemo } from "react";

export interface GlossaryEntry {
  slug:       string;
  title:      string;
  excerpt:    string;
  difficulty: "beginner" | "intermediate" | "advanced";
  href:       string;
}

const FILTERS = [
  { id: "all",          label: "All"           },
  { id: "beginner",     label: "Beginner"      },
  { id: "intermediate", label: "Intermediate"  },
  { id: "advanced",     label: "Advanced"      },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const DIFF_PILL: Record<GlossaryEntry["difficulty"], string> = {
  beginner:     "border-good/40    text-good     bg-good/10",
  intermediate: "border-warn/40    text-warn     bg-warn/10",
  advanced:     "border-bad/40     text-bad      bg-bad/10",
};

const DIFF_LABEL: Record<GlossaryEntry["difficulty"], string> = {
  beginner:     "Beginner",
  intermediate: "Intermediate",
  advanced:     "Advanced",
};

export default function GlossaryFilter({ entries }: { entries: GlossaryEntry[] }) {
  const [active, setActive] = useState<FilterId>("all");

  const counts = useMemo(() => {
    return {
      all:          entries.length,
      beginner:     entries.filter((e) => e.difficulty === "beginner").length,
      intermediate: entries.filter((e) => e.difficulty === "intermediate").length,
      advanced:     entries.filter((e) => e.difficulty === "advanced").length,
    };
  }, [entries]);

  const visible = active === "all"
    ? entries
    : entries.filter((e) => e.difficulty === active);

  return (
    <div>
      {/* Filter chips */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const isActive = f.id === active;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActive(f.id)}
              className={`text-xs sm:text-sm px-4 py-2 rounded-full border transition uppercase tracking-wider font-semibold ${
                isActive
                  ? "border-brand-purple bg-brand-purple/15 text-[color:var(--color-ink-strong)]"
                  : "border-line text-slate-600 hover:text-[color:var(--color-ink-strong)] hover:border-slate-500"
              }`}
            >
              {f.label}
              <span className="ml-2 text-[10px] text-slate-500 normal-case tracking-normal">
                {counts[f.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-ink-900/30 p-10 text-center">
          <div className="text-base font-medium text-slate-800 mb-1">
            No glossary entries at this level yet
          </div>
          <div className="text-sm text-slate-600">
            Try a different difficulty - more entries coming soon.
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((e) => (
            <Link
              key={e.slug}
              href={e.href}
              className="block group card hover:border-brand-purple/40 transition"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="text-base font-semibold text-[color:var(--color-ink-strong)] leading-snug">
                  {e.title}
                </div>
                <span className={`shrink-0 text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${DIFF_PILL[e.difficulty]}`}>
                  {DIFF_LABEL[e.difficulty]}
                </span>
              </div>
              <div className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {e.excerpt}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
