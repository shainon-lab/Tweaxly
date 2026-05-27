"use client";

// Phase 1 of the Financial Data Pipeline. Wraps BankImportWizard with a
// two-step intake:
//
//   1. Pick a source (or "+ Add source" - links to /sources)
//   2. Specific month OR historical range
//
// Then runs an overlap check against existing active UploadBatches for
// the same (source, period). If overlap exists, the user gets a
// "Replace existing data?" warning before entering the wizard; the
// replace targets are passed through to /api/upload/commit so the
// stale rows are wiped in the same DB transaction the new batch is
// created in.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import BankImportWizard, { type WizardContext } from "./BankImportWizard";

type Source = {
  id: string; name: string; type: string; currency: string; last4: string | null; startMonth: string;
};
type OverlapBatch = {
  id: string; filename: string; periodStart: string | null; periodEnd: string | null;
  transactionCount: number; overlappingMonths: string[]; createdAt: string;
};

type Intake = {
  source: Source | null;
  periodKind: "month" | "range";
  periodStart: string;  // YYYY-MM
  periodEnd:   string;  // YYYY-MM (= periodStart for month kind)
};

type Phase = "intake" | "overlap" | "wizard";

export default function GuidedBankImport({ defaultCurrency }: { defaultCurrency: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Deep-link params consumed on first render after the source list
  // loads, then stripped from the URL so a manual refresh doesn't
  // keep re-applying them.
  //   ?source=<id>  - set by SourcesClient on return from create-source,
  //                   and by the missing-data checklist chips
  //   ?month=YYYY-MM - set by the missing-data checklist chips so the
  //                    period is pre-filled to the missing month
  const pendingSourceId = searchParams.get("source");
  const pendingMonth    = searchParams.get("month");
  const pendingMonthValid = pendingMonth && /^\d{4}-\d{2}$/.test(pendingMonth) ? pendingMonth : null;

  const [sources,  setSources]  = useState<Source[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);

  const [intake, setIntake] = useState<Intake>({
    source: null,
    periodKind: "month",
    periodStart: defaultMonth(),
    periodEnd:   defaultMonth(),
  });

  const [phase,    setPhase]    = useState<Phase>("intake");
  const [checking, setChecking] = useState(false);
  const [overlap,  setOverlap]  = useState<OverlapBatch[]>([]);
  const [replaceBatchIds, setReplaceBatchIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/financial-sources");
        const d = await r.json();
        if (!cancelled) setSources(d.sources ?? []);
      } finally {
        if (!cancelled) setLoadingSources(false);
      }
    })();
    return () => { cancelled = true };
  }, []);

  // Once sources have loaded, pre-select the one the user just created
  // (return-from-Manual-Sources flow) or clicked on the missing-data
  // checklist. If ?month=YYYY-MM is also present we set the period
  // to that single month. Then clear the query so this doesn't fire
  // again on a manual refresh.
  useEffect(() => {
    if (loadingSources) return;
    if (!pendingSourceId && !pendingMonthValid) return;
    setIntake((prev) => {
      const next = { ...prev };
      if (pendingSourceId) {
        const match = sources.find((s) => s.id === pendingSourceId);
        if (match) next.source = match;
      }
      if (pendingMonthValid) {
        next.periodKind  = "month";
        next.periodStart = pendingMonthValid;
        next.periodEnd   = pendingMonthValid;
      }
      return next;
    });
    router.replace("/manual-data");
  }, [pendingSourceId, pendingMonthValid, loadingSources, sources, router]);

  const context: WizardContext | null = useMemo(() => {
    if (phase !== "wizard" || !intake.source) return null;
    return {
      sourceId:        intake.source.id,
      sourceName:      intake.source.name,
      sourceCurrency:  intake.source.currency,
      periodStart:     intake.periodStart,
      periodEnd:       intake.periodKind === "month" ? intake.periodStart : intake.periodEnd,
      replaceBatchIds,
    };
  }, [phase, intake, replaceBatchIds]);

  async function continueFromIntake() {
    if (!intake.source) return;
    const start = intake.periodStart;
    const end   = intake.periodKind === "month" ? intake.periodStart : intake.periodEnd;
    if (!start || !end || start > end) {
      alert("Pick a valid month or month range first.");
      return;
    }
    setChecking(true);
    try {
      const r = await fetch(`/api/financial-sources/${intake.source.id}/overlap?periodStart=${start}&periodEnd=${end}`);
      const d = await r.json();
      if (!r.ok) { alert(d.error ?? "Overlap check failed."); return; }
      if (d.hasOverlap && d.batches.length > 0) {
        setOverlap(d.batches);
        setPhase("overlap");
      } else {
        setReplaceBatchIds([]);
        setPhase("wizard");
      }
    } finally {
      setChecking(false);
    }
  }

  function resetGuided() {
    setPhase("intake");
    setOverlap([]);
    setReplaceBatchIds([]);
    // Keep source/period so the user can run another import for the
    // same source without re-picking everything.
  }

  return (
    <div>
      {/* Intake - always visible as a context header once a source/period
          is chosen, so the user can see what they're uploading INTO. */}
      {phase === "intake" || phase === "overlap" ? (
        <IntakeStep
          intake={intake}
          setIntake={setIntake}
          sources={sources}
          loadingSources={loadingSources}
          checking={checking}
          onContinue={continueFromIntake}
        />
      ) : (
        <ContextHeader
          context={context!}
          replacing={replaceBatchIds.length}
          onReset={resetGuided}
        />
      )}

      {phase === "overlap" && intake.source ? (
        <OverlapWarning
          source={intake.source}
          start={intake.periodStart}
          end={intake.periodKind === "month" ? intake.periodStart : intake.periodEnd}
          batches={overlap}
          onCancel={() => { setPhase("intake"); setOverlap([]); }}
          onReplace={() => {
            setReplaceBatchIds(overlap.map((b) => b.id));
            setPhase("wizard");
          }}
        />
      ) : null}

      {phase === "wizard" && context ? (
        <BankImportWizard
          defaultCurrency={context.sourceCurrency || defaultCurrency}
          context={context}
          onAfterDone={resetGuided}
        />
      ) : null}
    </div>
  );
}

// ─── Intake step ─────────────────────────────────────────────────────
// Slimmed-down two-question flow: pick the source, say what the file
// covers. No prose - the redesign's primary principle is "drop your
// file, we'll handle the rest" - so explanations move to the
// collapsible "How does data import work?" panel on ManualDataClient.
function IntakeStep({
  intake, setIntake, sources, loadingSources, checking, onContinue,
}: {
  intake: Intake;
  setIntake: (i: Intake) => void;
  sources: Source[];
  loadingSources: boolean;
  checking: boolean;
  onContinue: () => void;
}) {
  const router = useRouter();
  return (
    <>
      {/* ── Step 2: Select source ───────────────────────────────────── */}
      <section className="mb-5">
        <IntakeStepLabel index={2} title="Select source" />
        {loadingSources ? (
          <div className="text-xs text-slate-500 px-1">Loading sources…</div>
        ) : sources.length === 0 ? (
          <Link
            href="/sources?new=1&from=upload"
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent-soft/20 px-3 py-2 text-sm text-accent hover:bg-accent-soft/30 transition"
          >
            + Add Source
          </Link>
        ) : (
          <select
            className="input max-w-md"
            value={intake.source?.id ?? ""}
            onChange={(e) => {
              if (e.target.value === "__new__") {
                router.push("/sources?new=1&from=upload");
                return;
              }
              const s = sources.find((x) => x.id === e.target.value) ?? null;
              setIntake({ ...intake, source: s });
            }}
          >
            <option value="">Pick a source…</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.currency}{s.last4 ? ` ·${s.last4}` : ""})
              </option>
            ))}
            <option value="__new__">+ Add Source</option>
          </select>
        )}
      </section>

      {/* ── Step 3: What does this file include? ────────────────────── */}
      <section className="mb-5">
        <IntakeStepLabel index={3} title="What does this file include?" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <KindButton
            active={intake.periodKind === "month"}
            onClick={() => setIntake({ ...intake, periodKind: "month", periodEnd: intake.periodStart })}
            label="Single Month"
            hint="Typical monthly upload"
          />
          <KindButton
            active={intake.periodKind === "range"}
            onClick={() => setIntake({ ...intake, periodKind: "range" })}
            label="Historical Range"
            hint="Multi-month historical export"
          />
        </div>

        {/* Period inputs - inline, no verbose labels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mb-4">
          <div>
            <label className="label">{intake.periodKind === "month" ? "Month" : "From"}</label>
            <input
              type="month"
              className="input"
              value={intake.periodStart}
              onChange={(e) => {
                const v = e.target.value;
                setIntake({
                  ...intake,
                  periodStart: v,
                  periodEnd: intake.periodKind === "month" ? v : (intake.periodEnd < v ? v : intake.periodEnd),
                });
              }}
            />
          </div>
          {intake.periodKind === "range" ? (
            <div>
              <label className="label">To</label>
              <input
                type="month"
                className="input"
                value={intake.periodEnd}
                min={intake.periodStart}
                onChange={(e) => setIntake({ ...intake, periodEnd: e.target.value })}
              />
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onContinue}
            disabled={!intake.source || checking}
            className="btn-primary text-sm inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {checking ? (<><Loader2 size={14} className="animate-spin" /> Checking…</>) : (<>Continue <ArrowRight size={14} /></>)}
          </button>
        </div>
      </section>
    </>
  );
}

function IntakeStepLabel({ index, title }: { index: number; title: string }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent/20 text-accent text-[10px] font-semibold px-1.5">
        {index}
      </span>
      <span className="text-sm font-semibold text-slate-100 tracking-tight">{title}</span>
    </div>
  );
}

function KindButton({ active, onClick, label, hint }: { active: boolean; onClick: () => void; label: string; hint: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border p-3 transition ${
        active ? "border-accent bg-accent-soft/30" : "border-line bg-ink-900/30 hover:border-accent/40"
      }`}
    >
      <div className="text-sm font-medium text-slate-100">{label}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">{hint}</div>
    </button>
  );
}

// ─── Overlap warning ─────────────────────────────────────────────────
function OverlapWarning({
  source, start, end, batches, onCancel, onReplace,
}: {
  source: Source;
  start: string;
  end: string;
  batches: OverlapBatch[];
  onCancel: () => void;
  onReplace: () => void;
}) {
  const monthLabel = start === end ? fmtYm(start) : `${fmtYm(start)} – ${fmtYm(end)}`;
  return (
    <div className="card mb-6 border-warn/40 bg-warn/5">
      <div className="flex items-start gap-3 mb-3">
        <AlertTriangle size={18} className="text-warn shrink-0 mt-0.5" />
        <div>
          <div className="font-medium text-slate-100">Data already exists for this source and period</div>
          <div className="text-xs text-slate-300 mt-1">
            <span className="font-medium">{source.name}</span> already has imports covering some or all of <span className="font-medium">{monthLabel}</span>.
            You can replace the existing data (the old rows are deleted and the import history is preserved) or cancel and pick a different period.
          </div>
        </div>
      </div>
      <div className="rounded-md border border-line/60 bg-ink-900/40 mb-3 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="text-[10px] uppercase tracking-wider text-slate-500">
            <tr className="border-b border-line/60">
              <th className="text-left px-3 py-2">File</th>
              <th className="text-left px-3 py-2">Covers</th>
              <th className="text-left px-3 py-2">Imported</th>
              <th className="text-right px-3 py-2">Transactions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40">
            {batches.map((b) => (
              <tr key={b.id}>
                <td className="px-3 py-1.5 text-slate-200 truncate max-w-[280px]">{b.filename}</td>
                <td className="px-3 py-1.5 text-slate-400">{b.overlappingMonths.map(fmtYm).join(", ")}</td>
                <td className="px-3 py-1.5 text-slate-500">{new Date(b.createdAt).toLocaleDateString()}</td>
                <td className="px-3 py-1.5 text-slate-300 text-right">{b.transactionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost text-sm">Cancel</button>
        <button
          type="button"
          onClick={onReplace}
          className="text-sm font-medium px-3 py-1.5 rounded-md border border-bad/50 text-bad hover:bg-bad/10 transition inline-flex items-center gap-1.5"
        >
          <RefreshCw size={14} /> Replace existing data
        </button>
      </div>
    </div>
  );
}

// ─── Context header shown above the wizard once intake is done ───────
function ContextHeader({
  context, replacing, onReset,
}: {
  context: WizardContext;
  replacing: number;
  onReset: () => void;
}) {
  const periodLabel = context.periodStart === context.periodEnd
    ? fmtYm(context.periodStart)
    : `${fmtYm(context.periodStart)} – ${fmtYm(context.periodEnd)}`;
  return (
    <div className="card-tight mb-3 flex items-center gap-3 flex-wrap">
      <div className="text-xs text-slate-400">Uploading into:</div>
      <div className="text-sm font-medium text-slate-100">{context.sourceName}</div>
      <div className="text-xs text-slate-500">·</div>
      <div className="text-sm text-slate-200">{periodLabel}</div>
      <div className="text-xs text-slate-500">·</div>
      <div className="text-xs font-mono text-slate-400">{context.sourceCurrency}</div>
      {replacing > 0 ? (
        <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-bad/15 text-bad border border-bad/30">
          Replacing {replacing} previous import{replacing === 1 ? "" : "s"}
        </span>
      ) : null}
      <button type="button" onClick={onReset} className="ml-auto text-xs text-slate-500 hover:text-slate-200 underline">
        Change source / period
      </button>
    </div>
  );
}

function fmtYm(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function defaultMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
