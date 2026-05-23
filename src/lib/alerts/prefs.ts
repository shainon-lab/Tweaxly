// Per-user × per-business alert preferences. Reads / writes the
// AlertPreference table; falls back to defaults when no row exists
// yet (the UI can render the form against a virgin preference).

import { prisma } from "../db";
import {
  type AlertCategory, type AlertSensitivity,
  defaultCategoryMap,
} from "./types";

export interface AlertPreferences {
  pushEnabled:        boolean;
  inAppEnabled:       boolean;
  emailEnabled:       boolean;
  categories:         Record<AlertCategory, boolean>;
  sensitivity:        AlertSensitivity;
  quietHoursEnabled:  boolean;
  quietHoursStart:    string | null;
  quietHoursEnd:      string | null;
  quietHoursTimezone: string | null;
  criticalBypass:     boolean;
  dailyLimit:         number;
}

const DEFAULTS = (): AlertPreferences => ({
  pushEnabled:        false,
  inAppEnabled:       true,
  emailEnabled:       false,
  categories:         defaultCategoryMap(),
  sensitivity:        "balanced",
  quietHoursEnabled:  false,
  quietHoursStart:    "22:00",
  quietHoursEnd:      "07:00",
  quietHoursTimezone: null,
  criticalBypass:     true,
  dailyLimit:         15,
});

export async function getAlertPreferences(
  userId: string, businessId: string,
): Promise<AlertPreferences> {
  const row = await prisma.alertPreference.findUnique({
    where: { userId_businessId: { userId, businessId } },
  });
  if (!row) return DEFAULTS();
  const d = DEFAULTS();
  return {
    pushEnabled:        row.pushEnabled,
    inAppEnabled:       row.inAppEnabled,
    emailEnabled:       row.emailEnabled,
    categories:         { ...d.categories, ...(row.categories as Record<AlertCategory, boolean> | null ?? {}) },
    sensitivity:        (row.sensitivity as AlertSensitivity) ?? "balanced",
    quietHoursEnabled:  row.quietHoursEnabled,
    quietHoursStart:    row.quietHoursStart    ?? d.quietHoursStart,
    quietHoursEnd:      row.quietHoursEnd      ?? d.quietHoursEnd,
    quietHoursTimezone: row.quietHoursTimezone ?? null,
    criticalBypass:     row.criticalBypass,
    dailyLimit:         row.dailyLimit,
  };
}

export async function upsertAlertPreferences(
  userId: string, businessId: string,
  fields: Partial<AlertPreferences>,
) {
  const clean = {
    pushEnabled:        fields.pushEnabled,
    inAppEnabled:       fields.inAppEnabled,
    emailEnabled:       fields.emailEnabled,
    categories:         fields.categories as unknown as object | undefined,
    sensitivity:        fields.sensitivity,
    quietHoursEnabled:  fields.quietHoursEnabled,
    quietHoursStart:    fields.quietHoursStart,
    quietHoursEnd:      fields.quietHoursEnd,
    quietHoursTimezone: fields.quietHoursTimezone,
    criticalBypass:     fields.criticalBypass,
    dailyLimit:         fields.dailyLimit,
  };
  return prisma.alertPreference.upsert({
    where:  { userId_businessId: { userId, businessId } },
    create: { userId, businessId, ...clean },
    update: clean,
  });
}
