"use client";

// Reusable "How it Works?" help affordance. Renders a small pill
// trigger next to the page title (via PageHeader.right) and opens a
// centered floating modal with per-page copy.
//
// Designed for future expansion: when the owner ships tour videos,
// pass `videoUrl` and an extra video-icon button appears next to
// the question icon. Clicking it embeds the video inside the modal
// instead of (or alongside) the explainer copy.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, X as XIcon, Video } from "lucide-react";

export interface HowItWorksCard {
  icon:  React.ReactNode;
  title: string;
  body:  string;
}

export interface HowItWorksProps {
  // Modal heading.
  title: string;
  // Optional small caption rendered under the title (e.g. "6 of 6
  // active · Pro plan" on the signals surface).
  subtitle?: string;
  // One-paragraph intro that explains what this surface is for.
  intro: string;
  // Optional 3-up card grid for the key concepts / actions.
  cards?: HowItWorksCard[];
  // Optional closing paragraph (cross-surface tie-ins, gotchas).
  outro?: React.ReactNode;
  // Trigger label, defaults to "How it Works?".
  label?: string;
  // Future: full URL of a short tour video. When provided, a small
  // play-icon button sits next to the trigger; clicking it opens the
  // modal in video mode. Leave undefined for surfaces without video.
  videoUrl?: string;
}

export default function HowItWorks({
  title, subtitle, intro, cards, outro,
  label = "How it Works?",
  videoUrl,
}: HowItWorksProps) {
  const [open, setOpen] = useState<"copy" | "video" | null>(null);

  // Portal target - body so the backdrop escapes any sticky / overflow
  // ancestor (PageHeader is sticky and would otherwise trap us).
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => { setPortalTarget(document.body) }, []);

  // ESC closes + body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(null) }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen("copy")}
          aria-label={label}
          title={label}
          // Compact icon-only trigger sized to sit inline next to a
          // page title without competing with action buttons in
          // PageHeader.right. Native title attribute carries the
          // "How it works?" tooltip on hover.
          className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-line text-slate-400 hover:text-accent hover:border-accent/60 hover:bg-accent-soft/20 transition"
        >
          <HelpCircle size={13} strokeWidth={1.75} aria-hidden="true" />
        </button>
        {videoUrl ? (
          <button
            type="button"
            onClick={() => setOpen("video")}
            aria-label="Watch tour video"
            title="Watch tour video"
            className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-line text-slate-400 hover:text-accent hover:border-accent/60 hover:bg-accent-soft/20 transition"
          >
            <Video size={13} strokeWidth={1.75} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {open && portalTarget ? createPortal(
        <div
          className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="how-it-works-title"
          onClick={() => setOpen(null)}
        >
          <section
            onClick={(e) => e.stopPropagation()}
            className={`rounded-2xl border border-line shadow-2xl shadow-black/40 ${cards && cards.length >= 4 ? "max-w-4xl" : "max-w-2xl"} w-full bg-ink-900 overflow-hidden animate-[slideInRight_180ms_ease-out]`}
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(124,92,250,0.10) 0%, rgba(79,125,255,0.06) 50%, rgba(34,211,238,0.08) 100%)",
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-5 md:p-6 border-b border-line/40">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <span className="shrink-0 inline-flex w-10 h-10 rounded-2xl bg-accent-soft/40 border border-brand-purple/30 items-center justify-center text-brand-purple">
                  {open === "video" ? <Video size={18} strokeWidth={1.5} /> : <HelpCircle size={18} strokeWidth={1.5} />}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id="how-it-works-title" className="text-base md:text-lg font-semibold text-slate-50 leading-tight">
                    {title}
                  </h2>
                  {subtitle ? (
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">
                      {subtitle}
                    </div>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Close"
                className="w-8 h-8 rounded-md text-slate-400 hover:text-white hover:bg-ink-700 inline-flex items-center justify-center transition shrink-0"
              >
                <XIcon size={16} strokeWidth={1.75} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 md:p-6">
              {open === "video" && videoUrl ? (
                <div className="aspect-video w-full rounded-lg overflow-hidden border border-line bg-black">
                  <iframe
                    src={videoUrl}
                    className="w-full h-full"
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {intro}
                  </p>

                  {cards && cards.length > 0 ? (
                    <div className={`mt-5 grid gap-3 ${
                      cards.length === 2 ? "sm:grid-cols-2"
                      : cards.length === 3 ? "sm:grid-cols-3"
                      : cards.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4"
                      : "sm:grid-cols-3"
                    }`}>
                      {cards.map((c, i) => (
                        <ExplainerCard key={i} icon={c.icon} title={c.title} body={c.body} />
                      ))}
                    </div>
                  ) : null}

                  {outro ? (
                    <div className="mt-5 text-xs text-slate-400 leading-relaxed">
                      {outro}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </section>
        </div>,
        portalTarget,
      ) : null}
    </>
  );
}

function ExplainerCard({
  icon, title, body,
}: {
  icon:  React.ReactNode;
  title: string;
  body:  string;
}) {
  return (
    <div className="rounded-lg border border-line/60 bg-ink-900/40 p-3">
      <div className="flex items-center gap-2 text-slate-200 text-sm font-medium mb-1">
        <span className="text-accent">{icon}</span>
        {title}
      </div>
      <div className="text-xs text-slate-400 leading-relaxed">
        {body}
      </div>
    </div>
  );
}
