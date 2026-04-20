import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { normalizeAvatarUrl } from "@/lib/avatar-utils";
import { profileSchema } from "@/lib/auth-schemas";
import { sanitizeUsername } from "@/lib/username";
import { isAdminEmail } from "@/server/admin-access";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAdminEmail(session.user.email)) {
    return NextResponse.json(
      { error: "Akun owner tidak menggunakan profil creator." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 }
    );
  }

  const username = sanitizeUsername(parsed.data.username);
  const existingUser = await db.query.users.findFirst({
    where: and(eq(users.username, username), ne(users.id, session.user.id)),
    columns: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Username sudah dipakai user lain." },
      { status: 409 }
    );
  }

  const [updated] = await db
    .update(users)
    .set({
      name: parsed.data.fullName.trim(),
      username,
      image: normalizeAvatarUrl(parsed.data.avatarUrl?.trim() || "") || null,
      coverImageUrl: normalizeAvatarUrl(parsed.data.coverImageUrl?.trim() || ""),
      bio: parsed.data.bio.trim(),
      experience: parsed.data.experience.trim(),
      birthDate: parsed.data.birthDate.trim(),
      city: parsed.data.city.trim(),
      contactEmail: parsed.data.contactEmail.trim().toLowerCase(),
      phoneNumber: parsed.data.phoneNumber.trim(),
      websiteUrl: parsed.data.websiteUrl,
      instagramUrl: parsed.data.instagramUrl,
      youtubeUrl: parsed.data.youtubeUrl,
      facebookUrl: parsed.data.facebookUrl,
      threadsUrl: parsed.data.threadsUrl,
      skills: parsed.data.skills,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id))
    .returning();

  return NextResponse.json({ user: updated });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAdminEmail(session.user.email)) {
    return NextResponse.json(
      { error: "Akun owner tidak menggunakan profil creator." },
      { status: 403 }
    );
  }

  const [deletedUser] = await db
    .delete(users)
    .where(eq(users.id, session.user.id))
    .returning({ id: users.id });

  if (!deletedUser) {
    return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
