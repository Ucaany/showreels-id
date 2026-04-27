import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  createLinkItem,
  linkCreateSchema,
  normalizeOrder,
  normalizeStoredLinks,
} from "@/lib/link-builder";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbiddenOwnerResponse() {
  return NextResponse.json(
    { error: "Akun owner tidak menggunakan dashboard creator." },
    { status: 403 }
  );
}

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return unauthorizedResponse();
  }
  if (isAdminEmail(currentUser.email)) {
    return forbiddenOwnerResponse();
  }

  const links = normalizeStoredLinks(currentUser.customLinks);
  const entitlementState = await getCreatorEntitlementsForUser(currentUser.id);

  return NextResponse.json({
    links,
    maxLinks: entitlementState.entitlements.linkBuilderMax,
    planName: entitlementState.effectivePlan.planName,
  });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return unauthorizedResponse();
  }
  if (isAdminEmail(currentUser.email)) {
    return forbiddenOwnerResponse();
  }

  const body = await request.json().catch(() => null);
  const parsed = linkCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data link tidak valid." },
      { status: 400 }
    );
  }

  const entitlementState = await getCreatorEntitlementsForUser(currentUser.id);
  const linkBuilderMax = entitlementState.entitlements.linkBuilderMax;
  const existing = normalizeStoredLinks(currentUser.customLinks);
  if (typeof linkBuilderMax === "number" && existing.length >= linkBuilderMax) {
    return NextResponse.json(
      {
        error: `Batas link builder plan ${entitlementState.effectivePlan.planName.toUpperCase()} sudah tercapai (${linkBuilderMax} link).`,
        code: "link_limit_exceeded",
      },
      { status: 403 }
    );
  }

  const nextLinks = normalizeOrder([...existing, createLinkItem(parsed.data, existing)]);

  const [updated] = await db
    .update(users)
    .set({
      customLinks: nextLinks,
      updatedAt: new Date(),
    })
    .where(eq(users.id, currentUser.id))
    .returning({ customLinks: users.customLinks });

  return NextResponse.json({
    links: normalizeStoredLinks(updated?.customLinks ?? nextLinks),
    status: "saved",
  });
}
