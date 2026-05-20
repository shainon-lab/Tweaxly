// Strict pre-save validation for a Transaction (or anything that
// becomes one). Returns a structured error list so the caller can
// either reject the whole batch, surface row-level errors in an
// import preview, or 400 a single-row API.
//
// Reject corrupted records BEFORE they enter the system —
// docs/financial-data-integrity.md §7.

import { isRegionCode } from "./regions";

export interface TransactionLike {
  amount?:           unknown;
  currency?:         unknown;
  transactionDate?:  unknown;
  type?:             unknown;
  categoryId?:       unknown;
}

export type ValidationIssue = {
  code:
    | "missing_amount"
    | "invalid_amount"
    | "missing_date"
    | "invalid_date"
    | "future_date"
    | "missing_currency"
    | "invalid_currency"
    | "missing_type"
    | "invalid_type"
    | "zero_amount";
  field: string;
  message: string;
};

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  normalized?: {
    amount:           number;
    currency:         string;
    transactionDate:  Date;
    type:             string;
  };
}

const ALLOWED_TYPES = new Set([
  "income", "expense", "transfer", "fee", "payroll", "tax", "other",
]);

// Reject dates more than ~30 years in the past or any in the future
// (a transaction with a 2050 date is almost certainly a typo).
const MIN_DATE = new Date(Date.UTC(1995, 0, 1));

export function validateTransaction(input: TransactionLike): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Amount
  const amountNum = typeof input.amount === "number"
    ? input.amount
    : typeof input.amount === "string" ? Number(input.amount) : NaN;
  if (input.amount === null || input.amount === undefined || input.amount === "") {
    issues.push({ code: "missing_amount", field: "amount", message: "Amount is required." });
  } else if (!Number.isFinite(amountNum)) {
    issues.push({ code: "invalid_amount", field: "amount", message: "Amount must be a number." });
  } else if (amountNum === 0) {
    issues.push({ code: "zero_amount", field: "amount", message: "Amount must be non-zero." });
  }

  // Date
  let date: Date | null = null;
  if (input.transactionDate === null || input.transactionDate === undefined || input.transactionDate === "") {
    issues.push({ code: "missing_date", field: "transactionDate", message: "Transaction date is required." });
  } else {
    date = input.transactionDate instanceof Date
      ? input.transactionDate
      : new Date(input.transactionDate as string | number);
    if (Number.isNaN(date.getTime())) {
      issues.push({ code: "invalid_date", field: "transactionDate", message: "Transaction date is not a valid date." });
      date = null;
    } else if (date < MIN_DATE) {
      issues.push({ code: "invalid_date", field: "transactionDate", message: `Date is before ${MIN_DATE.toISOString().slice(0,10)}; check formatting.` });
      date = null;
    } else {
      // Allow today, reject far-future. Cap at ~5 years out (forecast
      // engine handles the future projection; raw Transactions stay
      // historical).
      const fiveYearsOut = new Date();
      fiveYearsOut.setUTCFullYear(fiveYearsOut.getUTCFullYear() + 5);
      if (date > fiveYearsOut) {
        issues.push({ code: "future_date", field: "transactionDate", message: "Date is too far in the future." });
        date = null;
      }
    }
  }

  // Currency
  let currency: string | null = null;
  if (input.currency === null || input.currency === undefined || input.currency === "") {
    issues.push({ code: "missing_currency", field: "currency", message: "Currency is required." });
  } else if (typeof input.currency !== "string") {
    issues.push({ code: "invalid_currency", field: "currency", message: "Currency must be a 3-letter ISO 4217 code." });
  } else {
    const c = input.currency.trim().toUpperCase();
    if (c.length !== 3 || !/^[A-Z]{3}$/.test(c)) {
      issues.push({ code: "invalid_currency", field: "currency", message: "Currency must be a 3-letter ISO 4217 code." });
    } else {
      currency = c;
    }
  }

  // Type
  let type: string | null = null;
  if (input.type === null || input.type === undefined || input.type === "") {
    issues.push({ code: "missing_type", field: "type", message: "Type is required." });
  } else if (typeof input.type !== "string" || !ALLOWED_TYPES.has(input.type)) {
    issues.push({ code: "invalid_type", field: "type", message: `Type must be one of: ${Array.from(ALLOWED_TYPES).join(", ")}` });
  } else {
    type = input.type;
  }

  if (issues.length > 0) {
    return { valid: false, issues };
  }

  return {
    valid: true,
    issues: [],
    normalized: {
      amount:          amountNum,
      currency:        currency!,
      transactionDate: date!,
      type:            type!,
    },
  };
}

// Lightweight wrapper for callers that only care about a single
// field. Useful for inline form-level validation.
export function isValidIso4217(code: string): boolean {
  return /^[A-Z]{3}$/.test(code) && code === code.toUpperCase();
}

// Re-exported for the validation layer to call when needed (e.g. when
// validating a region code on a separate input).
export { isRegionCode };
