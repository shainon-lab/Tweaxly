// App-wide loading fallback. Next.js renders this whenever a server
// component under the (app) layout is streaming - workspace switches,
// dashboard navigation, sub-tab clicks. Without it, the user sees the
// previous page hang while the new one fetches, which feels broken.
//
// Uses the same sweeping gradient bar as upload progress + the
// consultation thinking screen so every "something is happening"
// surface speaks the same visual language.

import LoadingBar from "@/components/LoadingBar";

export default function Loading() {
  return (
    <div className="space-y-4 py-8">
      <LoadingBar label="Loading…" hint="Fetching the latest data" />
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card animate-pulse">
          <div className="h-3 w-1/3 rounded bg-ink-700/50 mb-3" />
          <div className="h-6 w-2/3 rounded bg-ink-700/40" />
        </div>
        <div className="card animate-pulse">
          <div className="h-3 w-1/3 rounded bg-ink-700/50 mb-3" />
          <div className="h-6 w-2/3 rounded bg-ink-700/40" />
        </div>
        <div className="card animate-pulse">
          <div className="h-3 w-1/3 rounded bg-ink-700/50 mb-3" />
          <div className="h-6 w-2/3 rounded bg-ink-700/40" />
        </div>
      </div>
      <div className="card animate-pulse">
        <div className="h-3 w-1/4 rounded bg-ink-700/50 mb-3" />
        <div className="h-3 w-full rounded bg-ink-700/40 mb-2" />
        <div className="h-3 w-5/6 rounded bg-ink-700/40 mb-2" />
        <div className="h-3 w-3/4 rounded bg-ink-700/40" />
      </div>
    </div>
  );
}
