// Suggested common business categories per the Vendor / Category spec.
// Surfaced as quick-pick suggestions in the Add Category modal AND in
// the Transactions bulk category picker. Suggestions only - nothing
// is ever auto-created from this list until the user picks one.

export const SUGGESTED_EXPENSE_CATEGORIES = [
  "Rent",
  "Payroll",
  "Payment Processing Fees",
  "Advertising",
  "Software",
  "Accounting",
  "Taxes",
  "Government Fees",
  "Utilities",
  "Office Services",
  "Internet & Telephony",
  "Vehicle Expenses",
  "Equipment",
  "Travel",
  "Professional Services",
] as const;

export const SUGGESTED_INCOME_CATEGORIES = [
  "Product Sales",
  "Service Revenue",
  "Subscription Revenue",
  "Consulting Revenue",
  "One-Time Payments",
  "Refunds / Adjustments",
  "Other Income",
] as const;

export type SuggestedCategoryKind = "income" | "expense";

export function suggestedCategoriesByKind(kind: SuggestedCategoryKind): readonly string[] {
  return kind === "income" ? SUGGESTED_INCOME_CATEGORIES : SUGGESTED_EXPENSE_CATEGORIES;
}
