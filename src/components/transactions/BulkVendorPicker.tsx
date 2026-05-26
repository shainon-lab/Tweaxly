"use client";

// Picker modal for the Transactions bulk "Apply vendor" action.
//
// Same pattern as BulkCategoryPicker but simpler - there's no suggested
// list (vendors are workspace-specific) and no "kind" toggle. The
// search box doubles as the create input: typing a name not in the
// list and clicking "Create new vendor" upserts the Vendor row and
// auto-applies it to the selection.

import { useEffect, useMemo, useState } from "react";
import { X as XIcon, Plus } from "lucide-react";

export interface PickerVendor {
  id:   string;
  name: string;
}

interface Props {
  open:       boolean;
  onClose:    () => void;
  vendors:    PickerVendor[];
  // Called when the user picks an existing vendor OR confirms a new
  // one. The parent decides whether to upsert server-side (the bulk
  // setVendor endpoint already does that; we just pass the name).
  onPick:     (vendorName: string) => void;
}

export default function BulkVendorPicker({ open, onClose, vendors, onPick }: Props) {
  const [q, setQ] = useState("");

  useEffect(() => { if (open) setQ(""); }, [open]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return vendors;
    return vendors.filter((v) => v.name.toLowerCase().includes(term));
  }, [vendors, q]);

  const exactMatch = useMemo(
    () => filtered.find((v) => v.name.toLowerCase() === q.trim().toLowerCase()),
    [filtered, q],
  );

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4"
      onClick={onClose}
    >
      <div className="card w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-base font-semibold text-slate-100">Pick a vendor</div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <XIcon size={16} />
          </button>
        </div>

        <input
          autoFocus
          className="input mb-3"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search or type a new name (e.g. Bank Leumi)…"
        />

        <div className="max-h-[420px] overflow-y-auto -mx-1 px-1">
          {filtered.length > 0 ? (
            <ul className="space-y-1 mb-3">
              {filtered.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => onPick(v.name)}
                    className="w-full text-left px-3 py-2 rounded-md border border-line bg-ink-900/30 hover:border-accent/40 hover:bg-accent-soft/20 transition text-sm text-slate-100"
                  >
                    {v.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {q.trim().length > 0 && !exactMatch ? (
            <button
              type="button"
              onClick={() => onPick(q.trim())}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-accent/40 text-accent hover:bg-accent-soft/30 transition text-sm"
            >
              <Plus size={14} /> Create new vendor: "{q.trim()}"
            </button>
          ) : null}
          {q.trim().length === 0 && filtered.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-4">
              Type a vendor name to search or create one.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
