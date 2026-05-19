"use client";

// Wraps the registration form so the submit button stays disabled
// until the user accepts the Terms of Service. Server still
// re-validates the acceptTerms hidden value as the source of truth.

import { useState } from "react";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import TermsCheckbox from "@/components/TermsCheckbox";

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
  const [accepted, setAccepted] = useState(false);

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
      <div className="pt-1">
        <TermsCheckbox checked={accepted} onChange={setAccepted} />
      </div>
      <button
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        type="submit"
        disabled={!accepted}
      >
        {labels.create}
      </button>
      <p className="text-xs text-slate-500 text-center">{labels.footer}</p>
    </form>
  );
}
