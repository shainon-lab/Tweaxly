"use client";

// Per-row actions dropdown for the accounts table. Surfaces View,
// Impersonate, Extend Trial, Add Note (jumps to the Notes section
// on the customer 360), and Suspend / Reactivate. Every destructive
// action confirms before firing.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { notify } from "@/lib/notify";

export default function RowActions({
  businessId,
  businessName,
  status,
}: {
  businessId: string;
  businessName: string;
  status: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function changeStatus(next: string, prompt: string) {
    if (!(await notify.confirm({ title: "Change account status?", body: prompt, confirmLabel: "Confirm", danger: true }))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/accounts/${businessId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) notify.alert("Status update failed");
      else router.refresh();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function impersonate() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessId, allowWrites: false }),
      });
      if (!res.ok) { notify.alert("Impersonation failed"); setBusy(false); return; }
      window.location.assign("/dashboard");
    } catch {
      setBusy(false);
    }
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-line text-slate-400 hover:text-white hover:bg-ink-700 transition"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${businessName}`}
      >
        <MoreHorizontal size={14} strokeWidth={2} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-1 z-20 w-48 rounded-lg border border-line bg-ink-900/95 backdrop-blur shadow-xl shadow-black/50 py-1 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <Item href={`/admin/accounts/${businessId}`}>View account</Item>
          <button
            type="button"
            disabled={busy}
            onClick={impersonate}
            className="w-full text-left px-3 py-1.5 text-accent hover:bg-accent-soft/30 transition disabled:opacity-50"
            role="menuitem"
          >
            Impersonate
          </button>
          <Item href={`/admin/accounts/${businessId}#plan`}>Edit plan & trial</Item>
          <Item href={`/admin/accounts/${businessId}#notes`}>Add note</Item>
          <div className="border-t border-line my-1" />
          {status === "suspended" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => changeStatus("active", `Reactivate "${businessName}"?`)}
              className="w-full text-left px-3 py-1.5 text-good hover:bg-good/10 transition disabled:opacity-50"
              role="menuitem"
            >
              Reactivate
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => changeStatus("suspended", `Suspend "${businessName}"? Users will be blocked from every app page until reactivated.`)}
              className="w-full text-left px-3 py-1.5 text-bad hover:bg-bad/10 transition disabled:opacity-50"
              role="menuitem"
            >
              Suspend account
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Item({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      role="menuitem"
      className="block px-3 py-1.5 text-slate-200 hover:bg-ink-700 transition"
    >
      {children}
    </a>
  );
}
