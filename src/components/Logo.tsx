// TWEAXLY wordmark. The X is two chevrons (< purple + > teal) meeting at a
// shared center vertex - matching the brand mark exactly. The component
// carries its own navy panel so it always sits on the correct background
// regardless of where it's rendered.

type Size = "sm" | "md" | "lg";

const NAVY = "#0a1428";
const PURPLE = "#A78BFA";
const TEAL = "#22D3EE";

const SIZE_MAP: Record<
  Size,
  { wordPx: number; taglinePx: number; padX: string; padY: string; gap: string; xSize: number }
> = {
  sm: { wordPx: 16, taglinePx: 8,  padX: "px-3", padY: "py-2",   gap: "mt-1",   xSize: 16 },
  md: { wordPx: 22, taglinePx: 10, padX: "px-4", padY: "py-3",   gap: "mt-1.5", xSize: 22 },
  lg: { wordPx: 40, taglinePx: 13, padX: "px-6", padY: "py-5",   gap: "mt-2.5", xSize: 40 },
};

export default function Logo({
  size = "md",
  showTagline = false,
  className = "",
}: {
  size?: Size;
  showTagline?: boolean;
  className?: string;
}) {
  const s = SIZE_MAP[size];
  return (
    // The brand is a left-to-right wordmark ("TWEA · X · LY") with a
    // tagline below. When the surrounding document is RTL (Hebrew),
    // flex children would reverse and the mark would render as
    // "YL · X · AEWT" - so we lock the Logo to dir="ltr" regardless
    // of the page direction.
    <div
      dir="ltr"
      className={`inline-flex flex-col items-center rounded-lg ${s.padX} ${s.padY} ${className}`}
      style={{ backgroundColor: NAVY }}
      aria-label="TWEAXLY"
    >
      <div
        className="flex items-center font-semibold text-white"
        style={{ fontSize: s.wordPx, lineHeight: 1, letterSpacing: "0.12em" }}
      >
        <span>TWEA</span>
        <SplitX size={s.xSize} />
        <span>LY</span>
      </div>
      {showTagline ? (
        <div
          className={`uppercase font-medium whitespace-nowrap ${s.gap}`}
          style={{ fontSize: s.taglinePx, letterSpacing: "0.25em", color: "#cbd5e1" }}
        >
          Your AI Business Pulse
        </div>
      ) : null}
    </div>
  );
}

function SplitX({ size }: { size: number }) {
  const w = size * 0.95;
  const h = size;
  const stroke = Math.max(2, size * 0.18);
  const inset = stroke / 2 + 1;
  const cx = w / 2;
  const cy = h / 2;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: "inline-block", verticalAlign: "middle", marginInline: size * 0.04 }}
      aria-hidden="true"
    >
      <polyline
        points={`${inset},${inset} ${cx},${cy} ${inset},${h - inset}`}
        fill="none"
        stroke={PURPLE}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={`${w - inset},${inset} ${cx},${cy} ${w - inset},${h - inset}`}
        fill="none"
        stroke={TEAL}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
