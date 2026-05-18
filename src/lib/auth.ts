import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "./db";
import { getSession } from "./session";

// Persisting the session cookie writes via cookies().set(), which Next.js
// rejects from Server Components (read-only renders). Wrap saves in a
// try/catch so a stale session.currentBusinessId or a missing user during
// a page render doesn't blow up — any subsequent Server Action / Route
// Handler will re-persist the resolved value cleanly.
async function trySaveSession(session: Awaited<ReturnType<typeof getSession>>) {
  try {
    await session.save();
  } catch {
    // Server Component render — cookies can't be mutated here. No-op.
  }
}

async function tryDestroySession(session: Awaited<ReturnType<typeof getSession>>) {
  try {
    await session.destroy();
  } catch {
    // Same as above — happens during reads where session is already invalid.
  }
}

export async function requireUser() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.userId! },
  });
  if (!user) {
    await tryDestroySession(session);
    redirect("/login");
  }
  return user;
}

// Tenant-scoped business resolver. The standard call for every authed
// app surface — every query in the product fans out from the {user,
// business} pair returned here.
//
// Resolution order:
//   1. If the user is a super_admin AND has an active impersonation
//      target, return that business (regardless of ownership).
//   2. Otherwise, prefer the session's currentBusinessId.
//   3. Otherwise, the user's own most-recent owned business.
//   4. Otherwise, /setup.
//
// Also stamps Business.lastActivityAt for any non-impersonated visit so
// the admin panel's "last activity" reflects real customer usage rather
// than internal observation.
export async function requireBusiness() {
  const user = await requireUser();
  const session = await getSession();

  // 1. Impersonation override — super_admin only.
  if (session.impersonatingBusinessId && user.systemRole === "super_admin") {
    const target = await prisma.business.findUnique({
      where: { id: session.impersonatingBusinessId },
    });
    if (target) {
      return {
        user,
        business: target,
        isImpersonating: true as const,
        impersonationAllowWrites: !!session.impersonationAllowWrites,
      };
    }
    // Target disappeared — clear and fall through.
    session.impersonatingBusinessId = undefined;
    session.impersonationAllowWrites = undefined;
    await trySaveSession(session);
  }

  // 2. + 3. Normal user resolution — scoped by membership, not
  // ownership, so invited collaborators and accountants see every
  // workspace they were added to. Disabled memberships are excluded.
  const businessId = session.currentBusinessId;
  let business = businessId
    ? await prisma.business.findFirst({
        where: {
          id: businessId,
          memberships: { some: { userId: user.id, status: "active" } },
        },
      })
    : null;
  if (!business) {
    business = await prisma.business.findFirst({
      where: {
        memberships: { some: { userId: user.id, status: "active" } },
      },
      orderBy: { createdAt: "asc" },
    });
    if (!business) redirect("/setup");
    session.currentBusinessId = business.id;
    await trySaveSession(session);
  }

  // Block suspended accounts from any app surface (login still works
  // so the user sees the message; but every business-scoped page is
  // off-limits).
  if (business.status === "suspended") {
    redirect("/suspended");
  }

  // Stamp last activity (best-effort; race-safe via fire-and-forget
  // try/catch — we don't await across the response).
  try {
    await prisma.business.update({
      where: { id: business.id },
      data: { lastActivityAt: new Date() },
    });
  } catch {
    /* RSC read / race — ignore */
  }

  return {
    user,
    business,
    isImpersonating: false as const,
    impersonationAllowWrites: true,
  };
}

export async function getOptionalContext() {
  const session = await getSession();
  if (!session.userId) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;
  const business = session.currentBusinessId
    ? await prisma.business.findFirst({
        where: {
          id: session.currentBusinessId,
          memberships: { some: { userId: user.id, status: "active" } },
        },
      })
    : null;
  return { user, business };
}

// ─────────────────────────────────────────────────────────────────────
// Super-admin gate. Use in every /admin route + every /api/admin route.
// Server-side enforcement — never trust UI-only gating.
// ─────────────────────────────────────────────────────────────────────

// Role hierarchy: user < admin < super_admin.
//   - admin can do everything an operator does in the panel
//     (impersonate, suspend, change plan, add notes, edit memberships)
//   - admin CANNOT: change system roles, delete users, hard-delete a
//     workspace's data, or touch the super_admin user
//   - super_admin is the only role with that destructive surface
export type SystemRole = "user" | "admin" | "super_admin";

export function isAdminOrSuper(role: string | undefined | null): boolean {
  return role === "admin" || role === "super_admin";
}

export async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.systemRole !== "super_admin") {
    redirect("/");
  }
  return user;
}

// Admin OR super_admin — used for everything that's "operator panel
// activity" without being a destructive role/data change.
export async function requireAdminOrSuper() {
  const user = await requireUser();
  if (!isAdminOrSuper(user.systemRole)) {
    redirect("/");
  }
  return user;
}

// API variant — returns a NextResponse instead of redirecting, so a
// caller can return it directly on the early-exit path.
export async function requireSuperAdminApi(): Promise<
  | { ok: true; user: Awaited<ReturnType<typeof requireUser>> }
  | { ok: false; response: NextResponse }
> {
  const session = await getSession();
  if (!session.userId) {
    return { ok: false, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.systemRole !== "super_admin") {
    return { ok: false, response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { ok: true, user };
}

// API variant of requireAdminOrSuper — most admin-panel mutations use
// this gate; only role changes and user deletion keep the stricter
// requireSuperAdminApi.
export async function requireAdminOrSuperApi(): Promise<
  | { ok: true; user: Awaited<ReturnType<typeof requireUser>> }
  | { ok: false; response: NextResponse }
> {
  const session = await getSession();
  if (!session.userId) {
    return { ok: false, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !isAdminOrSuper(user.systemRole)) {
    return { ok: false, response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { ok: true, user };
}

// Write-permission gate. Returns a 403 NextResponse if a super_admin
// is impersonating without explicit write mode enabled, otherwise null
// (write allowed). Apply at the top of any destructive API route.
export async function blockWriteDuringImpersonation(): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session.impersonatingBusinessId) return null;
  if (session.impersonationAllowWrites) return null;
  return NextResponse.json(
    {
      error: "writes_disabled_during_impersonation",
      message:
        "Writes are blocked while viewing this account as Super Admin. Enable write mode from the admin panel to proceed.",
    },
    { status: 403 }
  );
}
