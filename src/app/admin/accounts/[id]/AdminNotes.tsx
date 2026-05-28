"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { notify } from "@/lib/notify";

type Note = {
  id: string;
  body: string;
  tags: string | null;
  authorEmail: string;
  authorName: string | null;
  createdAt: string;
};

const TAG_SUGGESTIONS = ["onboarding", "billing", "bug", "sales", "churn_risk", "vip"];

export function AdminNotes({
  businessId,
  notes,
}: {
  businessId: string;
  notes: Note[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTag(t: string) {
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  async function add() {
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounts/${businessId}/notes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body, tags: tags.join(",") }),
      });
      if (!res.ok) {
        setError("Failed to add note");
        return;
      }
      setBody("");
      setTags([]);
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  async function remove(noteId: string) {
    if (!(await notify.confirm({ title: "Delete note?", body: "Delete this note? This can't be undone.", confirmLabel: "Delete", danger: true }))) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/accounts/${businessId}/notes?noteId=${noteId}`, {
        method: "DELETE",
      });
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Compose */}
      <div className="lg:col-span-1 rounded-xl border border-line bg-ink-900/40 p-5 space-y-3 h-fit">
        <div className="text-sm font-semibold text-slate-100">Add note</div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          maxLength={5000}
          placeholder="Internal-only. Visible to super_admins."
          className="input w-full resize-none text-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {TAG_SUGGESTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition ${
                tags.includes(t)
                  ? "bg-accent-soft border-accent/40 text-accent"
                  : "border-line text-slate-400 hover:text-slate-200 hover:border-slate-500"
              }`}
            >
              {t.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          {error ? <span className="text-xs text-bad">{error}</span> : <span />}
          <button
            type="button"
            onClick={add}
            disabled={!body.trim() || busy || pending}
            className="text-sm px-4 py-1.5 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition disabled:opacity-50"
          >
            Save note
          </button>
        </div>
      </div>

      {/* List */}
      <div className="lg:col-span-2 space-y-2">
        {notes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-ink-900/20 p-6 text-center text-sm text-slate-500">
            No internal notes yet.
          </div>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="rounded-xl border border-line bg-ink-900/40 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="text-xs text-slate-500">
                  <span className="text-slate-300">{n.authorName ?? n.authorEmail}</span>
                  <span className="mx-2 text-slate-700">·</span>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  className="shrink-0 text-slate-500 hover:text-bad transition"
                  title="Delete note"
                  aria-label="Delete note"
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </button>
              </div>
              <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{n.body}</div>
              {n.tags ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {n.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border border-line text-slate-400">
                      {t.replace("_", " ")}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
