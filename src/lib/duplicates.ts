// Cross-source duplicate detection.
// Heuristic: same |amount| within $0.50 AND date within ±3 days AND different sources.
// Plus stricter "transfer pair" check: opposite-sign same-amount in same business.
import type { Transaction } from "@prisma/client";

export type DupCandidate = {
  reason: string;
  txnIds: string[];
};

export function findDuplicateCandidates(txns: Transaction[]): DupCandidate[] {
  const groups: DupCandidate[] = [];
  const used = new Set<string>();

  // Group A: same absolute amount across different sources within ±3 days.
  // We bucket by rounded |amount|.
  const byAmount = new Map<string, Transaction[]>();
  for (const t of txns) {
    const key = Math.round(Math.abs(t.amount) * 100).toString();
    if (!byAmount.has(key)) byAmount.set(key, []);
    byAmount.get(key)!.push(t);
  }

  for (const bucket of byAmount.values()) {
    if (bucket.length < 2) continue;
    for (let i = 0; i < bucket.length; i++) {
      const a = bucket[i];
      if (used.has(a.id)) continue;
      const matches: Transaction[] = [a];
      for (let j = i + 1; j < bucket.length; j++) {
        const b = bucket[j];
        if (used.has(b.id)) continue;
        const daysDiff = Math.abs(a.transactionDate.getTime() - b.transactionDate.getTime()) / 86400000;
        if (daysDiff > 3) continue;
        if (a.source === b.source && a.externalId && a.externalId === b.externalId) {
          matches.push(b);
          continue;
        }
        if (a.source !== b.source && Math.sign(a.amount) === Math.sign(b.amount)) {
          matches.push(b);
        }
      }
      if (matches.length >= 2) {
        for (const m of matches) used.add(m.id);
        const sources = Array.from(new Set(matches.map((m) => m.source))).join(" + ");
        groups.push({
          reason: `Same amount across ${sources}, dates within 3 days`,
          txnIds: matches.map((m) => m.id),
        });
      }
    }
  }

  // Group B: transfer pair (same business, equal & opposite amounts within ±2 days).
  for (let i = 0; i < txns.length; i++) {
    const a = txns[i];
    if (used.has(a.id)) continue;
    if (a.type !== "transfer" && Math.abs(a.amount) < 50) continue;
    for (let j = i + 1; j < txns.length; j++) {
      const b = txns[j];
      if (used.has(b.id)) continue;
      const sameAbs = Math.abs(Math.abs(a.amount) - Math.abs(b.amount)) < 0.51;
      const opposite = Math.sign(a.amount) !== Math.sign(b.amount);
      const days = Math.abs(a.transactionDate.getTime() - b.transactionDate.getTime()) / 86400000;
      if (sameAbs && opposite && days <= 2 && a.source !== b.source) {
        groups.push({ reason: "Likely internal transfer pair", txnIds: [a.id, b.id] });
        used.add(a.id); used.add(b.id);
        break;
      }
    }
  }

  return groups;
}
