"use client";

// URL-driven year selector for /insights/yearly. Pushes ?year=YYYY.

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export default function YearSelect({
  selected,
  years,
}: {
  selected: number;
  years: number[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  // Optimistic mirror so the select reflects the click immediately
  // while the Server Component navigation happens underneath.
  const [draft, setDraft] = useState<number>(selected);
  useEffect(() => { setDraft(selected); }, [selected]);

  function pick(y: number) {
    setDraft(y);
    const params = new URLSearchParams(sp.toString());
    params.set("year", String(y));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div>
      <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">
        Year{pending ? <span aria-hidden className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse align-middle" /> : null}
      </label>
      <select
        className="input"
        value={draft}
        onChange={(e) => pick(Number(e.target.value))}
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
