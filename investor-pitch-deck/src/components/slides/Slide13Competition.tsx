import SlideShell, { SlideTitle, SlideLead } from "../SlideShell";

type Cap = "Records transactions" | "Forecasts business impact" | "Detects operational signals" | "AI decision support" | "Explains profitability" | "Cashflow intelligence";

const CAPS: Cap[] = [
  "Records transactions",
  "Forecasts business impact",
  "Detects operational signals",
  "AI decision support",
  "Explains profitability",
  "Cashflow intelligence",
];

type Vendor = { name: string; caps: Partial<Record<Cap, boolean>>; isUs?: boolean };

const VENDORS: Vendor[] = [
  {
    name: "QuickBooks",
    caps: { "Records transactions": true },
  },
  {
    name: "Xero",
    caps: { "Records transactions": true },
  },
  {
    name: "ERP systems",
    caps: { "Records transactions": true, "Explains profitability": true },
  },
  {
    name: "Tweaxly",
    isUs: true,
    caps: {
      "Records transactions": true,
      "Forecasts business impact": true,
      "Detects operational signals": true,
      "AI decision support": true,
      "Explains profitability": true,
      "Cashflow intelligence": true,
    },
  },
];

export default function Slide13Competition({ total }: { total: number }) {
  return (
    <SlideShell number={13} total={total} eyebrow="Competitive positioning">
      <SlideTitle>
        Not accounting software.<br />
        <span className="gradient-text">Operational intelligence</span>.
      </SlideTitle>
      <SlideLead>
        QuickBooks-style tools record what happened. Tweaxly explains why, predicts what&apos;s next, and tells the owner what to do.
      </SlideLead>

      <div className="mt-10 card overflow-x-auto max-w-6xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="text-left py-3 pr-3 text-xs uppercase tracking-[0.15em] text-ink-500 font-medium">
                Capability
              </th>
              {VENDORS.map((v) => (
                <th
                  key={v.name}
                  className={`text-center py-3 px-2 font-semibold ${
                    v.isUs ? "text-ink-900" : "text-ink-600"
                  }`}
                >
                  <div className={v.isUs ? "inline-block px-3 py-1 rounded-full bg-ink-900 text-white text-xs" : "text-xs"}>
                    {v.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CAPS.map((cap) => (
              <tr key={cap} className="border-b border-line/60 last:border-b-0">
                <td className="py-3 pr-3 text-ink-800">{cap}</td>
                {VENDORS.map((v) => (
                  <td key={v.name} className="text-center py-3 px-2">
                    {v.caps[cap] ? (
                      <span
                        className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold ${
                          v.isUs
                            ? "text-white"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        }`}
                        style={
                          v.isUs
                            ? {
                                backgroundImage:
                                  "linear-gradient(135deg, #7c5cfa 0%, #22d3ee 100%)",
                              }
                            : undefined
                        }
                      >
                        ✓
                      </span>
                    ) : (
                      <span className="text-ink-300">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SlideShell>
  );
}
