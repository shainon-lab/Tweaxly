import { redirect } from "next/navigation";
import { prisma } from "./db";
import { getSession } from "./session";

export async function requireUser() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.userId! },
  });
  if (!user) {
    session.destroy();
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
    await session.save();
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
