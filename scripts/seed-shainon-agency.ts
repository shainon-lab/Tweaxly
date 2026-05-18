// One-shot mock data seeder for shainon@gmail.com → MAIN BUSINESS.
//
// Story: Digital agency, founded Jan 2023. 7 employees added over time.
// 2023: bootstrap + slow growth.
// 2024: rough year — client churn, summer trough, recovery starts in Q4.
// 2025: steady recovery, ends strong.
// 2026 (Jan–May): high-growth — current state of the business.
//
// Everything is deterministic — running the script twice produces the
// exact same data. Re-running wipes the business's existing transactions /
// employees / vendors / categories first.

import { prisma } from "../src/lib/db";

const EMAIL = "shainon@gmail.com";
const BIZ_NAME = "MAIN BUSINESS";
const START_YM = { y: 2023, m: 1 };
const END_YM   = { y: 2026, m: 5 };

// Deterministic PRNG so the script is reproducible.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(0xA11CE);
const r = (min: number, max: number) => min + rand() * (max - min);
const rInt = (min: number, max: number) => Math.floor(r(min, max + 1));
const pick = <T>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

function ym(y: number, m: number) { return `${y}-${String(m).padStart(2, "0")}`; }
function date(y: number, m: number, d: number) { return new Date(Date.UTC(y, m - 1, d)); }
function lastDay(y: number, m: number) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
function monthsBetween(a: { y: number; m: number }, b: { y: number; m: number }) {
  const out: { y: number; m: number }[] = [];
  let y = a.y, m = a.m;
  while (y < b.y || (y === b.y && m <= b.m)) {
    out.push({ y, m });
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

// ─── revenue trajectory: total monthly revenue per (y, m) ─────────────
// Hand-curated to reflect the agency's story: bootstrap → rough 2024 →
// recovery → strong 2026. Each value is total monthly revenue in USD.
const MONTHLY_REVENUE: Record<string, number> = {
  // 2023: ramp from zero
  "2023-01":  8_000, "2023-02": 12_000, "2023-03": 18_000,
  "2023-04": 22_000, "2023-05": 25_000, "2023-06": 30_000,
  "2023-07": 28_000, "2023-08": 32_000, "2023-09": 40_000,
  "2023-10": 48_000, "2023-11": 52_000, "2023-12": 55_000,
  // 2024: rough year
  "2024-01": 40_000, "2024-02": 35_000, "2024-03": 42_000,
  "2024-04": 38_000, "2024-05": 30_000, "2024-06": 28_000,
  "2024-07": 22_000, "2024-08": 26_000, "2024-09": 32_000,
  "2024-10": 38_000, "2024-11": 42_000, "2024-12": 45_000,
  // 2025: recovery
  "2025-01": 40_000, "2025-02": 48_000, "2025-03": 55_000,
  "2025-04": 58_000, "2025-05": 62_000, "2025-06": 68_000,
  "2025-07": 58_000, "2025-08": 65_000, "2025-09": 72_000,
  "2025-10": 80_000, "2025-11": 85_000, "2025-12": 88_000,
  // 2026 Jan–May: strong
  "2026-01": 72_000, "2026-02": 78_000, "2026-03": 85_000,
  "2026-04": 90_000, "2026-05": 95_000,
};

// ─── categories ──────────────────────────────────────────────────────
const CATEGORIES = [
  // income
  { name: "Project Revenue",        kind: "revenue", isOneTime: false },
  { name: "Retainer Revenue",       kind: "revenue", isOneTime: false },
  { name: "Add-on Services",        kind: "revenue", isOneTime: true  },
  // outcome
  { name: "Payroll",                kind: "payroll", isOneTime: false },
  { name: "Marketing & Ads",        kind: "marketing", isOneTime: false },
  { name: "Software & SaaS",        kind: "variable", isOneTime: false },
  { name: "Office Rent",            kind: "fixed",  isOneTime: false },
  { name: "Utilities",              kind: "fixed",  isOneTime: false },
  { name: "Contractors",            kind: "variable", isOneTime: false },
  { name: "Professional Services",  kind: "variable", isOneTime: false },
  { name: "Office Supplies",        kind: "variable", isOneTime: false },
  { name: "Equipment",              kind: "variable", isOneTime: true  },
  { name: "Insurance",              kind: "fixed",  isOneTime: false },
  { name: "Travel & Meals",         kind: "variable", isOneTime: false },
  { name: "Bank Fees",              kind: "fee",    isOneTime: false },
] as const;

// ─── vendor catalog (with category mapping) ──────────────────────────
type VendorDef = { name: string; categoryName: string; isOneTime?: boolean };
const VENDORS: VendorDef[] = [
  // Revenue-side: clients (mapped to Retainer or Project depending on usage)
  { name: "Acme Corp",         categoryName: "Retainer Revenue" },
  { name: "BlueSky Ventures",  categoryName: "Retainer Revenue" },
  { name: "Northstar SaaS",    categoryName: "Retainer Revenue" },
  { name: "Vivid Retail",      categoryName: "Retainer Revenue" },
  { name: "Apex Labs",         categoryName: "Project Revenue" },
  { name: "Greenleaf Co",      categoryName: "Project Revenue" },
  { name: "Sundial Media",     categoryName: "Project Revenue" },
  { name: "Helio Industries",  categoryName: "Project Revenue" },
  { name: "Cobalt Health",     categoryName: "Project Revenue" },
  // Expense-side
  { name: "Adobe Creative Cloud", categoryName: "Software & SaaS" },
  { name: "Figma",                categoryName: "Software & SaaS" },
  { name: "GitHub",               categoryName: "Software & SaaS" },
  { name: "Vercel",               categoryName: "Software & SaaS" },
  { name: "AWS",                  categoryName: "Software & SaaS" },
  { name: "Slack",                categoryName: "Software & SaaS" },
  { name: "Notion",               categoryName: "Software & SaaS" },
  { name: "Linear",               categoryName: "Software & SaaS" },
  { name: "Anthropic API",        categoryName: "Software & SaaS" },
  { name: "1Password",            categoryName: "Software & SaaS" },
  { name: "Zoom",                 categoryName: "Software & SaaS" },
  { name: "Loom",                 categoryName: "Software & SaaS" },
  { name: "Google Ads",     categoryName: "Marketing & Ads" },
  { name: "Meta Ads",       categoryName: "Marketing & Ads" },
  { name: "LinkedIn Ads",   categoryName: "Marketing & Ads" },
  { name: "HubSpot",        categoryName: "Marketing & Ads" },
  { name: "Mailchimp",      categoryName: "Marketing & Ads" },
  { name: "Mission Street Lease", categoryName: "Office Rent" },
  { name: "PG&E",                 categoryName: "Utilities" },
  { name: "Comcast Business",     categoryName: "Utilities" },
  { name: "Upwork",            categoryName: "Contractors" },
  { name: "Toptal",            categoryName: "Contractors" },
  { name: "Freelance Hub",     categoryName: "Contractors" },
  { name: "Vega Legal",        categoryName: "Professional Services" },
  { name: "Sterling Accountancy", categoryName: "Professional Services" },
  { name: "Hartford Insurance",  categoryName: "Insurance" },
  { name: "Amazon Business",   categoryName: "Office Supplies" },
  { name: "Costco Business",   categoryName: "Office Supplies" },
  { name: "Apple",             categoryName: "Equipment", isOneTime: true },
  { name: "Dell",              categoryName: "Equipment", isOneTime: true },
  { name: "Mercury Bank",      categoryName: "Bank Fees" },
  { name: "Stripe",            categoryName: "Bank Fees" },
  { name: "Delta",             categoryName: "Travel & Meals" },
  { name: "Uber",              categoryName: "Travel & Meals" },
  { name: "DoorDash",          categoryName: "Travel & Meals" },
];

// ─── employees ───────────────────────────────────────────────────────
type EmployeeDef = {
  name: string;
  role: string;
  department: string;
  grossMonthlySalary: number;
  start: { y: number; m: number };
};
const EMPLOYEES: EmployeeDef[] = [
  { name: "Sarah Chen",       role: "Founder & CEO",     department: "Leadership",   grossMonthlySalary: 9_000, start: { y: 2023, m: 1 } },
  { name: "Mike Rodriguez",   role: "Senior Developer",  department: "Engineering",  grossMonthlySalary: 8_000, start: { y: 2023, m: 2 } },
  { name: "Lisa Park",        role: "Senior Designer",   department: "Design",       grossMonthlySalary: 7_000, start: { y: 2023, m: 3 } },
  { name: "James Wilson",     role: "Account Manager",   department: "Client",       grossMonthlySalary: 5_500, start: { y: 2023, m: 5 } },
  { name: "Priya Patel",      role: "Junior Developer",  department: "Engineering",  grossMonthlySalary: 4_800, start: { y: 2023, m: 8 } },
  { name: "David Kim",        role: "Junior Designer",   department: "Design",       grossMonthlySalary: 4_500, start: { y: 2024, m: 1 } },
  { name: "Emma Thompson",    role: "Marketing & Sales", department: "Marketing",    grossMonthlySalary: 5_500, start: { y: 2025, m: 3 } },
];

// ─── revenue split per month: 3-5 retainer clients + 1-3 projects ────
function generateRevenueTransactions(yMonth: { y: number; m: number }, total: number) {
  const txns: { date: Date; amount: number; vendor: string; categoryName: string; description: string }[] = [];
  // Retainer block: ~50% of total revenue, split across 3-5 clients.
  const retainerPortion = total * (0.45 + rand() * 0.20);
  const retainerClients = ["Acme Corp", "BlueSky Ventures", "Northstar SaaS", "Vivid Retail"];
  const activeRetainers = retainerClients.slice(0, rInt(3, Math.min(4, retainerClients.length)));
  // Distribute retainerPortion across activeRetainers with some variance.
  const weights = activeRetainers.map(() => 0.8 + rand() * 0.4);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  activeRetainers.forEach((client, i) => {
    const amount = Math.round((retainerPortion * weights[i]) / weightSum);
    if (amount <= 0) return;
    txns.push({
      date: date(yMonth.y, yMonth.m, rInt(1, 7)),
      amount,
      vendor: client,
      categoryName: "Retainer Revenue",
      description: `Monthly retainer · ${client}`,
    });
  });
  // Project block: 1-3 projects this month.
  const projectClients = ["Apex Labs", "Greenleaf Co", "Sundial Media", "Helio Industries", "Cobalt Health"];
  const projectCount = rInt(1, 3);
  const projectPortion = total - txns.reduce((a, t) => a + t.amount, 0);
  if (projectPortion > 0 && projectCount > 0) {
    const projWeights = Array.from({ length: projectCount }, () => 0.6 + rand() * 0.8);
    const projSum = projWeights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < projectCount; i++) {
      const amount = Math.round((projectPortion * projWeights[i]) / projSum);
      if (amount <= 0) continue;
      txns.push({
        date: date(yMonth.y, yMonth.m, rInt(8, 25)),
        amount,
        vendor: pick(projectClients),
        categoryName: "Project Revenue",
        description: `Project milestone payment`,
      });
    }
  }
  return txns;
}

// ─── recurring SaaS — same vendors each month with small variance ────
const SAAS_RECURRING = [
  { vendor: "Adobe Creative Cloud", baseAmount: 360,  startedYM: "2023-01" },
  { vendor: "Figma",                baseAmount: 180,  startedYM: "2023-01" },
  { vendor: "GitHub",               baseAmount: 80,   startedYM: "2023-02" },
  { vendor: "Vercel",               baseAmount: 60,   startedYM: "2023-02" },
  { vendor: "AWS",                  baseAmount: 420,  startedYM: "2023-04" },
  { vendor: "Slack",                baseAmount: 120,  startedYM: "2023-03" },
  { vendor: "Notion",               baseAmount: 90,   startedYM: "2023-03" },
  { vendor: "Linear",               baseAmount: 110,  startedYM: "2023-06" },
  { vendor: "Anthropic API",        baseAmount: 250,  startedYM: "2025-01" },
  { vendor: "1Password",            baseAmount: 60,   startedYM: "2023-03" },
  { vendor: "Zoom",                 baseAmount: 75,   startedYM: "2023-02" },
  { vendor: "Loom",                 baseAmount: 95,   startedYM: "2024-04" },
];

// ─── main ────────────────────────────────────────────────────────────
async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) throw new Error(`User ${EMAIL} not found`);

  const business = await prisma.business.findFirst({
    where: { ownerId: user.id, name: BIZ_NAME },
  });
  if (!business) throw new Error(`Business "${BIZ_NAME}" not found for ${EMAIL}`);
  console.log(`→ Seeding business ${business.id} (${business.name})`);

  // Wipe in dependency order so FK constraints don't bite.
  console.log("→ Wiping existing data…");
  await prisma.consultationMessage.deleteMany({ where: { consultation: { businessId: business.id } } });
  await prisma.consultation.deleteMany({ where: { businessId: business.id } });
  await prisma.adminNote.deleteMany({ where: { targetBusinessId: business.id } });
  await prisma.recommendation.deleteMany({ where: { businessId: business.id } });
  await prisma.transaction.deleteMany({ where: { businessId: business.id } });
  await prisma.manualEntry.deleteMany({ where: { businessId: business.id } });
  await prisma.uploadBatch.deleteMany({ where: { businessId: business.id } });
  await prisma.duplicateGroup.deleteMany({ where: { businessId: business.id } });
  await prisma.notificationRule.deleteMany({ where: { businessId: business.id } });
  await prisma.forecastAssumption.deleteMany({ where: { businessId: business.id } });
  await prisma.forecastItem.deleteMany({ where: { businessId: business.id } });
  await prisma.mutedSignal.deleteMany({ where: { businessId: business.id } });
  await prisma.employeeEvent.deleteMany({ where: { businessId: business.id } });
  await prisma.employee.deleteMany({ where: { businessId: business.id } });
  await prisma.categorizationRule.deleteMany({ where: { businessId: business.id } });
  await prisma.mappingTemplate.deleteMany({ where: { businessId: business.id } });
  await prisma.vendor.deleteMany({ where: { businessId: business.id } });
  await prisma.category.deleteMany({ where: { businessId: business.id } });

  // 1. Categories ────────────────────────────────────────────────────
  console.log("→ Creating categories…");
  const catRows = await prisma.$transaction(
    CATEGORIES.map((c) => prisma.category.create({
      data: { businessId: business.id, name: c.name, kind: c.kind, isOneTime: c.isOneTime },
    }))
  );
  const catByName = new Map(catRows.map((c) => [c.name, c.id]));
  function catId(name: string): string {
    const id = catByName.get(name);
    if (!id) throw new Error(`Category not found: ${name}`);
    return id;
  }

  // 2. Vendors ───────────────────────────────────────────────────────
  console.log("→ Creating vendors…");
  for (const v of VENDORS) {
    await prisma.vendor.create({
      data: {
        businessId: business.id,
        name: v.name,
        categoryId: catId(v.categoryName),
        isOneTime: !!v.isOneTime,
      },
    });
  }

  // 3. Employees ─────────────────────────────────────────────────────
  console.log("→ Creating employees…");
  for (const e of EMPLOYEES) {
    await prisma.employee.create({
      data: {
        businessId: business.id,
        name: e.name,
        role: e.role,
        department: e.department,
        employmentType: "employee",
        grossMonthlySalary: e.grossMonthlySalary,
        employerCostMultiplier: 1.25,
        startDate: date(e.start.y, e.start.m, 1),
        status: "active",
        notes: null,
      },
    });
  }

  // 4. Transactions month-by-month ──────────────────────────────────
  console.log("→ Generating transactions…");
  const allTxns: {
    date: Date; amount: number; vendor: string; categoryName: string;
    description: string; type: string; source: string; ym: string;
  }[] = [];
  const months = monthsBetween(START_YM, END_YM);

  for (const m of months) {
    const monthLabel = ym(m.y, m.m);
    const last = lastDay(m.y, m.m);

    // — revenue
    const total = MONTHLY_REVENUE[monthLabel] ?? 0;
    if (total > 0) {
      for (const t of generateRevenueTransactions(m, total)) {
        allTxns.push({
          ...t,
          type: "income",
          source: "bank",
          ym: monthLabel,
        });
      }
    }

    // — payroll (one transaction per active employee)
    for (const e of EMPLOYEES) {
      const started = e.start.y < m.y || (e.start.y === m.y && e.start.m <= m.m);
      if (!started) continue;
      const loaded = Math.round(e.grossMonthlySalary * 1.25);
      allTxns.push({
        date: date(m.y, m.m, last - 1),
        amount: -loaded,
        vendor: e.name,
        categoryName: "Payroll",
        description: `Payroll · ${e.name} (${e.role})`,
        type: "payroll",
        source: "bank",
        ym: monthLabel,
      });
    }

    // — recurring SaaS
    for (const s of SAAS_RECURRING) {
      if (s.startedYM > monthLabel) continue;
      const amount = -Math.round(s.baseAmount * (0.95 + rand() * 0.1));
      allTxns.push({
        date: date(m.y, m.m, rInt(1, 5)),
        amount,
        vendor: s.vendor,
        categoryName: "Software & SaaS",
        description: `${s.vendor} subscription`,
        type: "expense",
        source: "credit_card",
        ym: monthLabel,
      });
    }

    // — rent (starts when team grows beyond 3 → Jun 2023)
    if (monthLabel >= "2023-06") {
      allTxns.push({
        date: date(m.y, m.m, 1),
        amount: -3_500,
        vendor: "Mission Street Lease",
        categoryName: "Office Rent",
        description: "Monthly office lease",
        type: "expense",
        source: "bank",
        ym: monthLabel,
      });
      // Utilities follow rent
      allTxns.push({
        date: date(m.y, m.m, rInt(3, 8)),
        amount: -Math.round(r(180, 320)),
        vendor: "PG&E",
        categoryName: "Utilities",
        description: "Electricity",
        type: "expense",
        source: "bank",
        ym: monthLabel,
      });
      allTxns.push({
        date: date(m.y, m.m, rInt(3, 8)),
        amount: -Math.round(r(120, 180)),
        vendor: "Comcast Business",
        categoryName: "Utilities",
        description: "Business internet",
        type: "expense",
        source: "bank",
        ym: monthLabel,
      });
    }

    // — marketing: scaled by phase
    //   bootstrap 2023 → light, recovery push 2025+ → heavier
    let mktBudget = 1_500;
    if (monthLabel >= "2024-01" && monthLabel < "2024-10") mktBudget = 800; // cut during rough year
    else if (monthLabel >= "2024-10" && monthLabel < "2025-04") mktBudget = 2_500;
    else if (monthLabel >= "2025-04") mktBudget = 4_500;
    // Q4 boost
    if (m.m >= 10) mktBudget = Math.round(mktBudget * 1.4);
    // Split across vendors
    const mktVendors = ["Google Ads", "Meta Ads", "LinkedIn Ads"];
    for (const v of mktVendors) {
      const amt = -Math.round(mktBudget * r(0.25, 0.5));
      allTxns.push({
        date: date(m.y, m.m, rInt(2, 28)),
        amount: amt,
        vendor: v,
        categoryName: "Marketing & Ads",
        description: `${v} campaigns`,
        type: "expense",
        source: "credit_card",
        ym: monthLabel,
      });
    }
    // HubSpot starts 2024
    if (monthLabel >= "2024-03") {
      allTxns.push({
        date: date(m.y, m.m, rInt(1, 5)),
        amount: -Math.round(r(680, 850)),
        vendor: "HubSpot",
        categoryName: "Marketing & Ads",
        description: "HubSpot Pro subscription",
        type: "expense",
        source: "credit_card",
        ym: monthLabel,
      });
    }

    // — contractors (occasional, more in busy quarters)
    const contractorChance = (m.m === 11 || m.m === 12 || m.m === 3 || m.m === 6) ? 0.7 : 0.3;
    if (rand() < contractorChance) {
      allTxns.push({
        date: date(m.y, m.m, rInt(5, 25)),
        amount: -Math.round(r(1_500, 6_000)),
        vendor: pick(["Upwork", "Toptal", "Freelance Hub"]),
        categoryName: "Contractors",
        description: "Freelance overflow work",
        type: "expense",
        source: "bank",
        ym: monthLabel,
      });
    }

    // — professional services (legal/accounting), mostly quarterly
    if (m.m === 1 || m.m === 4 || m.m === 7 || m.m === 10) {
      allTxns.push({
        date: date(m.y, m.m, rInt(10, 25)),
        amount: -Math.round(r(900, 1_800)),
        vendor: "Sterling Accountancy",
        categoryName: "Professional Services",
        description: "Quarterly bookkeeping",
        type: "expense",
        source: "bank",
        ym: monthLabel,
      });
    }
    // Legal sporadic
    if (rand() < 0.15) {
      allTxns.push({
        date: date(m.y, m.m, rInt(5, 25)),
        amount: -Math.round(r(500, 2_500)),
        vendor: "Vega Legal",
        categoryName: "Professional Services",
        description: "Legal review",
        type: "expense",
        source: "bank",
        ym: monthLabel,
      });
    }

    // — insurance, monthly
    if (monthLabel >= "2023-04") {
      allTxns.push({
        date: date(m.y, m.m, 5),
        amount: -Math.round(r(420, 580)),
        vendor: "Hartford Insurance",
        categoryName: "Insurance",
        description: "Business liability + benefits",
        type: "expense",
        source: "bank",
        ym: monthLabel,
      });
    }

    // — office supplies / coffee / etc
    allTxns.push({
      date: date(m.y, m.m, rInt(5, 25)),
      amount: -Math.round(r(150, 600)),
      vendor: pick(["Amazon Business", "Costco Business"]),
      categoryName: "Office Supplies",
      description: "Office supplies",
      type: "expense",
      source: "credit_card",
      ym: monthLabel,
    });

    // — travel + meals (irregular)
    if (rand() < 0.6) {
      const meals = rInt(2, 6);
      for (let i = 0; i < meals; i++) {
        allTxns.push({
          date: date(m.y, m.m, rInt(2, 28)),
          amount: -Math.round(r(35, 180)),
          vendor: pick(["Uber", "DoorDash"]),
          categoryName: "Travel & Meals",
          description: "Team meals / transit",
          type: "expense",
          source: "credit_card",
          ym: monthLabel,
        });
      }
    }
    // Occasional flight
    if (rand() < 0.18 && monthLabel >= "2023-09") {
      allTxns.push({
        date: date(m.y, m.m, rInt(5, 25)),
        amount: -Math.round(r(380, 900)),
        vendor: "Delta",
        categoryName: "Travel & Meals",
        description: "Client visit flight",
        type: "expense",
        source: "credit_card",
        ym: monthLabel,
      });
    }

    // — equipment (rare, one-time)
    if (rand() < 0.08) {
      allTxns.push({
        date: date(m.y, m.m, rInt(5, 25)),
        amount: -Math.round(r(1_200, 3_200)),
        vendor: pick(["Apple", "Dell"]),
        categoryName: "Equipment",
        description: "New laptop / monitor",
        type: "expense",
        source: "credit_card",
        ym: monthLabel,
      });
    }

    // — bank / payment processor fees
    allTxns.push({
      date: date(m.y, m.m, last),
      amount: -Math.round(r(60, 220)),
      vendor: "Stripe",
      categoryName: "Bank Fees",
      description: "Payment processing fees",
      type: "fee",
      source: "bank",
      ym: monthLabel,
    });
    allTxns.push({
      date: date(m.y, m.m, last),
      amount: -Math.round(r(15, 55)),
      vendor: "Mercury Bank",
      categoryName: "Bank Fees",
      description: "Bank service fees",
      type: "fee",
      source: "bank",
      ym: monthLabel,
    });
  }

  // Insert in batches.
  console.log(`→ Inserting ${allTxns.length} transactions…`);
  const BATCH = 200;
  for (let i = 0; i < allTxns.length; i += BATCH) {
    const slice = allTxns.slice(i, i + BATCH);
    await prisma.transaction.createMany({
      data: slice.map((t) => ({
        businessId: business.id,
        source: t.source,
        transactionDate: t.date,
        accountingMonth: t.ym,
        amount: t.amount,
        currency: "USD",
        type: t.type,
        categoryId: catId(t.categoryName),
        vendor: t.vendor,
        description: t.description,
      })),
    });
  }

  // Refresh business activity timestamp.
  await prisma.business.update({
    where: { id: business.id },
    data: { lastActivityAt: new Date(), industry: "Digital Agency", country: "United States", timezone: "America/Los_Angeles" },
  });

  console.log("\n✓ Seed complete.");
  console.log(`  Categories: ${CATEGORIES.length}`);
  console.log(`  Vendors:    ${VENDORS.length}`);
  console.log(`  Employees:  ${EMPLOYEES.length}`);
  console.log(`  Transactions: ${allTxns.length}`);
  console.log(`  Range:      ${ym(START_YM.y, START_YM.m)} → ${ym(END_YM.y, END_YM.m)}`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
