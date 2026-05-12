// Default category seed for a new business. Designed for SMB CEO clarity, not bookkeeping.
export const DEFAULT_CATEGORIES: { name: string; kind: string; isOneTime?: boolean }[] = [
  { name: "Product Revenue", kind: "revenue" },
  { name: "Service Revenue", kind: "revenue" },
  { name: "Other Income", kind: "revenue" },

  { name: "Rent", kind: "fixed" },
  { name: "SaaS & Subscriptions", kind: "fixed" },
  { name: "Insurance", kind: "fixed" },
  { name: "Internet & Utilities", kind: "fixed" },

  { name: "Marketing & Ads", kind: "variable" },
  { name: "Travel", kind: "variable" },
  { name: "Meals", kind: "variable" },
  { name: "Office Supplies", kind: "variable" },
  { name: "Contractors", kind: "variable" },
  { name: "Cost of Goods", kind: "variable" },

  { name: "Payroll", kind: "payroll" },
  { name: "Bonuses", kind: "payroll", isOneTime: true },

  { name: "Payment Processing Fees", kind: "fee" },
  { name: "Bank Fees", kind: "fee" },

  { name: "Taxes", kind: "tax" },

  { name: "Internal Transfer", kind: "transfer" },

  { name: "One-time Equipment", kind: "variable", isOneTime: true },
  { name: "Legal & Professional", kind: "variable" },

  { name: "Uncategorized", kind: "other" },
];

// Standard display order for categories across the whole app: income first
// (kind="revenue"), then outcome. Within each group sort alphabetically by
// name. Use this comparator anywhere a category list is rendered in a table
// or select so the user always sees revenue at the top.
export function compareCategoriesIncomeFirst<T extends { kind: string; name: string }>(a: T, b: T): number {
  const aIncome = a.kind === "revenue";
  const bIncome = b.kind === "revenue";
  if (aIncome !== bIncome) return aIncome ? -1 : 1;
  return a.name.localeCompare(b.name);
}
