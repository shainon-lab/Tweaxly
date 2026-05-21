"use server";

// Server actions for the Forecast tab - CRUD on ForecastAssumption rows.
// Used by the scenario builder and assumptions panel.
//
// Plan gate: the Scenario Builder is a Pro/Business feature. Free
// users can view the baseline forecast but can't create / delete /
// clear scenario assumptions. We enforce this server-side so the UI
// gate is convenience, not security.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/auth";
import { hasFeature } from "@/lib/billing";

class ScenarioBuilderLockedError extends Error {
  code = "scenario_builder_locked";
  constructor() {
    super("Scenario Builder is available on Pro and Business plans. Upgrade to keep customising forecasts.");
    this.name = "ScenarioBuilderLockedError";
  }
}

async function ensureScenarioBuilderEntitled(businessId: string) {
  const ok = await hasFeature(businessId, "scenarioBuilder");
  if (!ok) throw new ScenarioBuilderLockedError();
}

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
  await ensureScenarioBuilderEntitled(business.id);
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
  await ensureScenarioBuilderEntitled(business.id);
  // Scope the delete to this business so a bad id can't touch another tenant.
  await prisma.forecastAssumption.deleteMany({
    where: { id, businessId: business.id },
  });
  revalidatePath("/forecast");
}

export async function clearAllAssumptions() {
  const { business } = await requireBusiness();
  await ensureScenarioBuilderEntitled(business.id);
  await prisma.forecastAssumption.deleteMany({
    where: { businessId: business.id },
  });
  revalidatePath("/forecast");
}
