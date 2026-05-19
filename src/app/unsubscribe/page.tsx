// Public confirmation page that the /api/unsubscribe redirect lands on.
// Renders the success or error state and a link back to Account →
// Communication Preferences so the user can re-enable specific
// channels if they unsubscribed by mistake.

import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Unsubscribed — Tweaxly",
  description: "You've been unsubscribed from Tweaxly marketing communications.",
};

const CHANNEL_LABELS: Record<string, string> = {
  marketingEmails:      "marketing emails",
  marketingSMS:         "marketing SMS",
  productAnnouncements: "product announcements",
  newsletter:           "the newsletter",
};

export default async function UnsubscribePage({
  searchParams,
}: { searchParams: Promise<{ status?: string; detail?: string }> }) {
  const { status, detail } = await searchParams;
  const ok = status === "success";

  let body: React.ReactNode = null;
  if (ok) {
    const channels = (detail ?? "").split(",").filter(Boolean);
    if (channels.length === 0 || channels.length === 4) {
      body = <p>You have been unsubscribed from all Tweaxly marketing communications.</p>;
    } else if (channels.length === 1) {
      body = <p>You have been unsubscribed from {CHANNEL_LABELS[channels[0]] ?? channels[0]}.</p>;
    } else {
      const names = channels.map((c) => CHANNEL_LABELS[c] ?? c);
      body = <p>You have been unsubscribed from: {names.join(", ")}.</p>;
    }
  } else {
    const reason =
      detail === "invalid_token" ? "We couldn't find a matching subscription for this link. It may have already been used or expired." :
      detail === "missing_token" ? "This unsubscribe link is missing a verification token." :
      detail === "invalid_channel" ? "The channel specified in this unsubscribe link isn't recognized." :
      "Something went wrong processing the unsubscribe request.";
    body = <p>{reason}</p>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="max-w-2xl mx-auto w-full px-6 pt-8 pb-4 border-b border-line/40">
        <Link href="/">
          <Logo size="md" showTagline />
        </Link>
      </header>
      <main id="main-content" className="max-w-2xl mx-auto w-full px-6 py-16">
        <div className={`rounded-2xl border p-8 ${
          ok ? "border-good/30 bg-good/5" : "border-bad/30 bg-bad/5"
        }`}>
          <h1 className={`text-2xl font-semibold mb-3 ${ok ? "text-good" : "text-bad"}`}>
            {ok ? "You're unsubscribed" : "We couldn't unsubscribe you"}
          </h1>
          <div className="text-sm text-slate-300 leading-relaxed mb-5">
            {body}
          </div>
          <div className="text-xs text-slate-400 mb-4">
            You may still receive transactional emails (billing, security alerts,
            password resets) for as long as your account is active — these are
            required to operate the account.
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/account" className="btn-primary">
              Manage communication preferences
            </Link>
            <Link href="/login" className="btn-ghost">
              Sign in
            </Link>
          </div>
        </div>
        <div className="mt-6 text-xs text-slate-500 text-center">
          Need help? Email{" "}
          <a href="mailto:support@tweaxly.com" className="text-accent hover:underline">
            support@tweaxly.com
          </a>
          .
        </div>
      </main>
    </div>
  );
}
