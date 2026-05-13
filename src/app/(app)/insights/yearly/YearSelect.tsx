"use client";

// URL-driven year selector for /insights/yearly. Pushes ?year=YYYY.

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

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

  function pick(y: number) {
    const params = new URLSearchParams(sp.toString());
    params.set("year", String(y));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div>
      <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">
        Year
      </label>
      <select
        className="input"
        value={selected}
        onChange={(e) => pick(Number(e.target.value))}
        disabled={pending}
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
