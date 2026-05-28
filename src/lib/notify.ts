// In-app replacement for window.alert() / window.confirm(). Provides
// an imperative singleton API so any client module can call
// `notify.alert("…")` / `await notify.confirm("…")` without having
// to thread a React hook through props.
//
// The actual modal is rendered by <NotifyProvider /> in the (app)
// layout. On mount it calls registerNotifyHandlers() to wire its
// state into this singleton; on unmount it falls back to the
// browser-native dialogs (handy for routes outside the (app)
// layout that haven't mounted the provider).

export interface NoticeRequest {
  title?: string;
  body:   string;
}

export interface ConfirmRequest {
  title?:        string;
  body:          string;
  confirmLabel?: string;
  cancelLabel?:  string;
  danger?:       boolean;
}

type AlertHandler   = (req: NoticeRequest  | string) => Promise<void>;
type ConfirmHandler = (req: ConfirmRequest | string) => Promise<boolean>;

let alertHandler:   AlertHandler   | null = null;
let confirmHandler: ConfirmHandler | null = null;

export function registerNotifyHandlers(handlers: {
  alert:   AlertHandler;
  confirm: ConfirmHandler;
}): void {
  alertHandler   = handlers.alert;
  confirmHandler = handlers.confirm;
}

export function unregisterNotifyHandlers(): void {
  alertHandler   = null;
  confirmHandler = null;
}

function bodyOf(req: NoticeRequest | ConfirmRequest | string): string {
  return typeof req === "string" ? req : req.body;
}

export const notify = {
  alert(req: NoticeRequest | string): Promise<void> {
    if (alertHandler) return alertHandler(req);
    if (typeof window !== "undefined") window.alert(bodyOf(req));
    return Promise.resolve();
  },
  confirm(req: ConfirmRequest | string): Promise<boolean> {
    if (confirmHandler) return confirmHandler(req);
    if (typeof window !== "undefined") return Promise.resolve(window.confirm(bodyOf(req)));
    return Promise.resolve(false);
  },
};
