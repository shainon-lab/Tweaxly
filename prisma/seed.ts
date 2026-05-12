// Optional demo seed — creates a demo user, business, employees, and ~3 months of transactions.
// Run: npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_CATEGORIES } from "../src/lib/categories";

const prisma = new PrismaClient();

function ymd(y: number, m: number, d: number) { return new Date(Date.UTC(y, m - 1, d)); }

async function main() {
  const email = "demo@example.com";
  const password = "demo1234";

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, passwordHash: await bcrypt.hash(password, 10), name: "Demo Owner" },
    });
  }

  let biz = await prisma.business.findFirst({ where: { ownerId: user.id, name: "Demo Co." } });
  if (!biz) {
    biz = await prisma.business.create({
      data: {
        ownerId: user.id, name: "Demo Co.", currency: "USD",
        categories: { create: DEFAULT_CATEGORIES.map((c) => ({ name: c.name, kind: c.kind, isOneTime: !!c.isOneTime })) },
      },
    });
  }
  const cats = await prisma.category.findMany({ where: { businessId: biz.id } });
  const cat = (n: string) => cats.find((c) => c.name === n)!.id;

  // Employees
  await prisma.employee.deleteMany({ where: { businessId: biz.id } });
  await prisma.employeeEvent.deleteMany({ where: { businessId: biz.id } });
  await prisma.employee.createMany({
    data: [
      { businessId: biz.id, name: "Alex Rivera", role: "Engineer", grossMonthlySalary: 8000, employerCostMultiplier: 1.25, startDate: ymd(2024, 6, 1) },
      { businessId: biz.id, name: "Priya Shah", role: "Marketing Lead", grossMonthlySalary: 6500, employerCostMultiplier: 1.25, startDate: ymd(2024, 9, 15) },
    ],
  });

  // Transactions over 3 months
  await prisma.transaction.deleteMany({ where: { businessId: biz.id } });
  const months = [
    { y: 2026, m: 3 }, { y: 2026, m: 4 }, { y: 2026, m: 5 },
  ];
  const data: { businessId: string; source: string; transactionDate: Date; accountingMonth: string;
    amount: number; currency: string; type: string; categoryId: string; vendor: string; description: string;
    isRecurring?: boolean; isOneTime?: boolean; }[] = [];
  for (const { y, m } of months) {
    const ym = `${y}-${String(m).padStart(2, "0")}`;
    // Revenue
    data.push({ businessId: biz.id, source: "stripe", transactionDate: ymd(y, m, 5), accountingMonth: ym,
      amount: 22000 + (m === 5 ? -2000 : 0), currency: "USD", type: "income",
      categoryId: cat("Service Revenue"), vendor: "Stripe", description: "Stripe payout — Q2 retainers", isRecurring: true });
    data.push({ businessId: biz.id, source: "invoicing", transactionDate: ymd(y, m, 12), accountingMonth: ym,
      amount: 9500, currency: "USD", type: "income", categoryId: cat("Product Revenue"), vendor: "Acme Corp", description: "Invoice #" + (1000 + m) });
    // Rent
    data.push({ businessId: biz.id, source: "bank", transactionDate: ymd(y, m, 2), accountingMonth: ym,
      amount: -3500, currency: "USD", type: "expense", categoryId: cat("Rent"), vendor: "WeWork", description: "Office rent", isRecurring: true });
    // Subscriptions
    data.push({ businessId: biz.id, source: "credit_card", transactionDate: ymd(y, m, 14), accountingMonth: ym,
      amount: -240, currency: "USD", type: "expense", categoryId: cat("SaaS & Subscriptions"), vendor: "Notion", description: "Notion team plan", isRecurring: true });
    data.push({ businessId: biz.id, source: "credit_card", transactionDate: ymd(y, m, 20), accountingMonth: ym,
      amount: -129, currency: "USD", type: "expense", categoryId: cat("SaaS & Subscriptions"), vendor: "Slack", description: "Slack standard", isRecurring: true });
    // Marketing
    data.push({ businessId: biz.id, source: "credit_card", transactionDate: ymd(y, m, 18), accountingMonth: ym,
      amount: -(m === 5 ? 1100 : 2400), currency: "USD", type: "expense", categoryId: cat("Marketing & Ads"), vendor: "Google Ads", description: "Google Ads" });
    // Payroll
    data.push({ businessId: biz.id, source: "payroll", transactionDate: ymd(y, m, 28), accountingMonth: ym,
      amount: -(8000 + 6500) * 1.25, currency: "USD", type: "payroll", categoryId: cat("Payroll"), vendor: "Gusto", description: "Monthly payroll", isRecurring: true });
    // Stripe fees
    data.push({ businessId: biz.id, source: "stripe", transactionDate: ymd(y, m, 5), accountingMonth: ym,
      amount: -660, currency: "USD", type: "fee", categoryId: cat("Payment Processing Fees"), vendor: "Stripe", description: "Stripe processing fees", isRecurring: true });
  }

  // One-time bonus in March
  data.push({ businessId: biz.id, source: "payroll", transactionDate: ymd(2026, 3, 15), accountingMonth: "2026-03",
    amount: -3000, currency: "USD", type: "payroll", categoryId: cat("Bonuses"), vendor: "Gusto", description: "Spot bonus — Alex", isOneTime: true });

  for (const t of data) await prisma.transaction.create({ data: t });

  console.log(`Seeded user: ${email}  password: ${password}  business: Demo Co.`);
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
