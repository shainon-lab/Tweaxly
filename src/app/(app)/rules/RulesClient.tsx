"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Rule = {
  id: string;
  matchField: string;
  matchType: string;
  pattern: string;
  categoryId: string;
  priority: number;
  setRecurring: boolean;
  setOneTime: boolean;
};

export default function RulesClient({
  rules: initial,
  categories,
}: { rules: Rule[]; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rules, setRules] = useState<Rule[]>(initial);
  const [draft, setDraft] = useState<Partial<Rule>>({
    matchField: "description",
    matchType: "contains",
    pattern: "",
    categoryId: categories[0]?.id ?? "",
    priority: 0,
    setRecurring: false,
    setOneTime: false,
  });
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);

  async function add() {
    if (!draft.pattern || !draft.categoryId) return;
    const res = await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!res.ok) { alert(await res.text()); return; }
    const created = await res.json();
    setRules([created, ...rules]);
    setDraft({ ...draft, pattern: "" });
  }

  async function remove(id: string) {
    if (!confirm("Delete this rule?")) return;
    const res = await fetch(`/api/rules?id=${id}`, { method: "DELETE" });
    if (!res.ok) { alert(await res.text()); return; }
    setRules(rules.filter((r) => r.id !== id));
  }

  async function applyAll() {
    setApplying(true);
    setApplyResult(null);
    const res = await fetch("/api/rules/apply", { method: "POST" });
    setApplying(false);
    if (!res.ok) { setApplyResult(await res.text()); return; }
    const data = await res.json();
    setApplyResult(`Updated ${data.updated} transactions.`);
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="card mb-4">
        <div className="font-medium mb-3">Add rule</div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
          <div className="md:col-span-1">
            <label className="label">Field</label>
            <select className="input" value={draft.matchField} onChange={(e) => setDraft({ ...draft, matchField: e.target.value })}>
              <option value="description">description</option>
              <option value="vendor">vendor</option>
              <option value="source">source</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="label">Match</label>
            <select className="input" value={draft.matchType} onChange={(e) => setDraft({ ...draft, matchType: e.target.value })}>
              <option value="contains">contains</option>
              <option value="equals">equals</option>
              <option value="startsWith">startsWith</option>
              <option value="regex">regex</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Pattern</label>
            <input className="input" value={draft.pattern ?? ""} onChange={(e) => setDraft({ ...draft, pattern: e.target.value })} placeholder="e.g. STRIPE PAYOUT" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Category</label>
            <select className="input" value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="label">Priority</label>
            <input className="input" type="number" value={draft.priority ?? 0} onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) })} />
          </div>
          <div className="md:col-span-7 flex items-center gap-3">
            <label className="text-sm text-slate-300 flex items-center gap-2">
              <input type="checkbox" checked={!!draft.setRecurring} onChange={(e) => setDraft({ ...draft, setRecurring: e.target.checked })} />
              also mark recurring
            </label>
            <label className="text-sm text-slate-300 flex items-center gap-2">
              <input type="checkbox" checked={!!draft.setOneTime} onChange={(e) => setDraft({ ...draft, setOneTime: e.target.checked })} />
              also mark one-time
            </label>
            <div className="flex-1" />
            <button className="btn-primary" onClick={add}>Add rule</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium">Existing rules</div>
          <div className="flex items-center gap-3">
            {applyResult ? <div className="text-xs text-slate-300">{applyResult}</div> : null}
            <button className="btn-ghost" disabled={applying || pending} onClick={applyAll}>
              {applying ? "Applying…" : "Re-apply rules to all transactions"}
            </button>
          </div>
        </div>
        {rules.length === 0 ? (
          <div className="text-sm text-slate-400 py-6 text-center">No rules yet — bulk-categorizing on the Transactions page is also fine.</div>
        ) : (
          <table className="table-base">
            <thead>
              <tr><th>Pri</th><th>Field</th><th>Match</th><th>Pattern</th><th>Category</th><th>Flags</th><th></th></tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id}>
                  <td className="text-slate-300">{r.priority}</td>
                  <td>{r.matchField}</td>
                  <td>{r.matchType}</td>
                  <td className="font-mono text-xs">{r.pattern}</td>
                  <td>{categories.find((c) => c.id === r.categoryId)?.name ?? "—"}</td>
                  <td className="space-x-1">
                    {r.setRecurring ? <span className="pill-accent">recurring</span> : null}
                    {r.setOneTime ? <span className="pill-warn">one-time</span> : null}
                  </td>
                  <td className="text-right"><button className="btn-danger" onClick={() => remove(r.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
