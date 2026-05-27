"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import GuidedBankImport from "./GuidedBankImport";
import CurrencyPicker from "@/components/CurrencyPicker";
import { fmtMoney } from "@/lib/format";

// Per-currency formatter for the "original entered" amount shown in
// parens after the base-currency converted value.
function fmtOriginal(amount: number, currency: string): string {
  return fmtMoney(Math.abs(amount), currency);
}

type UploadMode = "bank" | "manual";

type Category = { id: string; name: string; kind: string };

type Entry = {
  id: string;
  type: string;
  // Amount the user typed, in their chosen currency.
  amount: number;
  currency: string;
  // Converted to the business base currency. Equal to `amount` for
  // same-currency entries; for non-base, taken from the latest
  // materialized occurrence's rate.
  convertedAmount: number;
  convertedCurrency: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
  categoryId: string;
  categoryName: string;
  categoryKind: string;
  materialized: number;
};

const FREQUENCY_OPTIONS = [
  { value: "one_time", label: "One-time" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const FREQUENCY_LABEL: Record<string, string> = {
  one_time: "One-time",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ManualDataClient({
  entries: initial,
  categories,
  currency,
}: {
  entries: Entry[];
  categories: Category[];
  currency: string;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState(initial);
  // `initial` only seeds local state on first mount, so router.refresh()
  // after Add Entry would otherwise leave the table stale. Re-sync
  // every time the server-rendered prop changes so the new row appears
  // without a full reload.
  useEffect(() => { setEntries(initial); }, [initial]);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bulk upload now has two flavors:
  //   "dated"   - each row carries its own date (bank export / template).
  //               System derives accountingMonth per row.
  //   "monthly" - one file per month, user picks the month for the whole
  //               file (legacy P&L summary style).
  // Default to "dated" since it matches what most people upload.
  const [uploadMode, setUploadMode] = useState<UploadMode>("bank");

  // Form state
  const [type, setType] = useState<"income" | "outcome">("outcome");
  const [categoryMode, setCategoryMode] = useState<"existing" | "new">("existing");
  const [categoryId, setCategoryId] = useState<string>("");
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  // Currency the user typed the amount in. Defaults to the business
  // base currency; if the user picks something else, the server
  // converts at the historical rate from the start date.
  const [entryCurrency, setEntryCurrency] = useState<string>(currency);
  // Default to one_time. This matches the most common use case - a
  // single historical or current expense/income - and avoids the
  // common UX trap where users picked monthly without an end date
  // and the system silently materialized many transactions through
  // the current month.
  const [frequency, setFrequency] = useState<string>("one_time");
  const [startDate, setStartDate] = useState<string>(todayISO());
  const [endDate, setEndDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [confirmDelete, setConfirmDelete] = useState<Entry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Manual entries are shown in a table - keep `.00` so columns align.
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // For the existing-category dropdown: filter to revenue-kind for income, exclude revenue for outcome
  const filteredCategories = categories.filter((c) => {
    if (type === "income") return c.kind === "revenue";
    return c.kind !== "revenue" && c.kind !== "transfer";
  });

  function resetForm() {
    setType("outcome");
    setCategoryMode("existing");
    setCategoryId("");
    setNewCategoryName("");
    setAmount("");
    setEntryCurrency(currency);
    setFrequency("one_time");
    setStartDate(todayISO());
    setEndDate("");
    setNotes("");
  }

  async function add() {
    setError(null);
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Amount must be a positive number");
      return;
    }
    if (categoryMode === "existing" && !categoryId) {
      setError("Pick a category or switch to 'New category'");
      return;
    }
    if (categoryMode === "new" && !newCategoryName.trim()) {
      setError("Enter a name for the new category");
      return;
    }
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        type,
        amount: amt,
        // Only send when it differs from base - keeps the wire format
        // backward-compatible with anything that ignores it.
        currency: entryCurrency.toUpperCase(),
        frequency,
        startDate,
        endDate: endDate || undefined,
        notes: notes.trim() || undefined,
      };
      if (categoryMode === "existing") body.categoryId = categoryId;
      else body.newCategoryName = newCategoryName.trim();

      const res = await fetch("/api/manual-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      const data = await res.json();
      void data;
      resetForm();
      startTransition(() => {
        router.refresh();
        // Defer the scroll until the next frame so the refreshed
        // table (with the new row prepended) is in the DOM before we
        // move the viewport.
        requestAnimationFrame(() => {
          document.getElementById("manual-entries-list")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function reallyDelete(entry: Entry) {
    setDeletingId(entry.id);
    try {
      const res = await fetch(`/api/manual-entries?id=${entry.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        alert(await res.text());
        return;
      }
      const data = await res.json();
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      setConfirmDelete(null);
      startTransition(() => router.refresh());
      alert(
        `Removed manual entry. Deleted ${data.deletedTransactions} materialized transaction${data.deletedTransactions === 1 ? "" : "s"}.`,
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      {/* ── Step 1: Choose upload type ────────────────────────────────
          Two cards, one-sentence descriptions. Replaces the old
          three-paragraph "Recommended workflow" + verbose mode-selector
          combo that pushed the actual action below the fold. */}
      <section className="mb-5">
        <StepLabel index={1} title="Choose upload type" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <UploadTypeCard
            active={uploadMode === "bank"}
            badge="recommended"
            title="Statement Upload"
            description="Upload bank, credit card, PayPal, or Stripe exports."
            onClick={() => setUploadMode("bank")}
          />
          <UploadTypeCard
            active={uploadMode === "manual"}
            title="Manual Entry"
            description="Add a one-time transaction manually."
            onClick={() => setUploadMode("manual")}
          />
        </div>
      </section>

      {uploadMode === "bank" ? (
        <GuidedBankImport defaultCurrency={currency} />
      ) : null}

      {uploadMode === "manual" ? (
      <>
      <div className="card mb-6">
        <div className="font-medium mb-3">Add a single manual entry</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`btn flex-1 ${type === "outcome" ? "bg-bad text-white" : "btn-ghost"}`}
                onClick={() => {
                  setType("outcome");
                  setCategoryId("");
                }}
              >
                Outcome
              </button>
              <button
                type="button"
                className={`btn flex-1 ${type === "income" ? "bg-good text-white" : "btn-ghost"}`}
                onClick={() => {
                  setType("income");
                  setCategoryId("");
                }}
              >
                Income
              </button>
            </div>
          </div>
          <div>
            <label className="label">Frequency</label>
            <select
              className="input"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              {FREQUENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Amount</label>
            <div className="flex items-stretch gap-2">
              <input
                className="input flex-1 min-w-0"
                type="number"
                step="0.01"
                min={0}
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="w-28 shrink-0">
                <CurrencyPicker
                  value={entryCurrency}
                  onChange={setEntryCurrency}
                />
              </div>
            </div>
            {entryCurrency.toUpperCase() !== currency.toUpperCase() ? (
              <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                Converted to {currency} at the historical rate from the start date. The original {entryCurrency} amount is preserved on every transaction.
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="label">Category</label>
            <div className="flex items-center gap-2 mb-2 text-xs">
              <button
                type="button"
                className={`btn py-1 px-2 ${categoryMode === "existing" ? "bg-accent-soft text-accent" : "btn-ghost"}`}
                onClick={() => setCategoryMode("existing")}
              >
                Use existing
              </button>
              <button
                type="button"
                className={`btn py-1 px-2 ${categoryMode === "new" ? "bg-accent-soft text-accent" : "btn-ghost"}`}
                onClick={() => setCategoryMode("new")}
              >
                + New category
              </button>
            </div>
            {categoryMode === "existing" ? (
              <select
                className="input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">
                  - pick {type === "income" ? "an income" : "an outcome"} category -
                </option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.kind})
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="input"
                type="text"
                placeholder='e.g. "Office rental" or "Consulting income"'
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            )}
            {categoryMode === "existing" && filteredCategories.length === 0 ? (
              <div className="text-xs text-slate-400 mt-1">
                No existing {type} categories - switch to "New category" to add one.
              </div>
            ) : null}
          </div>
          <div>
            <label className="label">Start date</label>
            <input
              className="input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <div className="text-xs text-slate-400 mt-1">
              The first occurrence date.
            </div>
          </div>
        </div>

        {frequency !== "one_time" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="label">End date {endDate ? "" : "(optional)"}</label>
              <input
                className="input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <div className="text-xs text-slate-400 mt-1 leading-snug">
                {endDate ? (
                  <>One transaction will be created per occurrence from <strong>{startDate}</strong> to <strong>{endDate}</strong> (or today, whichever is earlier).</>
                ) : (
                  <>Without an end date, only the start-date occurrence is recorded. Add an end date to repeat through that date.</>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mb-4">
          <label className="label">Notes (optional)</label>
          <input
            className="input"
            type="text"
            placeholder='e.g. "Bought equipment with personal card, will reimburse"'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error ? (
          <div className="text-sm text-bad mb-3">{error}</div>
        ) : null}

        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={resetForm} disabled={busy}>
            Reset
          </button>
          <button className="btn-primary" onClick={add} disabled={busy || pending}>
            {busy ? "Adding…" : "Add entry"}
          </button>
        </div>
      </div>

      <div id="manual-entries-list" className="card overflow-x-auto scroll-mt-4">
        <div className="font-medium mb-3">Existing manual entries</div>
        {entries.length === 0 ? (
          <div className="text-sm text-slate-400 py-6 text-center">
            No manual entries yet. Add one above.
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Created</th>
                <th>Type</th>
                <th>Category</th>
                <th>Frequency</th>
                <th className="text-right">Amount</th>
                <th>Start</th>
                <th>End</th>
                <th className="text-right">Materialized</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="text-slate-300 whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={e.type === "income" ? "pill-good" : "pill-bad"}>
                      {e.type === "income" ? "Income" : "Outcome"}
                    </span>
                  </td>
                  <td className="font-medium">
                    {e.categoryName}
                    <div className="text-xs text-slate-400">{e.categoryKind}</div>
                  </td>
                  <td>
                    <span className="pill">{FREQUENCY_LABEL[e.frequency] ?? e.frequency}</span>
                  </td>
                  <td
                    className={`text-right font-medium whitespace-nowrap ${e.type === "income" ? "text-good" : "text-bad"}`}
                  >
                    {e.type === "income" ? "+" : "−"}
                    {fmt.format(e.convertedAmount)}
                    {e.currency !== e.convertedCurrency ? (
                      <span className="ml-1 text-xs text-slate-400 font-normal">
                        ({fmtOriginal(e.amount, e.currency)})
                      </span>
                    ) : null}
                  </td>
                  <td className="text-slate-300 whitespace-nowrap">
                    {e.startDate.slice(0, 10)}
                  </td>
                  <td className="text-slate-300 whitespace-nowrap">
                    {e.endDate ? e.endDate.slice(0, 10) : "-"}
                  </td>
                  <td className="text-right text-slate-300">{e.materialized}</td>
                  <td className="text-xs text-slate-400 max-w-[220px] truncate" title={e.notes ?? ""}>
                    {e.notes ?? "-"}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <button
                      className="btn-danger py-1"
                      disabled={deletingId === e.id || pending}
                      onClick={() => setConfirmDelete(e)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </>
      ) : null}

      {confirmDelete ? (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => (deletingId ? null : setConfirmDelete(null))}
        >
          <div
            className="card max-w-md w-full"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="text-base font-semibold mb-2">
              This action will delete data - are you sure you want to proceed?
            </div>
            <div className="text-sm text-slate-400 mb-4">
              Removing this manual entry will permanently delete:
            </div>
            <ul className="text-sm text-slate-300 space-y-1 mb-4 border-l-2 border-bad/40 pl-3">
              <li>
                <span className="text-slate-400">Category:</span>{" "}
                <span className="font-medium">{confirmDelete.categoryName}</span>
              </li>
              <li>
                <span className="text-slate-400">Type:</span>{" "}
                {confirmDelete.type === "income" ? "Income" : "Outcome"}
              </li>
              <li>
                <span className="text-slate-400">Frequency:</span>{" "}
                {FREQUENCY_LABEL[confirmDelete.frequency] ?? confirmDelete.frequency}
              </li>
              <li>
                <span className="text-slate-400">Amount:</span>{" "}
                {confirmDelete.type === "income" ? "+" : "−"}{fmt.format(confirmDelete.convertedAmount)}
                {confirmDelete.currency !== confirmDelete.convertedCurrency ? (
                  <span className="ml-1 text-xs text-slate-400">
                    ({fmtOriginal(confirmDelete.amount, confirmDelete.currency)})
                  </span>
                ) : null}
              </li>
              <li>
                <span className="text-slate-400">Will delete:</span>{" "}
                <span className="text-bad font-medium">
                  {confirmDelete.materialized} materialized transaction
                  {confirmDelete.materialized === 1 ? "" : "s"}
                </span>
              </li>
            </ul>
            <div className="flex gap-2 justify-end">
              <button
                className="btn-ghost"
                disabled={deletingId === confirmDelete.id}
                onClick={() => setConfirmDelete(null)}
              >
                No - keep the data
              </button>
              <button
                className="btn-danger"
                disabled={deletingId === confirmDelete.id}
                onClick={() => reallyDelete(confirmDelete)}
              >
                {deletingId === confirmDelete.id ? "Removing…" : "Yes - remove"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Lightweight AI helper ─────────────────────────────────────
          Sits below the action area, conversational tone. Replaces the
          old documentation-heavy "Recommended workflow" block at the
          top - same useful guidance, but the user sees it AFTER the
          primary action is visible, not before. */}
      <section className="mt-6">
        <div className="rounded-2xl border border-brand-purple/25 bg-gradient-to-br from-brand-purple/10 via-ink-900/40 to-accent/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="text-xl leading-none mt-0.5" aria-hidden="true">👋</div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-100">First time importing?</div>
              <div className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                For the best insights, start with:
              </div>
              <ul className="mt-1 text-xs text-slate-300 leading-relaxed space-y-0.5">
                <li>• Bank statements</li>
                <li>• Credit card exports</li>
                <li>• PayPal activity</li>
              </ul>
              <div className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                Historical uploads improve forecasting accuracy.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Collapsed: How does data import work? ────────────────────
          All the long-form workflow explanation lives here, hidden by
          default so first-time users aren't forced to read it before
          uploading. Curious users can expand for the deep version. */}
      <section className="mt-3">
        <details className="group rounded-xl border border-line bg-ink-900/30">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-200 flex items-center justify-between">
            <span>How does data import work?</span>
            <span className="text-slate-500 text-xs transition group-open:rotate-180">⌄</span>
          </summary>
          <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed space-y-3">
            <p>
              <span className="font-medium text-slate-100">Historical first.</span>{" "}
              On your first run, upload a date range from every source you track (bank,
              credit card, PayPal, etc.) so we have a complete baseline for forecasts
              and signals.
            </p>
            <p>
              <span className="font-medium text-slate-100">Monthly cadence.</span>{" "}
              After that, upload last month's statement from each source. The
              coverage matrix and missing-month alerts remind you what's needed.
            </p>
            <p>
              <span className="font-medium text-slate-100">CSV template.</span>{" "}
              Inside Statement Upload you can optionally download the Tweaxly CSV
              template to pre-format a file. This skips the column-mapping step.
            </p>
            <p>
              <span className="font-medium text-slate-100">Manual entry</span>{" "}
              is for one-offs that won't appear in any export - a personal-card
              business purchase, a gift, or an invoice settled outside the books.
            </p>
          </div>
        </details>
      </section>
    </>
  );
}

// ─── Step header ────────────────────────────────────────────────────
// Small uniform label so each step in the upload flow reads with the
// same visual weight. Used by ManualDataClient AND GuidedBankImport so
// the four step boundaries (Type → Source → Coverage → Upload) look
// like one cohesive sequence even though they live in two files.
function StepLabel({ index, title }: { index: number; title: string }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent/20 text-accent text-[10px] font-semibold px-1.5">
        {index}
      </span>
      <span className="text-sm font-semibold text-slate-100 tracking-tight">{title}</span>
    </div>
  );
}

// ─── Upload-type card ──────────────────────────────────────────────
function UploadTypeCard({
  active, badge, title, description, onClick,
}: {
  active:       boolean;
  badge?:       string;
  title:        string;
  description:  string;
  onClick:      () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition ${
        active
          ? "border-accent bg-accent-soft/30"
          : "border-line bg-ink-900/30 hover:border-accent/40"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        {badge ? (
          <span className={active ? "pill-accent" : "pill text-[10px]"}>
            {active ? "selected" : badge}
          </span>
        ) : active ? (
          <span className="pill-accent">selected</span>
        ) : null}
        <span className="font-medium text-slate-100">{title}</span>
      </div>
      <div className="text-xs text-slate-400 leading-relaxed">{description}</div>
    </button>
  );
}
