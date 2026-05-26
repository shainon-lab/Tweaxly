// "Continue with Google" button. Matches Google's brand guidelines:
//   - white surface
//   - 4-color "G" logo (in an inline SVG to avoid a network round-trip)
//   - "Continue with Google" label (rather than the more aggressive
//     "Sign in" - the same button handles both new signup and
//     existing-account login on the backend)
//
// The button is a plain link to /api/auth/google/start; that route
// generates the state token + redirects to Google. No client-side
// state needed.

import Link from "next/link";

export default function GoogleSignInButton({
  label = "Continue with Google",
}: {
  label?: string;
}) {
  return (
    <Link
      href="/api/auth/google/start"
      className="w-full inline-flex items-center justify-center gap-3 rounded-md border border-line bg-white text-slate-900 hover:bg-slate-50 transition px-4 py-2.5 text-sm font-medium shadow-sm"
    >
      <GoogleGlyph />
      <span>{label}</span>
    </Link>
  );
}

// Official Google "G" mark. Inlined so the button works without
// loading external assets and remains crisp at any DPR.
function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
