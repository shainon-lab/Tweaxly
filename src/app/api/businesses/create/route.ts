// POST /api/businesses/create
//   body: { name: string; industry?: string; country?: string }
//
// Creates a new Business owned by the calling user, seeds the default
// category list, creates the owner's account_admin membership, and
// switches the session into the new workspace so the next page render
// already shows it. Defaults match the signup flow (USD, January,
// no VAT) - finance settings are tunable later in Settings → Business
// profile.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { getWorkspaceCapStatus } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  let body: { name?: string; industry?: string; country?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "missing_name" }, { status: 400 });
  }
  if (name.length > 120) {
    return NextResponse.json({ error: "name_too_long" }, { status: 400 });
  }

  // Workspace cap. Free=1, Pro=3, Business=unlimited. Existing
  // owners over the cap are grandfathered (the check runs on create
  // only) but cannot add NEW workspaces beyond their tier limit.
  // 402 carries the same shape as other billing gates so the UI
  // can route to the upgrade modal.
  const capStatus = await getWorkspaceCapStatus(user.id);
  if (!capStatus.canCreate) {
    return NextResponse.json({
      error:   "workspace_cap_reached",
      message: capStatus.plan === "free"
        ? "Free workspaces are limited to 1. Upgrade to Pro for 3 workspaces or Business for unlimited."
        : "Pro workspaces are limited to 3. Upgrade to Business for unlimited workspaces.",
      plan:    capStatus.plan,
      cap:     capStatus.cap,
      owned:   capStatus.owned,
    }, { status: 402 });
  }

  const business = await prisma.business.create({
    data: {
      ownerId: user.id,
      name,
      currency: "USD",
      fiscalStartMonth: 1,
      vatEnabled: false,
      vatRate: 0,
      industry:  body.industry?.trim()  || null,
      country:   body.country?.trim()   || null,
      categories: {
        create: DEFAULT_CATEGORIES.map((c) => ({
          name: c.name, kind: c.kind, isOneTime: !!c.isOneTime,
        })),
      },
      memberships: {
        create: { userId: user.id, role: "account_admin", joinedAt: new Date() },
      },
    },
  });

  // Drop the user straight into the new workspace.
  const session = await getSession();
  session.currentBusinessId = business.id;
  session.impersonatingBusinessId = undefined;
  session.impersonationAllowWrites = undefined;
  await session.save();

  return NextResponse.json({ ok: true, id: business.id, name: business.name });
}
