import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { linkToggleSchema, normalizeOrder, normalizeStoredLinks } from "@/lib/link-builder";
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

export async function PATCH(
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

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = linkToggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Status link tidak valid." },
      { status: 400 }
    );
  }

  const currentLinks = normalizeStoredLinks(currentUser.customLinks);
  const targetExists = currentLinks.some((link) => link.id === id);
  if (!targetExists) {
    return NextResponse.json({ error: "Link tidak ditemukan." }, { status: 404 });
  }

  const nextLinks = normalizeOrder(
    currentLinks.map((link) =>
      link.id === id ? { ...link, enabled: parsed.data.enabled } : link
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
