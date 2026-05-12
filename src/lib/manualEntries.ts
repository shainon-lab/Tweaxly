// ManualEntry materialization.
//
// When a user creates a manual entry the system generates Transaction rows for
// each occurrence from startDate up to (and including) the current month.
// Future months are NOT pre-materialized — the forecast engine projects them
// from the trailing-month average automatically once enough history is recorded.
// (Yearly entries materialized only at their anniversary still get caught by
// the forecast since `buildForecast` factors in trailing 3-month averages.)

import { prisma } from "./db";
import { dateToYM, todayYM } from "./format";

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
      frequency: input.frequency,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      notes: input.notes ?? null,
    },
  });

  // Determine upper bound: end of current month (so this month is included).
  const now = new Date();
  const upper = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59),
  );

  const dates = occurrenceDates(
    input.startDate,
    input.frequency,
    upper,
    input.endDate ?? null,
  );

  const sign = input.type === "income" ? 1 : -1;
  const txnRows: { id: string }[] = [];
  for (const d of dates) {
    const t = await prisma.transaction.create({
      data: {
        businessId: input.businessId,
        manualEntryId: entry.id,
        source: "manual",
        originalSourceFile: null,
        transactionDate: d,
        accountingMonth: dateToYM(d),
        amount: sign * Math.abs(input.amount),
        currency: business.currency,
        type: input.type === "income" ? "income" : "expense",
        categoryId: input.categoryId,
        description: cat.name,
        isOneTime: input.frequency === "one_time" || cat.isOneTime,
        notes: input.notes ?? null,
      },
    });
    txnRows.push({ id: t.id });
  }

  // touch — keep `todayYM` import used in case future logic needs it
  void todayYM;

  return { entry, materialized: txnRows.length };
}
