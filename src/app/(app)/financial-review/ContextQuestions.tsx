"use client";

import { useState } from "react";
import { Loader2, Check, Sparkles } from "lucide-react";
import type { ContextSignal } from "@/lib/financialReview/types";
import { CONTEXT_SIGNALS, type ContextSignalKey } from "@/lib/financialReview/context";

// Business-context follow-ups for a completed review. The AI detected
// one or more patterns in the statements (deferred revenue, seasonality,
// inventory reliance, project-based revenue) and asks the owner a short,
// plain-English question for each. Answers persist to the workspace's
// durable financial-analysis context and sharpen the Business Story.
//
// These are NEVER accounting-treatment questions - the audited statement
// is the source of truth; we only collect business context.

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
}: {
  signals: ContextSignal[];
  initialAnswers: Record<string, string>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const s of signals) {
      if (initialAnswers[s.key]) seed[s.key] = initialAnswers[s.key];
    }
    return seed;
  });
  const [savedSnapshot, setSavedSnapshot] = useState<Record<string, string>>(answers);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (signals.length === 0) return null;

  const dirty = signals.some((s) => answers[s.key] && answers[s.key] !== savedSnapshot[s.key]);
  const answeredCount = signals.filter((s) => answers[s.key]).length;

  function choose(key: string, option: string) {
    setSavedAt(false);
    setAnswers((prev) => ({ ...prev, [key]: option }));
  }

  async function save() {
    if (busy || !dirty) return;
    setBusy(true);
    setError(null);
    try {
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
      setSavedAt(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your answers.");
    } finally {
      setBusy(false);
    }
  }

  return (
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
        <span className="t-meta text-slate-500">
          {answeredCount}/{signals.length} answered
        </span>
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy || !dirty}
          onClick={save}
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : savedAt ? <Check size={15} /> : null}
          {busy ? "Saving" : savedAt && !dirty ? "Saved" : "Save context"}
        </button>
      </div>
    </section>
  );
}
