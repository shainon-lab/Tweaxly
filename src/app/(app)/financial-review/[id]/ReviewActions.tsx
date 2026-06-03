"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { notify } from "@/lib/notify";

// Header action for a review: delete it (with confirm) and return to the
// module landing. Small client island so the detail page stays a server
// component.
export default function ReviewActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (busy) return;
    const ok = await notify.confirm("Delete this review? This cannot be undone.");
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/financial-review/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/financial-review");
      router.refresh();
    } catch {
      setBusy(false);
      await notify.alert("Could not delete the review. Please try again.");
    }
  }

  return (
    <button type="button" onClick={remove} disabled={busy} className="btn-ghost text-sm">
      <Trash2 size={15} className="mr-1.5" />
      Delete
    </button>
  );
}
