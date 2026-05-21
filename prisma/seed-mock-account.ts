// Mock-data seed for a single account.
//
// Target user: shainon+767356@gmail.com
// Window:      June 2025 → April 2026 (11 months)
//
// Generates a realistic SMB lifecycle inside that window:
//   • 3 employees with growing salaries
//   • Monthly subscription revenue + occasional one-time sales
//   • Payroll, software, marketing, office, equipment + misc
//   • Modest growth trend with one dip month for realism
//   • A handful of one-time items + Dec seasonal pattern
//
// Idempotent: deletes anything in the window for the target business
// before re-seeding, so re-running gives a clean state.
//
// Run:
//   DATABASE_URL=... npx tsx prisma/seed-mock-account.ts
// Restart the Next 14 product dev server (port 3000) afterwards so
// any cached Prisma client / query plans pick up the new rows.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_EMAIL    = "shainon+767356@gmail.com";
const BUSINESS_NAME   = "Mock Studio";
const BUSINESS_CCY    = "USD";
const START_YM        = "2025-06";
const END_YM          = "2026-04";

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function pad2(n: number) { return String(n).padStart(2, "0"); }
function parseYM(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return { year: y, month: m };
}
function dateInMonth(ym: string, day: number): Date {
  const { year, month } = parseYM(ym);
  return new Date(Date.UTC(year, month - 1, day));
}
function eachMonth(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = from;
  while (cur <= to) {
    out.push(cur);
    const { year, month } = parseYM(cur);
    const next = month === 12 ? `${year + 1}-01` : `${year}-${pad2(month + 1)}`;
    cur = next;
  }
  return out;
}
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
function round2(n: number) { return Math.round(n * 100) / 100; }

// ─────────────────────────────────────────────────────────────────────
// Data: revenue trend + employees + recurring categories
// ─────────────────────────────────────────────────────────────────────

// Monthly baseline revenue across the window. Starts at ~$12K in
// Jun 2025 and grows to ~$35K by Apr 2026, with one dip in Dec 2025
// for seasonal realism. Random ±10% noise added per month.
const REVENUE_BASELINE: Record<string, number> = {
  "2025-06": 12_000,
  "2025-07": 13_500,
  "2025-08": 15_200,
  "2025-09": 16_800,
  "2025-10": 18_500,
  "2025-11": 20_000,
  "2025-12": 16_500, // ← seasonal dip
  "2026-01": 22_000,
  "2026-02": 26_500,
  "2026-03": 30_000,
  "2026-04": 34_500,
};

interface Hire {
  name:    string;
  role:    string;
  startYM: string;
  endYM?:  string;
  salary:  number;   // gross monthly USD
}
const HIRES: Hire[] = [
  { name: "Maya Cohen",   role: "Founder",          startYM: "2025-06", salary: 5500 },
  { name: "Jordan Reyes", role: "Engineer",         startYM: "2025-08", salary: 4800 },
  { name: "Sam Ahmed",    role: "Marketing Lead",   startYM: "2025-11", salary: 4200 },
];

interface CategoryDef { name: string; kind: string; isOneTime?: boolean }
const CATEGORIES: CategoryDef[] = [
  { name: "Subscription Revenue", kind: "revenue" },
  { name: "Consulting Revenue",   kind: "revenue" },
  { name: "Other Income",         kind: "revenue" },
  { name: "Payroll",              kind: "payroll" },
  { name: "Contractor Fees",      kind: "variable" },
  { name: "Software & SaaS",      kind: "fixed"   },
  { name: "Marketing",            kind: "marketing" },
  { name: "Office & Rent",        kind: "fixed"   },
  { name: "Travel",               kind: "variable" },
  { name: "Professional Services", kind: "fixed" },
  { name: "Equipment",            kind: "variable", isOneTime: true },
  { name: "Bank & Processing Fees", kind: "fee"  },
  { name: "Other Expenses",       kind: "other" },
];

// Recurring monthly spend. Each entry produces one transaction per
// month it's active. Amount is jittered ±5% per month.
interface Recurring {
  category:  string;
  vendor:    string;
  description: string;
  amount:    number;   // positive USD
  activeFrom?: string; // YM, inclusive
}
const RECURRING: Recurring[] = [
  { category: "Software & SaaS",       vendor: "Notion",       description: "Notion workspace",         amount:  48 },
  { category: "Software & SaaS",       vendor: "Slack",        description: "Slack Standard",           amount:  87 },
  { category: "Software & SaaS",       vendor: "GitHub",       description: "GitHub Team",              amount:  96 },
  { category: "Software & SaaS",       vendor: "AWS",          description: "AWS infrastructure",       amount: 420, activeFrom: "2025-06" },
  { category: "Software & SaaS",       vendor: "Vercel",       description: "Vercel Pro",               amount:  40 },
  { category: "Software & SaaS",       vendor: "Linear",       description: "Linear Standard",          amount:  72, activeFrom: "2025-08" },
  { category: "Software & SaaS",       vendor: "Figma",        description: "Figma Organization",       amount:  90, activeFrom: "2025-09" },
  { category: "Software & SaaS",       vendor: "Stripe",       description: "Stripe processing fees",   amount: 180 },
  { category: "Office & Rent",         vendor: "WeWork",       description: "Co-working hot desks",     amount: 850, activeFrom: "2025-07" },
  { category: "Professional Services", vendor: "Schwartz CPA", description: "Accounting retainer",      amount: 450 },
  { category: "Bank & Processing Fees", vendor: "Chase",       description: "Business banking fees",    amount:  35 },
];

// ─────────────────────────────────────────────────────────────────────
// Seed body
// ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Looking up user: ${TARGET_EMAIL}`);
  const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } });
  if (!user) {
    throw new Error(
      `User ${TARGET_EMAIL} not found. Sign up first at /register, then re-run this script.`,
    );
  }
  console.log(`  ✓ user id ${user.id}`);

  // Find or create the business. Prefer the user's first existing
  // business (so re-runs don't proliferate workspaces); create one
  // if they have none.
  let business = await prisma.business.findFirst({
    where:   { ownerId: user.id },
    orderBy: { createdAt: "asc" },
  });
  if (!business) {
    console.log(`  No business found - creating "${BUSINESS_NAME}"`);
    business = await prisma.business.create({
      data: {
        ownerId:    user.id,
        name:       BUSINESS_NAME,
        currency:   BUSINESS_CCY,
        status:     "active",
        plan:       "free",
      },
    });
    // Membership row so the workspaces / admin UI can find it.
    await prisma.businessMembership.create({
      data: {
        userId:     user.id,
        businessId: business.id,
        role:       "account_admin",
        status:     "active",
        joinedAt:   new Date(),
      },
    });
    console.log(`  ✓ business id ${business.id}`);
  } else {
    console.log(`  ✓ using existing business "${business.name}" (${business.id})`);
  }

  // Wipe anything in the window for clean re-runs. Scoped to this
  // business only.
  const months = eachMonth(START_YM, END_YM);
  console.log(`Clearing existing transactions in ${months[0]} → ${months[months.length - 1]}…`);
  const deleted = await prisma.transaction.deleteMany({
    where: {
      businessId:      business.id,
      accountingMonth: { in: months },
    },
  });
  console.log(`  ✓ deleted ${deleted.count} prior transactions`);

  // Ensure categories exist. We upsert by (businessId, name) using
  // a findFirst + create pattern since the Prisma schema doesn't
  // expose a unique on the pair.
  console.log(`Ensuring ${CATEGORIES.length} categories…`);
  const catIdByName = new Map<string, string>();
  for (const c of CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { businessId: business.id, name: c.name },
    });
    if (existing) {
      catIdByName.set(c.name, existing.id);
      continue;
    }
    const row = await prisma.category.create({
      data: {
        businessId: business.id,
        name:       c.name,
        kind:       c.kind,
        isOneTime:  Boolean(c.isOneTime),
      },
    });
    catIdByName.set(c.name, row.id);
  }
  const catId = (name: string) => {
    const id = catIdByName.get(name);
    if (!id) throw new Error(`missing category: ${name}`);
    return id;
  };

  // Employees. Wipe + recreate so re-runs are clean.
  console.log(`Replacing employee roster (${HIRES.length} hires)…`);
  await prisma.employeeEvent.deleteMany({ where: { employee: { businessId: business.id } } });
  await prisma.employee.deleteMany({       where: { businessId: business.id } });
  for (const h of HIRES) {
    await prisma.employee.create({
      data: {
        businessId:        business.id,
        name:              h.name,
        role:              h.role,
        employmentType:    "employee",
        status:            h.endYM ? "terminated" : "active",
        startDate:         dateInMonth(h.startYM, 1),
        endDate:           h.endYM ? dateInMonth(h.endYM, 28) : null,
        grossMonthlySalary: h.salary,
      },
    });
  }

  // Build the txn ledger. Deterministic per-month RNG so repeated
  // runs produce stable-looking jitter (helpful for screenshots).
  let created = 0;
  for (let i = 0; i < months.length; i++) {
    const ym   = months[i];
    const rand = rng(parseInt(ym.replace("-", ""), 10));

    // ── Revenue ────────────────────────────────────────────────
    const baseRev = REVENUE_BASELINE[ym] ?? 15_000;
    // Split between subscription (steady core) and consulting (lumpier).
    const subsRev    = round2(baseRev * (0.65 + rand() * 0.10));
    const consultRev = round2(baseRev * (0.20 + rand() * 0.15));
    const otherRev   = round2(baseRev * (rand() * 0.08));

    await prisma.transaction.create({
      data: {
        businessId:       business.id,
        source:           "csv_upload",
        transactionDate:  dateInMonth(ym, 1),
        accountingMonth:  ym,
        amount:           subsRev,
        currency:         BUSINESS_CCY,
        type:             "income",
        categoryId:       catId("Subscription Revenue"),
        vendor:           "Stripe",
        description:      "Monthly subscriptions (Stripe payout)",
      },
    });
    created++;

    // Consulting comes in a few chunks across the month, not one tx.
    const consultChunks = 2 + Math.floor(rand() * 3); // 2-4 invoices
    let consultLeft = consultRev;
    for (let k = 0; k < consultChunks; k++) {
      const last = k === consultChunks - 1;
      const slice = last ? consultLeft : round2(consultRev * (0.15 + rand() * 0.30));
      consultLeft = round2(consultLeft - slice);
      if (slice <= 0) continue;
      await prisma.transaction.create({
        data: {
          businessId:       business.id,
          source:           "csv_upload",
          transactionDate:  dateInMonth(ym, 5 + Math.floor(rand() * 20)),
          accountingMonth:  ym,
          amount:           slice,
          currency:         BUSINESS_CCY,
          type:             "income",
          categoryId:       catId("Consulting Revenue"),
          vendor:           `Client ${String.fromCharCode(65 + k)}`,
          description:      "Consulting engagement",
        },
      });
      created++;
    }

    if (otherRev > 50) {
      await prisma.transaction.create({
        data: {
          businessId:       business.id,
          source:           "csv_upload",
          transactionDate:  dateInMonth(ym, 22),
          accountingMonth:  ym,
          amount:           otherRev,
          currency:         BUSINESS_CCY,
          type:             "income",
          categoryId:       catId("Other Income"),
          vendor:           "Misc",
          description:      "Other income",
        },
      });
      created++;
    }

    // ── Payroll ────────────────────────────────────────────────
    for (const h of HIRES) {
      if (h.startYM > ym) continue;
      if (h.endYM && h.endYM < ym) continue;
      // Mid-window raises - so trends are visible in the dashboard.
      const monthsIn = (parseYM(ym).year - parseYM(h.startYM).year) * 12
                     + (parseYM(ym).month - parseYM(h.startYM).month);
      const raiseFactor = monthsIn >= 6 ? 1.08 : 1.0;
      const gross = round2(h.salary * raiseFactor);
      await prisma.transaction.create({
        data: {
          businessId:       business.id,
          source:           "csv_upload",
          transactionDate:  dateInMonth(ym, 28),
          accountingMonth:  ym,
          amount:           -gross,
          currency:         BUSINESS_CCY,
          type:             "expense",
          categoryId:       catId("Payroll"),
          vendor:           "Gusto",
          description:      `Payroll - ${h.name}`,
        },
      });
      created++;
    }

    // ── Recurring expenses ────────────────────────────────────
    for (const r of RECURRING) {
      if (r.activeFrom && r.activeFrom > ym) continue;
      const jitter = 0.95 + rand() * 0.10;
      const amount = round2(-r.amount * jitter);
      await prisma.transaction.create({
        data: {
          businessId:       business.id,
          source:           "csv_upload",
          transactionDate:  dateInMonth(ym, 3 + Math.floor(rand() * 5)),
          accountingMonth:  ym,
          amount,
          currency:         BUSINESS_CCY,
          type:             "expense",
          categoryId:       catId(r.category),
          vendor:           r.vendor,
          description:      r.description,
        },
      });
      created++;
    }

    // ── Marketing - grows with revenue ────────────────────────
    const marketingBudget = round2(baseRev * (0.06 + rand() * 0.04));
    const adsSpend  = round2(-marketingBudget * 0.65);
    const otherMkt  = round2(-marketingBudget * 0.35);
    await prisma.transaction.create({
      data: {
        businessId:       business.id,
        source:           "csv_upload",
        transactionDate:  dateInMonth(ym, 14),
        accountingMonth:  ym,
        amount:           adsSpend,
        currency:         BUSINESS_CCY,
        type:             "expense",
        categoryId:       catId("Marketing"),
        vendor:           "Google Ads",
        description:      "Paid search",
      },
    });
    created++;
    if (otherMkt < -30) {
      await prisma.transaction.create({
        data: {
          businessId:       business.id,
          source:           "csv_upload",
          transactionDate:  dateInMonth(ym, 18),
          accountingMonth:  ym,
          amount:           otherMkt,
          currency:         BUSINESS_CCY,
          type:             "expense",
          categoryId:       catId("Marketing"),
          vendor:           "LinkedIn Ads",
          description:      "Social + content",
        },
      });
      created++;
    }

    // ── Occasional one-times ──────────────────────────────────
    // New-hire laptop + setup
    const hiresThisMonth = HIRES.filter((h) => h.startYM === ym);
    for (const h of hiresThisMonth) {
      await prisma.transaction.create({
        data: {
          businessId:       business.id,
          source:           "csv_upload",
          transactionDate:  dateInMonth(ym, 4),
          accountingMonth:  ym,
          amount:           -round2(2100 + rand() * 800),
          currency:         BUSINESS_CCY,
          type:             "expense",
          categoryId:       catId("Equipment"),
          vendor:           "Apple",
          description:      `Laptop & setup - ${h.name}`,
          isOneTime:        true,
        },
      });
      created++;
    }

    // Quarterly travel / offsite (Sep, Dec, Mar)
    if (["2025-09", "2025-12", "2026-03"].includes(ym)) {
      await prisma.transaction.create({
        data: {
          businessId:       business.id,
          source:           "csv_upload",
          transactionDate:  dateInMonth(ym, 12),
          accountingMonth:  ym,
          amount:           -round2(900 + rand() * 700),
          currency:         BUSINESS_CCY,
          type:             "expense",
          categoryId:       catId("Travel"),
          vendor:           "Delta Airlines",
          description:      "Team offsite / customer travel",
        },
      });
      created++;
    }

    // Annual insurance hit (one month: 2025-10)
    if (ym === "2025-10") {
      await prisma.transaction.create({
        data: {
          businessId:       business.id,
          source:           "csv_upload",
          transactionDate:  dateInMonth(ym, 6),
          accountingMonth:  ym,
          amount:           -2400,
          currency:         BUSINESS_CCY,
          type:             "expense",
          categoryId:       catId("Professional Services"),
          vendor:           "Hiscox",
          description:      "Annual business insurance",
          isOneTime:        true,
        },
      });
      created++;
    }

    // Q1 marketing push (Feb 2026)
    if (ym === "2026-02") {
      await prisma.transaction.create({
        data: {
          businessId:       business.id,
          source:           "csv_upload",
          transactionDate:  dateInMonth(ym, 20),
          accountingMonth:  ym,
          amount:           -3500,
          currency:         BUSINESS_CCY,
          type:             "expense",
          categoryId:       catId("Marketing"),
          vendor:           "Press Release Wire",
          description:      "Launch campaign push",
          isOneTime:        true,
        },
      });
      created++;
    }
  }

  console.log(`\n  ✓ ${created} transactions created across ${months.length} months`);
  console.log("\nDone. Restart the Next 14 dev server on port 3000 to make sure the dashboard picks up the new data.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
