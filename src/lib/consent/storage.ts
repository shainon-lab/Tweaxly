// Cookie + localStorage persistence for the consent record.
//
// Cookie is the canonical store (works server-side, survives across
// subdomains via the `.tweaxly.com` domain attribute). localStorage is
// a redundant client-side mirror so the script-blocking init script
// can hydrate before any cookie parser runs.

import {
  COOKIE_MAX_AGE, COOKIE_NAME, STORAGE_KEY,
  type ConsentState,
} from "./types";

// Domain to scope the cookie to so production app + marketing share it.
// In dev (localhost) we let the browser default to host-only. The
// preview deployments on *.vercel.app also need host-only because the
// `.tweaxly.com` scope wouldn't match those hosts.
function cookieDomain(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "";
  if (host.endsWith(".tweaxly.com") || host === "tweaxly.com") {
    return "; Domain=.tweaxly.com";
  }
  return "";
}

export function readCookieClient(): ConsentState | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(
    `(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`
  ));
  if (!match) return null;
  try {
    const decoded = atob(decodeURIComponent(match[1]));
    return JSON.parse(decoded) as ConsentState;
  } catch { return null; }
}

export function readStorage(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentState;
  } catch { return null; }
}

// Reads either store; cookie wins if both exist (it's authoritative).
export function readConsent(): ConsentState | null {
  return readCookieClient() ?? readStorage();
}

export function writeConsent(state: ConsentState): void {
  if (typeof document === "undefined") return;
  // base64 of JSON keeps the cookie value safe from header-mangling
  // characters and gives us a clean canonical encoding.
  const payload = btoa(JSON.stringify(state));
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(payload)}`,
    `Path=/`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    `SameSite=Lax`,
    // Secure can't be set on http://localhost — only add it elsewhere.
    typeof window !== "undefined" && window.location.protocol === "https:" ? "Secure" : "",
    cookieDomain(),
  ].filter(Boolean);
  document.cookie = parts.join("; ");

  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { /* quota / private mode */ }
}

export function clearConsent(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${cookieDomain()}`;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
}
