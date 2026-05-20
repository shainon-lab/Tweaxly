"use server";

// Server actions for the Forecast tab - CRUD on ForecastAssumption rows.
// Used by the scenario builder and assumptions panel.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";

export type CreateAssumptionInput = {
  family: "revenue" | "expense" | "payroll";
  type: string;
  label: string;
  category?: string | null;
  amount?: number;
  percentage?: number; // 0..1
  startMonth?: number;
  endMonth?: number | null;
  isRecurring?: boolean;
  notes?: string | null;
};

export async function createAssumption(input: CreateAssumptionInput) {
  const { business } = await requireBusiness();
  if (!input.label || !input.type || !input.family) {
    throw new Error("family, type and label are required");
  }
  await prisma.forecastAssumption.create({
    data: {
      businessId: business.id,
      family: input.family,
      type: input.type,
      label: input.label.trim(),
      category: input.category ?? null,
      amount: Number(input.amount ?? 0),
      percentage: Number(input.percentage ?? 0),
      startMonth: Math.max(1, Number(input.startMonth ?? 1)),
      endMonth: input.endMonth == null ? null : Math.max(1, Number(input.endMonth)),
      isRecurring: input.isRecurring ?? true,
      notes: input.notes ?? null,
    },
  });
  revalidatePath("/forecast");
}

export async function deleteAssumption(id: string) {
  const { business } = await requireBusiness();
  // Scope the delete to this business so a bad id can't touch another tenant.
  await prisma.forecastAssumption.deleteMany({
    where: { id, businessId: business.id },
  });
  revalidatePath("/forecast");
}

export async function clearAllAssumptions() {
  const { business } = await requireBusiness();
  await prisma.forecastAssumption.deleteMany({
    where: { businessId: business.id },
  });
  revalidatePath("/forecast");
}
