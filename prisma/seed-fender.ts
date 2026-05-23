// Mock-data seed for the FENDER workspace.
//
// Owner:    shainon@gmail.com
// Business: FENDER (boutique guitar studio + small dealer storyline)
// Window:   Jan 2025 → Dec 2026 (24 months)
//
// Generates a realistic 2-year arc for a small music-industry SMB:
//   • 4 employees with hires across the window
//   • Mixed revenue: instrument sales, lesson subscriptions, repair
//     work, occasional gig/endorsement income
//   • Recurring costs: rent, payroll, software, inventory, marketing
//   • Seasonal spikes (Nov/Dec holiday sales, summer gear-buy)
//   • One-time hits: trade-show booth, big inventory order, etc.
//
// Idempotent: deletes anything in the window for this business
// before re-seeding so re-running gives a clean state.
//
// Run:
//   DATABASE_URL=... npx tsx prisma/seed-fender.ts
// Restart the Next 14 product dev server (port 3000) afterwards so
// the dashboard picks up the new rows.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_BUSINESS_ID = "cmpha7ntk000fyues8hc2o54x";
const BUSINESS_CCY       = "USD";
const START_YM           = "2025-01";
const END_YM             = "2026-12";

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
    cur = month === 12 ? `${year + 1}-01` : `${year}-${pad2(month + 1)}`;
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
// Revenue baseline — boutique guitar shop trajectory.
// Slow ramp 2025, summer + holiday spikes, second-year scale.
// ─────────────────────────────────────────────────────────────────────
const REVENUE_BASELINE: Record<string, number> = {
  // 2025: opening year, finding rhythm
  "2025-01": 18_000,
  "2025-02": 19_500,
  "2025-03": 22_000,
  "2025-04": 24_000,
  "2025-05": 26_500,
  "2025-06": 29_000,  // summer pickup
  "2025-07": 31_500,
  "2025-08": 33_000,
  "2025-09": 28_000,  // back-to-school dip after summer
  "2025-10": 32_000,
  "2025-11": 41_000,  // Black Friday / holiday push
  "2025-12": 48_500,  // peak holiday
  // 2026: scale year
  "2026-01": 26_000,  // post-holiday lull
  "2026-02": 30_500,
  "2026-03": 35_000,
  "2026-04": 38_000,
  "2026-05": 41_500,
  "2026-06": 46_000,  // summer
  "2026-07": 50_000,
  "2026-08": 52_500,
  "2026-09": 44_000,
  "2026-10": 50_000,
  "2026-11": 62_000,
  "2026-12": 72_000,  // big holiday year
};

interface Hire {
  name:    string;
  role:    string;
  startYM: string;
  endYM?:  string;
  salary:  number;   // gross monthly USD
}
const HIRES: Hire[] = [
  { name: "Leo Fender",     role: "Owner / Master Tech",   startYM: "2025-01", salary: 6500 },
  { name: "Casey Park",     role: "Sales Lead",            startYM: "2025-03", salary: 4200 },
  { name: "Riley Thompson", role: "Guitar Tech",           startYM: "2025-07", salary: 4500 },
  { name: "Morgan Daly",    role: "Lessons Coordinator",   startYM: "2026-02", salary: 4000 },
];

interface CategoryDef { name: string; kind: string; isOneTime?: boolean }
const CATEGORIES: CategoryDef[] = [
  // Revenue
  { name: "Instrument Sales",       kind: "revenue" },
  { name: "Lesson Subscriptions",   kind: "revenue" },
  { name: "Repairs & Setup",        kind: "revenue" },
  { name: "Accessories & Strings",  kind: "revenue" },
  { name: "Endorsement / Gig Fees", kind: "revenue" },
  // Expenses
  { name: "Payroll",                kind: "payroll" },
  { name: "Inventory - Guitars",    kind: "variable" },
  { name: "Inventory - Accessories", kind: "variable" },
  { name: "Rent & Utilities",       kind: "fixed" },
  { name: "Software & SaaS",        kind: "fixed" },
  { name: "Marketing",              kind: "marketing" },
  { name: "Travel",                 kind: "variable" },
  { name: "Professional Services",  kind: "fixed" },
  { name: "Equipment",              kind: "variable", isOneTime: true },
  { name: "Bank & Processing Fees", kind: "fee" },
  { name: "Other Expenses",         kind: "other" },
];

// Recurring monthly spend. activeFrom respected for staged onboarding.
interface Recurring {
  category:   string;
  vendor:     string;
  description: string;
  amount:     number;   // positive USD; the sign flips at insert
  activeFrom?: string;
}
const RECURRING: Recurring[] = [
  { category: "Rent & Utilities",       vendor: "Sunset Plaza Mgmt", description: "Storefront lease",         amount: 4200 },
  { category: "Rent & Utilities",       vendor: "City Power",        description: "Electric utility",          amount:  340 },
  { category: "Rent & Utilities",       vendor: "Comcast Business",  description: "Internet + phone",          amount:  180 },
  { category: "Software & SaaS",        vendor: "Lightspeed POS",    description: "POS + inventory system",    amount:  149 },
  { category: "Software & SaaS",        vendor: "Shopify",           description: "Online store",              amount:   99 },
  { category: "Software & SaaS",        vendor: "QuickBooks",        description: "Accounting software",        amount:   85 },
  { category: "Software & SaaS",        vendor: "Mailchimp",         description: "Email + customer CRM",       amount:   75, activeFrom: "2025-04" },
  { category: "Software & SaaS",        vendor: "Stripe",            description: "Card processing platform",   amount:  220 },
  { category: "Software & SaaS",        vendor: "Calendly",          description: "Lessons booking",            amount:   24, activeFrom: "2026-02" },
  { category: "Professional Services",  vendor: "Schwartz CPA",      description: "Accounting retainer",        amount:  650 },
  { category: "Bank & Processing Fees", vendor: "Chase",             description: "Business banking fees",      amount:   55 },
];

// ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Targeting FENDER workspace: ${TARGET_BUSINESS_ID}`);
  const business = await prisma.business.findUnique({ where: { id: TARGET_BUSINESS_ID } });
  if (!business) throw new Error(`Business ${TARGET_BUSINESS_ID} not found`);
  console.log(`  ✓ "${business.name}" (${business.currency})`);

  const months = eachMonth(START_YM, END_YM);
  console.log(`Clearing existing transactions ${months[0]} → ${months[months.length - 1]}…`);
  const deleted = await prisma.transaction.deleteMany({
    where: { businessId: business.id, accountingMonth: { in: months } },
  });
  console.log(`  ✓ deleted ${deleted.count} prior transactions`);

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

  console.log(`Replacing employee roster (${HIRES.length} hires)…`);
  await prisma.employeeEvent.deleteMany({ where: { employee: { businessId: business.id } } });
  await prisma.employee.deleteMany({       where: { businessId: business.id } });
  for (const h of HIRES) {
    await prisma.employee.create({
      data: {
        businessId:         business.id,
        name:               h.name,
        role:               h.role,
        employmentType:     "employee",
        status:             h.endYM ? "terminated" : "active",
        startDate:          dateInMonth(h.startYM, 1),
        endDate:            h.endYM ? dateInMonth(h.endYM, 28) : null,
        grossMonthlySalary: h.salary,
      },
    });
  }

  let created = 0;
  for (const ym of months) {
    const rand = rng(parseInt(ym.replace("-", ""), 10));
    const baseRev = REVENUE_BASELINE[ym] ?? 25_000;

    // Revenue mix:
    //   Instrument sales:    50-60% (lumpier - 3-5 sales per month)
    //   Lesson subs:         15-22% (steady)
    //   Repairs:             10-15% (steady)
    //   Accessories/strings: 8-12%  (lots of small chunks)
    //   Endorsement fees:    0-5%   (occasional)
    const instrumentTotal  = round2(baseRev * (0.50 + rand() * 0.10));
    const lessonTotal      = round2(baseRev * (0.15 + rand() * 0.07));
    const repairTotal      = round2(baseRev * (0.10 + rand() * 0.05));
    const accessoriesTotal = round2(baseRev * (0.08 + rand() * 0.04));
    const endorsementTotal = round2(baseRev * (rand() * 0.05));

    // Instrument sales — 3-5 chunks
    const instrChunks = 3 + Math.floor(rand() * 3);
    let instrLeft = instrumentTotal;
    for (let k = 0; k < instrChunks; k++) {
      const last  = k === instrChunks - 1;
      const slice = last ? instrLeft : round2(instrumentTotal * (0.18 + rand() * 0.28));
      instrLeft = round2(instrLeft - slice);
      if (slice <= 0) continue;
      const items = ["Stratocaster", "Telecaster", "Jazzmaster", "Mustang", "Jaguar", "P-Bass", "Jazz Bass"];
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 3 + Math.floor(rand() * 24)),
          accountingMonth: ym,
          amount:          slice,
          currency:        BUSINESS_CCY,
          type:            "income",
          categoryId:      catId("Instrument Sales"),
          vendor:          "In-store sale",
          description:     `${items[k % items.length]} sale`,
        },
      });
      created++;
    }

    // Lessons — monthly Stripe payout
    await prisma.transaction.create({
      data: {
        businessId:      business.id,
        source:          "csv_upload",
        transactionDate: dateInMonth(ym, 2),
        accountingMonth: ym,
        amount:          lessonTotal,
        currency:        BUSINESS_CCY,
        type:            "income",
        categoryId:      catId("Lesson Subscriptions"),
        vendor:          "Stripe",
        description:     "Monthly lesson subscriptions",
      },
    });
    created++;

    // Repairs — 2-3 service tickets
    const repChunks = 2 + Math.floor(rand() * 2);
    let repLeft = repairTotal;
    for (let k = 0; k < repChunks; k++) {
      const last  = k === repChunks - 1;
      const slice = last ? repLeft : round2(repairTotal * (0.30 + rand() * 0.20));
      repLeft = round2(repLeft - slice);
      if (slice <= 0) continue;
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 7 + Math.floor(rand() * 18)),
          accountingMonth: ym,
          amount:          slice,
          currency:        BUSINESS_CCY,
          type:            "income",
          categoryId:      catId("Repairs & Setup"),
          vendor:          `Customer ${String.fromCharCode(65 + k)}`,
          description:     "Setup + fret level",
        },
      });
      created++;
    }

    // Accessories — single monthly aggregate
    if (accessoriesTotal > 50) {
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 28),
          accountingMonth: ym,
          amount:          accessoriesTotal,
          currency:        BUSINESS_CCY,
          type:            "income",
          categoryId:      catId("Accessories & Strings"),
          vendor:          "Counter sales",
          description:     "Strings, picks, cables, straps",
        },
      });
      created++;
    }

    // Endorsement / gig — occasional
    if (endorsementTotal > 200) {
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 20),
          accountingMonth: ym,
          amount:          endorsementTotal,
          currency:        BUSINESS_CCY,
          type:            "income",
          categoryId:      catId("Endorsement / Gig Fees"),
          vendor:          "Local artist deal",
          description:     "Artist endorsement / live gig",
        },
      });
      created++;
    }

    // ── Payroll ────────────────────────────────────────────────
    for (const h of HIRES) {
      if (h.startYM > ym) continue;
      if (h.endYM && h.endYM < ym) continue;
      const monthsIn = (parseYM(ym).year - parseYM(h.startYM).year) * 12
                     + (parseYM(ym).month - parseYM(h.startYM).month);
      // Two raises across the 24-month arc: at 6 and 14 months in.
      const raiseFactor = monthsIn >= 14 ? 1.15 : monthsIn >= 6 ? 1.08 : 1.0;
      const gross = round2(h.salary * raiseFactor);
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 28),
          accountingMonth: ym,
          amount:          -gross,
          currency:        BUSINESS_CCY,
          type:            "expense",
          categoryId:      catId("Payroll"),
          vendor:          "Gusto",
          description:     `Payroll - ${h.name}`,
        },
      });
      created++;
    }

    // ── Inventory restock — scales with prior-month sales ──────
    // Guitars: chunky restock, 2 per month avg
    const guitarRestock = round2(baseRev * (0.30 + rand() * 0.05));
    await prisma.transaction.create({
      data: {
        businessId:      business.id,
        source:          "csv_upload",
        transactionDate: dateInMonth(ym, 8),
        accountingMonth: ym,
        amount:          -guitarRestock,
        currency:        BUSINESS_CCY,
        type:            "expense",
        categoryId:      catId("Inventory - Guitars"),
        vendor:          "Fender Distribution",
        description:     "Restock - electric & bass guitars",
      },
    });
    created++;

    // Accessories restock
    const accRestock = round2(baseRev * (0.05 + rand() * 0.03));
    await prisma.transaction.create({
      data: {
        businessId:      business.id,
        source:          "csv_upload",
        transactionDate: dateInMonth(ym, 15),
        accountingMonth: ym,
        amount:          -accRestock,
        currency:        BUSINESS_CCY,
        type:            "expense",
        categoryId:      catId("Inventory - Accessories"),
        vendor:          "D'Addario Wholesale",
        description:     "Strings, picks, cables - bulk order",
      },
    });
    created++;

    // ── Recurring expenses ────────────────────────────────────
    for (const r of RECURRING) {
      if (r.activeFrom && r.activeFrom > ym) continue;
      const jitter = 0.95 + rand() * 0.10;
      const amount = round2(-r.amount * jitter);
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 3 + Math.floor(rand() * 5)),
          accountingMonth: ym,
          amount,
          currency:        BUSINESS_CCY,
          type:            "expense",
          categoryId:      catId(r.category),
          vendor:          r.vendor,
          description:     r.description,
        },
      });
      created++;
    }

    // ── Marketing — grows with revenue, spikes for holidays ───
    const isHolidayMonth = ["2025-11", "2025-12", "2026-11", "2026-12"].includes(ym);
    const mktMultiplier  = isHolidayMonth ? 0.12 : 0.05;
    const marketingBudget = round2(baseRev * (mktMultiplier + rand() * 0.03));
    const adsSpend = round2(-marketingBudget * 0.70);
    const localMkt = round2(-marketingBudget * 0.30);
    await prisma.transaction.create({
      data: {
        businessId:      business.id,
        source:          "csv_upload",
        transactionDate: dateInMonth(ym, 14),
        accountingMonth: ym,
        amount:          adsSpend,
        currency:        BUSINESS_CCY,
        type:            "expense",
        categoryId:      catId("Marketing"),
        vendor:          "Meta Ads",
        description:     isHolidayMonth ? "Holiday paid social push" : "Paid social",
      },
    });
    created++;
    if (localMkt < -50) {
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 19),
          accountingMonth: ym,
          amount:          localMkt,
          currency:        BUSINESS_CCY,
          type:            "expense",
          categoryId:      catId("Marketing"),
          vendor:          "Local Print Co.",
          description:     "Flyers + community sponsorships",
        },
      });
      created++;
    }

    // ── One-times ─────────────────────────────────────────────
    // New-hire equipment
    const hiresThisMonth = HIRES.filter((h) => h.startYM === ym);
    for (const h of hiresThisMonth) {
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 4),
          accountingMonth: ym,
          amount:          -round2(1400 + rand() * 600),
          currency:        BUSINESS_CCY,
          type:            "expense",
          categoryId:      catId("Equipment"),
          vendor:          "Apple",
          description:     `Laptop + tools - ${h.name}`,
          isOneTime:       true,
        },
      });
      created++;
    }

    // Annual insurance (October each year)
    if (ym === "2025-10" || ym === "2026-10") {
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 6),
          accountingMonth: ym,
          amount:          -3200,
          currency:        BUSINESS_CCY,
          type:            "expense",
          categoryId:      catId("Professional Services"),
          vendor:          "Hiscox",
          description:     "Annual business + inventory insurance",
          isOneTime:       true,
        },
      });
      created++;
    }

    // NAMM trade-show trip (Jan each year)
    if (ym === "2025-01" || ym === "2026-01") {
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 12),
          accountingMonth: ym,
          amount:          -round2(2200 + rand() * 800),
          currency:        BUSINESS_CCY,
          type:            "expense",
          categoryId:      catId("Travel"),
          vendor:          "NAMM Show",
          description:     "NAMM trade-show travel + booth",
          isOneTime:       true,
        },
      });
      created++;
    }

    // Mid-year big inventory order (July each year)
    if (ym === "2025-07" || ym === "2026-07") {
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 10),
          accountingMonth: ym,
          amount:          -round2(8500 + rand() * 3500),
          currency:        BUSINESS_CCY,
          type:            "expense",
          categoryId:      catId("Inventory - Guitars"),
          vendor:          "Fender Distribution",
          description:     "Summer NAMM order - bulk stock",
          isOneTime:       true,
        },
      });
      created++;
    }

    // Workshop equipment upgrade (one-time, Q2 2026)
    if (ym === "2026-04") {
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 22),
          accountingMonth: ym,
          amount:          -4800,
          currency:        BUSINESS_CCY,
          type:            "expense",
          categoryId:      catId("Equipment"),
          vendor:          "Stewart-MacDonald",
          description:     "Pro fret + truss-rod tool upgrade",
          isOneTime:       true,
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
