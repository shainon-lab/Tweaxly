"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Rule = {
  id: string;
  metric: string;
  categoryId: string | null;
  categoryName: string | null;
  direction: string;
  thresholdType: string;
  thresholdValue: number;
  period: string;
  label: string | null;
  enabled: boolean;
  createdAt: string; // ISO timestamp
};

function fmtTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

type Category = { id: string; name: string; kind: string };

const METRIC_OPTIONS = [
  { value: "revenue",  label: "Revenue (total income)" },
  { value: "expenses", label: "Expenses (total outcome)" },
  { value: "net",      label: "Net profit (income − expenses)" },
  { value: "category", label: "A specific category…" },
];

const PERIOD_OPTIONS = [
  { value: "month", label: "month" },
  { value: "quarter", label: "quarter" },
  { value: "year", label: "year" },
];

const DIRECTION_OPTIONS = [
  { value: "increase", label: "increases by more than" },
  { value: "decrease", label: "decreases by more than" },
];

export default function NotificationsClient({
  currency,
  initialRules,
  categories,
}: { currency: string; initialRules: Rule[]; categories: Category[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    metric: "revenue" as string,
    categoryId: categories[0]?.id ?? "",
    direction: "increase" as string,
    thresholdType: "percent" as string,
    thresholdValue: 10,
    period: "month" as string,
    label: "",
  });
  // Tracks whether the user has manually edited the label. While false, the
  // label auto-syncs to the suggestion derived from the rule's other fields.
  const [labelTouched, setLabelTouched] = useState(false);

  const fmtMoney = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [currency]
  );

  const suggestedLabel = useMemo(() => {
    const subject =
      draft.metric === "revenue"   ? "Revenue" :
      draft.metric === "expenses"  ? "Expenses" :
      draft.metric === "net"       ? "Net profit" :
      categories.find((c) => c.id === draft.categoryId)?.name ?? "Category";
    const verb = draft.direction === "increase" ? "up" : "down";
    const amount = draft.thresholdType === "percent"
      ? `${draft.thresholdValue}%`
      : fmtMoney.format(draft.thresholdValue || 0);
    const periodAbbr =
      draft.period === "month"   ? "MoM" :
      draft.period === "quarter" ? "QoQ" :
                                   "YoY";
    return `${subject} ${verb} ≥ ${amount} ${periodAbbr}`;
  }, [
    draft.metric, draft.categoryId, draft.direction,
    draft.thresholdType, draft.thresholdValue, draft.period,
    categories, fmtMoney,
  ]);

  // Auto-fill the label as the user adjusts other inputs, until they edit
  // the label themselves. After that, leave it alone.
  useEffect(() => {
    if (labelTouched) return;
    setDraft((d) => (d.label === suggestedLabel ? d : { ...d, label: suggestedLabel }));
  }, [suggestedLabel, labelTouched]);

  function describe(r: Rule): string {
    const subject =
      r.metric === "revenue"   ? "Revenue" :
      r.metric === "expenses"  ? "Expenses" :
      r.metric === "net"       ? "Net profit" :
      r.categoryName ?? "Category";
    const dir = r.direction === "increase" ? "increases by more than" : "decreases by more than";
    const amount =
      r.thresholdType === "percent"
        ? `${r.thresholdValue}%`
        : fmtMoney.format(r.thresholdValue);
    return `${subject} ${dir} ${amount} compared to the previous ${r.period}`;
  }

  async function add() {
    setError(null);
    if (draft.metric === "category" && !draft.categoryId) {
      setError("Pick a category, or change the metric to revenue / expenses / net.");
      return;
    }
    if (!draft.thresholdValue || draft.thresholdValue <= 0) {
      setError("Threshold must be a positive number.");
      return;
    }
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metric: draft.metric,
        categoryId: draft.metric === "category" ? draft.categoryId : null,
        direction: draft.direction,
        thresholdType: draft.thresholdType,
        thresholdValue: Number(draft.thresholdValue),
        period: draft.period,
        label: draft.label || null,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      try { setError(JSON.parse(txt).error ?? txt); } catch { setError(txt); }
      return;
    }
    const created = await res.json();
    const cat = categories.find((c) => c.id === created.categoryId);
    setRules([
      {
        id: created.id,
        metric: created.metric,
        categoryId: created.categoryId,
        categoryName: cat?.name ?? null,
        direction: created.direction,
        thresholdType: created.thresholdType,
        thresholdValue: created.thresholdValue,
        period: created.period,
        label: created.label,
        enabled: created.enabled,
        createdAt: created.createdAt ?? new Date().toISOString(),
      },
      ...rules,
    ]);
    setDraft({ ...draft, label: "" });
    // Re-arm auto-suggestion so the next rule starts with a fresh recommended label.
    setLabelTouched(false);
    startTransition(() => router.refresh());
  }

  async function toggle(id: string, enabled: boolean) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled } : r)));
    startTransition(() => router.refresh());
  }

  async function remove(id: string) {
    if (!confirm("Delete this notification rule?")) return;
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    setRules(rules.filter((r) => r.id !== id));
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="card mb-6">
        <div className="font-medium mb-3">Add rule</div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-3">
            <label className="label">When</label>
            <select
              className="input"
              value={draft.metric}
              onChange={(e) => setDraft({ ...draft, metric: e.target.value })}
            >
              {METRIC_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          {draft.metric === "category" ? (
            <div className="md:col-span-3">
              <label className="label">Category</label>
              <select
                className="input"
                value={draft.categoryId}
                onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.kind})
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className={draft.metric === "category" ? "md:col-span-3" : "md:col-span-3"}>
            <label className="label">Trigger when it</label>
            <select
              className="input"
              value={draft.direction}
              onChange={(e) => setDraft({ ...draft, direction: e.target.value })}
            >
              {DIRECTION_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Amount</label>
            <input
              className="input"
              type="number"
              min={0}
              step={draft.thresholdType === "percent" ? 1 : 100}
              value={draft.thresholdValue}
              onChange={(e) => setDraft({ ...draft, thresholdValue: Number(e.target.value) })}
            />
          </div>
          <div className="md:col-span-1">
            <label className="label">As</label>
            <select
              className="input"
              value={draft.thresholdType}
              onChange={(e) => setDraft({ ...draft, thresholdType: e.target.value })}
            >
              <option value="percent">%</option>
              <option value="amount">{currency}</option>
            </select>
          </div>
          <div className={draft.metric === "category" ? "md:col-span-12" : "md:col-span-3"}>
            <label className="label">Compared to previous</label>
            <select
              className="input"
              value={draft.period}
              onChange={(e) => setDraft({ ...draft, period: e.target.value })}
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-9">
            <div className="flex items-center justify-between">
              <label className="label">Label</label>
              {labelTouched && draft.label !== suggestedLabel ? (
                <button
                  type="button"
                  className="text-[11px] text-accent hover:underline"
                  onClick={() => {
                    setLabelTouched(false);
                    setDraft({ ...draft, label: suggestedLabel });
                  }}
                  title="Replace your edit with the auto-suggested label"
                >
                  Use suggestion: {suggestedLabel}
                </button>
              ) : (
                <span className="text-[11px] text-slate-500">
                  Auto-suggested — edit if you want a different name
                </span>
              )}
            </div>
            <input
              className="input"
              value={draft.label}
              onChange={(e) => {
                setLabelTouched(true);
                setDraft({ ...draft, label: e.target.value });
              }}
              placeholder={suggestedLabel}
            />
          </div>
          <div className="md:col-span-3 flex md:justify-end">
            <button className="btn-primary w-full md:w-auto" disabled={pending} onClick={add}>
              Add notification
            </button>
          </div>
        </div>
        {error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}
      </div>

      <div className="card">
        <div className="font-medium mb-3">Your notifications</div>
        {rules.length === 0 ? (
          <div className="text-sm text-slate-400 py-6 text-center">
            No rules yet. Add one above — they&apos;ll fire on the dashboard whenever the threshold is crossed.
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Label</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id}>
                  <td className={r.enabled ? "" : "text-slate-500"}>
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.enabled ? (
                        <span className="pill-good">ENABLED</span>
                      ) : (
                        <span className="pill text-slate-400">DISABLED</span>
                      )}
                      <span>{describe(r)}</span>
                    </div>
                  </td>
                  <td className="text-slate-300">{r.label ?? ""}</td>
                  <td className="text-xs text-slate-400 whitespace-nowrap">
                    {fmtTimestamp(r.createdAt)}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        className={`btn ${r.enabled ? "btn-ghost" : "bg-good text-white"}`}
                        onClick={() => toggle(r.id, !r.enabled)}
                        title={r.enabled ? "Pause this rule (it won't fire alerts)" : "Re-enable this rule"}
                      >
                        {r.enabled ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-bad/40 text-red-300 hover:bg-red-500/10 transition"
                        onClick={() => remove(r.id)}
                        title="Delete this rule permanently"
                        aria-label="Delete rule"
                      >
                        {/* Trash icon */}
                        <svg
                          width="14" height="14" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
