"use client";

import { useRef, useState } from "react";
import { Loader2, Check, Sparkles, ChevronDown } from "lucide-react";
import type { ContextSignal } from "@/lib/financialReview/types";
import { CONTEXT_SIGNALS, type ContextSignalKey } from "@/lib/financialReview/context";

// Business-context follow-ups for a completed review. The AI detected
// one or more patterns in the statements (deferred revenue, seasonality,
// inventory reliance, project-based revenue) and asks the owner a short,
// plain-English question for each.
//
// These gate the review: the analysis (passed as children) stays hidden
// until the owner answers and saves - then the questions collapse into a
// compact summary and we reveal + scroll to the report. Answers persist
// to the workspace's durable financial-analysis context and sharpen the
// multi-year Business Story. They are NEVER accounting-treatment
// questions - the audited statement is the source of truth.

function optionsFor(sig: ContextSignal): string[] {
  if (sig.options.length > 0) return sig.options;
  const def = CONTEXT_SIGNALS[sig.key as ContextSignalKey];
  return def ? def.options : [];
}
function questionFor(sig: ContextSignal): string {
  if (sig.question.trim()) return sig.question;
  const def = CONTEXT_SIGNALS[sig.key as ContextSignalKey];
  return def ? def.question : "";
}

export default function ContextQuestions({
  signals,
  initialAnswers,
  children,
}: {
  signals: ContextSignal[];
  initialAnswers: Record<string, string>;
  children: React.ReactNode;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const s of signals) {
      if (initialAnswers[s.key]) seed[s.key] = initialAnswers[s.key];
    }
    return seed;
  });

  // Already answered on a prior visit -> show the report straight away
  // with the questions collapsed.
  const answeredOnLoad = signals.length > 0 && signals.every((s) => initialAnswers[s.key]);

  const [savedSnapshot, setSavedSnapshot] = useState<Record<string, string>>(answers);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportVisible, setReportVisible] = useState(answeredOnLoad);
  const [editing, setEditing] = useState(!answeredOnLoad);

  const reportRef = useRef<HTMLDivElement>(null);

  if (signals.length === 0) return <>{children}</>;

  const dirty = signals.some((s) => answers[s.key] && answers[s.key] !== savedSnapshot[s.key]);
  const answeredCount = signals.filter((s) => answers[s.key]).length;
  const savedCount = signals.filter((s) => savedSnapshot[s.key]).length;

  function scrollToReport() {
    // Wait a frame so the report is in the DOM before scrolling.
    requestAnimationFrame(() => {
      reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function choose(key: string, option: string) {
    setAnswers((prev) => ({ ...prev, [key]: option }));
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      // Only POST when something changed; otherwise just reveal.
      if (dirty) {
        const res = await fetch("/api/financial-review/context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d?.error || "Could not save your answers.");
        }
        setSavedSnapshot(answers);
      }
      setEditing(false);
      setReportVisible(true);
      scrollToReport();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your answers.");
    } finally {
      setBusy(false);
    }
  }

  function skip() {
    setEditing(false);
    setReportVisible(true);
    scrollToReport();
  }

  return (
    <div className="space-y-6">
      {editing ? (
        // ── Expanded questions ──
        <section className="card border-accent/30 bg-accent-soft/10">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            <h2 className="t-card">A few quick questions to sharpen your analysis</h2>
          </div>
          <p className="t-meta mb-4 text-slate-400">
            Tweaxly noticed a few patterns in your statements. These are business questions, not accounting ones - your answers improve the multi-year Business Story and stay saved for future analyses.
          </p>

          <div className="space-y-5">
            {signals.map((sig) => {
              const opts = optionsFor(sig);
              return (
                <div key={sig.key}>
                  <div className="t-body font-semibold text-slate-100">{questionFor(sig)}</div>
                  {sig.observation ? (
                    <p className="t-meta mt-1 text-slate-400">{sig.observation}</p>
                  ) : null}
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {opts.map((opt) => {
                      const selected = answers[sig.key] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => choose(sig.key, opt)}
                          className={`rounded-full border px-3 py-1.5 text-sm transition ${
                            selected
                              ? "border-accent bg-accent text-white"
                              : "border-line bg-ink-800/60 text-slate-200 hover:border-accent/60"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}

          <div className="mt-5 flex items-center justify-between gap-3">
            <span className="t-meta text-slate-500">{answeredCount}/{signals.length} answered</span>
            <div className="flex items-center gap-2">
              {!reportVisible ? (
                <button type="button" onClick={skip} className="btn-ghost text-sm" disabled={busy}>
                  Skip for now
                </button>
              ) : null}
              <button
                type="button"
                className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busy || answeredCount === 0}
                onClick={save}
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {busy ? "Saving" : "Save & view analysis"}
              </button>
            </div>
          </div>
        </section>
      ) : (
        // ── Collapsed summary ──
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex w-full items-center justify-between gap-3 rounded-md border border-line bg-ink-800/60 px-4 py-3 text-left transition hover:border-accent/50"
        >
          <span className="flex items-center gap-2">
            <Sparkles size={15} className="text-accent" />
            <span className="t-meta text-slate-300">
              {savedCount > 0
                ? `Business context saved · ${savedCount}/${signals.length} answered`
                : "Answer a few quick questions to sharpen your analysis"}
            </span>
          </span>
          <span className="t-meta inline-flex items-center gap-1 text-accent">
            {savedCount > 0 ? "Edit" : "Answer"} <ChevronDown size={14} />
          </span>
        </button>
      )}

      {reportVisible ? <div ref={reportRef}>{children}</div> : null}
    </div>
  );
}
