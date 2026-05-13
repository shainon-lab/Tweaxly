"use client";

// Split-screen history view: list on the left, viewer on the right.
// Selection lives in the URL (?id=xxx) so navigation feels stable —
// each click triggers a server-rendered swap of the right panel
// without touching the left list.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

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
  answerNodes,
}: {
  list: HistoryListItem[];
  detail: HistoryDetail | null;
  answerNodes: React.ReactNode;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const selectedId = sp.get("id") ?? detail?.id ?? null;

  function newConversation() {
    startTransition(() => router.push("/consultation"));
    // The layout uses a custom <main> as the scroll container, so
    // Next.js's window-level scroll-restoration doesn't reset it on
    // route change. Force the pane to the top so the user lands on the
    // intro card instead of mid-page.
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        const main = document.querySelector("main");
        if (main) main.scrollTop = 0;
        window.scrollTo({ top: 0 });
      });
    }
  }

  function closeViewer() {
    const params = new URLSearchParams(sp.toString());
    params.delete("id");
    const qs = params.toString();
    startTransition(() => router.push(`/consultation/history${qs ? `?${qs}` : ""}`));
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <button
          type="button"
          className="btn-brand text-sm px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition-transform active:scale-[0.98]"
          onClick={newConversation}
          disabled={pending}
        >
          + New Consultation
        </button>
      </div>

      {list.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-lg font-medium">No consultations yet</div>
          <div className="text-sm text-slate-400 mt-1">
            Start a new consultation to begin building your history.
          </div>
        </div>
      ) : (
        // Split-screen on lg+. On mobile both panes stack and grow with
        // their content (no inner-scroll wrestling on small viewports).
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 lg:h-[calc(100vh-300px)] lg:min-h-[480px]">
          {/* Left panel: list */}
          <aside className="rounded-xl border border-line bg-ink-900/30 overflow-y-auto">
            <ul className="p-2 space-y-1">
              {list.map((item) => {
                const active = item.id === selectedId;
                const { date, time } = fmtDate(item.askedAt);
                return (
                  <li key={item.id}>
                    <Link
                      href={`/consultation/history?id=${item.id}`}
                      scroll={false}
                      className={`block rounded-lg px-3 py-2.5 text-sm transition border ${
                        active
                          ? "bg-accent-soft border-accent/40 text-slate-100"
                          : "border-transparent text-slate-300 hover:bg-ink-700/60 hover:border-line"
                      }`}
                    >
                      <div className="line-clamp-2 leading-snug">{item.title}</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {date} • {time}
                      </div>
                    </Link>
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
                {/* Sticky question header — never scrolls, so the user
                    always knows which question the analysis answers. */}
                <div className="px-5 md:px-6 py-4 border-b border-line bg-ink-900/60 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-accent mb-1">Question</div>
                    <div className="text-sm md:text-base text-slate-100 break-words">
                      {detail.question}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {new Date(detail.askedAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-slate-300 hover:text-white border border-line rounded-md px-2 py-1 shrink-0"
                    onClick={closeViewer}
                    disabled={pending}
                  >
                    Close
                  </button>
                </div>

                {/* Scrollable answer body */}
                <div className="flex-1 overflow-y-auto px-5 md:px-6 py-5">
                  {answerNodes ? (
                    <div className="space-y-1.5 max-w-3xl">{answerNodes}</div>
                  ) : (
                    <div className="text-sm text-slate-400 italic">
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
