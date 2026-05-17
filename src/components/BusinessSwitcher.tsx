"use client";

// Workspace switcher rendered in the sidebar header. Lists every
// business the user has an active membership in. Picking one POSTs to
// /api/businesses/switch and reloads — that's the only correct way to
// switch context because the server has to verify membership and
// rewrite session.currentBusinessId.
//
// The bottom row opens an inline 'Create new workspace' dialog (name +
// optional industry + optional country). The full management surface
// lives at /settings/workspaces.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Check, Plus } from "lucide-react";

export type SwitcherWorkspace = {
  id: string;
  name: string;
  role: string;
  isCurrent: boolean;
};

export default function BusinessSwitcher({
  current,
  workspaces,
}: {
  current: { id: string; name: string } | null;
  workspaces: SwitcherWorkspace[];
}) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function switchTo(id: string) {
    if (id === current?.id) { setOpen(false); return; }
    await fetch("/api/businesses/switch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ businessId: id }),
    });
    // Hard navigation so every server component re-renders with the
    // new workspace scope.
    window.location.assign("/dashboard");
  }

  return (
    <>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-line bg-ink-900/60 text-left text-sm text-slate-100 hover:bg-ink-700 transition"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Workspace</div>
            <div className="truncate text-slate-100 font-medium" title={current?.name ?? "Workspace"}>
              {current?.name ?? "Select workspace"}
            </div>
          </div>
          <ChevronDown size={14} strokeWidth={1.75} className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>

        {open ? (
          <div
            role="listbox"
            className="absolute left-0 right-0 mt-1.5 z-50 rounded-lg border border-line bg-ink-900/95 backdrop-blur shadow-xl overflow-hidden"
          >
            <ul className="max-h-72 overflow-y-auto py-1">
              {workspaces.map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => switchTo(w.id)}
                    role="option"
                    aria-selected={w.isCurrent}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 text-sm transition ${
                      w.isCurrent
                        ? "bg-accent-soft/40 text-accent"
                        : "text-slate-200 hover:bg-ink-700"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{w.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{w.role.replace("_", " ")}</div>
                    </div>
                    {w.isCurrent ? <Check size={14} strokeWidth={2} className="shrink-0" /> : null}
                  </button>
                </li>
              ))}
              {workspaces.length === 0 ? (
                <li className="px-3 py-2 text-xs text-slate-500">No other workspaces.</li>
              ) : null}
            </ul>
            <div className="border-t border-line">
              <button
                type="button"
                onClick={() => { setOpen(false); setCreateOpen(true); }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 text-sm text-accent hover:bg-accent-soft/30 transition"
              >
                <Plus size={14} strokeWidth={2} aria-hidden="true" />
                Create new workspace
              </button>
              <Link
                href="/settings/workspaces"
                onClick={() => setOpen(false)}
                className="block w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-ink-700 hover:text-slate-100 transition border-t border-line"
              >
                Manage workspaces →
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {createOpen ? (
        <CreateWorkspaceDialog onClose={() => setCreateOpen(false)} />
      ) : null}
    </>
  );
}

function CreateWorkspaceDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/businesses/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, industry: industry || undefined, country: country || undefined }),
      });
      if (!res.ok) {
        const t = await res.text();
        let msg = `Create failed (${res.status})`;
        try { msg = JSON.parse(t).error ?? msg; } catch { /* keep */ }
        setError(msg);
        return;
      }
      window.location.assign("/dashboard");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create new workspace"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card w-full max-w-md">
        <div className="mb-4">
          <div className="text-lg font-semibold text-slate-100">New workspace</div>
          <div className="text-sm text-slate-400 mt-1">
            Belongs to your account. No new login required.
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Business name *</label>
            <input
              autoFocus
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Side Co."
            />
          </div>
          <div>
            <label className="label">Business type <span className="text-slate-500">(optional)</span></label>
            <input className="input" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. SaaS, Retail, Agency" />
          </div>
          <div>
            <label className="label">Country <span className="text-slate-500">(optional)</span></label>
            <input className="input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. United States" />
          </div>
          {error ? <div className="text-sm text-bad">{error}</div> : null}
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
          <button
            type="button"
            disabled={!name.trim() || busy}
            onClick={submit}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create workspace"}
          </button>
        </div>
      </div>
    </div>
  );
}
