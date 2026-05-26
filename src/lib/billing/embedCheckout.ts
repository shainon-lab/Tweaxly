// Wrapper around @polar-sh/checkout's PolarEmbedCheckout that keeps
// the user inside Tweaxly during the entire billing flow.
//
// Why a wrapper:
//   - The SDK ships an iframe + modal chrome, but its default `success`
//     handler redirects the parent window to the checkout's `successUrl`
//     when present. We set successUrl server-side (for the small set
//     of users who get a hosted-Polar redirect flow, e.g. from the
//     customer portal), but inside the embedded flow we want to STAY
//     in-app. Calling event.preventDefault() on the success event
//     suppresses the SDK's redirect.
//   - The SDK is dynamically imported so it never lands in the server
//     bundle and the parent doesn't ship the iframe code on first
//     paint (only on actual checkout-open click).
//   - Callers pass async hooks for success / close / error so each
//     modal can refresh its own slice of state (router.refresh,
//     toast, "Welcome to Premium" overlay, etc.).
//
// Frontend success NEVER unlocks features on its own — the webhook is
// still the source of truth (handled by /api/billing/webhooks/polar).
// onSuccess just refreshes server-rendered state so the new plan /
// credit balance lands in the UI as soon as the webhook arrives.

export type EmbeddedCheckoutHandlers = {
  // Fires the instant Polar's iframe emits `success`. Use this to
  // close your modal + start a `router.refresh()` + show a toast.
  onSuccess?: (info: { successURL?: string }) => void;
  // Fires when the user closes the iframe before paying. The modal
  // should still close itself - this is just a hook for analytics.
  onClose?: () => void;
  // Fires during the small window between submitting and receiving
  // success. Useful for hiding the close button so the user can't
  // navigate away mid-charge.
  onConfirmed?: () => void;
  // Fires when the iframe fails to mount, the network errors, or
  // PolarEmbedCheckout rejects. Returns an Error-like string the
  // caller can render.
  onError?: (message: string) => void;
};

export async function openEmbeddedCheckout(
  checkoutUrl: string,
  handlers: EmbeddedCheckoutHandlers = {},
  options: { theme?: "light" | "dark" } = {},
): Promise<void> {
  try {
    // Dynamic import keeps the SDK out of the initial JS bundle.
    const { PolarEmbedCheckout } = await import("@polar-sh/checkout/embed");
    // Default theme is "light" so the checkout card reads as a clean,
    // bright surface even inside Tweaxly's dark app. The platform's
    // dark theme already makes the surrounding page heavy; a dark
    // checkout iframe on top of it stacks too much black.
    const instance = await PolarEmbedCheckout.create(checkoutUrl, {
      theme: options.theme ?? "light",
    });

    instance.addEventListener("success", (event) => {
      // Suppress the SDK's default redirect — we want the user to
      // stay on the page they were on. Frontend just refreshes
      // server state; webhook is the actual source of truth.
      event.preventDefault();
      handlers.onSuccess?.({ successURL: event.detail.successURL });
      // The SDK keeps the iframe open after success when the
      // redirect is suppressed. Close it ourselves so the modal
      // dismisses cleanly.
      try { instance.close(); } catch { /* already closed */ }
    });

    instance.addEventListener("close", () => {
      handlers.onClose?.();
    });

    instance.addEventListener("confirmed", () => {
      handlers.onConfirmed?.();
    });
  } catch (err) {
    handlers.onError?.(err instanceof Error ? err.message : "Couldn't open checkout.");
  }
}
