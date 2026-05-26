// Apply CategorizationRule / VendorizationRule rows to a transaction.
// Higher priority wins. Both rule types share the same match shape
// (matchField + matchType + pattern); only the action differs.
import type { CategorizationRule, VendorizationRule, Transaction } from "@prisma/client";

export type RuleMatchInput = Pick<Transaction, "description" | "vendor" | "source">;

// Generic matcher - works for either rule kind since both have the
// same matchField / matchType / pattern columns.
function matchPattern(
  rule: { matchField: string; matchType: string; pattern: string },
  txn: RuleMatchInput,
): boolean {
  const fieldVal = (() => {
    switch (rule.matchField) {
      case "vendor": return txn.vendor ?? "";
      case "source": return txn.source ?? "";
      case "description":
      default: return txn.description ?? "";
    }
  })().toLowerCase();
  const pat = rule.pattern.toLowerCase();
  switch (rule.matchType) {
    case "equals": return fieldVal === pat;
    case "startsWith": return fieldVal.startsWith(pat);
    case "regex":
      try { return new RegExp(rule.pattern, "i").test(fieldVal); }
      catch { return false; }
    case "contains":
    default: return fieldVal.includes(pat);
  }
}

export function matchRule(rule: CategorizationRule, txn: RuleMatchInput): boolean {
  return matchPattern(rule, txn);
}

export type RuleApplication = {
  categoryId: string;
  setRecurring: boolean;
  setOneTime: boolean;
};

export function findApplicableRule(
  rules: CategorizationRule[],
  txn: RuleMatchInput
): RuleApplication | null {
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);
  for (const r of sorted) {
    if (matchPattern(r, txn)) {
      return { categoryId: r.categoryId, setRecurring: r.setRecurring, setOneTime: r.setOneTime };
    }
  }
  return null;
}

export type VendorRuleApplication = {
  vendorName: string;
};

export function findApplicableVendorRule(
  rules: VendorizationRule[],
  txn: RuleMatchInput,
): VendorRuleApplication | null {
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);
  for (const r of sorted) {
    if (matchPattern(r, txn)) {
      return { vendorName: r.vendorName };
    }
  }
  return null;
}
