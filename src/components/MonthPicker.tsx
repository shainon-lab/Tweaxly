"use client";
import { useRouter, useSearchParams } from "next/navigation";

export default function MonthPicker({ months, current }: { months: string[]; current: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const allMonths = months.length ? months : [current];
  return (
    <select
      className="input max-w-[180px]"
      value={current}
      onChange={(e) => {
        const sp = new URLSearchParams(params.toString());
        sp.set("ym", e.target.value);
        router.push(`?${sp.toString()}`);
      }}
    >
      {allMonths.map((m) => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select>
  );
}
