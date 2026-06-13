// One-off backfill: normalize non-ISO currency labels and re-run the
// historical FX conversion for rows that were stored un-converted because
// their currency was a symbol/word the rate service couldn't resolve.
//
// Dry-run by default (no writes). Add --apply to write.
//   node --env-file=.env.local --import tsx scripts/backfill-currency.ts
//   node --env-file=.env.local --import tsx scripts/backfill-currency.ts --apply
//
// Safety: only rows with a real originalCurrency snapshot are converted;
// legacy rows (originalCurrency = null) are only relabelled when they map
// to the base currency, never converted.

import { PrismaClient } from "@prisma/client";
import { normalizeCurrency } from "../src/lib/currency";

const APPLY = process.argv.includes("--apply");
const BIZ_MATCH = "shai";
const ALIASES: Record<string, string> = { L: "RON" }; // this workspace: "L" = Romanian Leu

const prisma = new PrismaClient();
const rateCache = new Map<string, number | null>();

function ymd(d: Date): string { return d.toISOString().slice(0, 10); }

// ILS-per-1-`from` on `date` via Frankfurter (ECB). Rolls back to the
// previous trading day automatically for weekends/holidays.
async function fetchRate(from: string, to: string, date: Date): Promise<number | null> {
  if (from === to) return 1;
  const key = `${from}:${to}:${ymd(date)}`;
  if (rateCache.has(key)) return rateCache.get(key)!;
  let rate: number | null = null;
  try {
    const r = await fetch(`https://api.frankfurter.dev/v1/${ymd(date)}?base=${from}&symbols=${to}`);
    if (r.ok) { const j: { rates?: Record<string, number> } = await r.json(); rate = j.rates?.[to] ?? null; }
  } catch { /* leave null */ }
  rateCache.set(key, rate);
  return rate;
}

async function main() {
  const biz = await prisma.business.findFirst({
    where: { name: { contains: BIZ_MATCH, mode: "insensitive" } },
    select: { id: true, name: true, currency: true },
  });
  if (!biz) { console.error("business not found"); return; }
  const base = biz.currency.toUpperCase();
  console.log(`Business: ${biz.name} (base ${base}) | mode: ${APPLY ? "APPLY" : "DRY RUN"}\n`);

  const txns = await prisma.transaction.findMany({
    where: { businessId: biz.id },
    select: {
      id: true, amount: true, currency: true, originalAmount: true, originalCurrency: true,
      baseCurrency: true, exchangeRate: true, conversionMethod: true, transactionDate: true,
    },
  });

  const updates: { id: string; data: Record<string, unknown> }[] = [];
  let relabel = 0, skip = 0, skipLegacy = 0, failed = 0;
  const convSummary: Record<string, { count: number; origSum: number; convSum: number; rate: number }> = {};
  const relabelMap: Record<string, number> = {};

  for (const t of txns) {
    const raw = (t.originalCurrency ?? t.currency ?? base);
    const norm = normalizeCurrency(raw, { aliases: ALIASES, fallback: String(raw).toUpperCase() });
    const origAmt = t.originalAmount ?? t.amount;

    // Base currency: relabel only (amount already in base).
    if (norm === base) {
      const needs = t.originalCurrency !== base || t.currency !== base || t.exchangeRate !== 1;
      if (needs) {
        relabel++;
        relabelMap[`${raw} -> ${base}`] = (relabelMap[`${raw} -> ${base}`] ?? 0) + 1;
        updates.push({ id: t.id, data: {
          currency: base, originalCurrency: base, baseCurrency: base,
          originalAmount: origAmt, amount: origAmt, exchangeRate: 1,
          exchangeRateSource: "same_currency", conversionMethod: "none",
          isConverted: false, rateFetchStatus: "same_currency",
        } });
      } else skip++;
      continue;
    }

    // Non-base. Already properly converted? leave it.
    const alreadyConverted =
      t.conversionMethod === "daily_historical" && !!t.exchangeRate && Math.abs(t.exchangeRate - 1) > 1e-9;
    if (alreadyConverted) { skip++; continue; }

    // Rows with no original snapshot (originalCurrency = null) but a
    // non-base `currency` are un-converted foreign rows - e.g. Plaid
    // imported USD into an ILS business and stored the raw USD value in
    // `amount` without converting. `amount` IS the original value here,
    // so origAmt (= originalAmount ?? amount) is correct to snapshot and
    // convert. (Base-currency legacy rows take the relabel branch above.)
    void skipLegacy;

    const rate = await fetchRate(norm, base, t.transactionDate);
    if (rate == null) {
      failed++;
      updates.push({ id: t.id, data: {
        currency: norm, originalCurrency: norm, baseCurrency: base,
        originalAmount: origAmt, rateFetchStatus: "needs_review",
      } });
      continue;
    }
    const newAmount = origAmt * rate;
    const s = (convSummary[norm] ??= { count: 0, origSum: 0, convSum: 0, rate });
    s.count++; s.origSum += origAmt; s.convSum += newAmount; s.rate = rate;
    updates.push({ id: t.id, data: {
      currency: norm, originalCurrency: norm, baseCurrency: base,
      originalAmount: origAmt, amount: newAmount, exchangeRate: rate,
      exchangeRateDate: t.transactionDate, exchangeRateSource: "frankfurter",
      conversionMethod: "daily_historical", isConverted: true, rateFetchStatus: "success",
    } });
  }

  console.log(`Totals: convert=${Object.values(convSummary).reduce((n, s) => n + s.count, 0)} relabel=${relabel} skip=${skip} skip-legacy(originalCurrency=null)=${skipLegacy} failed=${failed}\n`);
  console.log("Conversions (raised expense magnitude):");
  for (const [c, s] of Object.entries(convSummary)) {
    console.log(`  ${c}: ${s.count} rows  ~rate ${s.rate.toFixed(4)}  ${s.origSum.toFixed(2)} ${c} -> ${s.convSum.toFixed(2)} ${base}`);
  }
  console.log("\nRelabels (no amount change):");
  for (const [m, n] of Object.entries(relabelMap)) console.log(`  ${m}: ${n} rows`);

  if (!APPLY) { console.log("\nDRY RUN - no writes. Re-run with --apply once this looks right."); await prisma.$disconnect(); return; }

  let done = 0;
  for (const u of updates) { await prisma.transaction.update({ where: { id: u.id }, data: u.data }); done++; }
  console.log(`\nApplied ${done} updates.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
