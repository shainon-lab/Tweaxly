"use client";

// Split-screen history view: list on the left, viewer on the right.
// Selection lives in the URL (?id=xxx) so navigation feels stable -
// each click triggers a server-rendered swap of the right panel
// without touching the left list.
//
// Detail render path is identical to the New Advisory tab: if a
// structured payload was stored we render StructuredAdvisoryView,
// otherwise we fall through to the shared ResponseBriefing. That
// way re-opening a past question shows the same boxes, anchors,
// strategic paths and risk cards the user saw the first time.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import StructuredAdvisoryView from "@/components/advisory/StructuredAdvisoryView";
import ResponseBriefing from "@/components/advisory/ResponseBriefing";
import type { StructuredAdvice } from "@/lib/advisorTypes";
import { notify } from "@/lib/notify";

export type HistoryListItem = {
  id: string;
  title: string;
  askedAt: string;
};

export type HistoryDetail = {
  id: string;
  question: string;
  askedAt: string;
  answerMarkdown: string | null;
  payload: string | null;
  structured: StructuredAdvice | null;
};

function fmtDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function HistoryClient({
  list,
  detail,
  currency,
}: {
  list: HistoryListItem[];
  detail: HistoryDetail | null;
  currency: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const selectedId = sp.get("id") ?? detail?.id ?? null;

  function newConversation() {
    startTransition(() => router.push("/consultation"));
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        const main = document.querySelector("main");
        if (main) main.scrollTop = 0;
        window.scrollTo({ top: 0 });
      });
    }
  }

  async function deleteEntry(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!(await notify.confirm({ title: "Delete consultation?", body: "Delete this consultation from history? This cannot be undone.", confirmLabel: "Delete", danger: true }))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/consultation/history?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        notify.alert(await res.text());
        return;
      }
      // If we just deleted the currently-selected entry, clear the
      // ?id= so the right panel falls back to the next item.
      if (id === selectedId) {
        startTransition(() => router.push("/consultation/history"));
      } else {
        startTransition(() => router.refresh());
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <button
          type="button"
          className="btn-primary text-sm px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition-transform active:scale-[0.98]"
          onClick={newConversation}
          disabled={pending}
        >
          + New Advisory
        </button>
      </div>

      {list.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-lg font-medium">No advisory sessions yet</div>
          <div className="text-sm text-slate-400 mt-1">
            Start a new consultation to begin building your history.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 lg:h-[calc(100vh-300px)] lg:min-h-[480px]">
          {/* Left panel: list */}
          <aside className="rounded-xl border border-line bg-ink-900/30 overflow-y-auto">
            <ul className="p-2 space-y-1">
              {list.map((item) => {
                const active = item.id === selectedId;
                const { date, time } = fmtDate(item.askedAt);
                const isDeleting = deletingId === item.id;
                return (
                  <li key={item.id} className="relative group">
                    <Link
                      href={`/consultation/history?id=${item.id}`}
                      scroll={false}
                      className={`block rounded-lg pl-3 pr-9 py-2.5 text-sm transition border ${
                        active
                          ? "bg-accent-soft border-accent/40 text-slate-100"
                          : "border-transparent text-slate-300 hover:bg-ink-700/60 hover:border-line"
                      } ${isDeleting ? "opacity-50" : ""}`}
                    >
                      <div className="line-clamp-2 leading-snug">{item.title}</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {date} • {time}
                      </div>
                    </Link>
                    {/* Hover-revealed trash. Always rendered (positioned
                        absolute) so screen readers can still focus it;
                        opacity transitions in on hover/focus. */}
                    <button
                      type="button"
                      onClick={(e) => void deleteEntry(item.id, e)}
                      disabled={isDeleting || pending}
                      className={`absolute top-2.5 right-2 inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-bad hover:bg-bad/10 transition opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed`}
                      title="Delete this consultation"
                      aria-label="Delete this consultation"
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Right panel: viewer. Empty state when no selection. */}
          <section className="rounded-xl border border-line bg-ink-900/30 flex flex-col overflow-hidden">
            {!detail ? (
              <div className="flex-1 flex items-center justify-center text-center px-6">
                <div className="max-w-sm">
                  <div className="inline-flex w-12 h-12 rounded-full bg-accent-soft text-accent items-center justify-center text-xl mb-3">
                    ✦
                  </div>
                  <div className="text-base font-medium text-slate-200">
                    Select a consultation to view its analysis.
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Pick any item from the list on the left.
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Question header - mirrors the New Advisory question
                    card (same accent border, "Your question" eyebrow,
                    t-meta/t-body typography) so a re-opened session
                    feels identical to the moment it was asked. */}
                <div className="px-5 md:px-6 py-4 border-b border-line bg-ink-900/60">
                  <div className="rounded-xl border border-accent/30 bg-accent-soft/30 px-4 py-3">
                    <div className="t-meta uppercase tracking-wide text-accent mb-1">Your question</div>
                    <div className="t-body text-slate-100 whitespace-pre-wrap">
                      {detail.question}
                    </div>
                    <div className="t-meta text-slate-500 mt-1">
                      {new Date(detail.askedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 md:px-6 py-5">
                  {/* Same branching the New Advisory view uses: if a
                      structured payload was stored we render the rich
                      card layout; otherwise fall back to the shared
                      ResponseBriefing built from markdown. */}
                  {detail.structured ? (
                    <StructuredAdvisoryView data={detail.structured} />
                  ) : detail.answerMarkdown ? (
                    <ResponseBriefing
                      content={detail.answerMarkdown}
                      payload={detail.payload}
                      currency={currency}
                    />
                  ) : (
                    <div className="t-body text-slate-400 italic">
                      No answer was recorded for this consultation.
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

