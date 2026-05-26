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
// Order matters for `firstMatch`-style logging only. The corresponding
// brand label is used by the upload-card-statement recommendation
// surfaced on the dashboard.
const CARD_HINTS: { re: RegExp; label: string }[] = [
  { re: /visa/i,                  label: "Visa" },
  { re: /master\s*card/i,         label: "Mastercard" },
  { re: /mastercard/i,            label: "Mastercard" },
  { re: /amex/i,                  label: "Amex" },
  { re: /american\s*express/i,    label: "Amex" },
  { re: /isracard/i,              label: "Isracard" },
  { re: /diners/i,                label: "Diners" },
  { re: /\bmax\b/i,               label: "MAX" },
  { re: /max\s*it/i,              label: "MAX" },
  { re: /\bcal\b/i,               label: "Cal" },
  { re: /leumi\s*card/i,          label: "Leumi Card" },
  { re: /credit\s*card/i,         label: "Credit card" },
  { re: /card\s*payment/i,        label: "Credit card" },
  { re: /ויזה/,                   label: "Visa" },
  { re: /מסטרקארד/,               label: "Mastercard" },
  { re: /אמקס/,                   label: "Amex" },
  { re: /אמריקן\s*אקספרס/,        label: "Amex" },
  { re: /ישראכרט/,                label: "Isracard" },
  { re: /דיינרס/,                 label: "Diners" },
  { re: /מקס/,                    label: "MAX" },
  { re: /כרטיס\s*אשראי/,          label: "Credit card" },
];

const PAYPAL_HINTS: { re: RegExp; label: string }[] = [
  { re: /paypal/i,  label: "PayPal" },
  { re: /פייפאל/,   label: "PayPal" },
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
    const isCardHint   = CARD_HINTS.some(({ re }) => re.test(desc));
    const isPayPalHint = PAYPAL_HINTS.some(({ re }) => re.test(desc));
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

// ── Bank-to-bank transfer detection ─────────────────────────────────
// When the owner has 2+ bank sources, internal transfers between them
// (savings ⇄ checking, ILS bank ⇄ USD bank, etc.) should NOT count as
// either income or expense — they're balance moves, not P&L events.
//
// Heuristic: for every recent bank-side outflow, look for an opposing
// inflow on a DIFFERENT bank source with the same absolute amount
// (within ±$1 / 0.5%) dated within ±3 days. Description hints
// (TRANSFER/WIRE/ZELLE/ACH/העברה) boost confidence — pairs without
// any hint are still matched but only when both date and amount are
// dead-on (±1 day, exact amount).

export type TransferMatch = {
  outflowTxnId: string;
  inflowTxnId:  string;
  amount:       number;        // positive magnitude
  outflowDate:  Date;
  outflowSourceId: string;
  inflowSourceId:  string;
  outflowSourceName: string;
  inflowSourceName:  string;
  reason: string;
};

const TRANSFER_HINTS = [
  /transfer/i, /wire/i, /zelle/i, /\bach\b/i,
  /to\s+account/i, /from\s+account/i,
  /העברה/, /העברת/,
];

export async function detectBankTransfers(businessId: string): Promise<TransferMatch[]> {
  const cutoff = new Date(Date.now() - SCAN_WINDOW_DAYS * 86400_000);
  const sources = await prisma.financialSource.findMany({
    where: { businessId, status: "active", type: "bank" },
    select: { id: true, name: true },
  });
  if (sources.length < 2) return [];
  const sourceMeta = new Map(sources.map((s) => [s.id, s]));
  const bankSourceIds = new Set(sources.map((s) => s.id));

  const txns = await prisma.transaction.findMany({
    where: {
      businessId,
      transactionDate: { gte: cutoff },
      uploadBatch: { status: "active" },
    },
    select: {
      id: true, amount: true, description: true, vendor: true,
      transactionDate: true, type: true, isExcludedFromPnl: true,
      uploadBatch: { select: { financialSourceId: true } },
    },
  });

  type Side = {
    id: string; sourceId: string; amount: number; date: Date; hasHint: boolean;
    desc: string;
  };
  const outflows: Side[] = [];
  const inflows:  Side[] = [];
  for (const t of txns) {
    const srcId = t.uploadBatch?.financialSourceId;
    if (!srcId || !bankSourceIds.has(srcId)) continue;
    if (t.isExcludedFromPnl)               continue;
    if (t.type === "bank_transfer")        continue; // already classified
    if (t.type === "credit_card_settlement" || t.type === "paypal_settlement") continue;
    const desc = `${t.vendor ?? ""} ${t.description ?? ""}`.trim();
    const hasHint = TRANSFER_HINTS.some((re) => re.test(desc));
    const side: Side = { id: t.id, sourceId: srcId, amount: t.amount, date: t.transactionDate, hasHint, desc };
    if (t.amount < 0) outflows.push(side);
    else if (t.amount > 0) inflows.push(side);
  }

  const matches: TransferMatch[] = [];
  const used = new Set<string>();
  for (const out of outflows) {
    if (used.has(out.id)) continue;
    const mag = Math.abs(out.amount);
    const tolerance = Math.max(1.0, mag * 0.005);
    // Without hints, require exact-ish amount + ≤1 day apart. With hints,
    // relax to ±3 days.
    const maxDays = out.hasHint ? 3 : 1;
    let best: { in: Side; diff: number; days: number } | null = null;
    for (const inn of inflows) {
      if (used.has(inn.id))                continue;
      if (inn.sourceId === out.sourceId)   continue; // must be cross-source
      const days = Math.abs((inn.date.getTime() - out.date.getTime()) / 86400_000);
      if (days > maxDays)                  continue;
      const diff = Math.abs(inn.amount - mag);
      if (diff > tolerance)                continue;
      // Require AT LEAST one side to have a hint when the dates are
      // looser than ±1 — defends against random coincidence on round
      // amounts (e.g. $500 in/out at unrelated vendors).
      if (days > 1 && !inn.hasHint && !out.hasHint) continue;
      if (!best || diff < best.diff || (diff === best.diff && days < best.days)) {
        best = { in: inn, diff, days };
      }
    }
    if (!best) continue;
    used.add(out.id);
    used.add(best.in.id);
    const outMeta = sourceMeta.get(out.sourceId)!;
    const inMeta  = sourceMeta.get(best.in.sourceId)!;
    matches.push({
      outflowTxnId:      out.id,
      inflowTxnId:       best.in.id,
      amount:            mag,
      outflowDate:       out.date,
      outflowSourceId:   out.sourceId,
      inflowSourceId:    best.in.sourceId,
      outflowSourceName: outMeta.name,
      inflowSourceName:  inMeta.name,
      reason: `Outflow ${mag.toFixed(2)} from ${outMeta.name} matches inflow on ${inMeta.name} (±${best.days.toFixed(0)}d, hint ${out.hasHint || best.in.hasHint ? "yes" : "no"})`,
    });
  }
  return matches;
}

export async function applyBankTransfers(businessId: string, matches: TransferMatch[]): Promise<number> {
  let applied = 0;
  for (const m of matches) {
    // Mark BOTH sides — owner sees one settlement pill per row and the
    // pair is excluded from P&L symmetrically.
    const note = `Auto-detected bank transfer — ${m.reason}. Internal account-to-account move, not income or expense.`;
    const res = await prisma.transaction.updateMany({
      where: { id: { in: [m.outflowTxnId, m.inflowTxnId] }, businessId },
      data: {
        type:              "bank_transfer",
        isExcludedFromPnl: true,
        excludeNote:       note,
      },
    });
    applied += res.count;
  }
  return applied;
}

// ── Payment provider settlement detection ─────────────────────────
// When the owner uploads both a Stripe/Square/Wise export AND their
// bank statement, the bank inflow ("STRIPE PAYOUT $9,700") should be
// excluded from P&L because the detailed provider transactions already
// account for the revenue (and the fees).
//
// Heuristic: for each payment_provider source, compute monthly NET
// income (positive rows minus absolute negative rows = what the
// provider would actually payout to bank). For each bank-side inflow
// hinting "STRIPE"/"SQUARE"/"WISE"/etc. or naming the provider source,
// look for a matching net within tolerance in the same month or ±1.

export type ProviderSettlementMatch = {
  bankTxnId:        string;
  bankAmount:       number;      // positive
  bankDescription:  string;
  bankDate:         Date;
  providerSourceId: string;
  providerSourceName: string;
  providerNet:      number;
  providerYM:       string;
  reason:           string;
};

const PROVIDER_HINTS = [
  /stripe/i, /square/i, /wise/i, /payoneer/i, /shopify\s*payout/i,
  /payout/i,
  /סטרייפ/, /סקוור/, /וייז/,
];

export async function detectPaymentProviderSettlements(businessId: string): Promise<ProviderSettlementMatch[]> {
  const cutoff = new Date(Date.now() - SCAN_WINDOW_DAYS * 86400_000);
  const sources = await prisma.financialSource.findMany({
    where: { businessId, status: "active" },
    select: { id: true, name: true, type: true, currency: true, last4: true },
  });
  const providerSources = sources.filter((s) => s.type === "payment_provider");
  const bankSources     = sources.filter((s) => s.type === "bank");
  if (providerSources.length === 0 || bankSources.length === 0) return [];
  const bankSourceIds = new Set(bankSources.map((s) => s.id));

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

  // Compute per-(provider, ym) net income — what the provider would
  // payout. Net = sum(amount) including fees (negative rows reduce it).
  type Net = { sourceId: string; ym: string; net: number; sourceName: string };
  const netByKey = new Map<string, Net>();
  const sourceMeta = new Map(sources.map((s) => [s.id, s]));
  for (const t of txns) {
    const srcId = t.uploadBatch?.financialSourceId;
    if (!srcId) continue;
    const meta = sourceMeta.get(srcId);
    if (!meta || meta.type !== "payment_provider") continue;
    if (t.isExcludedFromPnl)                       continue;
    const key = `${srcId}|${t.accountingMonth}`;
    let entry = netByKey.get(key);
    if (!entry) {
      entry = { sourceId: srcId, ym: t.accountingMonth, net: 0, sourceName: meta.name };
      netByKey.set(key, entry);
    }
    entry.net += t.amount;
  }
  if (netByKey.size === 0) return [];

  const matches: ProviderSettlementMatch[] = [];
  for (const t of txns) {
    const srcId = t.uploadBatch?.financialSourceId;
    if (!srcId || !bankSourceIds.has(srcId)) continue;
    if (t.amount <= 0)                                continue; // payouts are inflows
    if (t.type === "payment_provider_settlement")     continue;
    if (t.isExcludedFromPnl)                          continue;
    const desc = `${t.vendor ?? ""} ${t.description ?? ""}`.trim();
    const namedProvider = providerSources.find((s) =>
      new RegExp(`\\b${escapeRegex(s.name)}\\b`, "i").test(desc) ||
      (s.last4 && new RegExp(`\\b${s.last4}\\b`).test(desc)),
    );
    const isProviderHint = PROVIDER_HINTS.some((re) => re.test(desc));
    if (!namedProvider && !isProviderHint) continue;
    const candidateAmount = t.amount;
    const tolerance = Math.max(TOLERANCE_ABS, candidateAmount * TOLERANCE_RATIO);
    const candidateMonths = [t.accountingMonth, prevYm(t.accountingMonth), nextYm(t.accountingMonth)];
    let best: { net: Net; diff: number } | null = null;
    for (const net of netByKey.values()) {
      if (namedProvider && net.sourceId !== namedProvider.id) continue;
      if (!candidateMonths.includes(net.ym))                  continue;
      const diff = Math.abs(net.net - candidateAmount);
      if (diff > tolerance)                                   continue;
      if (!best || diff < best.diff) best = { net, diff };
    }
    if (!best) continue;
    matches.push({
      bankTxnId:          t.id,
      bankAmount:         t.amount,
      bankDescription:    desc || "(no description)",
      bankDate:           t.transactionDate,
      providerSourceId:   best.net.sourceId,
      providerSourceName: best.net.sourceName,
      providerNet:        best.net.net,
      providerYM:         best.net.ym,
      reason: `Inflow ${candidateAmount.toFixed(2)} matches ${best.net.sourceName} ${best.net.ym} net ${best.net.net.toFixed(2)} (within ${tolerance.toFixed(2)})`,
    });
  }
  return matches;
}

export async function applyPaymentProviderSettlements(
  businessId: string,
  matches: ProviderSettlementMatch[],
): Promise<number> {
  let applied = 0;
  for (const m of matches) {
    const res = await prisma.transaction.updateMany({
      where: { id: m.bankTxnId, businessId },
      data: {
        type:              "payment_provider_settlement",
        isExcludedFromPnl: true,
        excludeNote:       `Auto-detected ${m.providerSourceName} payout — ${m.reason}. The detailed provider lines count as revenue instead.`,
      },
    });
    applied += res.count;
  }
  return applied;
}

// ── Orchestrator ───────────────────────────────────────────────────
// Runs all three detection passes in series and returns a combined
// summary the wizard surfaces on the Done step.
export async function detectAllSettlements(businessId: string): Promise<{
  cardCount:     number;
  paypalCount:   number;
  transferCount: number;
  providerCount: number;
  samples:       { kind: string; source: string; ym: string; amount: number }[];
}> {
  const out = { cardCount: 0, paypalCount: 0, transferCount: 0, providerCount: 0, samples: [] as { kind: string; source: string; ym: string; amount: number }[] };

  const card = await detectSettlements(businessId);
  if (card.length > 0) {
    await applySettlements(businessId, card);
    for (const m of card) {
      if (m.matchedKind === "paypal") out.paypalCount++; else out.cardCount++;
      if (out.samples.length < 5) {
        out.samples.push({ kind: m.matchedKind, source: m.matchedSourceName, ym: m.matchedYM, amount: Math.abs(m.bankAmount) });
      }
    }
  }
  const transfers = await detectBankTransfers(businessId);
  if (transfers.length > 0) {
    out.transferCount = await applyBankTransfers(businessId, transfers);
    for (const m of transfers.slice(0, 5 - out.samples.length)) {
      if (out.samples.length < 5) {
        out.samples.push({
          kind: "transfer",
          source: `${m.outflowSourceName} → ${m.inflowSourceName}`,
          ym: monthFromDate(m.outflowDate),
          amount: m.amount,
        });
      }
    }
  }
  const providers = await detectPaymentProviderSettlements(businessId);
  if (providers.length > 0) {
    out.providerCount = await applyPaymentProviderSettlements(businessId, providers);
    for (const m of providers.slice(0, 5 - out.samples.length)) {
      if (out.samples.length < 5) {
        out.samples.push({ kind: "provider", source: m.providerSourceName, ym: m.providerYM, amount: m.bankAmount });
      }
    }
  }
  return out;
}

function monthFromDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
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

// ─── Pre-emptive scan for the "upload your credit card" recommendation ─
// Powers the dashboard recommendation card that nudges bank-only
// workspaces to upload card statements too. Counts bank-side outflows
// whose description matches a card/paypal brand hint, even when the
// user hasn't created a credit-card source yet. Returns null when
// there's nothing to recommend (no bank source, or no candidates).

export type BankCardSignals = {
  hasBankSource:     boolean;
  hasCardSource:     boolean;
  hasPaypalSource:   boolean;
  cardCandidates:    number;
  paypalCandidates:  number;
  // Distinct brand labels detected ("Visa", "MAX", "Isracard"…), in
  // descending frequency. Capped at 4 for UI brevity.
  detectedBrands:    string[];
};

export async function scanBankCardSignals(businessId: string): Promise<BankCardSignals> {
  const [sources, txns] = await Promise.all([
    prisma.financialSource.findMany({
      where: { businessId, status: "active" },
      select: { id: true, type: true },
    }),
    prisma.transaction.findMany({
      where: {
        businessId,
        amount: { lt: 0 },
        isExcludedFromPnl: false,
        transactionDate: { gte: new Date(Date.now() - SCAN_WINDOW_DAYS * 86400_000) },
      },
      select: { source: true, vendor: true, description: true, type: true },
    }),
  ]);

  const hasBankSource   = sources.some((s) => s.type === "bank");
  const hasCardSource   = sources.some((s) => s.type === "credit_card");
  const hasPaypalSource = sources.some((s) => s.type === "paypal");

  // Tally hits per brand label, deduping by regex group.
  const brandCounts = new Map<string, number>();
  let cardCandidates = 0;
  let paypalCandidates = 0;
  for (const t of txns) {
    // Skip rows already classified as settlements (avoids double-counting
    // when the matched flow already replaced them).
    if (t.type === "credit_card_settlement" || t.type === "paypal_settlement") continue;
    // Only bank-side rows are candidates — uploads to a card source
    // shouldn't trigger the "upload your card" nudge.
    if (t.source !== "bank") continue;
    const desc = `${t.vendor ?? ""} ${t.description ?? ""}`.trim();
    if (!desc) continue;
    const cardHit = CARD_HINTS.find(({ re }) => re.test(desc));
    if (cardHit) {
      cardCandidates++;
      brandCounts.set(cardHit.label, (brandCounts.get(cardHit.label) ?? 0) + 1);
      continue;
    }
    const paypalHit = PAYPAL_HINTS.find(({ re }) => re.test(desc));
    if (paypalHit) {
      paypalCandidates++;
      brandCounts.set(paypalHit.label, (brandCounts.get(paypalHit.label) ?? 0) + 1);
    }
  }
  const detectedBrands = Array.from(brandCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label]) => label);

  return {
    hasBankSource,
    hasCardSource,
    hasPaypalSource,
    cardCandidates,
    paypalCandidates,
    detectedBrands,
  };
}
