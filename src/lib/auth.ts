import { redirect } from "next/navigation";
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

export async function requireBusiness() {
  const user = await requireUser();
  const session = await getSession();
  let businessId = session.currentBusinessId;
  let business = businessId
    ? await prisma.business.findFirst({
        where: { id: businessId, ownerId: user.id },
      })
    : null;
  if (!business) {
    business = await prisma.business.findFirst({
      where: { ownerId: user.id },
      orderBy: { createdAt: "asc" },
    });
    if (!business) redirect("/setup");
    session.currentBusinessId = business.id;
    await trySaveSession(session);
  }
  return { user, business };
}

export async function getOptionalContext() {
  const session = await getSession();
  if (!session.userId) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;
  const business = session.currentBusinessId
    ? await prisma.business.findFirst({
        where: { id: session.currentBusinessId, ownerId: user.id },
      })
    : null;
  return { user, business };
}
