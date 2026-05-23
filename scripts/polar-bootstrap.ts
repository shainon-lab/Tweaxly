// scripts/polar-bootstrap.ts
//
// One-shot helper that creates the four Polar products you need:
//   • Pro $49/mo subscription
//   • Pack +100 AI Credits ($19, one-time)
//   • Pack +500 AI Credits ($79, one-time)
//
// Run after you have a Polar org + access token:
//
//   POLAR_ACCESS_TOKEN=polar_at_... POLAR_ENV=sandbox \
//     npx tsx scripts/polar-bootstrap.ts
//
// Outputs the product IDs - paste them into your env as:
//   POLAR_PRODUCT_PRO_ID=...
//   POLAR_PRODUCT_PACK_100_ID=...
//   POLAR_PRODUCT_PACK_500_ID=...
//
// The script lists existing products first and skips any whose name
// matches, so re-running is safe and never duplicates.

import { Polar } from "@polar-sh/sdk";

import {
  PLANS, CREDIT_PACKS,
  CUSTOM_PACK_MIN_CREDITS, calculateCustomPackPriceCents,
} from "../src/lib/billing/plans";

const PRO_PRODUCT_NAME    = "Tweaxly Pro · Workspace subscription";
const CUSTOM_PACK_NAME    = "Tweaxly AI Credits · Custom";

interface OutSpec {
  envVar: string;
  name:   string;
  exists: boolean;
  id:     string;
}

async function main() {
  const token  = process.env.POLAR_ACCESS_TOKEN;
  const server = (process.env.POLAR_ENV ?? "sandbox") === "production" ? "production" : "sandbox";
  if (!token) {
    console.error("POLAR_ACCESS_TOKEN env var is required.");
    process.exit(1);
  }

  const polar = new Polar({ accessToken: token, server });

  // Pull the full product list once and reuse it as the existence check.
  const existing = new Map<string, string>();
  for await (const page of await polar.products.list({})) {
    for (const product of page.result.items) {
      existing.set(product.name, product.id);
    }
  }

  const out: OutSpec[] = [];

  // ── Pro subscription ──────────────────────────────────────────
  const pro = PLANS.find((p) => p.key === "pro");
  if (!pro) throw new Error("No Pro plan in PLANS");
  const proExistingId = existing.get(PRO_PRODUCT_NAME);
  if (proExistingId) {
    out.push({ envVar: "POLAR_PRODUCT_PRO_ID", name: PRO_PRODUCT_NAME, exists: true, id: proExistingId });
  } else {
    const created = await polar.products.create({
      name:              PRO_PRODUCT_NAME,
      description:       "Unlock the full Tweaxly platform on this workspace. 500 AI Credits / month, unlimited everything.",
      recurringInterval: "month",
      prices: [{
        amountType:    "fixed",
        priceAmount:   pro.priceCents,
        priceCurrency: "usd",
      }],
    });
    out.push({ envVar: "POLAR_PRODUCT_PRO_ID", name: PRO_PRODUCT_NAME, exists: false, id: created.id });
  }

  // ── Credit packs (fixed amounts) ─────────────────────────────
  for (const pack of CREDIT_PACKS) {
    const name = `Tweaxly AI Credits · +${pack.credits.toLocaleString()}`;
    const envVar = `POLAR_PRODUCT_PACK_${pack.sku.replace(/^pack_/, "")}_ID`;
    const existingId = existing.get(name);
    if (existingId) {
      out.push({ envVar, name, exists: true, id: existingId });
      continue;
    }
    const created = await polar.products.create({
      name,
      description: `${pack.credits.toLocaleString()} AI Credits added to this workspace's wallet. Expires 12 months after purchase. Pro plan only.`,
      // One-time products omit recurringInterval entirely.
      prices: [{
        amountType:    "fixed",
        priceAmount:   pack.priceCents,
        priceCurrency: "usd",
      }],
    });
    out.push({ envVar, name, exists: false, id: created.id });
  }

  // ── Custom pack (pay-what-you-want, server picks amount) ─────
  // One product on Polar; our checkout flow sends `amount` per
  // session based on the credit count the user picked + the
  // sliding-scale rate. minimumAmount mirrors the floor so Polar
  // also enforces it independently if our server check is bypassed.
  const customMinimumCents = calculateCustomPackPriceCents(CUSTOM_PACK_MIN_CREDITS);
  const customExistingId   = existing.get(CUSTOM_PACK_NAME);
  if (customExistingId) {
    out.push({ envVar: "POLAR_PRODUCT_PACK_CUSTOM_ID", name: CUSTOM_PACK_NAME, exists: true, id: customExistingId });
  } else {
    const created = await polar.products.create({
      name:        CUSTOM_PACK_NAME,
      description: `Buy any amount of AI Credits (minimum ${CUSTOM_PACK_MIN_CREDITS}). Expires 12 months after purchase. Pro plan only.`,
      prices: [{
        amountType:    "custom",
        priceCurrency: "usd",
        minimumAmount: customMinimumCents,
        presetAmount:  customMinimumCents,
      }],
    });
    out.push({ envVar: "POLAR_PRODUCT_PACK_CUSTOM_ID", name: CUSTOM_PACK_NAME, exists: false, id: created.id });
  }

  console.log(`\nDone (env=${server}). Add these to your Vercel env:\n`);
  for (const item of out) {
    const flag = item.exists ? "(existing)" : "(created)";
    console.log(`  ${item.envVar}=${item.id}   # ${flag} ${item.name}`);
  }
  console.log(`\nAlso make sure these are set:`);
  console.log(`  POLAR_ACCESS_TOKEN=...`);
  console.log(`  POLAR_WEBHOOK_SECRET=...        # from Polar dashboard > Webhooks`);
  console.log(`  POLAR_ENV=${server}`);
  console.log(`  APP_URL=https://app.tweaxly.com\n`);
}

main().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
