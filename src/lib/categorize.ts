// Apply CategorizationRule rows to a transaction. Higher priority wins.
import type { CategorizationRule, Transaction } from "@prisma/client";

export type RuleMatchInput = Pick<Transaction, "description" | "vendor" | "source">;

export function matchRule(rule: CategorizationRule, txn: RuleMatchInput): boolean {
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
    if (matchRule(r, txn)) {
      return { categoryId: r.categoryId, setRecurring: r.setRecurring, setOneTime: r.setOneTime };
    }
  }
  return null;
}
