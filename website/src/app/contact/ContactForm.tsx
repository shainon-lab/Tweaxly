"use client";

import { useState } from "react";
import LegalCheckbox from "@/components/LegalCheckbox";

export default function ContactForm() {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(false);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!accepted) {
      setStatus({ kind: "err", text: "Please accept the Terms of Service and Privacy Policy to send the form." });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, acceptTerms: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStatus({ kind: "err", text: body.error ?? `Something went wrong (HTTP ${res.status}). Please try again.` });
        return;
      }
      setStatus({ kind: "ok", text: "Thanks — we got your message. We'll get back to you at the email you provided." });
      setName(""); setEmail(""); setSubject(""); setMessage(""); setAccepted(false);
    } catch (err) {
      setStatus({ kind: "err", text: err instanceof Error ? err.message : "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Name *</label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            className="w-full rounded-md border border-line bg-ink-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-purple focus:outline-none focus:ring-1 focus:ring-brand-purple"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Email *</label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            className="w-full rounded-md border border-line bg-ink-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-purple focus:outline-none focus:ring-1 focus:ring-brand-purple"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Subject</label>
        <input
          id="contact-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={busy}
          className="w-full rounded-md border border-line bg-ink-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-purple focus:outline-none focus:ring-1 focus:ring-brand-purple"
          placeholder="What's this about?"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Message *</label>
        <textarea
          id="contact-message"
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={busy}
          className="w-full rounded-md border border-line bg-ink-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-purple focus:outline-none focus:ring-1 focus:ring-brand-purple resize-y"
          placeholder="Tell us what you're looking for, or what you'd like us to help with."
        />
      </div>

      <div className="pt-1">
        <LegalCheckbox checked={accepted} onChange={setAccepted} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="submit"
          disabled={busy || !accepted}
          className="btn-brand text-base px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? "Sending…" : "Send message"}
        </button>
        {status ? (
          <span className={`text-sm ${status.kind === "ok" ? "text-good" : "text-bad"}`}>
            {status.text}
          </span>
        ) : null}
      </div>
    </form>
  );
}
