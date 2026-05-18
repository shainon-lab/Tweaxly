// Server-side IP-country detection. On Vercel, the edge layer
// auto-adds an `x-vercel-ip-country` header (ISO 3166-1 alpha-2)
// to every request. We also check the Cloudflare equivalent so
// the code keeps working behind a Cloudflare tunnel during dev.
//
// Returns null in local dev (the headers aren't set) so callers
// can fall back to a sensible default.

import { headers } from "next/headers";
import { isRegionCode } from "./regions";

export function detectIpCountry(): string | null {
  try {
    const h = headers();
    const candidates = [
      h.get("x-vercel-ip-country"),
      h.get("cf-ipcountry"),
      h.get("x-country-code"),
    ];
    for (const c of candidates) {
      if (c && c !== "XX" && isRegionCode(c.toUpperCase())) {
        return c.toUpperCase();
      }
    }
  } catch {
    // headers() throws if called outside a request scope — caller
    // should fall back to null.
  }
  return null;
}
