// ManualEntry materialization.
//
// Financial-date rule (single source of truth):
//
//   - One-time entries → exactly one Transaction at startDate.
//   - Recurring entries (monthly/quarterly/yearly):
//       • With an explicit endDate  → one Transaction per occurrence
//         from startDate to MIN(endDate, today).
//       • WITHOUT an endDate        → one Transaction at startDate only.
//
// The "no endDate → backfill to today" auto-fan-out behaviour was
// removed because it produced surprising results: a single historical
// expense entered as monthly with no end date would silently
// materialize as N transactions across N months, including the
// current month. The user's mental model is "Start Date is the date
// the entry applies to" - so we honor that literally and require an
// explicit endDate when a user really wants the gap filled.
//
// The forecast engine still projects recurring entries forward from
// trailing-month averages, so ongoing recurring expenses still show
// up in the projection even when only the start occurrence is
// materialized.

import { prisma } from "./db";
import { dateToYM, todayYM } from "./format";
import { convertAmount } from "./fx";

export type Frequency = "one_time" | "monthly" | "quarterly" | "yearly";

const VALID_FREQUENCIES: Frequency[] = [
  "one_time",
  "monthly",
  "quarterly",
  "yearly",
];

export function isValidFrequency(s: string): s is Frequency {
  return (VALID_FREQUENCIES as string[]).includes(s);
}

// Generate the dates on which a recurring entry occurs, between start and an
// inclusive upper bound. For one-time, exactly one occurrence at startDate.
export function occurrenceDates(
  startDate: Date,
  frequency: Frequency,
  upperBound: Date,
  endDate?: Date | null,
): Date[] {
  if (Number.isNaN(startDate.getTime())) return [];
  const upper = endDate && endDate < upperBound ? endDate : upperBound;
  if (startDate > upper) return [];

  if (frequency === "one_time") return [new Date(startDate)];

  const stepMonths =
    frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12;
  const out: Date[] = [];
  // Use UTC to keep YM math stable across DST changes.
  const cursor = new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
    ),
  );
  while (cursor <= upper && out.length < 240) {
    out.push(new Date(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + stepMonths);
  }
  return out;
}

export type CreateManualEntryInput = {
  businessId: string;
  type: "income" | "outcome";
  categoryId: string;
  amount: number;
  // ISO 4217 the user entered the amount in. Defaults to the business
  // base currency at the API boundary. Each occurrence gets its own
  // historical-rate conversion so a recurring entry that spans
  // multiple months reflects rate movement between occurrences.
  currency?: string;
  frequency: Frequency;
  startDate: Date;
  endDate?: Date | null;
  notes?: string | null;
};

export async function createManualEntryAndMaterialize(
  input: CreateManualEntryInput,
) {
  // Validate category belongs to business
  const cat = await prisma.category.findFirst({
    where: { id: input.categoryId, businessId: input.businessId },
  });
  if (!cat) throw new Error("Category not found for this business");

  const business = await prisma.business.findUnique({
    where: { id: input.businessId },
  });
  if (!business) throw new Error("Business not found");

  const entry = await prisma.manualEntry.create({
    data: {
      businessId: input.businessId,
      type: input.type,
      categoryId: input.categoryId,
      amount: Math.abs(input.amount),
      currency: (input.currency ?? business.currency).toUpperCase(),
      frequency: input.frequency,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      notes: input.notes ?? null,
    },
  });

  // Determine the materialization window per the financial-date rule
  // documented at the top of this file. For non-one_time frequencies
  // we still cap at today's end-of-month so we never write Transaction
  // rows dated in the future; the forecast engine projects forward
  // separately.
  const now = new Date();
  const todayEom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59),
  );

  let dates: Date[];
  if (input.frequency === "one_time") {
    // Always single transaction at startDate.
    dates = [new Date(input.startDate)];
  } else if (input.endDate) {
    // Recurring with explicit end → fill the user's stated window
    // (capped at today so we don't write future-dated rows).
    const upper = input.endDate < todayEom ? input.endDate : todayEom;
    dates = occurrenceDates(input.startDate, input.frequency, upper, input.endDate);
  } else {
    // Recurring without an end → honour Start Date as the financial
    // date, materialize only that one occurrence. The forecast engine
    // continues to project recurring expenses forward.
    dates = [new Date(input.startDate)];
  }

  const sign = input.type === "income" ? 1 : -1;
  // If the user entered the amount in a non-base currency, convert
  // per occurrence so a recurring entry reflects rate movement over
  // time (rather than locking in the start-date rate for every
  // future month). The FX service handles cache + Frankfurter +
  // weekend roll-back uniformly with the CSV importer.
  const enteredCurrency = (input.currency ?? business.currency).toUpperCase();
  const txnRows: { id: string }[] = [];
  for (const d of dates) {
    const signed = sign * Math.abs(input.amount);
    const conv = await convertAmount(signed, enteredCurrency, business.currency, d);
    const t = await prisma.transaction.create({
      data: {
        businessId: input.businessId,
        manualEntryId: entry.id,
        source: "manual",
        originalSourceFile: null,
        transactionDate: d,
        accountingMonth: dateToYM(d),
        amount: conv.amount,
        currency: enteredCurrency,
        originalAmount: conv.originalAmount,
        originalCurrency: conv.originalCurrency,
        baseCurrency: conv.baseCurrency,
        exchangeRate: conv.exchangeRate,
        exchangeRateDate: conv.exchangeRateDate,
        exchangeRateSource: conv.exchangeRateSource,
        conversionMethod: conv.conversionMethod,
        isConverted: conv.isConverted,
        rateFetchStatus: conv.rateFetchStatus,
        type: input.type === "income" ? "income" : "expense",
        categoryId: input.categoryId,
        description: cat.name,
        isOneTime: input.frequency === "one_time" || cat.isOneTime,
        notes: input.notes ?? null,
      },
    });
    txnRows.push({ id: t.id });
  }

  // touch - keep `todayYM` import used in case future logic needs it
  void todayYM;

  return { entry, materialized: txnRows.length };
}
