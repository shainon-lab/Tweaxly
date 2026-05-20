"use client";

// App-wide error boundary. Without this, any unhandled server-render
// error in /app/(app) renders as a blank page - the symptom the user
// hit on a fresh account clicking through tabs. Show something useful
// instead, and a Retry button that re-runs the failed segment.

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card text-center py-12 px-4">
      <div className="text-base font-medium text-slate-100 mb-2">
        Something went wrong loading this page
      </div>
      <div className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-4">
        It&apos;s usually transient - give it another try. If you just signed up, some pages may look empty until you finish setting things up.
      </div>
      {error?.digest ? (
        <div className="text-[11px] text-slate-500 mb-4">Reference: {error.digest}</div>
      ) : null}
      <button type="button" className="btn-primary" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
