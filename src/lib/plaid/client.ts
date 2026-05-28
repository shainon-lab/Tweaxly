// Plaid SDK singleton. Sandbox-only for the MVP - swap the env var to
// "development" / "production" later when we have real institution
// access without changing any code.

import "server-only";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

function envBase(): string {
  const e = (process.env.PLAID_ENV ?? "sandbox").toLowerCase();
  if (e === "production")  return PlaidEnvironments.production;
  if (e === "development") return PlaidEnvironments.development;
  return PlaidEnvironments.sandbox;
}

let cached: PlaidApi | null = null;

export function getPlaid(): PlaidApi {
  if (cached) return cached;
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret   = process.env.PLAID_SECRET;
  if (!clientId || !secret) {
    throw new Error("PLAID_CLIENT_ID and PLAID_SECRET must be set");
  }
  cached = new PlaidApi(new Configuration({
    basePath: envBase(),
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET":    secret,
        "Plaid-Version":   "2020-09-14",
      },
    },
  }));
  return cached;
}

// Country codes supported by the workspace. Sandbox returns US by
// default; expand later when we open up CA/UK/EU institutions.
export function plaidCountryCodes(): string[] {
  const raw = process.env.PLAID_COUNTRY_CODES ?? "US";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

// Subset of Plaid products this app actually consumes. Read-only by
// design - no auth / identity / liabilities / transfer / payment /
// signal / income / beacon. If a future feature needs a new product
// it must opt in explicitly here AND in the corresponding link-token
// request (Plaid enforces this server-side too).
export const PLAID_PRODUCTS: ("transactions")[] = ["transactions"];
