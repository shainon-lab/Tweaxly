import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { business } = await requireBusiness();
  const b = await req.json();
  if (!b.name || !b.startDate) return NextResponse.json({ error: "name + startDate required" }, { status: 400 });
  const emp = await prisma.employee.create({
    data: {
      businessId: business.id,
      name: String(b.name),
      role: b.role || null,
      grossMonthlySalary: Number(b.grossMonthlySalary || 0),
      employerCostMultiplier: Number(b.employerCostMultiplier || 1.25) || 1.25,
      startDate: new Date(b.startDate),
      endDate: b.endDate ? new Date(b.endDate) : null,
      notes: b.notes || null,
    },
  });
  await prisma.employeeEvent.create({
    data: {
      businessId: business.id,
      employeeId: emp.id,
      type: "hire",
      effectiveDate: emp.startDate,
      notes: `Hired as ${emp.role ?? "employee"}`,
    },
  });
  return NextResponse.json(emp);
}

export async function PATCH(req: NextRequest) {
  const { business } = await requireBusiness();
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const emp = await prisma.employee.findFirst({ where: { id: b.id, businessId: business.id } });
  if (!emp) return NextResponse.json({ error: "not found" }, { status: 404 });
  const next = await prisma.employee.update({
    where: { id: emp.id },
    data: {
      name: b.name ?? emp.name,
      role: b.role ?? emp.role,
      grossMonthlySalary: b.grossMonthlySalary != null ? Number(b.grossMonthlySalary) : emp.grossMonthlySalary,
      employerCostMultiplier: b.employerCostMultiplier != null ? Number(b.employerCostMultiplier) : emp.employerCostMultiplier,
      startDate: b.startDate ? new Date(b.startDate) : emp.startDate,
      endDate: b.endDate ? new Date(b.endDate) : emp.endDate,
      notes: b.notes ?? emp.notes,
    },
  });
  if (b.endDate && (!emp.endDate || emp.endDate.toISOString().slice(0, 10) !== b.endDate)) {
    await prisma.employeeEvent.create({
      data: {
        businessId: business.id,
        employeeId: emp.id,
        type: "termination",
        effectiveDate: new Date(b.endDate),
        notes: `Terminated`,
      },
    });
  }
  return NextResponse.json(next);
}

export async function DELETE(req: NextRequest) {
  const { business } = await requireBusiness();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.employee.deleteMany({ where: { id, businessId: business.id } });
  return NextResponse.json({ ok: true });
}
