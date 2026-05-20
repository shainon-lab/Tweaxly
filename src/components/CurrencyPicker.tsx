"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  PRIORITY_CURRENCIES,
  OTHER_CURRENCIES,
  ALL_CURRENCIES,
  type Currency,
} from "@/lib/currencies";

// Searchable currency picker.
// - Default order: USD, EUR, GBP pinned, then a separator, then the rest
//   alphabetically by code.
// - Typing filters the list by code prefix or by name (case-insensitive).
// - Closing the dropdown without choosing reverts the input to the saved value
//   so the parent's controlled state never gets a malformed code.

type Props = {
  value: string;
  onChange: (code: string) => void;
  // Optional name attribute makes this work inside a plain HTML <form>.
  name?: string;
  id?: string;
  className?: string;
};

export default function CurrencyPicker({ value, onChange, name, id, className }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the input in sync if the parent updates `value` from outside.
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close on outside click, reverting the input to the saved value.
  useEffect(() => {
    function handleDocMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    }
    document.addEventListener("mousedown", handleDocMouseDown);
    return () => document.removeEventListener("mousedown", handleDocMouseDown);
  }, [value]);

  // Build the list of items to render. When the user is actively searching
  // (query differs from current value), filter strictly by code prefix and
  // sort alphabetically. Otherwise show priority pinned + separator + rest.
  const sections = useMemo<{ kind: "priority" | "rest" | "filtered"; items: Currency[] }[]>(() => {
    const q = query.trim().toUpperCase();
    const isSearching = q.length > 0 && q !== value.toUpperCase();
    if (isSearching) {
      const matches = ALL_CURRENCIES
        .filter((c) => c.code.startsWith(q))
        .sort((a, b) => a.code.localeCompare(b.code));
      return [{ kind: "filtered", items: matches }];
    }
    return [
      { kind: "priority", items: PRIORITY_CURRENCIES },
      { kind: "rest", items: OTHER_CURRENCIES },
    ];
  }, [query, value]);

  // Flat list of selectable items in render order - used for keyboard nav.
  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  function pick(code: string) {
    onChange(code);
    setQuery(code);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && flat[highlight]) {
        e.preventDefault();
        pick(flat[highlight].code);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery(value);
    }
  }

  return (
    <div ref={wrapRef} className={`relative ${className ?? ""}`}>
      <input
        id={id}
        name={name}
        className="input"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value.toUpperCase());
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Type to search… e.g. USD"
      />
      {open ? (
        <div
          ref={listRef}
          className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-md border border-line bg-ink-800 shadow-lg"
          role="listbox"
        >
          {flat.length === 0 ? (
            <div className="px-3 py-3 text-sm text-slate-400">
              No currencies match &quot;{query}&quot;
            </div>
          ) : (
            sections.map((section, sIdx) => {
              if (section.items.length === 0) return null;
              // Compute the absolute starting index in `flat` so highlight indexing lines up across sections.
              const before = sections.slice(0, sIdx).reduce((sum, s) => sum + s.items.length, 0);
              return (
                <div key={section.kind}>
                  {section.kind === "rest" ? (
                    <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500 border-t border-line bg-ink-900/50">
                      All currencies (alphabetical)
                    </div>
                  ) : null}
                  {section.items.map((c, i) => {
                    const idx = before + i;
                    const isHi = idx === highlight;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        role="option"
                        aria-selected={isHi}
                        className={`w-full text-left px-3 py-1.5 text-sm flex items-baseline gap-3 ${
                          isHi ? "bg-accent-soft text-accent" : "hover:bg-ink-700"
                        }`}
                        onMouseEnter={() => setHighlight(idx)}
                        onMouseDown={(e) => {
                          // mousedown (not click) so we beat the document
                          // mousedown handler that closes the dropdown.
                          e.preventDefault();
                          pick(c.code);
                        }}
                      >
                        <span className="font-mono w-12 shrink-0">{c.code}</span>
                        <span className="text-slate-400 truncate">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
