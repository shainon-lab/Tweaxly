// Tracking provider registry.
//
// Each tracking script (GA, Meta Pixel, Google Ads, LinkedIn, …) is
// registered as a TrackingProvider with a category, a load() function
// that injects the script, and an optional unload() that tears it
// down. The ConsentProvider calls applyConsent(state) on every change
// and the registry routes load/unload decisions based on the user's
// granted categories.
//
// CRITICAL: load() must never be called for a category that hasn't
// been granted. This is the gate that keeps marketing pixels off the
// page until the user opts in.

import type { ConsentState, OptionalCategory } from "./types";
import { isGranted } from "./types";

export interface TrackingProvider {
  id:          string;           // stable identifier - "ga4", "meta-pixel", …
  name:        string;           // human-readable name for docs / UI
  category:    OptionalCategory; // necessary providers don't need registration
  load:        () => void | Promise<void>;
  unload?:     () => void;       // best-effort teardown after withdrawal
}

const providers = new Map<string, TrackingProvider>();
const loaded    = new Set<string>();

export function registerProvider(p: TrackingProvider): void {
  providers.set(p.id, p);
}

export function unregisterProvider(id: string): void {
  providers.delete(id);
  loaded.delete(id);
}

export function listProviders(): TrackingProvider[] {
  return Array.from(providers.values());
}

export function isProviderLoaded(id: string): boolean {
  return loaded.has(id);
}

// Re-evaluate every provider against the current consent state.
// Called by the ConsentProvider on mount and on every consent update.
export async function applyConsent(state: ConsentState): Promise<void> {
  for (const p of providers.values()) {
    const shouldRun = isGranted(state, p.category);
    const isRunning = loaded.has(p.id);

    if (shouldRun && !isRunning) {
      try {
        await p.load();
        loaded.add(p.id);
      } catch (err) {
        // Don't take down the whole consent system if one provider's
        // injection fails - log to console and continue.
        // eslint-disable-next-line no-console
        console.error(`[consent] provider ${p.id} failed to load`, err);
      }
    } else if (!shouldRun && isRunning) {
      try { p.unload?.(); } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[consent] provider ${p.id} failed to unload`, err);
      }
      loaded.delete(p.id);
    }
  }
}
