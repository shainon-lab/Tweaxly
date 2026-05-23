// Credit-card / PayPal settlement detection.
//
// Problem: a business owner uploads their bank statement (showing
// "VISA PAYMENT -24,000") and separately uploads the detailed credit-
// card statement for the same month (showing 200 individual expenses
// totaling 24,000). Without intervention, both flows feed into P&L and
// the user is double-counted by 24,000.
//
// Solution: after every import that touches a bank-type source OR a
// credit-card/paypal source, run detectSettlements() over the recent
// window. For each bank-side candidate (negative txn whose description
// hints at a card payment OR matches another source's name/last4), find
// a credit-card or paypal source whose total spend for the same month
// matches the candidate's absolute amount within tolerance. When a
// match lands, the bank-side row is re-typed as a *settlement* and
// flagged isExcludedFromPnl so reports show the detailed card lines
// instead of the bank summary.
//
// The detection is workspace-scoped, idempotent (running twice produces
// the same result), and reversible — clearing the type back to "expense"
// + isExcludedFromPnl=false restores the bank row to P&L if the user
// rejects a match.

import { prisma } from "./db";

// 2% tolerance OR ≤ $1 absolute, whichever is larger. Catches FX rounding
// and conversion-fee differences between bank statement and card statement.
const TOLERANCE_RATIO = 0.02;
const TOLERANCE_ABS   = 1.0;

// Match the new batch and every batch in the last 90 days. Keeps the
// scan bounded; settlements rarely cross-reference data older than the
// last quarter.
const SCAN_WINDOW_DAYS = 90;

// Description keywords that hint a bank-side row is a card payment.
// Order matters for `firstMatch`-style logging only.
const CARD_HINTS = [
  /visa/i,
  /master\s*card/i,
  /mastercard/i,
  /amex/i,
  /american\s*express/i,
  /isracard/i,
  /diners/i,
  /credit\s*card/i,
  /card\s*payment/i,
  /ויזה/,
  /מסטרקארד/,
  /אמקס/,
  /אמריקן\s*אקספרס/,
  /ישראכרט/,
  /דיינרס/,
  /כרטיס\s*אשראי/,
];

const PAYPAL_HINTS = [
  /paypal/i,
  /פייפאל/,
];

export type SettlementMatch = {
  bankTxnId:        string;
  bankAmount:       number;       // signed (always negative for outflows)
  bankDescription:  string;
  bankDate:         Date;
  matchedSourceId:  string;
  matchedSourceName: string;
  matchedKind:      "credit_card" | "paypal";
  matchedTotal:     number;       // positive magnitude
  matchedYM:        string;
  reason:           string;
};

// Run BOTH directions:
//   - bank rows ↔ existing credit-card/paypal totals
//   - existing bank rows ↔ new credit-card/paypal totals
// Either upload order produces the same set of matches.
export async function detectSettlements(businessId: string): Promise<SettlementMatch[]> {
  const cutoff = new Date(Date.now() - SCAN_WINDOW_DAYS * 86400_000);

  // 1. Pull active sources by type so we know how to classify rows.
  const sources = await prisma.financialSource.findMany({
    where: { businessId, status: "active" },
    select: { id: true, name: true, type: true, currency: true, last4: true },
  });
  const cardSources    = sources.filter((s) => s.type === "credit_card");
  const paypalSources  = sources.filter((s) => s.type === "paypal");
  const bankSources    = sources.filter((s) => s.type === "bank");
  if (bankSources.length === 0) return [];
  if (cardSources.length === 0 && paypalSources.length === 0) return [];

  const bankSourceIds = new Set(bankSources.map((s) => s.id));

  // 2. Recent transactions in scope. Note we pull every active txn in
  // the window so we can match across batch boundaries (the bank batch
  // and the card batch can be uploaded weeks apart).
  const txns = await prisma.transaction.findMany({
    where: {
      businessId,
      transactionDate: { gte: cutoff },
      uploadBatch: { status: "active" },
    },
    select: {
      id: true, amount: true, description: true, vendor: true,
      transactionDate: true, accountingMonth: true, type: true,
      isExcludedFromPnl: true,
      uploadBatch: { select: { financialSourceId: true } },
    },
  });

  // 3. Pre-compute monthly spend per (sourceId, accountingMonth) for
  // every card / paypal source. Spend = absolute sum of negative rows
  // (we ignore positive rows like refunds + intra-card transfers when
  // settling against a single bank payment).
  type MonthlyTotal = { sourceId: string; ym: string; spend: number; sourceName: string; type: "credit_card" | "paypal" };
  const totals: MonthlyTotal[] = [];
  const sourceMeta = new Map(sources.map((s) => [s.id, s]));
  const byKey = new Map<string, MonthlyTotal>();
  for (const t of txns) {
    const srcId = t.uploadBatch?.financialSourceId;
    if (!srcId) continue;
    const meta = sourceMeta.get(srcId);
    if (!meta) continue;
    if (meta.type !== "credit_card" && meta.type !== "paypal") continue;
    if (t.amount >= 0) continue; // refunds excluded from the settlement match
    if (t.isExcludedFromPnl) continue;
    const key = `${srcId}|${t.accountingMonth}`;
    let entry = byKey.get(key);
    if (!entry) {
      entry = { sourceId: srcId, ym: t.accountingMonth, spend: 0, sourceName: meta.name, type: meta.type };
      byKey.set(key, entry);
      totals.push(entry);
    }
    entry.spend += Math.abs(t.amount);
  }

  // 4. Walk every bank-side candidate. A candidate is a negative bank
  // txn whose description hints "card payment" OR explicitly names a
  // card source. For each, find a card/paypal monthly total that
  // matches within tolerance.
  const matches: SettlementMatch[] = [];
  for (const t of txns) {
    const srcId = t.uploadBatch?.financialSourceId;
    if (!srcId || !bankSourceIds.has(srcId)) continue;
    if (t.amount >= 0) continue;                        // settlements are outflows
    if (t.type === "credit_card_settlement" || t.type === "paypal_settlement") continue; // already classified
    if (t.isExcludedFromPnl) continue;
    const desc = `${t.vendor ?? ""} ${t.description ?? ""}`.trim();
    const isCardHint   = CARD_HINTS.some((re) => re.test(desc));
    const isPayPalHint = PAYPAL_HINTS.some((re) => re.test(desc));
    // Look for an explicit name/last4 match against a card/paypal source
    // — catches files where the bank labels the row "MASTERCARD 1234".
    const nameMatch = [...cardSources, ...paypalSources].find((s) =>
      (s.last4 && new RegExp(`\\b${s.last4}\\b`).test(desc)) ||
      new RegExp(`\\b${escapeRegex(s.name)}\\b`, "i").test(desc),
    );
    if (!isCardHint && !isPayPalHint && !nameMatch) continue;
    const candidateAmount = Math.abs(t.amount);
    const tolerance = Math.max(TOLERANCE_ABS, candidateAmount * TOLERANCE_RATIO);

    // Restrict the search to relevant kinds based on the hint.
    const eligibleKinds: ("credit_card" | "paypal")[] =
      isPayPalHint && !isCardHint ? ["paypal"]
      : isCardHint && !isPayPalHint ? ["credit_card"]
      : ["credit_card", "paypal"];

    // Prefer the same accountingMonth; fall back to adjacent months
    // since some banks post the settlement on the next billing cycle.
    const candidateMonths = [t.accountingMonth, prevYm(t.accountingMonth), nextYm(t.accountingMonth)];
    let best: MonthlyTotal | null = null;
    let bestDiff = Infinity;
    for (const total of totals) {
      if (!eligibleKinds.includes(total.type)) continue;
      if (nameMatch && total.sourceId !== nameMatch.id) continue;
      if (!candidateMonths.includes(total.ym)) continue;
      const diff = Math.abs(total.spend - candidateAmount);
      if (diff <= tolerance && diff < bestDiff) {
        best = total;
        bestDiff = diff;
      }
    }
    if (!best) continue;
    const reason =
      `Amount ${candidateAmount.toFixed(2)} matches ${best.sourceName} ${best.ym} total ${best.spend.toFixed(2)} (within ${tolerance.toFixed(2)})`;
    matches.push({
      bankTxnId:         t.id,
      bankAmount:        t.amount,
      bankDescription:   desc || "(no description)",
      bankDate:          t.transactionDate,
      matchedSourceId:   best.sourceId,
      matchedSourceName: best.sourceName,
      matchedKind:       best.type,
      matchedTotal:      best.spend,
      matchedYM:         best.ym,
      reason,
    });
  }
  return matches;
}

// Apply the matches: flip the bank-side rows to settlement type and
// exclude them from P&L. Returns the count applied. Idempotent — rows
// already classified are skipped by detectSettlements upstream.
export async function applySettlements(
  businessId: string,
  matches: SettlementMatch[],
): Promise<number> {
  let applied = 0;
  for (const m of matches) {
    const type = m.matchedKind === "paypal" ? "paypal_settlement" : "credit_card_settlement";
    const res = await prisma.transaction.updateMany({
      where: { id: m.bankTxnId, businessId },
      data: {
        type,
        isExcludedFromPnl: true,
        excludeNote: `Auto-detected ${m.matchedKind === "paypal" ? "PayPal" : "credit-card"} settlement — ${m.reason}. The detailed card/PayPal lines count instead.`,
      },
    });
    applied += res.count;
  }
  return applied;
}

// ─── helpers ─────────────────────────────────────────────────────────
function prevYm(ym: string): string { return shiftYm(ym, -1); }
function nextYm(ym: string): string { return shiftYm(ym, +1); }
function shiftYm(ym: string, by: number): string {
  const [y, m] = ym.split("-").map(Number);
  const n = y * 12 + (m - 1) + by;
  const ny = Math.floor(n / 12);
  const nm = (n % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
