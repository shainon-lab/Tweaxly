"use client";

// Lightweight, fully-client search across the Learning Center.
//
// Implementation notes:
//   - Index is passed in from the server component at render time, so
//     there's no API round-trip and no extra request on first interaction.
//   - Matching is case-insensitive substring on title + excerpt + category
//     label. Good enough for the current catalog size; swap to MiniSearch
//     when the article count crosses ~50.
//   - Dropdown opens on focus when a query is present. Escape, click
//     outside, or a successful navigation closes it.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

export interface SearchArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  href: string;
}

export interface SearchCategory {
  id: string;
  label: string;
  href: string;
}

export default function ResourcesSearch({
  articles, categories,
}: {
  articles:   SearchArticle[];
  categories: SearchCategory[];
}) {
  const [q, setQ]       = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return { articles: [], categories: [] };
    const matches = (s: string) => s.toLowerCase().includes(needle);
    const catById = new Map(categories.map((c) => [c.id, c.label]));
    const catMatches = categories
      .filter((c) => matches(c.label))
      .slice(0, 4);
    const articleMatches = articles
      .map((a) => ({
        ...a,
        score:
          (matches(a.title)   ? 3 : 0) +
          (matches(a.excerpt) ? 1 : 0) +
          (matches(catById.get(a.category) ?? a.category) ? 2 : 0),
      }))
      .filter((a) => a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    return { articles: articleMatches, categories: catMatches };
  }, [q, articles, categories]);

  // Click-outside + Escape to close the dropdown.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown",  onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown",  onKey);
    };
  }, []);

  const hasResults =
    (results.articles.length + results.categories.length) > 0;

  return (
    <div ref={rootRef} className="relative max-w-2xl">
      <label htmlFor="resources-search" className="sr-only">
        Search the Learning Center
      </label>
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-ink-900/60 px-4 py-3 focus-within:border-brand-purple/60 transition">
        <span aria-hidden="true" className="text-slate-500">⌕</span>
        <input
          id="resources-search"
          type="search"
          value={q}
          placeholder="Search the Learning Center - try &quot;cash flow&quot; or &quot;CAC&quot;"
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
          className="flex-1 bg-transparent outline-none text-sm sm:text-base text-[color:var(--color-ink-strong)] placeholder:text-slate-500"
        />
        {q ? (
          <button
            type="button"
            onClick={() => { setQ(""); setOpen(false); }}
            className="text-slate-500 hover:text-[color:var(--color-ink-strong)] transition text-xs"
            aria-label="Clear search"
          >
            Clear
          </button>
        ) : null}
      </div>

      {open && q.trim().length > 0 ? (
        <div className="absolute z-30 left-0 right-0 top-full mt-2 rounded-2xl border border-line bg-ink-950 shadow-2xl shadow-black/60 max-h-[480px] overflow-y-auto">
          {!hasResults ? (
            <div className="px-5 py-6 text-sm text-slate-600">
              No matches for &ldquo;{q}&rdquo;. Try a broader term, or browse all categories below.
            </div>
          ) : null}
          {results.categories.length > 0 ? (
            <div className="border-b border-line/40">
              <div className="px-5 pt-4 pb-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">Categories</div>
              <ul>
                {results.categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={c.href}
                      onClick={() => setOpen(false)}
                      className="block px-5 py-3 text-sm text-slate-800 hover:bg-ink-900 hover:text-[color:var(--color-ink-strong)] transition"
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {results.articles.length > 0 ? (
            <div>
              <div className="px-5 pt-4 pb-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">Articles</div>
              <ul>
                {results.articles.map((a) => (
                  <li key={`${a.category}-${a.slug}`}>
                    <Link
                      href={a.href}
                      onClick={() => setOpen(false)}
                      className="block px-5 py-3 hover:bg-ink-900 transition"
                    >
                      <div className="text-sm font-medium text-[color:var(--color-ink-strong)] leading-snug">{a.title}</div>
                      <div className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">{a.excerpt}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
