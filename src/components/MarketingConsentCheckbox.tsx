"use client";

// Optional marketing-consent checkbox for the registration form.
//
// HARD RULE: this is OPT-IN ONLY. It must default to unchecked, must
// not block registration, and must remain visually + structurally
// separate from the legal-acceptance checkbox so it cannot be read as
// part of legal acceptance. Anything else is a dark pattern.

export default function MarketingConsentCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-line/70 bg-ink-900/40 p-3">
      <label className="flex items-start gap-2.5 text-xs text-slate-300 leading-snug cursor-pointer select-none">
        <input
          type="checkbox"
          name="acceptMarketing"
          value="yes"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 size-4 rounded border-line bg-ink-900 accent-brand-purple"
        />
        <span>
          I agree to receive marketing updates, promotions, newsletters,
          product announcements, and commercial communications from
          Tweaxly via email, SMS, or other electronic communications.
        </span>
      </label>
      <p className="mt-2 ml-6 text-[11px] text-slate-500 leading-snug">
        Optional. You can unsubscribe or change your communication
        preferences at any time from Account → Communication Preferences.
      </p>
    </div>
  );
}
