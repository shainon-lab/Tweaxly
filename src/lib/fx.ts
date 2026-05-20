// ExchangeRateService - single entry point for currency conversion.
//
// Order of operations on every getRate() call:
//
//   1. Same-currency short circuit (rate = 1, source = "same_currency").
//   2. Look up the local ExchangeRate cache by (base, quote, date).
//   3. If miss, hit Frankfurter. https://api.frankfurter.dev/v1/{date}
//      returns the latest available rate for that date (Frankfurter
//      automatically rolls back to the previous trading day for
//      weekends / holidays - we then pin the rateDate to what the
//      user asked for and stamp the effectiveDate with what came back,
//      so the snapshot remains a faithful audit record).
//   4. If Frankfurter fails (network, 5xx, parse), return a
//      status="failed" stub so the caller can mark the transaction
//      needs_review rather than silently guessing.
//
// The service never throws - every error becomes a structured result
// the caller can act on (success / missing / failed / same_currency).

import { prisma } from "./db";

export interface RateLookup {
  rate: number | null;
  rateDate: Date;          // the date the caller requested
  effectiveDate: Date | null; // the date the rate provider actually applied
  source: string;          // "frankfurter" | "ecb" | "manual" | "same_currency"
  status: "success" | "missing" | "failed" | "same_currency" | "manual";
  cached: boolean;
}

const FRANKFURTER_BASE = "https://api.frankfurter.dev/v1";

// Clamp the requested date to today - Frankfurter returns 404 for
// future dates and we don't want to advertise rates we don't have.
function clampToToday(d: Date): Date {
  const now = new Date();
  return d > now ? now : d;
}

function ymdUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Build the lookup key the unique constraint expects.
function cacheKey(base: string, quote: string, date: Date, source: string) {
  return {
    baseCurrency_quoteCurrency_rateDate_source: {
      baseCurrency:  base,
      quoteCurrency: quote,
      rateDate:      startOfDayUTC(date),
      source,
    },
  };
}

export async function getRate(
  baseCurrency: string,
  quoteCurrency: string,
  date: Date,
): Promise<RateLookup> {
  const base  = baseCurrency.toUpperCase();
  const quote = quoteCurrency.toUpperCase();
  const requested = startOfDayUTC(clampToToday(date));

  // 1. Same currency - no conversion needed.
  if (base === quote) {
    return {
      rate: 1,
      rateDate: requested,
      effectiveDate: requested,
      source: "same_currency",
      status: "same_currency",
      cached: false,
    };
  }

  // 2. Cache lookup (across all sources - manual override wins by source priority).
  const cachedManual = await prisma.exchangeRate.findUnique({
    where: cacheKey(base, quote, requested, "manual"),
  }).catch(() => null);
  if (cachedManual) {
    return {
      rate: cachedManual.rate,
      rateDate: cachedManual.rateDate,
      effectiveDate: cachedManual.effectiveDate,
      source: cachedManual.source,
      status: "manual",
      cached: true,
    };
  }

  const cachedFx = await prisma.exchangeRate.findUnique({
    where: cacheKey(base, quote, requested, "frankfurter"),
  }).catch(() => null);
  if (cachedFx) {
    return {
      rate: cachedFx.rate,
      rateDate: cachedFx.rateDate,
      effectiveDate: cachedFx.effectiveDate,
      source: cachedFx.source,
      status: "success",
      cached: true,
    };
  }

  // 3. External fetch.
  const remote = await fetchFrankfurter(base, quote, requested);
  if (remote.status === "success" && remote.rate != null && remote.effectiveDate) {
    // Persist for next time. upsert guards against the rare race where
    // two parallel imports look up the same pair simultaneously.
    await prisma.exchangeRate.upsert({
      where: cacheKey(base, quote, requested, "frankfurter"),
      update: {
        rate: remote.rate,
        effectiveDate: remote.effectiveDate,
      },
      create: {
        baseCurrency:  base,
        quoteCurrency: quote,
        rateDate:      requested,
        effectiveDate: remote.effectiveDate,
        rate:          remote.rate,
        source:        "frankfurter",
      },
    }).catch(() => { /* cache write failure is non-fatal */ });
  }
  return remote;
}

async function fetchFrankfurter(
  base: string,
  quote: string,
  date: Date,
): Promise<RateLookup> {
  const requestedDate = date;
  try {
    // Frankfurter's URL takes the date in the path and `base`/`symbols`
    // as query params. We ask for `base = quote` and `to = base`, then
    // invert below - the public API is documented as "base → symbols"
    // and we want "quote → base". Equivalent: ?base=QUOTE&to=BASE.
    const url = `${FRANKFURTER_BASE}/${ymdUTC(date)}?base=${quote}&symbols=${base}`;
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 8000);
    let resp: Response;
    try {
      resp = await fetch(url, { signal: ac.signal, headers: { "user-agent": "tweaxly-fx/1.0" } });
    } finally {
      clearTimeout(timeout);
    }
    if (!resp.ok) {
      // 404 happens for unsupported currency pairs or dates earlier
      // than Frankfurter's coverage (pre-1999 for EUR).
      return {
        rate: null,
        rateDate: requestedDate,
        effectiveDate: null,
        source: "frankfurter",
        status: resp.status === 404 ? "missing" : "failed",
        cached: false,
      };
    }
    const json = (await resp.json()) as { date?: string; rates?: Record<string, number> };
    const rate = json.rates?.[base];
    if (rate == null || !Number.isFinite(rate)) {
      return {
        rate: null,
        rateDate: requestedDate,
        effectiveDate: null,
        source: "frankfurter",
        status: "missing",
        cached: false,
      };
    }
    const effective = json.date ? new Date(`${json.date}T00:00:00Z`) : requestedDate;
    return {
      rate,
      rateDate: requestedDate,
      effectiveDate: effective,
      source: "frankfurter",
      status: "success",
      cached: false,
    };
  } catch {
    return {
      rate: null,
      rateDate: requestedDate,
      effectiveDate: null,
      source: "frankfurter",
      status: "failed",
      cached: false,
    };
  }
}

// Convenience: apply a rate to an amount. Returns a single object the
// caller can spread into prisma.transaction.create({ data: {...} }).
export interface ConversionResult {
  amount: number;             // converted, in base currency
  originalAmount: number;
  originalCurrency: string;
  baseCurrency: string;
  exchangeRate: number;
  exchangeRateDate: Date;
  exchangeRateSource: string;
  conversionMethod: "daily_historical" | "manual_fixed" | "none";
  isConverted: boolean;
  rateFetchStatus: RateLookup["status"] | "needs_review";
}

export async function convertAmount(
  originalAmount: number,
  originalCurrency: string,
  baseCurrency: string,
  transactionDate: Date,
): Promise<ConversionResult> {
  const lookup = await getRate(baseCurrency, originalCurrency, transactionDate);
  if (lookup.status === "same_currency") {
    return {
      amount: originalAmount,
      originalAmount,
      originalCurrency,
      baseCurrency,
      exchangeRate: 1,
      exchangeRateDate: lookup.rateDate,
      exchangeRateSource: "same_currency",
      conversionMethod: "none",
      isConverted: false,
      rateFetchStatus: "same_currency",
    };
  }
  if (lookup.rate == null) {
    return {
      amount: originalAmount,  // unconverted - caller should treat as needs_review
      originalAmount,
      originalCurrency,
      baseCurrency,
      exchangeRate: 1,
      exchangeRateDate: lookup.rateDate,
      exchangeRateSource: lookup.source,
      conversionMethod: "none",
      isConverted: false,
      rateFetchStatus: "needs_review",
    };
  }
  return {
    amount: originalAmount * lookup.rate,
    originalAmount,
    originalCurrency,
    baseCurrency,
    exchangeRate: lookup.rate,
    exchangeRateDate: lookup.effectiveDate ?? lookup.rateDate,
    exchangeRateSource: lookup.source,
    conversionMethod: "daily_historical",
    isConverted: true,
    rateFetchStatus: lookup.status,
  };
}

// Manual override - caller passes an explicit rate, we persist it to
// the cache as source="manual" so future lookups for the same pair/
// date pick it up automatically.
export async function setManualRate(input: {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  rateDate: Date;
}): Promise<void> {
  const base  = input.baseCurrency.toUpperCase();
  const quote = input.quoteCurrency.toUpperCase();
  const date  = startOfDayUTC(input.rateDate);
  await prisma.exchangeRate.upsert({
    where: cacheKey(base, quote, date, "manual"),
    update: { rate: input.rate, effectiveDate: date },
    create: {
      baseCurrency: base,
      quoteCurrency: quote,
      rate: input.rate,
      rateDate: date,
      effectiveDate: date,
      source: "manual",
    },
  });
}
