import { prisma } from "../src/lib/db";

async function main() {
  const u = await prisma.user.findUnique({
    where: { email: "shainon@gmail.com" },
    include: {
      businesses: {
        select: {
          id: true, name: true, currency: true, status: true,
          _count: { select: { transactions: true, employees: true, categories: true, vendors: true }},
        },
      },
    },
  });
  console.log(JSON.stringify(u, null, 2));
}
main().finally(() => prisma.$disconnect());
