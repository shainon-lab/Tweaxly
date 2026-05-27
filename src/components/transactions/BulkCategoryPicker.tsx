"use client";

// Picker modal for the Transactions bulk "Apply category" action.
//
// Single search box at the top filters BOTH existing workspace
// categories AND suggested common categories (from the spec). Clicking
// an existing category fires onPick immediately. Suggested categories
// that don't exist yet show "+ Create" - click to POST /api/categories
// then auto-pick.
//
// A standalone "+ Create new category" row at the bottom opens an
// inline form (name + Income/Outcome toggle) for fully custom names.
//
// All categories are created with kind = "revenue" (income) or
// "variable" (outcome) by default. The owner can edit kind later
// from Settings → Categories & Vendors.

import { useEffect, useMemo, useState } from "react";
import { X as XIcon, Plus, Sparkles } from "lucide-react";
import { SUGGESTED_INCOME_CATEGORIES, SUGGESTED_EXPENSE_CATEGORIES } from "@/lib/suggestedCategories";

export interface PickerCategory {
  id:   string;
  name: string;
  kind: string;        // "revenue" → income; else outcome
}

interface Props {
  open:        boolean;
  onClose:     () => void;
  categories:  PickerCategory[];
  onPick:      (categoryId: string, categoryName: string) => void;
  // Returns the newly-created category (id + name + kind) so the
  // parent can update its local list AND the modal can auto-pick.
  onCreate:    (name: string, kind: "revenue" | "variable") => Promise<PickerCategory>;
}

export default function BulkCategoryPicker({ open, onClose, categories, onPick, onCreate }: Props) {
  const [q, setQ]           = useState("");
  const [creating, setCreating] = useState<{ name: string; kind: "revenue" | "variable" } | null>(null);
  const [busy, setBusy]     = useState(false);

  useEffect(() => {
    if (open) { setQ(""); setCreating(null); setBusy(false); }
  }, [open]);

  const existingByName = useMemo(
    () => new Map(categories.map((c) => [c.name.toLowerCase(), c])),
    [categories],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(term));
  }, [categories, q]);

  // Suggested = the spec's common-categories lists, minus anything
  // already in the workspace, filtered by the search term.
  const suggested = useMemo(() => {
    const term = q.trim().toLowerCase();
    const all = [
      ...SUGGESTED_INCOME_CATEGORIES.map((n) => ({ name: n, kind: "revenue" as const })),
      ...SUGGESTED_EXPENSE_CATEGORIES.map((n) => ({ name: n, kind: "variable" as const })),
    ];
    return all
      .filter((s) => !existingByName.has(s.name.toLowerCase()))
      .filter((s) => !term || s.name.toLowerCase().includes(term));
  }, [existingByName, q]);

  async function createAndPick(name: string, kind: "revenue" | "variable") {
    setBusy(true);
    try {
      const created = await onCreate(name, kind);
      onPick(created.id, created.name);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't create category");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4"
      onClick={onClose}
    >
      <div className="card w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-base font-semibold text-slate-100">Pick a category</div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <XIcon size={16} />
          </button>
        </div>

        <input
          autoFocus
          className="input mb-3"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search or type a new name…"
        />

        {creating ? (
          <CreateForm
            initial={creating}
            busy={busy}
            onCancel={() => setCreating(null)}
            onSubmit={(name, kind) => createAndPick(name, kind)}
          />
        ) : (
          <div className="max-h-[420px] overflow-y-auto -mx-1 px-1">
            {filtered.length > 0 ? (
              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Your categories</div>
                <ul className="space-y-1">
                  {filtered.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => onPick(c.id, c.name)}
                        className="w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-line bg-ink-900/30 hover:border-accent/40 hover:bg-accent-soft/20 transition"
                      >
                        <span className="text-sm text-slate-100 truncate">{c.name}</span>
                        <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          c.kind === "revenue" ? "bg-good/15 text-good" : "bg-warn/15 text-warn"
                        }`}>
                          {c.kind === "revenue" ? "Income" : "Outcome"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {suggested.length > 0 ? (
              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 inline-flex items-center gap-1">
                  <Sparkles size={11} /> Suggested
                </div>
                <ul className="space-y-1">
                  {suggested.map((s) => (
                    <li key={s.name}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => createAndPick(s.name, s.kind)}
                        className="w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-line/60 bg-ink-900/20 hover:border-accent/40 hover:bg-accent-soft/15 transition disabled:opacity-50"
                      >
                        <span className="text-sm text-slate-200 truncate">{s.name}</span>
                        <span className="text-[10px] text-slate-500">
                          {s.kind === "revenue" ? "Income · create" : "Outcome · create"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setCreating({
                name: q.trim(),
                kind: "variable",
              })}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-accent/40 text-accent hover:bg-accent-soft/30 transition text-sm"
            >
              <Plus size={14} /> Create new category{q.trim() ? `: "${q.trim()}"` : ""}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateForm({
  initial, busy, onCancel, onSubmit,
}: {
  initial: { name: string; kind: "revenue" | "variable" };
  busy: boolean;
  onCancel: () => void;
  onSubmit: (name: string, kind: "revenue" | "variable") => void;
}) {
  const [name, setName] = useState(initial.name);
  const [kind, setKind] = useState<"revenue" | "variable">(initial.kind);
  const canSave = name.trim().length > 0 && !busy;
  return (
    <div className="space-y-3">
      <div>
        <label className="label">Category name</label>
        <input
          autoFocus
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rent, Software, Office Supplies"
        />
      </div>
      <div>
        <label className="label">Type</label>
        <div className="flex gap-2">
          <button
            type="button"
            className={`btn flex-1 ${kind === "variable" ? "border border-bad text-bad hover:bg-bad/10" : "btn-ghost"}`}
            onClick={() => setKind("variable")}
          >
            Outcome
          </button>
          <button
            type="button"
            className={`btn flex-1 ${kind === "revenue" ? "border border-good text-good hover:bg-good/10" : "btn-ghost"}`}
            onClick={() => setKind("revenue")}
          >
            Income
          </button>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost text-sm" disabled={busy} onClick={onCancel}>Cancel</button>
        <button
          type="button"
          className="btn-primary text-sm disabled:opacity-50"
          disabled={!canSave}
          onClick={() => onSubmit(name.trim(), kind)}
        >
          {busy ? "Creating…" : "Create + apply"}
        </button>
      </div>
    </div>
  );
}
