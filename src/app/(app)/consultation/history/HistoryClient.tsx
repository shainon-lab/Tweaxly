"use client";

// Split-screen history view: list on the left, viewer on the right.
// Selection lives in the URL (?id=xxx) so navigation feels stable —
// each click triggers a server-rendered swap of the right panel
// without touching the left list.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { buildDecisionBriefing } from "@/lib/decisionBriefing";
import { renderMarkdown } from "../markdown";

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
    if (!confirm("Delete this consultation from history? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/consultation/history?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert(await res.text());
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
                </div>

                <div className="flex-1 overflow-y-auto px-5 md:px-6 py-5">
                  {detail.answerMarkdown ? (
                    <HistoryBriefing
                      content={detail.answerMarkdown}
                      payload={detail.payload}
                      currency={currency}
                    />
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

// Lightweight Decision Briefing renderer scoped to the History viewer.
// Mirrors the structure of ConsultationClient's ResponseBriefing so
// past consultations read the same way fresh ones do.
function HistoryBriefing({
  content,
  payload,
  currency,
}: {
  content: string;
  payload: string | null;
  currency: string;
}) {
  const briefing = buildDecisionBriefing(content, payload, currency);
  const hasReasoning = briefing.reasoning.trim().length > 0;
  const hasAnchors = briefing.anchors.length > 0;
  const hasPaths = briefing.paths.length > 0;
  const hasRisks = briefing.risks.length > 0;
  return (
    <div className="space-y-5">
      {briefing.takeaway ? (
        <div className="rounded-xl border border-accent/40 bg-accent-soft/15 p-4 md:p-5">
          <div className="text-[10px] uppercase tracking-wide text-accent font-semibold mb-1">
            Executive Takeaway
          </div>
          <div className="text-base md:text-lg font-semibold text-slate-100 leading-snug">
            {briefing.takeaway.headline}
          </div>
          {briefing.takeaway.subhead ? (
            <div className="text-sm text-slate-300 mt-1.5 leading-relaxed">
              {briefing.takeaway.subhead}
            </div>
          ) : null}
        </div>
      ) : null}

      {hasReasoning || hasAnchors ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8">
          {hasReasoning ? (
            <div className={hasAnchors ? "lg:col-span-8" : "lg:col-span-12"}>
              <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">
                AI Reasoning
              </div>
              <div className="space-y-1.5 text-sm text-slate-200">
                {renderMarkdown(briefing.reasoning)}
              </div>
            </div>
          ) : null}
          {hasAnchors ? (
            <aside className={`lg:col-span-4 ${hasReasoning ? "lg:border-l lg:border-line/60 lg:pl-6" : ""}`}>
              <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">
                Decision Anchors
              </div>
              <ul className="divide-y divide-line/40">
                {briefing.anchors.map((a, i) => (
                  <li key={i} className="py-2.5 flex items-start justify-between gap-3">
                    <span className="text-xs text-slate-400 shrink-0">{a.label}</span>
                    <span
                      className={`text-sm font-medium text-right ${
                        a.tone === "good" ? "text-good" :
                        a.tone === "warn" ? "text-warn" :
                        a.tone === "bad"  ? "text-bad"  :
                                            "text-slate-100"
                      }`}
                    >
                      {a.value}
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      ) : null}

      {hasPaths ? (
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-3">
            Strategic Paths
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {briefing.paths.map((p, i) => (
              <div
                key={i}
                className={`rounded-lg border p-4 flex flex-col gap-2 ${
                  p.tier === "primary"     ? "border-accent/40 bg-accent-soft/10" :
                  p.tier === "high_impact" ? "border-warn/40 bg-warn/5"            :
                                             "border-line bg-ink-900/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-medium text-sm text-slate-100">{p.option.title}</div>
                  <div className="pill-good">{formatMoney(p.option.monthlySavings, currency)}/mo</div>
                </div>
                <div className="text-xs text-slate-400">
                  {formatMoney(p.option.annualSavings, currency)} per year · covers {Math.round(p.coveragePct * 100)}% over {p.horizonMonths}mo
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {hasRisks ? (
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">
            Risks &amp; Tradeoffs
          </div>
          <ul className="space-y-2">
            {briefing.risks.map((r, i) => (
              <li
                key={i}
                className={`rounded-lg border px-3 py-2 ${
                  r.tone === "bad"  ? "border-bad/40 bg-bad/5"  :
                  r.tone === "warn" ? "border-warn/40 bg-warn/5" :
                                      "border-line bg-ink-900/30"
                }`}
              >
                <div className={`text-xs font-medium ${
                  r.tone === "bad"  ? "text-bad"  :
                  r.tone === "warn" ? "text-warn" :
                                      "text-slate-200"
                }`}>
                  {r.label}
                </div>
                <div className="text-xs text-slate-300 leading-relaxed mt-0.5">
                  {r.text}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency,
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}
