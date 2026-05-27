"use client";

// Registration form. Two consent inputs sit before the submit button:
//
//   1. LegalCheckbox      - REQUIRED. Mandatory acceptance of Terms +
//                           Privacy Policy. Both viewable inline.
//                           Submit stays disabled until checked.
//
//   2. MarketingConsentCheckbox - OPTIONAL. Explicit opt-in to
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
  inviteToken,
  prefillEmail,
}: {
  labels: {
    businessName: string;
    yourName: string;
    email: string;
    passwordHint: string;
    create: string;
  };
  // When set, signup is an invitation-acceptance flow: we hide the
  // business-name field (the user is joining an existing workspace),
  // pre-fill the invited email, and pass the token through to the
  // server so it can route the redirect to /invite/[token] after
  // signup succeeds.
  inviteToken?: string | null;
  prefillEmail?: string | null;
}) {
  const [legalAccepted,   setLegalAccepted]   = useState(false);
  const [marketingOptIn,  setMarketingOptIn]  = useState(false);

  return (
    <form action="/api/auth/register" method="post" className="space-y-4">
      {inviteToken ? (
        <>
          {/* Hidden token gets read by the register handler so it can
              redirect to /invite/[token] (auto-accept) instead of
              /onboarding after the user is created. */}
          <input type="hidden" name="invite" value={inviteToken} />
          {/* No business-name field on the invitation flow: the user
              is joining an existing workspace, not creating one. The
              server uses a sensible default name internally. */}
        </>
      ) : (
        <div>
          <label className="label">{labels.businessName}</label>
          <input className="input" name="businessName" required autoFocus placeholder="e.g. Acme Co." />
        </div>
      )}
      <div>
        <label className="label">{labels.yourName}</label>
        <input className="input" name="name" required placeholder="e.g. Sam Founder" />
      </div>
      <div>
        <label className="label">{labels.email}</label>
        <input
          className="input"
          name="email"
          type="email"
          required
          defaultValue={prefillEmail ?? ""}
          readOnly={!!inviteToken}
        />
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
    </form>
  );
}
