import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  createLinkItem,
  LINK_BUILDER_MAX_ITEMS,
  linkCreateSchema,
  normalizeOrder,
  normalizeStoredLinks,
} from "@/lib/link-builder";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";

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

  return NextResponse.json({
    links,
    maxLinks: LINK_BUILDER_MAX_ITEMS,
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

  const existing = normalizeStoredLinks(currentUser.customLinks);
  if (existing.length >= LINK_BUILDER_MAX_ITEMS) {
    return NextResponse.json(
      { error: `Maksimal ${LINK_BUILDER_MAX_ITEMS} link untuk paket Free.` },
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
