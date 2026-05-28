// Plaid -> Tweaxly transaction & balance sync.
//
// Plaid's /transactions/sync is cursor-based and incremental: first
// call returns the full historical window; subsequent calls with the
// stored cursor return only added/modified/removed rows since then.
// Webhooks (SYNC_UPDATES_AVAILABLE) tell us when there's new data;
// the manual-refresh button calls this same function.
//
// Mapping into Tweaxly:
//   - Each Plaid account = one FinancialSource (created on first sync)
//   - Each Plaid transaction = one Transaction row with
//       source     = "plaid"
//       externalId = Plaid's transaction_id (unique per business)
//     so the existing dashboard / forecast / signals / consultation
//     queries see Plaid data the same way they see uploaded CSV data.
//   - Plaid's category goes into Transaction.subcategory (raw string);
//     categoryId stays null so the user can re-map via the existing
//     Tweaxly categorization UI. Vendor (merchant_name) is preserved
//     separately from category.
//
// Amount sign: Plaid returns positive amounts for outflows. Tweaxly's
// convention is negative for outflows / positive for inflows, so we
// flip the sign on every row.

import "server-only";
import { prisma } from "@/lib/db";
import { getPlaid } from "./client";
import { decryptAccessToken } from "./encryption";
import type {
  AccountBase,
  Transaction as PlaidTransaction,
  RemovedTransaction,
} from "plaid";

export interface SyncResult {
  ok:           boolean;
  added:        number;
  modified:     number;
  removed:      number;
  accounts:     number;
  error?:       string;
}

export async function syncPlaidConnection(connectionId: string): Promise<SyncResult> {
  const conn = await prisma.plaidConnection.findUnique({ where: { id: connectionId } });
  if (!conn) return { ok: false, added: 0, modified: 0, removed: 0, accounts: 0, error: "connection_not_found" };

  await prisma.plaidConnection.update({
    where: { id: connectionId },
    data:  { status: "syncing", lastSyncStartedAt: new Date(), lastError: null },
  });

  let accessToken: string;
  try {
    accessToken = decryptAccessToken(conn.accessTokenEnc);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "decrypt_failed";
    await prisma.plaidConnection.update({
      where: { id: connectionId },
      data:  { status: "error", lastError: msg },
    });
    return { ok: false, added: 0, modified: 0, removed: 0, accounts: 0, error: msg };
  }

  const plaid = getPlaid();

  try {
    // 1. Refresh account list + balances. Plaid returns current and
    //    available balance for every account on the Item.
    const accountsRes = await plaid.accountsBalanceGet({ access_token: accessToken });
    await upsertFinancialSources(conn.businessId, conn.id, accountsRes.data.accounts);

    // 2. Pull incremental transaction updates via /transactions/sync.
    //    First call (cursor="") returns the historical window; later
    //    calls return only what changed since the stored cursor.
    let cursor = conn.syncCursor;
    let added: PlaidTransaction[]    = [];
    let modified: PlaidTransaction[] = [];
    let removed: RemovedTransaction[] = [];
    let hasMore = true;
    let safetyMax = 25; // guardrail against infinite paging
    while (hasMore && safetyMax-- > 0) {
      const res = await plaid.transactionsSync({
        access_token: accessToken,
        cursor:       cursor || undefined,
        count:        500,
      });
      added    = added.concat(res.data.added);
      modified = modified.concat(res.data.modified);
      removed  = removed.concat(res.data.removed);
      cursor   = res.data.next_cursor;
      hasMore  = res.data.has_more;
    }

    // 3. Apply changes. The FinancialSource rows we just upserted
    //    provide the source-id mapping for transaction writes.
    const sources = await prisma.financialSource.findMany({
      where:  { plaidConnectionId: conn.id },
      select: { id: true, plaidAccountId: true, currency: true },
    });
    const sourceByAccountId = new Map(sources.map((s) => [s.plaidAccountId ?? "", s]));

    const addedCount    = await applyAdded(conn.businessId, conn.id, added, sourceByAccountId);
    const modifiedCount = await applyModified(conn.businessId, modified);
    const removedCount  = await applyRemoved(conn.businessId, removed);

    await prisma.plaidConnection.update({
      where: { id: connectionId },
      data:  {
        status:              "connected",
        syncCursor:          cursor,
        lastSyncCompletedAt: new Date(),
        lastError:           null,
      },
    });

    return {
      ok:       true,
      added:    addedCount,
      modified: modifiedCount,
      removed:  removedCount,
      accounts: accountsRes.data.accounts.length,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "sync_failed";
    console.error(`[plaid:sync] connection=${connectionId}`, err);
    await prisma.plaidConnection.update({
      where: { id: connectionId },
      data:  { status: "error", lastError: msg },
    });
    return { ok: false, added: 0, modified: 0, removed: 0, accounts: 0, error: msg };
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

async function upsertFinancialSources(
  businessId:   string,
  connectionId: string,
  accounts:     AccountBase[],
): Promise<void> {
  for (const a of accounts) {
    const name = friendlySourceName(a);
    const type = plaidTypeToSourceType(a.type);
    const currency = a.balances.iso_currency_code ?? a.balances.unofficial_currency_code ?? "USD";

    // Upsert keyed by (plaidConnectionId, plaidAccountId). The
    // FinancialSource @@unique on this pair makes this safe under
    // concurrent re-sync.
    await prisma.financialSource.upsert({
      where: {
        plaidConnectionId_plaidAccountId: {
          plaidConnectionId: connectionId,
          plaidAccountId:    a.account_id,
        },
      },
      create: {
        businessId,
        plaidConnectionId: connectionId,
        plaidAccountId:    a.account_id,
        name,
        type,
        currency,
        last4:             a.mask ?? null,
        startMonth:        new Date().toISOString().slice(0, 7),
        currentBalance:    a.balances.current   ?? null,
        availableBalance:  a.balances.available ?? null,
      },
      update: {
        // Keep the existing user-edited name; only update balances + currency.
        currency,
        last4:            a.mask ?? null,
        currentBalance:   a.balances.current   ?? null,
        availableBalance: a.balances.available ?? null,
      },
    });
  }
}

function plaidTypeToSourceType(plaidType: string): string {
  // Plaid types: depository | credit | loan | investment | other
  if (plaidType === "credit")     return "credit_card";
  if (plaidType === "depository") return "bank";
  return "other";
}

function friendlySourceName(a: AccountBase): string {
  const sub  = a.subtype ? ` ${humanize(a.subtype)}` : "";
  const tail = a.mask ? ` · ••${a.mask}` : "";
  return `${a.name}${sub}${tail}`.trim();
}

function humanize(s: string): string {
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Add new transactions. Skip any that are already in the DB (dedupe
// on externalId) - this makes the operation idempotent under retries.
async function applyAdded(
  businessId:        string,
  connectionId:      string,
  txns:              PlaidTransaction[],
  sourceByAccountId: Map<string, { id: string; currency: string }>,
): Promise<number> {
  if (txns.length === 0) return 0;

  const existingIds = new Set(
    (await prisma.transaction.findMany({
      where:  { businessId, source: "plaid", externalId: { in: txns.map((t) => t.transaction_id) } },
      select: { externalId: true },
    })).map((r) => r.externalId ?? "")
  );

  let written = 0;
  for (const t of txns) {
    if (existingIds.has(t.transaction_id)) continue;
    const src = sourceByAccountId.get(t.account_id);
    if (!src) continue; // no matching FinancialSource yet (shouldn't happen)

    const currency = t.iso_currency_code ?? t.unofficial_currency_code ?? src.currency;
    // Plaid: amount positive = outflow. Tweaxly: amount negative = outflow.
    const amount   = -t.amount;
    const date     = new Date(t.date);
    const month    = t.date.slice(0, 7);
    const category = (t.personal_finance_category?.primary ?? t.category?.[0] ?? null);

    await prisma.transaction.create({
      data: {
        businessId,
        source:           "plaid",
        externalId:       t.transaction_id,
        transactionDate:  date,
        accountingMonth:  month,
        amount,
        currency,
        baseCurrency:     currency,
        type:             amount < 0 ? "expense" : "income",
        vendor:           t.merchant_name ?? t.name ?? null,
        description:      t.name ?? "",
        subcategory:      category, // raw Plaid category; categoryId stays null
      },
    });
    written++;
  }

  // Connect each Plaid-source UploadBatch-style summary back to the
  // FinancialSource via the transaction-level join (existing reports
  // already group by Transaction.source).
  void connectionId;
  return written;
}

async function applyModified(
  businessId: string,
  txns:       PlaidTransaction[],
): Promise<number> {
  if (txns.length === 0) return 0;
  let updated = 0;
  for (const t of txns) {
    const r = await prisma.transaction.updateMany({
      where: { businessId, source: "plaid", externalId: t.transaction_id },
      data: {
        amount:          -t.amount,
        transactionDate: new Date(t.date),
        accountingMonth: t.date.slice(0, 7),
        vendor:          t.merchant_name ?? t.name ?? null,
        description:     t.name ?? "",
        subcategory:     t.personal_finance_category?.primary ?? t.category?.[0] ?? null,
      },
    });
    updated += r.count;
  }
  return updated;
}

// Plaid sends removals when a transaction is withdrawn (e.g. card
// reversal). Soft-delete to keep audit trail consistent with the way
// the bulk-trash flow handles user-requested deletes.
async function applyRemoved(
  businessId: string,
  removed:    RemovedTransaction[],
): Promise<number> {
  if (removed.length === 0) return 0;
  const ids = removed.map((r) => r.transaction_id).filter(Boolean) as string[];
  const r = await prisma.transaction.updateMany({
    where: { businessId, source: "plaid", externalId: { in: ids }, deletedAt: null },
    data:  { deletedAt: new Date() },
  });
  return r.count;
}
