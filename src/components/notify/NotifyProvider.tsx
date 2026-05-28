"use client";

// In-app replacement for window.alert() and window.confirm().
//
// On mount, registers itself with the singleton in @/lib/notify so
// every client module can just `import { notify } from "@/lib/notify"`
// and call `notify.alert(...)` / `await notify.confirm(...)` directly,
// without having to thread a React hook through props.
//
// The optional React context is still exposed via useNotify() for
// places that prefer the hook style.
//
// Mounted in the (app) layout once; available to every client
// component below it in the tree.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  registerNotifyHandlers, unregisterNotifyHandlers,
  type NoticeRequest, type ConfirmRequest,
} from "@/lib/notify";

interface NotifyContextValue {
  alert:   (req: NoticeRequest | string) => Promise<void>;
  confirm: (req: ConfirmRequest | string) => Promise<boolean>;
}

const NotifyContext = createContext<NotifyContextValue | null>(null);

export function useNotify(): NotifyContextValue {
  const ctx = useContext(NotifyContext);
  if (!ctx) {
    // Fail safe: if the provider somehow isn't mounted, fall back to
    // window dialogs so callers don't crash. Logs a warning so the
    // missing provider gets noticed in dev.
    if (typeof window !== "undefined") {
      console.warn("useNotify() called outside NotifyProvider - falling back to window.alert/confirm");
    }
    return {
      alert:   (req) => { window.alert(typeof req === "string" ? req : req.body); return Promise.resolve(); },
      confirm: (req) => Promise.resolve(window.confirm(typeof req === "string" ? req : req.body)),
    };
  }
  return ctx;
}

type Pending =
  | { kind: "notice";  req: NoticeRequest;  resolve: () => void }
  | { kind: "confirm"; req: ConfirmRequest; resolve: (ok: boolean) => void };

export default function NotifyProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const alert = useCallback((req: NoticeRequest | string): Promise<void> => {
    return new Promise<void>((resolve) => {
      const r: NoticeRequest = typeof req === "string" ? { body: req } : req;
      setPending({ kind: "notice", req: r, resolve });
    });
  }, []);

  const confirm = useCallback((req: ConfirmRequest | string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      const r: ConfirmRequest = typeof req === "string" ? { body: req } : req;
      setPending({ kind: "confirm", req: r, resolve });
    });
  }, []);

  // Register with the singleton so non-React modules can import
  // `notify` directly without going through the context. Unregister
  // on unmount so we don't leak the closure between routes.
  useEffect(() => {
    registerNotifyHandlers({ alert, confirm });
    return () => unregisterNotifyHandlers();
  }, [alert, confirm]);

  function closeAlert() {
    setPending((p) => {
      if (p?.kind === "notice") p.resolve();
      return null;
    });
  }
  function closeConfirm(ok: boolean) {
    setPending((p) => {
      if (p?.kind === "confirm") p.resolve(ok);
      return null;
    });
  }

  return (
    <NotifyContext.Provider value={{ alert, confirm }}>
      {children}
      {pending?.kind === "notice" ? (
        <NoticeModal
          title={pending.req.title ?? "Notice"}
          body={pending.req.body}
          onClose={closeAlert}
        />
      ) : null}
      {pending?.kind === "confirm" ? (
        <ConfirmModal
          title={pending.req.title ?? "Confirm"}
          body={pending.req.body}
          confirmLabel={pending.req.confirmLabel ?? "OK"}
          cancelLabel={pending.req.cancelLabel ?? "Cancel"}
          danger={!!pending.req.danger}
          onCancel={() => closeConfirm(false)}
          onConfirm={() => closeConfirm(true)}
        />
      ) : null}
    </NotifyContext.Provider>
  );
}

// ─── Modal components (internal) ───────────────────────────────────

function NoticeModal({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="text-base font-semibold mb-2 text-slate-100">{title}</div>
        <div className="text-sm text-slate-300 leading-relaxed mb-5 whitespace-pre-wrap break-words">{body}</div>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} autoFocus className="btn-primary text-sm">OK</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  title, body, confirmLabel, cancelLabel, danger, onCancel, onConfirm,
}: {
  title:        string;
  body:         string;
  confirmLabel: string;
  cancelLabel:  string;
  danger:       boolean;
  onCancel:     () => void;
  onConfirm:    () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="text-base font-semibold mb-2 text-slate-100">{title}</div>
        <div className="text-sm text-slate-300 leading-relaxed mb-5 whitespace-pre-wrap break-words">{body}</div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-ghost text-sm">{cancelLabel}</button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className={`text-sm px-4 py-2 rounded-md font-medium transition ${
              danger
                ? "border border-bad text-bad hover:bg-bad/10"
                : "btn-primary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
