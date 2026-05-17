"use client";

// Global admin command bar. Keyboard: ⌘K / Ctrl+K to focus, Esc to
// close, ↑↓ to highlight (only within visible group), Enter to open
// the first result. Results are grouped (Businesses / Users /
// Consultations) and limited to 5 per group.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";

type Results = {
  businesses: { id: string; name: string; status: string; plan: string; owner: { email: string } }[];
  users: { id: string; email: string; name: string | null; systemRole: string; businesses: { id: string; name: string }[] }[];
  consultations: { id: string; title: string; business: { id: string; name: string } }[];
};

const EMPTY: Results = { businesses: [], users: [], consultations: [] };

export default function AdminSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [res, setRes] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K focuses the search.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const cmdOrCtrl = e.metaKey || e.ctrlKey;
      if (cmdOrCtrl && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape" && open) {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Debounced fetch.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setRes(EMPTY); return; }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/admin/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.ok ? r.json() : EMPTY)
        .then((data) => { setRes(data); setLoading(false); })
        .catch(() => { setLoading(false); });
    }, 180);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  const totalCount = res.businesses.length + res.users.length + res.consultations.length;

  function go(href: string) {
    setOpen(false);
    setQ("");
    router.push(href);
  }

  return (
    <div ref={ref} className="relative w-72">
      <div className="relative">
        <Search size={13} strokeWidth={1.75} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search accounts, users, IDs…"
          className="w-full h-8 pl-7 pr-12 rounded-md border border-line bg-ink-900/60 text-[13px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent/50 transition"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 border border-line rounded px-1 py-0.5 hidden lg:inline">⌘K</kbd>
      </div>

      {open && q.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 mt-1.5 z-50 rounded-lg border border-line bg-ink-900/95 backdrop-blur shadow-2xl shadow-black/50 max-h-[460px] overflow-y-auto">
          {loading && totalCount === 0 ? (
            <div className="px-3 py-4 text-xs text-slate-500">Searching…</div>
          ) : totalCount === 0 ? (
            <div className="px-3 py-4 text-xs text-slate-500">No matches for &ldquo;{q}&rdquo;.</div>
          ) : (
            <>
              {res.businesses.length > 0 ? (
                <Group label="Businesses">
                  {res.businesses.map((b) => (
                    <Row
                      key={b.id}
                      title={b.name}
                      subtitle={`${b.owner.email} · ${b.plan} · ${b.status}`}
                      onClick={() => go(`/admin/accounts/${b.id}`)}
                    />
                  ))}
                </Group>
              ) : null}
              {res.users.length > 0 ? (
                <Group label="Users">
                  {res.users.map((u) => (
                    <Row
                      key={u.id}
                      title={u.name ?? u.email}
                      subtitle={u.email + (u.businesses[0] ? ` · ${u.businesses[0].name}` : "")}
                      onClick={() => u.businesses[0] ? go(`/admin/accounts/${u.businesses[0].id}`) : go(`/admin/accounts?q=${encodeURIComponent(u.email)}`)}
                    />
                  ))}
                </Group>
              ) : null}
              {res.consultations.length > 0 ? (
                <Group label="Consultations">
                  {res.consultations.map((c) => (
                    <Row
                      key={c.id}
                      title={c.title || "(untitled consultation)"}
                      subtitle={c.business.name}
                      onClick={() => go(`/admin/accounts/${c.business.id}`)}
                    />
                  ))}
                </Group>
              ) : null}
            </>
          )}
          <div className="border-t border-line px-3 py-1.5 text-[10px] text-slate-600">
            Press <kbd className="border border-line rounded px-1">esc</kbd> to close · <Link href="/admin/accounts" className="text-accent hover:underline">browse all accounts</Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</div>
      <ul>{children}</ul>
    </div>
  );
}

function Row({ title, subtitle, onClick }: { title: string; subtitle: string; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left px-3 py-2 hover:bg-ink-700 transition flex items-center justify-between gap-3"
      >
        <div className="min-w-0">
          <div className="text-sm text-slate-100 truncate">{title}</div>
          <div className="text-[11px] text-slate-500 truncate">{subtitle}</div>
        </div>
        <span className="text-[10px] text-slate-600 shrink-0">→</span>
      </button>
    </li>
  );
}
