import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { normalizeSocialUrl } from "@/lib/profile-utils";
import { sanitizeUsername } from "@/lib/username";
import { isProtectedOwnerTarget } from "@/server/admin-access";
import { requireAdminSession } from "@/server/admin-guard";

const adminUserUpdateSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(120),
  username: z
    .string()
    .trim()
    .min(3, "Username minimal 3 karakter.")
    .max(40)
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, underscore."),
  role: z.string().trim().max(120).default(""),
  bio: z.string().trim().max(500).default(""),
  city: z.string().trim().max(120).default(""),
  contactEmail: z
    .email("Email kontak belum valid.")
    .or(z.literal(""))
    .default(""),
  phoneNumber: z.string().trim().max(30).default(""),
  websiteUrl: z
    .string()
    .trim()
    .max(300)
    .transform((value) => normalizeSocialUrl(value))
    .default(""),
  isBlocked: z.boolean().optional(),
  blockedReason: z.string().trim().max(240).optional(),
});

async function getEditableUser(id: string) {
  const target = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!target) {
    return { error: "User tidak ditemukan.", status: 404 as const };
  }

  if (isProtectedOwnerTarget(target)) {
    return {
      error: "Owner/admin tidak bisa diubah dari panel ini.",
      status: 403 as const,
    };
  }

  return { target };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const editable = await getEditableUser(id);
  if ("error" in editable) {
    return NextResponse.json({ error: editable.error }, { status: editable.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminUserUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data user tidak valid." },
      { status: 400 }
    );
  }

  const username = sanitizeUsername(parsed.data.username);
  const duplicate = await db.query.users.findFirst({
    where: and(eq(users.username, username), ne(users.id, id)),
    columns: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Username sudah dipakai user lain." },
      { status: 409 }
    );
  }

  const shouldBlock = parsed.data.isBlocked ?? editable.target.isBlocked;
  const [updated] = await db
    .update(users)
    .set({
      name: parsed.data.name,
      username,
      role: parsed.data.role,
      bio: parsed.data.bio,
      city: parsed.data.city,
      contactEmail: parsed.data.contactEmail,
      phoneNumber: parsed.data.phoneNumber,
      websiteUrl: parsed.data.websiteUrl,
      isBlocked: shouldBlock,
      blockedAt:
        shouldBlock && !editable.target.isBlocked
          ? new Date()
          : shouldBlock
            ? editable.target.blockedAt
            : null,
      blockedReason: shouldBlock ? parsed.data.blockedReason || "" : "",
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return NextResponse.json({ user: updated });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const editable = await getEditableUser(id);
  if ("error" in editable) {
    return NextResponse.json({ error: editable.error }, { status: editable.status });
  }

  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id });

  if (!deleted) {
    return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
