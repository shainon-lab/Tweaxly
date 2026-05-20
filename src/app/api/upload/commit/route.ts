import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeRow, type ColumnMapping } from "@/lib/normalize";
import { findApplicableRule } from "@/lib/categorize";
import { findDuplicateCandidates } from "@/lib/duplicates";
import { kindFromName, parseDate } from "@/lib/parsers";
import { convertAmount } from "@/lib/fx";

export const runtime = "nodejs";

type Body = {
  source: string;
  filename: string;
  rows: Record<string, unknown>[];
  mapping: ColumnMapping;
  signOverride?: number;
  saveTemplateName?: string | null;
  // When set, every row is force-signed: "income" → +abs(amount), type "income";
  // "outcome" → −abs(amount), type "expense". The input sign is ignored.
  // Used by the Manual Data bulk upload where the user declares the direction.
  forceDirection?: "income" | "outcome";
  // When set ("YYYY-MM"), every row's accountingMonth is overridden to this
  // value regardless of the parsed transactionDate. Used by Manual Data bulk
  // uploads where the user is uploading data that represents a specific
  // period (e.g. an exported P&L for May 2026).
  forceAccountingMonth?: string;
};

const YM_RE = /^\d{4}-\d{2}$/;

function currentYM(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Lightly normalize a transaction name so two near-identical descriptions like
// "AMAZON.COM 1234ABC " and "AMAZON.COM 1234ABC" land in the same category.
// Conservative: trim, collapse whitespace, drop trailing reference numbers
// that look like "#12345" or "REF1234567".
function normalizeName(raw: string): string {
  let s = raw.trim().replace(/\s+/g, " ");
  s = s.replace(/\s+#\s*\d+$/, "");
  s = s.replace(/\s+REF\s*\d{4,}$/i, "");
  return s;
}

export async function POST(req: NextRequest) {
  const { business } = await requireBusiness();
  const body = (await req.json()) as Body;
  if (!body.mapping?.amount) {
    return NextResponse.json({ error: "Amount column is required." }, { status: 400 });
  }

  const sign: 1 | -1 = body.signOverride === -1 ? -1 : 1;

  // Optional period override — must be YYYY-MM and ≤ current month.
  let forceYM: string | null = null;
  if (body.forceAccountingMonth) {
    if (!YM_RE.test(body.forceAccountingMonth)) {
      return NextResponse.json({ error: "forceAccountingMonth must be YYYY-MM" }, { status: 400 });
    }
    if (body.forceAccountingMonth > currentYM()) {
      return NextResponse.json({ error: "forceAccountingMonth cannot be in the future" }, { status: 400 });
    }
    forceYM = body.forceAccountingMonth;
  }

  // Either we have a date column OR a forced period — otherwise we'd have no
  // way to bucket the rows.
  if (!body.mapping?.date && !forceYM) {
    return NextResponse.json({
      error: "Either a Date column or a Period (forceAccountingMonth) is required.",
    }, { status: 400 });
  }

  // P&L-style files often have only [Category, Amount] columns — no date. If
  // the user supplied a period, synthesize a date column on the rows so
  // downstream parsing has a valid date for every row. Rows that DO have a
  // valid date in the mapped column keep theirs; rows with missing/bad dates
  // get the 1st of the chosen month.
  if (forceYM) {
    const SYNTH = "_synth_date";
    const dateCol = body.mapping.date ?? SYNTH;
    const fallback = `${forceYM}-01`;
    body.rows = body.rows.map((r) => {
      const v = body.mapping.date ? r[body.mapping.date] : null;
      const ok = v != null && v !== "" && parseDate(v);
      return ok ? r : { ...r, [dateCol]: fallback };
    });
    if (!body.mapping.date) {
      body.mapping = { ...body.mapping, date: dateCol };
    }
  }

  const batch = await prisma.uploadBatch.create({
    data: {
      businessId: business.id,
      source: body.source,
      filename: body.filename,
      rowCount: body.rows.length,
    },
  });

  // Fetch existing rules. Uncategorized is no longer a fallback — instead each
  // unmapped transaction creates / reuses a category named after the transaction
  // itself (vendor or description).
  const rules = await prisma.categorizationRule.findMany({
    where: { businessId: business.id },
  });

  // In-memory cache of categories looked up / created during this commit, so
  // we don't hit the DB once per row when the same vendor appears repeatedly.
  const categoryCache = new Map<string, { id: string; isOneTime: boolean }>();

  // PASS 1: pre-aggregate transactions per name to set kind correctly when
  // creating new categories. (E.g. if a vendor's net is income, mark
  // kind=revenue; otherwise kind=other.) This way the first transaction's
  // sign doesn't lock a category into the wrong bucket.
  type RowInfo = {
    norm: ReturnType<typeof normalizeRow>;
    name: string | null;
    ruleCategoryId: string | null;
  };
  const rowInfos: RowInfo[] = [];
  const netByName = new Map<string, number>();
  const forceDir = body.forceDirection;
  for (const row of body.rows) {
    const norm = normalizeRow(row, body.mapping, body.source, business.currency, sign);
    if (!norm) {
      rowInfos.push({ norm, name: null, ruleCategoryId: null });
      continue;
    }
    // Apply forceDirection: every row force-signed to match the user's choice.
    if (forceDir) {
      const magnitude = Math.abs(norm.amount);
      norm.amount = forceDir === "income" ? magnitude : -magnitude;
      norm.type = forceDir === "income" ? "income" : "expense";
    }
    // Apply forceAccountingMonth: every row gets bucketed into this month
    // regardless of the row's parsed transaction date.
    if (forceYM) {
      norm.accountingMonth = forceYM;
    }
    const ruleApp = findApplicableRule(rules, {
      description: norm.description,
      vendor: norm.vendor,
      source: body.source,
    });
    let name: string | null = null;
    if (!ruleApp) {
      const raw = norm.vendor || norm.description || "";
      const cleaned = normalizeName(raw);
      if (cleaned) name = cleaned;
    }
    rowInfos.push({
      norm,
      name,
      ruleCategoryId: ruleApp?.categoryId ?? null,
    });
    if (name) {
      netByName.set(name, (netByName.get(name) ?? 0) + norm.amount);
    }
  }

  async function ensureCategoryByName(name: string, netAmount: number) {
    const cached = categoryCache.get(name);
    if (cached) return cached;
    let cat = await prisma.category.findFirst({
      where: { businessId: business.id, name },
    });
    if (!cat) {
      // Decide kind:
      //   - Net inflow ⇒ revenue (income wins, even when the name happens to
      //     match a non-revenue heuristic like "stripe" or "paypal")
      //   - Net outflow + name matches a known expense bucket ⇒ that bucket
      //   - Net outflow + unknown name ⇒ "other"
      const heuristic = kindFromName(name);
      let kind: string;
      if (netAmount > 0) {
        kind = "revenue";
      } else if (heuristic.kind !== "other") {
        kind = heuristic.kind;
      } else {
        kind = "other";
      }
      cat = await prisma.category.create({
        data: {
          businessId: business.id,
          name,
          kind,
          isOneTime: heuristic.isOneTime,
        },
      });
    }
    const entry = { id: cat.id, isOneTime: cat.isOneTime };
    categoryCache.set(name, entry);
    return entry;
  }

  const created: { id: string }[] = [];
  for (const info of rowInfos) {
    if (!info.norm) continue;
    const norm = info.norm;
    let categoryId: string | null = info.ruleCategoryId;
    let isOneTime = false;
    if (!categoryId && info.name) {
      const cat = await ensureCategoryByName(info.name, netByName.get(info.name) ?? norm.amount);
      categoryId = cat.id;
      isOneTime = cat.isOneTime;
    }
    const ruleApp = findApplicableRule(rules, {
      description: norm.description,
      vendor: norm.vendor,
      source: body.source,
    });
    // Convert the row's amount into the business base currency. The
    // service handles same-currency short-circuits, local cache hits,
    // Frankfurter lookups, and weekend roll-back. If the rate is
    // unavailable, the conversion result reports rateFetchStatus =
    // "needs_review" — we still save the row but flag it so the user
    // can manually fix the rate from Transaction → FX Override.
    const conv = await convertAmount(
      norm.amount,
      norm.currency,
      business.currency,
      norm.transactionDate,
    );
    const t = await prisma.transaction.create({
      data: {
        businessId: business.id,
        uploadBatchId: batch.id,
        source: body.source,
        originalSourceFile: body.filename,
        externalId: norm.externalId,
        transactionDate: norm.transactionDate,
        accountingMonth: norm.accountingMonth,
        amount: conv.amount,
        currency: norm.currency,
        originalAmount: conv.originalAmount,
        originalCurrency: conv.originalCurrency,
        baseCurrency: conv.baseCurrency,
        exchangeRate: conv.exchangeRate,
        exchangeRateDate: conv.exchangeRateDate,
        exchangeRateSource: conv.exchangeRateSource,
        conversionMethod: conv.conversionMethod,
        isConverted: conv.isConverted,
        rateFetchStatus: conv.rateFetchStatus,
        type: body.source === "payroll" ? "payroll" : norm.type,
        categoryId,
        vendor: norm.vendor,
        description: norm.description,
        notes: norm.notes,
        isRecurring: ruleApp?.setRecurring ?? false,
        isOneTime: ruleApp?.setOneTime ?? isOneTime,
      },
    });
    created.push({ id: t.id });
  }

  // Re-detect duplicates over a recent window (-90 days) to keep the work bounded.
  const since = new Date(Date.now() - 90 * 86400000);
  const recent = await prisma.transaction.findMany({
    where: { businessId: business.id, transactionDate: { gte: since } },
  });
  const groups = findDuplicateCandidates(recent);

  // Merge: clear flag on transactions previously flagged but not in current results,
  // and create groups for any new sets where none of the txns is already grouped.
  const flaggedIds = new Set<string>();
  for (const g of groups) for (const id of g.txnIds) flaggedIds.add(id);

  await prisma.transaction.updateMany({
    where: { businessId: business.id, isDuplicateCandidate: true, id: { notIn: Array.from(flaggedIds) } },
    data: { isDuplicateCandidate: false, duplicateGroupId: null },
  });

  let createdGroups = 0;
  for (const g of groups) {
    const existing = await prisma.transaction.findFirst({
      where: { id: { in: g.txnIds }, duplicateGroupId: { not: null } },
      select: { duplicateGroupId: true },
    });
    if (existing?.duplicateGroupId) {
      await prisma.transaction.updateMany({
        where: { id: { in: g.txnIds } },
        data: { duplicateGroupId: existing.duplicateGroupId, isDuplicateCandidate: true },
      });
    } else {
      const dg = await prisma.duplicateGroup.create({
        data: { businessId: business.id, reason: g.reason, status: "open" },
      });
      await prisma.transaction.updateMany({
        where: { id: { in: g.txnIds } },
        data: { duplicateGroupId: dg.id, isDuplicateCandidate: true },
      });
      createdGroups++;
    }
  }

  // Save mapping template if requested.
  if (body.saveTemplateName) {
    await prisma.mappingTemplate.upsert({
      where: { businessId_name: { businessId: business.id, name: body.saveTemplateName } },
      update: { mapping: JSON.stringify(body.mapping), source: body.source },
      create: {
        businessId: business.id,
        name: body.saveTemplateName,
        source: body.source,
        mapping: JSON.stringify(body.mapping),
      },
    });
  }

  return NextResponse.json({
    imported: created.length,
    duplicateGroups: createdGroups,
  });
}
