// Rich demo seed: 15 employees, ~75 months of transactions from 2020-01 to
// 2026-05, designed to look like a real SMB lifecycle — scrappy founding,
// pandemic dip, growth ramp, plateau, recovery, and recent acceleration.
// Applies to every business owned by demo@example.com.
//
// Run with: tsx /tmp/seed-rich.ts  (source .env.production first)

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Roster = {
  name: string;
  role: string;
  department: string;
  startYM: string;
  endYM?: string;
  type: "employee" | "contractor";
  // Current monthly gross salary (employees) or monthly fee (contractors).
  salary: number;
  notes?: string;
};

const ROSTER: Roster[] = [
  { name: "Sarah Chen",      role: "Founder & CEO",         department: "Executive",      startYM: "2020-01", type: "employee",   salary: 7500 },
  { name: "Marcus Webb",     role: "CTO",                   department: "Engineering",    startYM: "2020-02", type: "employee",   salary: 7000 },
  { name: "Diego Martinez",  role: "Senior Engineer",       department: "Engineering",    startYM: "2020-03", type: "employee",   salary: 5400 },
  { name: "Hannah Park",     role: "Engineer",              department: "Engineering",    startYM: "2020-08", type: "employee",   salary: 4600 },
  { name: "Lisa Hoffman",    role: "Marketing Lead",        department: "Marketing",      startYM: "2021-01", type: "employee",   salary: 5200 },
  { name: "Tom Becker",      role: "Account Executive",     department: "Sales",          startYM: "2021-06", type: "employee",   salary: 5000 },
  { name: "Priya Shah",      role: "Product Designer",      department: "Product",        startYM: "2022-03", type: "employee",   salary: 4800 },
  { name: "Alex Rivera",     role: "Operations Manager",    department: "Operations",     startYM: "2022-09", type: "employee",   salary: 5500 },
  { name: "Mia Tanaka",      role: "Customer Success Lead", department: "Customer Success", startYM: "2023-01", type: "employee", salary: 4900 },
  { name: "Jonas Larsen",    role: "Engineering Manager",   department: "Engineering",    startYM: "2023-06", type: "employee",   salary: 7200 },
  { name: "Yara Kim",        role: "Marketing Specialist",  department: "Marketing",      startYM: "2024-02", type: "employee",   salary: 3900 },
  { name: "Felipe Costa",    role: "SDR",                   department: "Sales",          startYM: "2024-08", endYM: "2025-03", type: "employee", salary: 3500, notes: "Left for a larger team" },
  { name: "Quinn O'Brien",   role: "Content Writer",        department: "Marketing",      startYM: "2024-04", type: "contractor", salary: 2200, notes: "Monthly retainer" },
  { name: "Riley Singh",     role: "Engineer",              department: "Engineering",    startYM: "2025-04", type: "employee",   salary: 5800 },
  { name: "Sven Nielsen",    role: "Senior Engineer",       department: "Engineering",    startYM: "2025-09", type: "employee",   salary: 6400 },
];

const START_YM = "2020-01";
const END_YM   = "2026-05";

// Annual baseline monthly revenue — the "trend line" before seasonality.
// Calibrated so the business stays profitable in healthy months but goes
// red during dips/plateaus. 2024 is intentionally close to 2023 (plateau /
// "stability"), 2025 is recovery, 2026 is acceleration.
function baseMonthlyRevenue(year: number): number {
  switch (year) {
    case 2020: return 22000;
    case 2021: return 48000;
    case 2022: return 85000;
    case 2023: return 120000;
    case 2024: return 128000; // ← plateau / stability year
    case 2025: return 165000; // ← recovery + growth
    case 2026: return 220000; // ← acceleration
    default:   return 18000;
  }
}

// Seasonality multipliers. Realistic SMB rhythm: post-holiday dip in Jan,
// year-end push in Mar, summer slowdown, Q4 ramp peaking in Dec.
const SEASONALITY: Record<number, number> = {
  1: 0.86, 2: 0.92, 3: 1.10, 4: 1.02, 5: 1.04, 6: 0.93,
  7: 0.88, 8: 0.95, 9: 1.06, 10: 1.10, 11: 1.20, 12: 1.26,
};

// One-off macro events that override the smooth trend in a specific month.
// Values are multipliers applied to the seasonal+trend baseline.
const EVENTS: Record<string, number> = {
  "2020-04": 0.62, "2020-05": 0.58, "2020-06": 0.68, // COVID dip
  "2020-07": 0.75, "2020-08": 0.82,
  "2022-09": 1.45,                                   // Big enterprise contract
  "2023-12": 1.18,                                   // strong Q4 close
  "2024-07": 0.78, "2024-08": 0.82, "2024-09": 0.86, // mid-2024 churn period
  "2026-03": 1.22,                                   // 2026 momentum
  "2026-04": 1.18,
};

function pad2(n: number) { return String(n).padStart(2, "0"); }
function ymToParts(ym: string) { const [y, m] = ym.split("-").map(Number); return { year: y, month: m }; }
function ymFirstDate(ym: string, day = 1) {
  const { year, month } = ymToParts(ym);
  return new Date(Date.UTC(year, month - 1, day));
}
function shiftYM(ym: string, delta: number): string {
  const { year, month } = ymToParts(ym);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
}
function eachMonth(from: string, to: string): string[] {
  const out: string[] = [];
  let ym = from;
  while (ym <= to) { out.push(ym); ym = shiftYM(ym, 1); }
  return out;
}

// Seedable PRNG so re-runs produce identical data — useful for diffing.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function rosterActiveIn(ym: string): Roster[] {
  return ROSTER.filter((r) => ym >= r.startYM && (!r.endYM || ym <= r.endYM));
}

function roundMoney(n: number) { return Math.round(n * 100) / 100; }

async function seedBusiness(businessId: string, currency: string) {
  console.log(`\n=== Seeding business ${businessId} ===`);

  // Idempotent reset for this business.
  await prisma.transaction.deleteMany({ where: { businessId } });
  await prisma.employeeEvent.deleteMany({ where: { businessId } });
  await prisma.employee.deleteMany({ where: { businessId } });

  // Categories already exist on each business (the registration flow creates
  // them from DEFAULT_CATEGORIES). Build a name→id map for quick lookup.
  const cats = await prisma.category.findMany({ where: { businessId } });
  const catId = (name: string) => {
    const c = cats.find((x) => x.name === name);
    if (!c) throw new Error(`Category not found: ${name} on business ${businessId}`);
    return c.id;
  };

  // ── Employees ─────────────────────────────────────────────────────────
  for (const r of ROSTER) {
    const useBreakdown = r.type === "employee" && (r.startYM >= "2023-01" || r.salary >= 6000);
    const taxes    = useBreakdown ? roundMoney(r.salary * 0.18) : null;
    const pension  = useBreakdown ? roundMoney(r.salary * 0.05) : null;
    const benefits = useBreakdown ? roundMoney(r.salary * 0.04) : null;
    const additional = useBreakdown ? roundMoney(r.salary * 0.02) : null;
    await prisma.employee.create({
      data: {
        businessId,
        name: r.name,
        role: r.role,
        department: r.department,
        employmentType: r.type,
        grossMonthlySalary: r.salary,
        employerCostMultiplier: useBreakdown ? 1 : 1.25,
        employerTaxes: taxes,
        pension,
        benefits,
        additionalCosts: additional,
        status: r.endYM ? "terminated" : "active",
        startDate: ymFirstDate(r.startYM, 1),
        endDate: r.endYM ? ymFirstDate(r.endYM, 28) : null,
        notes: r.notes ?? null,
      },
    });
  }

  // ── Transactions ──────────────────────────────────────────────────────
  // Per-month: revenue (3 streams), recurring expenses, payroll, fees, plus
  // occasional one-times. Deterministic noise so re-runs are stable.
  const rand = rng(0xC0FFEE);
  const months = eachMonth(START_YM, END_YM);
  let created = 0;

  for (const ym of months) {
    const { year, month } = ymToParts(ym);
    const seasonal = SEASONALITY[month] ?? 1;
    const event = EVENTS[ym] ?? 1;
    const trend = baseMonthlyRevenue(year);
    const noise = 0.92 + rand() * 0.16; // ±8%
    const monthRevenue = trend * seasonal * event * noise;

    // Split revenue across streams: ~60% service retainer, ~30% product
    // invoices to mid-sized clients, ~10% other income.
    const serviceShare = 0.60 + rand() * 0.05;
    const productShare = 0.30 + rand() * 0.05;
    const otherShare   = Math.max(0, 1 - serviceShare - productShare);

    const serviceRev = monthRevenue * serviceShare;
    const productRev = monthRevenue * productShare;
    const otherRev   = monthRevenue * otherShare;

    // Service revenue (Stripe payouts) — chunked into 1-3 deposits
    const serviceChunks = year >= 2024 ? 3 : year >= 2022 ? 2 : 1;
    for (let i = 0; i < serviceChunks; i++) {
      const amt = roundMoney(serviceRev / serviceChunks);
      await prisma.transaction.create({
        data: {
          businessId,
          source: "stripe",
          transactionDate: ymFirstDate(ym, 5 + i * 10),
          accountingMonth: ym,
          amount: amt,
          currency,
          type: "income",
          categoryId: catId("Service Revenue"),
          vendor: "Stripe",
          description: i === 0 ? "Stripe payout — retainers" : `Stripe payout — wave ${i + 1}`,
          isRecurring: true,
        },
      });
      created++;
    }

    // Product/invoiced revenue
    if (productRev > 100) {
      const customers = year >= 2024 ? ["Acme Corp", "Northwind", "Globex", "Initech", "Umbrella"] :
                        year >= 2022 ? ["Acme Corp", "Northwind", "Globex"] :
                                       ["Acme Corp"];
      const invoices = Math.min(customers.length, year >= 2024 ? 3 : year >= 2022 ? 2 : 1);
      for (let i = 0; i < invoices; i++) {
        const amt = roundMoney(productRev / invoices);
        await prisma.transaction.create({
          data: {
            businessId,
            source: "invoicing",
            transactionDate: ymFirstDate(ym, 12 + i * 5),
            accountingMonth: ym,
            amount: amt,
            currency,
            type: "income",
            categoryId: catId("Product Revenue"),
            vendor: customers[i],
            description: `Invoice ${1000 + Math.floor(rand() * 5000)} — ${customers[i]}`,
          },
        });
        created++;
      }
    }

    // Other income (consulting, referrals, etc.)
    if (otherRev > 50) {
      await prisma.transaction.create({
        data: {
          businessId,
          source: "bank",
          transactionDate: ymFirstDate(ym, 22),
          accountingMonth: ym,
          amount: roundMoney(otherRev),
          currency,
          type: "income",
          categoryId: catId("Other Income"),
          vendor: rand() > 0.5 ? "Partner referral" : "Consulting one-off",
          description: "Misc income",
        },
      });
      created++;
    }

    // ── Recurring expenses ────────────────────────────────────────────
    // Rent: starts small, two step-ups across the timeline.
    const rentBase = year < 2022 ? 1800 : year < 2024 ? 3000 : year < 2026 ? 3800 : 4400;
    await prisma.transaction.create({
      data: {
        businessId,
        source: "bank",
        transactionDate: ymFirstDate(ym, 2),
        accountingMonth: ym,
        amount: -rentBase,
        currency,
        type: "expense",
        categoryId: catId("Rent"),
        vendor: year < 2022 ? "Coworking Hub" : "WeWork",
        description: "Office rent",
        isRecurring: true,
      },
    });
    created++;

    // SaaS subscriptions — set grows with team
    const headcount = rosterActiveIn(ym).length;
    const saasItems: { v: string; a: number; d: number }[] = [
      { v: "Notion",  a: 8 + 4 * headcount,  d: 8 },
      { v: "Slack",   a: 7 + 6 * headcount,  d: 10 },
      { v: "GitHub",  a: 4 + 3 * headcount,  d: 11 },
      { v: "Linear",  a: 8 * headcount,      d: 14 },
      { v: "AWS",     a: 200 + 60 * headcount + (year >= 2024 ? 500 : 0), d: 15 },
      { v: "Stripe",  a: 0, d: 16 }, // billed via fees instead
      { v: "Figma",   a: 4 * Math.min(headcount, 6), d: 17 },
    ];
    if (year >= 2022) saasItems.push({ v: "HubSpot", a: 250 + 12 * headcount, d: 17 });
    if (year >= 2023) saasItems.push({ v: "Vercel",  a: 80 + 18 * headcount,  d: 18 });
    if (year >= 2024) saasItems.push({ v: "Datadog", a: 240 + 25 * headcount, d: 19 });
    if (year >= 2025) saasItems.push({ v: "Anthropic", a: 180 + 30 * headcount, d: 19 });

    for (const s of saasItems) {
      if (s.a <= 0) continue;
      await prisma.transaction.create({
        data: {
          businessId,
          source: "credit_card",
          transactionDate: ymFirstDate(ym, s.d),
          accountingMonth: ym,
          amount: -roundMoney(s.a),
          currency,
          type: "expense",
          categoryId: catId("SaaS & Subscriptions"),
          vendor: s.v,
          description: `${s.v} subscription`,
          isRecurring: true,
        },
      });
      created++;
    }

    // Marketing — scales with revenue ambition (varies by year). Targets
    // roughly 8–12% of monthly revenue depending on phase.
    const marketingBudget =
      year < 2021 ? 1800 :
      year < 2022 ? 4500 :
      year < 2023 ? 9000 :
      year < 2025 ? 13000 :
                    18000;
    const marketingVendors = year >= 2023
      ? [{ v: "Google Ads", s: 0.45 }, { v: "Meta Ads", s: 0.30 }, { v: "LinkedIn Ads", s: 0.25 }]
      : year >= 2021
        ? [{ v: "Google Ads", s: 0.6 }, { v: "Meta Ads", s: 0.4 }]
        : [{ v: "Google Ads", s: 1.0 }];
    for (const mv of marketingVendors) {
      const amt = roundMoney(marketingBudget * mv.s * (0.9 + rand() * 0.2));
      await prisma.transaction.create({
        data: {
          businessId,
          source: "credit_card",
          transactionDate: ymFirstDate(ym, 18),
          accountingMonth: ym,
          amount: -amt,
          currency,
          type: "expense",
          categoryId: catId("Marketing & Ads"),
          vendor: mv.v,
          description: `${mv.v} campaign`,
        },
      });
      created++;
    }

    // Internet & Utilities
    await prisma.transaction.create({
      data: {
        businessId,
        source: "bank",
        transactionDate: ymFirstDate(ym, 8),
        accountingMonth: ym,
        amount: -(year < 2022 ? 110 : year < 2024 ? 180 : 240),
        currency,
        type: "expense",
        categoryId: catId("Internet & Utilities"),
        vendor: "Comcast Business",
        description: "Internet & utilities",
        isRecurring: true,
      },
    });
    created++;

    // Insurance — bi-annual but simplified to monthly accrual
    if (year >= 2021) {
      await prisma.transaction.create({
        data: {
          businessId,
          source: "bank",
          transactionDate: ymFirstDate(ym, 10),
          accountingMonth: ym,
          amount: -(year < 2024 ? 380 : 540),
          currency,
          type: "expense",
          categoryId: catId("Insurance"),
          vendor: "Hiscox",
          description: "Business insurance",
          isRecurring: true,
        },
      });
      created++;
    }

    // Office supplies
    if (rand() > 0.4) {
      await prisma.transaction.create({
        data: {
          businessId,
          source: "credit_card",
          transactionDate: ymFirstDate(ym, 11),
          accountingMonth: ym,
          amount: -roundMoney(60 + rand() * (year >= 2024 ? 240 : 90)),
          currency,
          type: "expense",
          categoryId: catId("Office Supplies"),
          vendor: rand() > 0.5 ? "Amazon Business" : "Staples",
          description: "Office supplies",
        },
      });
      created++;
    }

    // Meals — small recurring + travel-adjacent
    if (year >= 2021 && rand() > 0.35) {
      await prisma.transaction.create({
        data: {
          businessId,
          source: "credit_card",
          transactionDate: ymFirstDate(ym, 13),
          accountingMonth: ym,
          amount: -roundMoney(120 + rand() * (year >= 2024 ? 600 : 300)),
          currency,
          type: "expense",
          categoryId: catId("Meals"),
          vendor: "DoorDash / restaurants",
          description: "Team meals & client lunches",
        },
      });
      created++;
    }

    // Travel — sometimes
    if (year >= 2022 && month >= 3 && rand() > 0.65) {
      await prisma.transaction.create({
        data: {
          businessId,
          source: "credit_card",
          transactionDate: ymFirstDate(ym, 21),
          accountingMonth: ym,
          amount: -roundMoney(800 + rand() * 2400),
          currency,
          type: "expense",
          categoryId: catId("Travel"),
          vendor: "United Airlines",
          description: "Travel — conference / customer visit",
        },
      });
      created++;
    }

    // Contractors — only if a non-employee in roster active
    const activeContractors = rosterActiveIn(ym).filter((r) => r.type === "contractor");
    for (const c of activeContractors) {
      await prisma.transaction.create({
        data: {
          businessId,
          source: "bank",
          transactionDate: ymFirstDate(ym, 24),
          accountingMonth: ym,
          amount: -c.salary,
          currency,
          type: "expense",
          categoryId: catId("Contractors"),
          vendor: c.name,
          description: `${c.role} — monthly retainer`,
          isRecurring: true,
        },
      });
      created++;
    }

    // Legal & Professional — incorporation, accounting, occasional legal
    if (month === 3 || (year >= 2022 && rand() > 0.8)) {
      await prisma.transaction.create({
        data: {
          businessId,
          source: "bank",
          transactionDate: ymFirstDate(ym, 6),
          accountingMonth: ym,
          amount: -roundMoney(month === 3 ? 1800 + rand() * 1200 : 350 + rand() * 600),
          currency,
          type: "expense",
          categoryId: catId("Legal & Professional"),
          vendor: rand() > 0.5 ? "Latham & Watkins" : "Pilot.com",
          description: month === 3 ? "Annual filings & tax prep" : "Legal / professional services",
        },
      });
      created++;
    }

    // ── Payroll ──────────────────────────────────────────────────────
    const employees = rosterActiveIn(ym).filter((r) => r.type === "employee");
    if (employees.length > 0) {
      // Sum monthly costs using the breakdown rule (mirrors lib/workforce.ts).
      let totalPayrollCost = 0;
      for (const e of employees) {
        // Same logic the seed used when creating Employee records.
        const useBreakdown = e.startYM >= "2023-01" || e.salary >= 6000;
        if (useBreakdown) {
          totalPayrollCost += e.salary + e.salary * 0.18 + e.salary * 0.05 + e.salary * 0.04 + e.salary * 0.02;
        } else {
          totalPayrollCost += e.salary * 1.25;
        }
      }
      await prisma.transaction.create({
        data: {
          businessId,
          source: "payroll",
          transactionDate: ymFirstDate(ym, 28),
          accountingMonth: ym,
          amount: -roundMoney(totalPayrollCost),
          currency,
          type: "payroll",
          categoryId: catId("Payroll"),
          vendor: "Gusto",
          description: `Monthly payroll · ${employees.length} employee${employees.length === 1 ? "" : "s"}`,
          isRecurring: true,
        },
      });
      created++;
    }

    // Bonuses — yearly in Dec for everyone, plus occasional spot bonuses
    if (month === 12 && employees.length > 0) {
      const bonusPool = employees.reduce((s, e) => s + e.salary * 0.20, 0);
      await prisma.transaction.create({
        data: {
          businessId,
          source: "payroll",
          transactionDate: ymFirstDate(ym, 20),
          accountingMonth: ym,
          amount: -roundMoney(bonusPool),
          currency,
          type: "payroll",
          categoryId: catId("Bonuses"),
          vendor: "Gusto",
          description: "Annual bonus pool",
          isOneTime: true,
        },
      });
      created++;
    }
    // Spot bonus randomly
    if (year >= 2022 && rand() > 0.92 && employees.length > 0) {
      const target = employees[Math.floor(rand() * employees.length)];
      await prisma.transaction.create({
        data: {
          businessId,
          source: "payroll",
          transactionDate: ymFirstDate(ym, 15),
          accountingMonth: ym,
          amount: -roundMoney(800 + rand() * 2200),
          currency,
          type: "payroll",
          categoryId: catId("Bonuses"),
          vendor: "Gusto",
          description: `Spot bonus — ${target.name}`,
          isOneTime: true,
        },
      });
      created++;
    }

    // Stripe / payment fees — ~2.9% of inbound revenue
    const fees = monthRevenue * 0.029;
    await prisma.transaction.create({
      data: {
        businessId,
        source: "stripe",
        transactionDate: ymFirstDate(ym, 5),
        accountingMonth: ym,
        amount: -roundMoney(fees),
        currency,
        type: "fee",
        categoryId: catId("Payment Processing Fees"),
        vendor: "Stripe",
        description: "Payment processing fees",
        isRecurring: true,
      },
    });
    created++;

    // Bank fees — small monthly
    await prisma.transaction.create({
      data: {
        businessId,
        source: "bank",
        transactionDate: ymFirstDate(ym, 1),
        accountingMonth: ym,
        amount: -(year < 2023 ? 25 : 45),
        currency,
        type: "fee",
        categoryId: catId("Bank Fees"),
        vendor: "Chase Business",
        description: "Bank account fees",
        isRecurring: true,
      },
    });
    created++;

    // Taxes — quarterly estimates (Mar, Jun, Sep, Dec)
    if ([3, 6, 9, 12].includes(month) && monthRevenue > 5000) {
      const taxAmt = monthRevenue * 0.18;
      await prisma.transaction.create({
        data: {
          businessId,
          source: "bank",
          transactionDate: ymFirstDate(ym, 25),
          accountingMonth: ym,
          amount: -roundMoney(taxAmt),
          currency,
          type: "tax",
          categoryId: catId("Taxes"),
          vendor: "IRS",
          description: "Quarterly estimated taxes",
          isRecurring: false,
        },
      });
      created++;
    }

    // One-time equipment when hires happen
    const hiresThisMonth = ROSTER.filter((r) => r.startYM === ym);
    for (const h of hiresThisMonth) {
      if (h.type !== "employee") continue;
      await prisma.transaction.create({
        data: {
          businessId,
          source: "credit_card",
          transactionDate: ymFirstDate(ym, 4),
          accountingMonth: ym,
          amount: -roundMoney(1800 + rand() * 1400),
          currency,
          type: "expense",
          categoryId: catId("One-time Equipment"),
          vendor: "Apple",
          description: `Laptop & setup — ${h.name}`,
          isOneTime: true,
        },
      });
      created++;
    }
  }

  console.log(`  Employees: ${ROSTER.length}  ·  Transactions created: ${created}`);
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "demo@example.com" } });
  if (!user) throw new Error("demo@example.com not found — run the basic seed first");
  const businesses = await prisma.business.findMany({ where: { ownerId: user.id } });
  if (businesses.length === 0) throw new Error("no businesses for demo user");
  for (const b of businesses) {
    await seedBusiness(b.id, b.currency);
  }
  console.log("\nDone.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
