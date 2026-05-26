"use client";

// Vendorization rules editor - mirror of RulesClient but the target
// is a vendor name instead of a category id. Patterns match against
// description / vendor / source; on upload, matching rows have their
// Transaction.vendor rewritten to the rule's vendorName.

import { useState } from "react";

type Rule = {
  id:         string;
  matchField: string;
  matchType:  string;
  pattern:    string;
  vendorName: string;
  priority:   number;
};

export default function VendorizationRulesClient({
  rules: initial,
  vendors,
}: {
  rules:    Rule[];
  vendors:  { id: string; name: string }[];
}) {
  const [rules, setRules] = useState<Rule[]>(initial);
  const [draft, setDraft] = useState<Partial<Rule>>({
    matchField: "description",
    matchType:  "contains",
    pattern:    "",
    vendorName: vendors[0]?.name ?? "",
    priority:   0,
  });

  async function add() {
    const vendorName = (draft.vendorName ?? "").trim();
    const pattern    = (draft.pattern ?? "").trim();
    if (!pattern || !vendorName) return;
    const res = await fetch("/api/vendorization-rules", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...draft, pattern, vendorName }),
    });
    if (!res.ok) { alert(await res.text()); return; }
    const created = await res.json();
    setRules([created, ...rules]);
    setDraft({ ...draft, pattern: "" });
  }

  async function remove(id: string) {
    if (!confirm("Delete this rule?")) return;
    const res = await fetch(`/api/vendorization-rules?id=${id}`, { method: "DELETE" });
    if (!res.ok) { alert(await res.text()); return; }
    setRules(rules.filter((r) => r.id !== id));
  }

  return (
    <>
      <div className="card mb-4">
        <div className="font-medium mb-3">Add vendorization rule</div>
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
            <input className="input" value={draft.pattern ?? ""} onChange={(e) => setDraft({ ...draft, pattern: e.target.value })} placeholder="e.g. GOOGLE *ADS" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Vendor (type or pick)</label>
            <input
              className="input"
              list="vendorization-vendor-options"
              value={draft.vendorName ?? ""}
              onChange={(e) => setDraft({ ...draft, vendorName: e.target.value })}
              placeholder="e.g. Google Ads"
            />
            <datalist id="vendorization-vendor-options">
              {vendors.map((v) => <option key={v.id} value={v.name} />)}
            </datalist>
          </div>
          <div className="md:col-span-1">
            <label className="label">Priority</label>
            <input className="input" type="number" value={draft.priority ?? 0} onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) })} />
          </div>
          <div className="md:col-span-7 flex items-center justify-end">
            <button className="btn-primary" onClick={add}>Add rule</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="font-medium mb-3">Existing vendorization rules</div>
        {rules.length === 0 ? (
          <div className="text-sm text-slate-400 py-6 text-center">
            No vendorization rules yet - bulk-vendor on the Transactions page also works.
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr><th>Pri</th><th>Field</th><th>Match</th><th>Pattern</th><th>→ Vendor</th><th></th></tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id}>
                  <td className="text-slate-300">{r.priority}</td>
                  <td>{r.matchField}</td>
                  <td>{r.matchType}</td>
                  <td className="font-mono text-xs">{r.pattern}</td>
                  <td className="text-slate-200">{r.vendorName}</td>
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
