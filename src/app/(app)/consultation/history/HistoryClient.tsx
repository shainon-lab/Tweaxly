"use client";

// Chat history view — every past question across all threads. Only one
// item can be open at a time; opening another closes the previous. The
// expanded item pins the question at the top while the answer scrolls
// underneath if it doesn't fit.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renderMarkdown } from "../markdown";

export type HistoryEntry = {
  id: string;
  question: string;
  answer: string | null;
  askedAt: string;
};

export default function HistoryClient({ history }: { history: HistoryEntry[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [openId, setOpenId] = useState<string | null>(null);

  function newConversation() {
    startTransition(() => {
      router.push("/consultation");
    });
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <button
          type="button"
          className="btn-primary"
          onClick={newConversation}
        >
          + New conversation
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <div className="font-medium">Chat history</div>
            <div className="text-xs text-slate-400">
              {history.length} question{history.length === 1 ? "" : "s"} asked — click any to read the answer
            </div>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="text-sm text-slate-400 py-10 text-center">
            No questions yet — once you ask the advisor something it&apos;ll show up here.
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((h) => {
              const open = openId === h.id;
              return (
                <div
                  key={h.id}
                  className={`rounded-md border ${
                    open ? "border-accent/50 bg-ink-800/40" : "border-line bg-ink-800/20"
                  }`}
                >
                  {/* Question header — always visible, click to toggle */}
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-ink-700/40 transition rounded-md"
                    onClick={() => setOpenId(open ? null : h.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-100">{h.question}</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {new Date(h.askedAt).toLocaleString()}
                      </div>
                    </div>
                    <span className="text-slate-400 text-xs shrink-0 mt-0.5">
                      {open ? "▴" : "▾"}
                    </span>
                  </button>

                  {/* Answer body — question stays pinned via the sticky
                      header above; the answer scrolls inside the panel if
                      it overflows but is roomy enough to fit most. */}
                  {open ? (
                    <div className="border-t border-line">
                      <div className="px-4 py-3 max-h-[60vh] overflow-y-auto">
                        {h.answer ? (
                          <div className="space-y-1.5">{renderMarkdown(h.answer)}</div>
                        ) : (
                          <div className="text-xs text-slate-500 italic">
                            No answer was recorded for this question.
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-2 border-t border-line flex justify-end">
                        <button
                          type="button"
                          className="btn-ghost text-xs"
                          onClick={() => setOpenId(null)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
