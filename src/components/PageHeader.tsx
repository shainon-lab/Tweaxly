// Sticky page header - stays pinned at the top of the (app) layout's
// <main> scroll container so users keep page context + actions while
// scrolling long data screens.
//
// Implementation rules (per scroll-stability requirements):
//   - Pure CSS position: sticky. NO JavaScript scroll tracking, NO
//     IntersectionObserver, NO scroll listeners. The entire surface
//     stays in the DOM at all times.
//   - The header dimensions are FIXED. No scroll-driven compact mode,
//     no padding / text-size / opacity transitions during scroll.
//   - Solid background (bg-ink-950 - the deepest app surface) so
//     scrolling content cannot show through.
//   - z-30 keeps it above scrolled content but below modals (z-40+)
//     and the Consult overlay.
//   - Stays a Server Component so it doesn't add a hydration boundary
//     to every page.

export default function PageHeader({
  title,
  subtitle,
  right,
  help,
}: {
  title:    string;
  subtitle?: string;
  right?:    React.ReactNode;
  // Small inline help trigger (e.g. <HowItWorks/>) rendered as a
  // sibling of the title so it never competes with action buttons
  // in `right` (period pickers, download buttons, etc).
  help?:     React.ReactNode;
}) {
  return (
    <div
      // Extended-width background: the negative + positive horizontal
      // padding cancels the inner-div px-* so the bar spans the full
      // width of the scroll-container content area. Border-bottom
      // gives clean visual separation; no shadow, no transitions.
      className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-ink-950 border-b border-line/40 py-4"
    >
      <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">
              {title}
            </h1>
            {help ? <div className="shrink-0">{help}</div> : null}
          </div>
          {subtitle ? (
            <div className="text-sm text-slate-400 mt-1 leading-snug">
              {subtitle}
            </div>
          ) : null}
        </div>
        {right ? (
          <div className="flex items-center gap-2 shrink-0">{right}</div>
        ) : null}
      </div>
    </div>
  );
}
