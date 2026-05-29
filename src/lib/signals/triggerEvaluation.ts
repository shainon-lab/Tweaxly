// Single helper used by every "fresh data landed" hook (CSV upload
// commit, Plaid sync, future integrations) to trigger a signal
// re-evaluation. Fire-and-forget by design - the caller has already
// returned a successful response to the user by the time this
// finishes, so we never want this side-effect to block the ingest
// path or surface a failure to the upload UI.
//
// Zero AI credits - same deterministic evaluator + diff-based
// dispatcher used by every other automatic trigger.

import "server-only";
import { evaluateSignals } from "./evaluator";
import { dispatchSignalNotifications } from "./notifications";

export function triggerSignalEvaluation(businessId: string, sourceLabel: string): void {
  void (async () => {
    try {
      const diff = await evaluateSignals(businessId);
      await dispatchSignalNotifications(businessId, diff);
    } catch (err) {
      console.error(`[signals:trigger:${sourceLabel}] evaluation failed business=${businessId}`, err);
    }
  })();
}
