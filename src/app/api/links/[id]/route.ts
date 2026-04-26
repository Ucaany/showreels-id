import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  linkCreateSchema,
  normalizeOrder,
  normalizeStoredLinks,
} from "@/lib/link-builder";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import {
  buildLinkLockedJsonResponse,
  requireBuildLinkAccess,
} from "@/server/link-builder-access";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbiddenOwnerResponse() {
  return NextResponse.json(
    { error: "Akun owner tidak menggunakan dashboard creator." },
    { status: 403 }
  );
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return unauthorizedResponse();
  }
  if (isAdminEmail(currentUser.email)) {
    return forbiddenOwnerResponse();
  }
  const access = await requireBuildLinkAccess(currentUser.id);
  if (!access.allowed) {
    return buildLinkLockedJsonResponse();
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = linkCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data link tidak valid." },
      { status: 400 }
    );
  }

  const currentLinks = normalizeStoredLinks(currentUser.customLinks);
  const targetIndex = currentLinks.findIndex((link) => link.id === id);
  if (targetIndex < 0) {
    return NextResponse.json({ error: "Link tidak ditemukan." }, { status: 404 });
  }

  const nextLinks = normalizeOrder(
    currentLinks.map((link) =>
      link.id === id
        ? {
            ...link,
            type: parsed.data.type || link.type || "link",
            title: parsed.data.title.trim(),
            url: parsed.data.url,
            value: parsed.data.value?.trim() || undefined,
            description: parsed.data.description?.trim() || undefined,
            platform: parsed.data.platform?.trim() || undefined,
            badge: parsed.data.badge?.trim() || undefined,
            thumbnailUrl: parsed.data.thumbnailUrl || undefined,
            style: parsed.data.style?.trim() || undefined,
            enabled: parsed.data.enabled !== false,
          }
        : link
    )
  );

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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return unauthorizedResponse();
  }
  if (isAdminEmail(currentUser.email)) {
    return forbiddenOwnerResponse();
  }
  const access = await requireBuildLinkAccess(currentUser.id);
  if (!access.allowed) {
    return buildLinkLockedJsonResponse();
  }

  const { id } = await context.params;
  const currentLinks = normalizeStoredLinks(currentUser.customLinks);
  const nextLinks = normalizeOrder(currentLinks.filter((link) => link.id !== id));

  if (nextLinks.length === currentLinks.length) {
    return NextResponse.json({ error: "Link tidak ditemukan." }, { status: 404 });
  }

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
