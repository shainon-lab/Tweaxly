// Tweaxly wordmark — light-mode variant for the investor deck.
// Mixed-case "Tweaxly" with the lowercase "x" highlighted in the brand
// gradient (purple → blue → teal).

type Size = "sm" | "md" | "lg" | "xl";

const SIZE: Record<Size, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
  xl: "text-5xl md:text-6xl",
};

export default function Logo({
  size = "md",
  className = "",
}: {
  size?: Size;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center font-semibold tracking-tight leading-none text-ink-900 ${SIZE[size]} ${className}`}
      aria-label="Tweaxly"
    >
      <span>Twea</span>
      <span className="gradient-text font-bold">x</span>
      <span>ly</span>
    </div>
  );
}
