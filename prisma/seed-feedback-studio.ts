// Mock-data seed for the FEEDBACK STUDIO workspace.
//
// Owner:    shainon+9292@gmail.com
// Business: Feedback Studio (Israeli recording + rehearsal studio)
// Window:   Jan 2022 → Apr 2026 (52 months)
// Currency: ILS
//
// Service prices (per the brief):
//   • Rehearsal sessions     - 60 ILS/hr · 3-hr blocks · 6 hrs/day capacity
//   • Recording studio time  - 120 ILS/hr
//   • Mixing services        - 120 ILS/hr
//   • Song production        - 500 ILS flat (playback + vocal + mix)
//
// Capacity model: 220 working days/year (≈ 18.3/mo) excluding weekends
// + Israeli holidays. Utilization ramps from ~40% (opening) to ~85%
// (mature), with Israeli-music-scene seasonality:
//   • Summer (Jun-Aug): peak
//   • Tishrei holidays (Sep): deep dip
//   • Pesach (Mar-Apr): mild dip
//   • Year-end: small bump
//
// Expenses: no employees. Rent (2000 ILS/mo) + Internet (120/mo) are
// fixed; Electricity + Water scale with utilization; Website maintain
// (600 ILS) paid in January each year.
//
// Idempotent: deletes anything in the window for this business before
// re-seeding.
//
// Run:
//   DATABASE_URL=... npx tsx prisma/seed-feedback-studio.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_BUSINESS_ID = "cmphh5il3000byh72i31j1mxs";
const BUSINESS_CCY       = "ILS";
const START_YM           = "2022-01";
const END_YM             = "2026-04";

// ── Pricing
const REHEARSAL_RATE_PER_HOUR    = 60;
const REHEARSAL_HOURS_PER_DAY    = 6;
const RECORDING_RATE_PER_HOUR    = 120;
const MIXING_RATE_PER_HOUR       = 120;
const SONG_PRODUCTION_FLAT       = 500;

// ── Capacity model
const WORKING_DAYS_PER_YEAR      = 220;
const AVG_WORKING_DAYS_PER_MONTH = WORKING_DAYS_PER_YEAR / 12; // 18.33

// ── Fixed expenses
const RENT_MONTHLY               = 2000;
const INTERNET_MONTHLY           = 120;
const WEBSITE_ANNUAL             = 600;

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
function pickN<T>(arr: T[], n: number, rand: () => number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length > 0) {
    const i = Math.floor(rand() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Seasonality + growth
// ─────────────────────────────────────────────────────────────────────

// Israeli music-scene seasonality. 1.0 = baseline. Summer is peak;
// Tishrei holidays (Sep) deep dip; Pesach (Mar-Apr) mild dip.
const SEASONALITY: Record<number, number> = {
  1:  0.95,  // Jan - post-holiday slow start
  2:  1.00,  // Feb
  3:  0.88,  // Mar - Purim + Pesach prep
  4:  0.92,  // Apr - Pesach lull
  5:  1.10,  // May - end-of-school-year prep
  6:  1.20,  // Jun - end of school, band season
  7:  1.25,  // Jul - summer peak
  8:  1.20,  // Aug - summer peak
  9:  0.72,  // Sep - Tishrei holidays (Rosh Hashanah, Yom Kippur, Sukkot)
  10: 0.92,  // Oct - post-holiday recovery
  11: 1.10,  // Nov - steady
  12: 1.05,  // Dec - year-end recordings
};

// Utilization (fraction of theoretical capacity) by year. Slow open
// in 2022 → mature by 2024 → stable through 2026.
function utilizationForYM(ym: string): number {
  const { year, month } = parseYM(ym);
  // Linear interpolation within each year between start/end values.
  const bands: Record<number, [number, number]> = {
    2022: [0.40, 0.55],
    2023: [0.55, 0.72],
    2024: [0.74, 0.80],
    2025: [0.80, 0.85],
    2026: [0.85, 0.86],
  };
  const [start, end] = bands[year] ?? [0.80, 0.80];
  const t = (month - 1) / 11;
  return start + (end - start) * t;
}

// ─────────────────────────────────────────────────────────────────────
// Customers
// ─────────────────────────────────────────────────────────────────────

interface RecurringBand {
  name:           string;
  rehearsalDays:  number;   // typical rehearsal days/month (subject to seasonality)
  recordingHours: number;   // typical recording hours/month
  mixingHours:    number;
  songsPerMonth:  number;
  joinedYM:       string;   // when they first show up in the data
  leftYM?:        string;   // optional churn
}

const RECURRING_BANDS: RecurringBand[] = [
  { name: "Rocketship",       rehearsalDays: 4, recordingHours: 4, mixingHours: 2, songsPerMonth: 0, joinedYM: "2022-03" },
  { name: "Asaf Cohen Trio",  rehearsalDays: 3, recordingHours: 0, mixingHours: 0, songsPerMonth: 0, joinedYM: "2022-05", leftYM: "2024-08" },
  { name: "Tal & Adi",        rehearsalDays: 2, recordingHours: 2, mixingHours: 2, songsPerMonth: 1, joinedYM: "2022-07" },
  { name: "Studio 8",         rehearsalDays: 3, recordingHours: 3, mixingHours: 1, songsPerMonth: 0, joinedYM: "2023-02" },
  { name: "Hummus Beats",     rehearsalDays: 1, recordingHours: 6, mixingHours: 5, songsPerMonth: 2, joinedYM: "2023-06" },
  { name: "Liraz Project",    rehearsalDays: 2, recordingHours: 4, mixingHours: 3, songsPerMonth: 1, joinedYM: "2024-01" },
  { name: "Tikva Voices",     rehearsalDays: 2, recordingHours: 5, mixingHours: 4, songsPerMonth: 2, joinedYM: "2024-09" },
  { name: "Echo Loop",        rehearsalDays: 3, recordingHours: 2, mixingHours: 1, songsPerMonth: 0, joinedYM: "2025-03" },
];

// One-time customer name pool. Used for walk-in / single-session names.
const ONE_TIME_NAMES = [
  "Yoav S.", "Lior K.", "Maya R.", "Dror N.", "Shira M.", "Itay B.", "Noa D.",
  "Omri P.", "Tamir L.", "Yael C.", "Eitan H.", "Ronit Z.", "Avi T.", "Karin G.",
  "Roi A.", "Idan F.", "Hila B.", "Boaz V.", "Reut N.", "Eden M.",
];

// ─────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────

interface CategoryDef { name: string; kind: string; isOneTime?: boolean }
const CATEGORIES: CategoryDef[] = [
  // Revenue
  { name: "Rehearsal Sessions",  kind: "revenue" },
  { name: "Recording Sessions",  kind: "revenue" },
  { name: "Mixing Services",     kind: "revenue" },
  { name: "Song Production",     kind: "revenue" },
  // Expenses
  { name: "Rent",                kind: "fixed" },
  { name: "Internet",            kind: "fixed" },
  { name: "Electricity",         kind: "variable" },
  { name: "Water",               kind: "variable" },
  { name: "Website Maintenance", kind: "fixed",  isOneTime: true },
  { name: "Equipment",           kind: "variable", isOneTime: true },
  { name: "Bank Fees",           kind: "fee" },
  { name: "Other Expenses",      kind: "other" },
];

// ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Targeting FEEDBACK STUDIO workspace: ${TARGET_BUSINESS_ID}`);
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

  // Wipe employees just in case (the brief says: no employees).
  await prisma.employeeEvent.deleteMany({ where: { employee: { businessId: business.id } } });
  await prisma.employee.deleteMany({       where: { businessId: business.id } });

  let created = 0;
  for (const ym of months) {
    const rand = rng(parseInt(ym.replace("-", ""), 10));
    const { month } = parseYM(ym);
    const seasonality = SEASONALITY[month] ?? 1.0;
    const utilization = utilizationForYM(ym);

    // Effective rehearsal-day budget for the month after seasonality
    // + utilization (capped at ~92% to keep some "blank days").
    const effectiveUtilization = Math.min(0.92, utilization * seasonality);

    // ── Rehearsals ───────────────────────────────────────────────
    // Recurring bands first - they book consistent days. One-time
    // customers fill the remaining slots up to the utilization cap.
    const rehearsalDayBudget = AVG_WORKING_DAYS_PER_MONTH;
    const targetRehearsalDays = Math.round(rehearsalDayBudget * effectiveUtilization);

    let recurringRehearsalDaysUsed = 0;
    for (const band of RECURRING_BANDS) {
      if (band.joinedYM > ym) continue;
      if (band.leftYM && band.leftYM < ym) continue;
      // Bands flex slightly with seasonality too - summer means more.
      const daysThisMonth = Math.max(1, Math.round(band.rehearsalDays * (0.85 + rand() * 0.30) * Math.min(seasonality, 1.2)));
      recurringRehearsalDaysUsed += daysThisMonth;
      if (daysThisMonth <= 0) continue;
      // Each band books in 1-2 chunks per month so the ledger reads
      // like real invoices, not a daily ticker.
      const chunks = daysThisMonth >= 4 ? 2 : 1;
      let daysLeft = daysThisMonth;
      for (let c = 0; c < chunks; c++) {
        const last = c === chunks - 1;
        const days = last ? daysLeft : Math.max(1, Math.floor(daysThisMonth / chunks));
        daysLeft -= days;
        const amount = round2(days * REHEARSAL_HOURS_PER_DAY * REHEARSAL_RATE_PER_HOUR);
        if (amount <= 0) continue;
        await prisma.transaction.create({
          data: {
            businessId:      business.id,
            source:          "csv_upload",
            transactionDate: dateInMonth(ym, 4 + Math.floor(rand() * 22)),
            accountingMonth: ym,
            amount,
            currency:        BUSINESS_CCY,
            type:            "income",
            categoryId:      catId("Rehearsal Sessions"),
            vendor:          band.name,
            description:     `Rehearsals (${days} day${days === 1 ? "" : "s"}, ${days * REHEARSAL_HOURS_PER_DAY}h) - recurring`,
          },
        });
        created++;
      }
    }

    // Remaining rehearsal capacity → one-time customers (3-7 names).
    const oneTimeRehearsalDays = Math.max(0, targetRehearsalDays - recurringRehearsalDaysUsed);
    if (oneTimeRehearsalDays > 0) {
      const namesNeeded = Math.min(7, Math.max(2, Math.ceil(oneTimeRehearsalDays / 2)));
      const names = pickN([...ONE_TIME_NAMES], namesNeeded, rand);
      let daysLeft = oneTimeRehearsalDays;
      for (let i = 0; i < names.length && daysLeft > 0; i++) {
        const last = i === names.length - 1;
        const days = last ? daysLeft : Math.max(1, Math.round(oneTimeRehearsalDays / names.length));
        daysLeft -= days;
        const amount = round2(days * REHEARSAL_HOURS_PER_DAY * REHEARSAL_RATE_PER_HOUR);
        if (amount <= 0) continue;
        await prisma.transaction.create({
          data: {
            businessId:      business.id,
            source:          "csv_upload",
            transactionDate: dateInMonth(ym, 2 + Math.floor(rand() * 25)),
            accountingMonth: ym,
            amount,
            currency:        BUSINESS_CCY,
            type:            "income",
            categoryId:      catId("Rehearsal Sessions"),
            vendor:          `${names[i]} (one-time)`,
            description:     `Rehearsals (${days} day${days === 1 ? "" : "s"}, ${days * REHEARSAL_HOURS_PER_DAY}h)`,
          },
        });
        created++;
      }
    }

    // ── Recording sessions ───────────────────────────────────────
    // Recurring bands first.
    let recordingTransactions = 0;
    for (const band of RECURRING_BANDS) {
      if (band.joinedYM > ym) continue;
      if (band.leftYM && band.leftYM < ym) continue;
      if (band.recordingHours <= 0) continue;
      const hours = Math.max(0, Math.round(band.recordingHours * (0.80 + rand() * 0.40) * seasonality));
      if (hours <= 0) continue;
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 5 + Math.floor(rand() * 22)),
          accountingMonth: ym,
          amount:          round2(hours * RECORDING_RATE_PER_HOUR),
          currency:        BUSINESS_CCY,
          type:            "income",
          categoryId:      catId("Recording Sessions"),
          vendor:          band.name,
          description:     `Recording session (${hours}h) - recurring`,
        },
      });
      created++;
      recordingTransactions++;
    }
    // One-time recording sessions on top - 1-3 per month scaled by util.
    const oneTimeRecordings = Math.max(0, Math.round((1 + rand() * 3) * effectiveUtilization));
    for (let i = 0; i < oneTimeRecordings; i++) {
      const hours = 2 + Math.floor(rand() * 4); // 2-5 hour sessions
      const name = ONE_TIME_NAMES[Math.floor(rand() * ONE_TIME_NAMES.length)];
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 3 + Math.floor(rand() * 24)),
          accountingMonth: ym,
          amount:          round2(hours * RECORDING_RATE_PER_HOUR),
          currency:        BUSINESS_CCY,
          type:            "income",
          categoryId:      catId("Recording Sessions"),
          vendor:          `${name} (one-time)`,
          description:     `Recording session (${hours}h)`,
        },
      });
      created++;
    }

    // ── Mixing services ──────────────────────────────────────────
    for (const band of RECURRING_BANDS) {
      if (band.joinedYM > ym) continue;
      if (band.leftYM && band.leftYM < ym) continue;
      if (band.mixingHours <= 0) continue;
      const hours = Math.max(0, Math.round(band.mixingHours * (0.80 + rand() * 0.40) * seasonality));
      if (hours <= 0) continue;
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 8 + Math.floor(rand() * 18)),
          accountingMonth: ym,
          amount:          round2(hours * MIXING_RATE_PER_HOUR),
          currency:        BUSINESS_CCY,
          type:            "income",
          categoryId:      catId("Mixing Services"),
          vendor:          band.name,
          description:     `Mixing (${hours}h) - recurring`,
        },
      });
      created++;
    }
    const oneTimeMixing = Math.max(0, Math.round((1 + rand() * 2.5) * effectiveUtilization));
    for (let i = 0; i < oneTimeMixing; i++) {
      const hours = 2 + Math.floor(rand() * 5); // 2-6h
      const name = ONE_TIME_NAMES[Math.floor(rand() * ONE_TIME_NAMES.length)];
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 6 + Math.floor(rand() * 21)),
          accountingMonth: ym,
          amount:          round2(hours * MIXING_RATE_PER_HOUR),
          currency:        BUSINESS_CCY,
          type:            "income",
          categoryId:      catId("Mixing Services"),
          vendor:          `${name} (one-time)`,
          description:     `Mixing (${hours}h)`,
        },
      });
      created++;
    }

    // ── Song production (500 ILS flat) ───────────────────────────
    for (const band of RECURRING_BANDS) {
      if (band.joinedYM > ym) continue;
      if (band.leftYM && band.leftYM < ym) continue;
      if (band.songsPerMonth <= 0) continue;
      const songs = Math.max(0, Math.round(band.songsPerMonth * (0.7 + rand() * 0.6) * seasonality));
      for (let k = 0; k < songs; k++) {
        await prisma.transaction.create({
          data: {
            businessId:      business.id,
            source:          "csv_upload",
            transactionDate: dateInMonth(ym, 10 + Math.floor(rand() * 16)),
            accountingMonth: ym,
            amount:          SONG_PRODUCTION_FLAT,
            currency:        BUSINESS_CCY,
            type:            "income",
            categoryId:      catId("Song Production"),
            vendor:          band.name,
            description:     `Song production (playback + vocal + mix)`,
          },
        });
        created++;
      }
    }
    const oneTimeSongs = Math.max(0, Math.round((1 + rand() * 2.5) * effectiveUtilization));
    for (let i = 0; i < oneTimeSongs; i++) {
      const name = ONE_TIME_NAMES[Math.floor(rand() * ONE_TIME_NAMES.length)];
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 5 + Math.floor(rand() * 22)),
          accountingMonth: ym,
          amount:          SONG_PRODUCTION_FLAT,
          currency:        BUSINESS_CCY,
          type:            "income",
          categoryId:      catId("Song Production"),
          vendor:          `${name} (one-time)`,
          description:     `Song production (playback + vocal + mix)`,
        },
      });
      created++;
    }

    // ── Expenses ─────────────────────────────────────────────────
    // Rent (fixed, paid early in month)
    await prisma.transaction.create({
      data: {
        businessId:      business.id,
        source:          "csv_upload",
        transactionDate: dateInMonth(ym, 1),
        accountingMonth: ym,
        amount:          -RENT_MONTHLY,
        currency:        BUSINESS_CCY,
        type:            "expense",
        categoryId:      catId("Rent"),
        vendor:          "Landlord",
        description:     "Studio rent",
      },
    });
    created++;

    // Internet (fixed)
    await prisma.transaction.create({
      data: {
        businessId:      business.id,
        source:          "csv_upload",
        transactionDate: dateInMonth(ym, 5),
        accountingMonth: ym,
        amount:          -INTERNET_MONTHLY,
        currency:        BUSINESS_CCY,
        type:            "expense",
        categoryId:      catId("Internet"),
        vendor:          "Bezeq",
        description:     "Studio internet + phone",
      },
    });
    created++;

    // Electricity (variable - scales with utilization). Hot Israeli
    // summer pushes A/C bills higher too.
    const summerHeat = (month === 7 || month === 8) ? 1.4 : (month === 6 || month === 9) ? 1.15 : 1.0;
    const electricity = round2((200 + effectiveUtilization * 250) * summerHeat * (0.92 + rand() * 0.16));
    await prisma.transaction.create({
      data: {
        businessId:      business.id,
        source:          "csv_upload",
        transactionDate: dateInMonth(ym, 18),
        accountingMonth: ym,
        amount:          -electricity,
        currency:        BUSINESS_CCY,
        type:            "expense",
        categoryId:      catId("Electricity"),
        vendor:          "IEC",
        description:     "Electricity (studio + A/C)",
      },
    });
    created++;

    // Water (small - studio doesn't use much)
    const water = round2((45 + effectiveUtilization * 50) * (0.92 + rand() * 0.16));
    await prisma.transaction.create({
      data: {
        businessId:      business.id,
        source:          "csv_upload",
        transactionDate: dateInMonth(ym, 20),
        accountingMonth: ym,
        amount:          -water,
        currency:        BUSINESS_CCY,
        type:            "expense",
        categoryId:      catId("Water"),
        vendor:          "Mei Avivim",
        description:     "Water utility",
      },
    });
    created++;

    // Website maintenance - 600 ILS once per year, paid in January.
    if (month === 1) {
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 14),
          accountingMonth: ym,
          amount:          -WEBSITE_ANNUAL,
          currency:        BUSINESS_CCY,
          type:            "expense",
          categoryId:      catId("Website Maintenance"),
          vendor:          "Webhost.co.il",
          description:     "Annual website maintenance + hosting",
          isOneTime:       true,
        },
      });
      created++;
    }

    // Modest occasional equipment one-times (cables, mic stands,
    // headphones replacement) - not part of the brief's list but
    // realistic for a working studio. Keeps once or twice a year.
    if ((month === 4 && parseYM(ym).year >= 2023) || (month === 10 && parseYM(ym).year >= 2024)) {
      const equipCost = round2(350 + rand() * 600);
      await prisma.transaction.create({
        data: {
          businessId:      business.id,
          source:          "csv_upload",
          transactionDate: dateInMonth(ym, 22),
          accountingMonth: ym,
          amount:          -equipCost,
          currency:        BUSINESS_CCY,
          type:            "expense",
          categoryId:      catId("Equipment"),
          vendor:          "Halilit",
          description:     "Equipment / accessories",
          isOneTime:       true,
        },
      });
      created++;
    }

    // Bank/processing fees - small flat each month
    const bankFee = round2(28 + rand() * 14);
    await prisma.transaction.create({
      data: {
        businessId:      business.id,
        source:          "csv_upload",
        transactionDate: dateInMonth(ym, 28),
        accountingMonth: ym,
        amount:          -bankFee,
        currency:        BUSINESS_CCY,
        type:            "expense",
        categoryId:      catId("Bank Fees"),
        vendor:          "Bank Hapoalim",
        description:     "Business banking fees",
      },
    });
    created++;
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
