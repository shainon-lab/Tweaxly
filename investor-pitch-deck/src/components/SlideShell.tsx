// Reusable shell for every slide: full-viewport section, eyebrow + slide
// number top-right, generous padding, and a soft branded radial wash in the
// background that anchors the slide visually without competing with the
// content.

import Logo from "./Logo";

export default function SlideShell({
  number,
  total,
  eyebrow,
  children,
  bgVariant = "default",
}: {
  number: number;
  total: number;
  eyebrow?: string;
  children: React.ReactNode;
  bgVariant?: "default" | "soft" | "deep";
}) {
  const bg =
    bgVariant === "deep"
      ? "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)"
      : bgVariant === "soft"
        ? "radial-gradient(60% 50% at 80% 10%, rgba(124,92,250,0.08) 0%, transparent 70%), radial-gradient(60% 50% at 10% 90%, rgba(34,211,238,0.08) 0%, transparent 70%)"
        : "radial-gradient(60% 50% at 90% 0%, rgba(124,92,250,0.06) 0%, transparent 70%)";

  return (
    <section
      id={`slide-${number}`}
      className="slide relative overflow-hidden"
      style={{ backgroundImage: bg }}
    >
      <header className="absolute top-0 left-0 right-0 px-8 md:px-16 py-6 flex items-center justify-between">
        <Logo size="md" />
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-ink-500">
          {eyebrow ? <span className="hidden md:inline">{eyebrow}</span> : null}
          <span className="font-mono">
            {String(number).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
      </header>
      <div className="container-deck py-16 md:py-20 flex-1 flex flex-col justify-center">
        {children}
      </div>
    </section>
  );
}

// Helper: large slide headline.
export function SlideTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-ink-900 leading-[1.05] max-w-5xl">
      {children}
    </h2>
  );
}

export function SlideLead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 text-lg md:text-xl text-ink-600 leading-relaxed max-w-3xl">
      {children}
    </p>
  );
}
