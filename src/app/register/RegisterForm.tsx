"use client";

// Registration form. Two consent inputs sit before the submit button:
//
//   1. LegalCheckbox      — REQUIRED. Mandatory acceptance of Terms +
//                           Privacy Policy. Both viewable inline.
//                           Submit stays disabled until checked.
//
//   2. MarketingConsentCheckbox — OPTIONAL. Explicit opt-in to
//                           marketing communications. Defaults to
//                           unchecked. Does NOT block registration.
//
// The server re-validates `acceptTerms` as the source of truth for
// legal acceptance and records `acceptMarketing` for the marketing
// consent record.

import { useState } from "react";
import PasswordInput from "@/components/PasswordInput";
import LegalCheckbox from "@/components/LegalCheckbox";
import MarketingConsentCheckbox from "@/components/MarketingConsentCheckbox";

export default function RegisterForm({
  labels,
}: {
  labels: {
    businessName: string;
    yourName: string;
    email: string;
    passwordHint: string;
    create: string;
    footer: string;
  };
}) {
  const [legalAccepted,   setLegalAccepted]   = useState(false);
  const [marketingOptIn,  setMarketingOptIn]  = useState(false);

  return (
    <form action="/api/auth/register" method="post" className="space-y-4">
      <div>
        <label className="label">{labels.businessName}</label>
        <input className="input" name="businessName" required autoFocus placeholder="e.g. Acme Co." />
      </div>
      <div>
        <label className="label">{labels.yourName}</label>
        <input className="input" name="name" required placeholder="e.g. Sam Founder" />
      </div>
      <div>
        <label className="label">{labels.email}</label>
        <input className="input" name="email" type="email" required />
      </div>
      <div>
        <label className="label">{labels.passwordHint}</label>
        <PasswordInput name="password" required minLength={6} />
      </div>

      <div className="pt-1 space-y-3">
        <LegalCheckbox checked={legalAccepted} onChange={setLegalAccepted} />
        <MarketingConsentCheckbox checked={marketingOptIn} onChange={setMarketingOptIn} />
      </div>

      <button
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        type="submit"
        disabled={!legalAccepted}
      >
        {labels.create}
      </button>
      <p className="text-xs text-slate-500 text-center">{labels.footer}</p>
    </form>
  );
}
