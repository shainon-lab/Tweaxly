// Data confidence scoring.
//
// Computes a 0-100 score representing how trustworthy a business's
// dataset is for reporting and AI consumption. Surfaces in the admin
// data-health view and can be embedded into AI prompts so the model
// hedges its language when the data is thin or broken.
//
// Scoring is intentionally conservative — perfect data is 100;
// realistically most healthy businesses land 70-90 once they have
// a few months of clean uploads. Below 50 means the AI should
// explicitly tell the user "data is incomplete; treat this as a
// directional estimate".

import { prisma } from "./db";

export interface ConfidenceComponent {
  key:   string;
  score: number;      // 0-100 contribution
  weight: number;     // weight in the final average
  detail: string;
}

export interface ConfidenceReport {
  businessId: string;
  score:      number;             // 0-100 overall
  band:       "low" | "medium" | "high";
  components: ConfidenceComponent[];
  warnings:   string[];
}

export async function buildDataConfidence(
  businessId: string,
): Promise<ConfidenceReport> {
  const [
    totalTxns, uncategorized, missingDate, dupCandidates,
    months, fxNeedsReview, latestUpload,
  ] = await Promise.all([
    prisma.transaction.count({ where: { businessId } }),
    prisma.transaction.count({ where: { businessId, categoryId: null } }),
    // Defensive: NULL accountingMonth would mean upstream bug. We
    // still count for the health signal.
    prisma.transaction.count({
      where: { businessId, accountingMonth: { in: ["", "0000-00"] } },
    }),
    prisma.transaction.count({ where: { businessId, isDuplicateCandidate: true } }),
    prisma.transaction.findMany({
      where: { businessId },
      select: { accountingMonth: true },
      distinct: ["accountingMonth"],
    }),
    prisma.transaction.count({
      where: { businessId, rateFetchStatus: { in: ["needs_review", "failed", "missing"] } },
    }),
    prisma.uploadBatch.findFirst({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const components: ConfidenceComponent[] = [];
  const warnings: string[] = [];

  // Component 1: History depth (max 25% weight).
  {
    const monthsCount = months.length;
    const score = Math.min(100, (monthsCount / 6) * 100);
    components.push({
      key:    "history_depth",
      score,
      weight: 0.25,
      detail: `${monthsCount} month${monthsCount === 1 ? "" : "s"} of data`,
    });
    if (monthsCount < 3) warnings.push("Less than 3 months of history — trend reads are unreliable.");
  }

  // Component 2: Categorization completeness (25%).
  {
    const pct = totalTxns === 0 ? 0 : (1 - uncategorized / totalTxns) * 100;
    components.push({
      key:    "categorization",
      score:  pct,
      weight: 0.25,
      detail: totalTxns === 0
        ? "No transactions yet."
        : `${uncategorized}/${totalTxns} uncategorized (${(100 - pct).toFixed(1)}%)`,
    });
    if (uncategorized > 0 && uncategorized / Math.max(1, totalTxns) > 0.1) {
      warnings.push("More than 10% of transactions are uncategorized — category-level totals will understate spend.");
    }
  }

  // Component 3: Duplicate hygiene (15%).
  {
    const pct = totalTxns === 0 ? 100 : Math.max(0, 100 - (dupCandidates / totalTxns) * 100);
    components.push({
      key:    "duplicate_hygiene",
      score:  pct,
      weight: 0.15,
      detail: `${dupCandidates} potential duplicates flagged`,
    });
    if (dupCandidates > 0) warnings.push(`${dupCandidates} potential duplicate transaction(s) flagged — review before relying on totals.`);
  }

  // Component 4: Date integrity (10%).
  {
    const pct = totalTxns === 0 ? 100 : (1 - missingDate / totalTxns) * 100;
    components.push({
      key:    "date_integrity",
      score:  pct,
      weight: 0.10,
      detail: missingDate === 0
        ? "All transactions have valid dates"
        : `${missingDate} transactions missing/invalid date`,
    });
    if (missingDate > 0) warnings.push(`${missingDate} transaction(s) have missing or invalid dates — excluded from period reports.`);
  }

  // Component 5: FX integrity (10%).
  {
    const pct = totalTxns === 0 ? 100 : (1 - fxNeedsReview / totalTxns) * 100;
    components.push({
      key:    "fx_integrity",
      score:  pct,
      weight: 0.10,
      detail: fxNeedsReview === 0
        ? "All multi-currency rows converted cleanly"
        : `${fxNeedsReview} rows with unresolved exchange-rate status`,
    });
    if (fxNeedsReview > 0) warnings.push(`${fxNeedsReview} transaction(s) have unresolved FX rates — set a manual rate or re-import.`);
  }

  // Component 6: Freshness (15%).
  {
    let pct = 100;
    let detail = "No uploads yet";
    if (latestUpload?.createdAt) {
      const ageDays = (Date.now() - latestUpload.createdAt.getTime()) / 86_400_000;
      // Linear decay: 0 days = 100, 30 days = 70, 90 days = 0.
      pct = Math.max(0, 100 - (ageDays / 90) * 100);
      detail = `Last upload ${Math.round(ageDays)} day${Math.round(ageDays) === 1 ? "" : "s"} ago`;
      if (ageDays > 45) warnings.push(`Last data upload was ${Math.round(ageDays)} days ago — current-month totals may be incomplete.`);
    }
    components.push({ key: "freshness", score: pct, weight: 0.15, detail });
  }

  const overall = components.reduce((s, c) => s + c.score * c.weight, 0)
                / components.reduce((s, c) => s + c.weight, 0);

  const band: ConfidenceReport["band"] =
    overall >= 80 ? "high" :
    overall >= 50 ? "medium" : "low";

  return {
    businessId,
    score: Math.round(overall),
    band,
    components,
    warnings,
  };
}
