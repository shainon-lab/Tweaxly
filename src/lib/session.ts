import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export type SessionData = {
  userId?: string;
  email?: string;
  currentBusinessId?: string;
};

export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_PASSWORD ??
    "ai-cfo-mvp-fallback-secret-change-this-please-in-prod",
  cookieName: "ai_cfo_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export async function getSession() {
  const store = cookies();
  return getIronSession<SessionData>(store, sessionOptions);
}
