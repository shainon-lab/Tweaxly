import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeRow, type ColumnMapping } from "@/lib/normalize";
import { findApplicableRule } from "@/lib/categorize";
import { findDuplicateCandidates } from "@/lib/duplicates";
import { detectAllSettlements } from "@/lib/settlements";
import { kindFromName, parseDate } from "@/lib/parsers";
import { convertAmount } from "@/lib/fx";
import { isSupportedCurrency } from "@/lib/currencies";

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
  // ─── Financial Sources fields ─────────────────────────────────────
  // Set by the guided bank-statement wizard. The batch is tagged so the
  // monthly coverage matrix can find it; if replaceBatchIds is set, the
  // listed batches are marked status="replaced" and their transactions
  // deleted in the same transaction the new batch is created in.
  financialSourceId?: string | null;
  periodStart?: string | null; // YYYY-MM
  periodEnd?:   string | null; // YYYY-MM
  replaceBatchIds?: string[];
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
//
// Every transaction is still saved as its own row with its own date —
// grouping happens at the category level so monthly reports can show
// one line per (category × month) instead of one line per raw bank
// description.
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

  // Optional period override - must be YYYY-MM and ≤ current month.
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

  // Either we have a date column OR a forced period - otherwise we'd have no
  // way to bucket the rows.
  if (!body.mapping?.date && !forceYM) {
    return NextResponse.json({
      error: "Either a Date column or a Period (forceAccountingMonth) is required.",
    }, { status: 400 });
  }

  // P&L-style files often have only [Category, Amount] columns - no date. If
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

  // Currency pre-validation. Block the entire upload (no rows
  // written, no UploadBatch created) if ANY row carries a currency
  // we can't convert via Frankfurter. The user gets a clear, single
  // error listing exactly which codes were unsupported so they can
  // fix the source file and re-upload.
  //
  // Same rule applies regardless of base currency - Frankfurter
  // exposes bilateral pairs between every currency in its supported
  // list, so a non-USD business (e.g. EUR base) inherits the same
  // supported set.
  if (!isSupportedCurrency(business.currency)) {
    return NextResponse.json({
      error: `Business base currency ${business.currency} is not supported by our exchange-rate provider. Please update your base currency in Settings before uploading.`,
    }, { status: 400 });
  }
  const unsupportedCodes = new Set<string>();
  const mappedCurrencyCol = body.mapping.currency;
  if (mappedCurrencyCol) {
    for (const row of body.rows) {
      const raw = row[mappedCurrencyCol];
      if (raw == null || raw === "") continue;
      const code = String(raw).trim().toUpperCase();
      if (code.length !== 3) continue;
      if (!isSupportedCurrency(code)) unsupportedCodes.add(code);
    }
  }
  if (unsupportedCodes.size > 0) {
    const list = Array.from(unsupportedCodes).sort().join(", ");
    return NextResponse.json({
      error: `This file includes a currency that is not supported and therefore it is not possible to upload the file. Unsupported currency code${unsupportedCodes.size === 1 ? "" : "s"}: ${list}. Please adjust the file with a supported currency and try uploading again.`,
      unsupportedCurrencies: Array.from(unsupportedCodes),
    }, { status: 400 });
  }

  // Validate financialSource ownership + replace targets up front so a
  // bad ID surfaces before we start writing rows.
  if (body.financialSourceId) {
    const owned = await prisma.financialSource.findFirst({
      where: { id: body.financialSourceId, businessId: business.id, status: "active" },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Financial source not found in this workspace." }, { status: 404 });
    }
  }
  if (body.replaceBatchIds && body.replaceBatchIds.length > 0) {
    const ownedCount = await prisma.uploadBatch.count({
      where: { id: { in: body.replaceBatchIds }, businessId: business.id, status: "active" },
    });
    if (ownedCount !== body.replaceBatchIds.length) {
      return NextResponse.json({ error: "One or more replace targets aren't valid." }, { status: 400 });
    }
  }

  // Period validation: must be YYYY-MM, periodStart <= periodEnd.
  const periodStart = body.periodStart ?? null;
  const periodEnd   = body.periodEnd   ?? periodStart;
  if (periodStart && !YM_RE.test(periodStart)) {
    return NextResponse.json({ error: "periodStart must be YYYY-MM." }, { status: 400 });
  }
  if (periodEnd && !YM_RE.test(periodEnd)) {
    return NextResponse.json({ error: "periodEnd must be YYYY-MM." }, { status: 400 });
  }
  if (periodStart && periodEnd && periodStart > periodEnd) {
    return NextResponse.json({ error: "periodStart must be <= periodEnd." }, { status: 400 });
  }

  // Replace + create batch atomically so a partial failure doesn't leave
  // dangling rows. The categorization / FX passes below run outside the
  // transaction since they're long-running and tolerate retries.
  const batch = await prisma.$transaction(async (tx) => {
    if (body.replaceBatchIds && body.replaceBatchIds.length > 0) {
      // Wipe the replaced batches' transactions, then mark the batches
      // themselves as replaced (replacedById is filled after the new
      // batch is created below).
      await tx.transaction.deleteMany({
        where: { uploadBatchId: { in: body.replaceBatchIds }, businessId: business.id },
      });
      await tx.uploadBatch.updateMany({
        where: { id: { in: body.replaceBatchIds }, businessId: business.id },
        data: { status: "replaced", replacedAt: new Date() },
      });
    }
    const created = await tx.uploadBatch.create({
      data: {
        businessId: business.id,
        source: body.source,
        filename: body.filename,
        rowCount: body.rows.length,
        financialSourceId: body.financialSourceId ?? null,
        periodStart,
        periodEnd,
      },
    });
    if (body.replaceBatchIds && body.replaceBatchIds.length > 0) {
      await tx.uploadBatch.updateMany({
        where: { id: { in: body.replaceBatchIds }, businessId: business.id },
        data: { replacedById: created.id },
      });
    }
    return created;
  });

  // Fetch existing rules. Uncategorized is no longer a fallback - instead each
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
    // "needs_review" - we still save the row but flag it so the user
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

  // Settlement detection — runs ALL three passes (credit-card / PayPal,
  // bank-to-bank transfers, payment-provider payouts) symmetrically
  // regardless of which source was just uploaded. Idempotent. Wrapped
  // in try/catch so a detection failure never breaks the import — the
  // user can correct individual rows from the Transactions page.
  let settlementsApplied = 0;
  let settlementSamples: { source: string; ym: string; amount: number; kind?: string }[] = [];
  let settlementBreakdown: { cardCount: number; paypalCount: number; transferCount: number; providerCount: number } = {
    cardCount: 0, paypalCount: 0, transferCount: 0, providerCount: 0,
  };
  try {
    const result = await detectAllSettlements(business.id);
    settlementsApplied =
      result.cardCount + result.paypalCount + result.transferCount + result.providerCount;
    settlementSamples = result.samples;
    settlementBreakdown = {
      cardCount: result.cardCount, paypalCount: result.paypalCount,
      transferCount: result.transferCount, providerCount: result.providerCount,
    };
  } catch (err) {
    console.error("[/api/upload/commit] settlement detection failed", err);
  }

  return NextResponse.json({
    imported: created.length,
    duplicateGroups: createdGroups,
    settlementsApplied,
    settlementSamples,
    settlementBreakdown,
  });
}
