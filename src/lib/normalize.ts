// Normalize a parsed row into a Transaction record.
import { parseAmount, parseDate, type ParsedRow } from "./parsers";
import { dateToYM } from "./format";
import { resolveCurrencyCode } from "./currencies";

export type ColumnMapping = {
  date: string | null;
  amount: string | null;
  description: string | null;
  currency: string | null;
  txnId: string | null;
  source: string | null;
  category: string | null;
  notes: string | null;
  vendor: string | null;
};

export type NormalizedTxn = {
  externalId: string | null;
  transactionDate: Date;
  accountingMonth: string;
  amount: number;
  currency: string;
  type: string;
  vendor: string | null;
  description: string;
  notes: string | null;
  rawCategory: string | null;
};

// inflowSign: +1 means "amount as given is positive for inflows" (default).
// For some bank exports, expenses come as positive numbers in a "Debit" column;
// we expose a sign override on the source.
export function normalizeRow(
  row: ParsedRow,
  mapping: ColumnMapping,
  source: string,
  defaultCurrency: string,
  signOverride: 1 | -1 = 1
): NormalizedTxn | null {
  const dateRaw = mapping.date ? row[mapping.date] : null;
  const amountRaw = mapping.amount ? row[mapping.amount] : null;
  const date = parseDate(dateRaw);
  if (!date) return null;
  const amount = parseAmount(amountRaw) * signOverride;
  if (!isFinite(amount) || amount === 0) return null;

  const description = mapping.description ? String(row[mapping.description] ?? "") : "";
  const vendor = mapping.vendor ? String(row[mapping.vendor] ?? "") : null;
  // Currency cell may contain an ISO code ("USD"), a symbol ("$"), or a
  // local-language name ("שקל", "Euro"). resolveCurrencyCode maps any
  // of those onto the canonical 3-letter ISO. Falls back to the
  // workspace's base currency when the cell is empty / unrecognized so
  // the row still imports (the validation pass at the top of commit
  // is the gate that hard-blocks truly unsupported strings).
  const currencyRaw = mapping.currency ? row[mapping.currency] : null;
  const currency = resolveCurrencyCode(currencyRaw == null ? null : String(currencyRaw)) ?? defaultCurrency;
  const externalId = mapping.txnId ? String(row[mapping.txnId] ?? "") || null : null;
  const notes = mapping.notes ? String(row[mapping.notes] ?? "") || null : null;
  const rawCategory = mapping.category ? String(row[mapping.category] ?? "") || null : null;

  return {
    externalId,
    transactionDate: date,
    accountingMonth: dateToYM(date),
    amount,
    currency: currency || defaultCurrency,
    type: inferType(amount, source, description),
    vendor: vendor && vendor.trim() ? vendor.trim() : null,
    description: description.trim(),
    notes,
    rawCategory,
  };
}

function inferType(amount: number, source: string, description: string): string {
  const d = description.toLowerCase();
  if (source === "payroll") return "payroll";
  if (/\btax(es)?\b|vat|iva/i.test(d)) return "tax";
  if (/\bfee\b|charge|commission|interchange/i.test(d) && amount < 0) return "fee";
  if (/transfer|xfer|to savings|from savings/i.test(d)) return "transfer";
  if (amount > 0) return "income";
  return "expense";
}
