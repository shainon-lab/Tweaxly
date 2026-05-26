// GET /api/billing/polar-status
//
// Diagnostic endpoint that reports which Polar mode the deployed
// instance is actually running in. Returns presence-of-env-var
// booleans only — never the values — so it's safe to leave
// unauthenticated. Use this to confirm Vercel has POLAR_ENV=production
// set and scoped to the Production environment. If `resolvedMode`
// says "sandbox" after you set POLAR_ENV=production, the var didn't
// make it into the build — re-check Vercel's Environment Variables
// page and confirm the environment scope is "Production" (not just
// "Preview" / "Development").

import { NextResponse } from "next/server";
import { isPolarProduction } from "@/lib/billing/polar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLAR_VAR_NAMES = [
  "POLAR_ACCESS_TOKEN",
  "POLAR_WEBHOOK_SECRET",
  "POLAR_PRODUCT_PRO_ID",
  "POLAR_PRODUCT_PACK_100_ID",
  "POLAR_PRODUCT_PACK_500_ID",
  "POLAR_PRODUCT_PACK_30_ID",
  "POLAR_PRODUCT_PACK_50_ID",
  "POLAR_PRODUCT_PACK_CUSTOM_ID",
];

export async function GET() {
  const polarEnv  = process.env.POLAR_ENV ?? "(unset)";
  const polarMode = isPolarProduction() ? "production" : "sandbox";
  const appUrl    = process.env.APP_URL ?? "(unset — defaults to https://app.tweaxly.com)";

  // For each known var, report whether the sandbox-named twin and
  // the _PROD-named twin are set. We never expose values — only
  // true/false flags.
  const presence: Record<string, { sandbox: boolean; production: boolean; activeVariantSet: boolean }> = {};
  for (const name of POLAR_VAR_NAMES) {
    const sandboxSet = !!process.env[name];
    const prodSet    = !!process.env[name + "_PROD"];
    // Which variant the live code path is reading right now:
    const activeSet  = isPolarProduction() ? (prodSet || sandboxSet) : sandboxSet;
    presence[name] = { sandbox: sandboxSet, production: prodSet, activeVariantSet: activeSet };
  }

  return NextResponse.json({
    polarEnv,
    resolvedMode: polarMode,
    appUrl,
    presence,
    note:
      polarMode === "production"
        ? "Live traffic will hit polar.sh production. Each var under 'presence' shows whether the _PROD variant is set (production:true)."
        : "Live traffic is still hitting Polar sandbox. To switch, set POLAR_ENV=production in the Production environment on Vercel and redeploy.",
  });
}
