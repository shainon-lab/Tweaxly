import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { business } = await requireBusiness();
  const b = await req.json();
  if (!b.type || !b.effectiveDate) return NextResponse.json({ error: "type + date required" }, { status: 400 });
  if (b.employeeId) {
    const emp = await prisma.employee.findFirst({ where: { id: b.employeeId, businessId: business.id } });
    if (!emp) return NextResponse.json({ error: "bad employee" }, { status: 400 });
    // For salary_change, also update employee's gross.
    if (b.type === "salary_change" && b.amount != null) {
      await prisma.employee.update({ where: { id: emp.id }, data: { grossMonthlySalary: Number(b.amount) } });
    }
  }
  const ev = await prisma.employeeEvent.create({
    data: {
      businessId: business.id,
      employeeId: b.employeeId || null,
      type: String(b.type),
      effectiveDate: new Date(b.effectiveDate),
      amount: b.amount != null ? Number(b.amount) : null,
      notes: b.notes || null,
    },
  });
  return NextResponse.json(ev);
}
