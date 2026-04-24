import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { normalizeAvatarUrl } from "@/lib/avatar-utils";
import { profileSchema } from "@/lib/auth-schemas";
import { normalizeImageCrop } from "@/lib/image-crop";
import { sanitizeUsername } from "@/lib/username";
import { isAdminEmail } from "@/server/admin-access";
import { deleteUserAccount } from "@/server/auth-profile";
import { getCurrentUser } from "@/server/current-user";

const USERNAME_CHANGE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAdminEmail(currentUser.email)) {
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
    where: and(eq(users.username, username), ne(users.id, currentUser.id)),
    columns: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Username sudah dipakai user lain." },
      { status: 409 }
    );
  }

  let usernameChangeCount = currentUser.usernameChangeCount;
  let usernameChangeWindowStart = currentUser.usernameChangeWindowStart;

  if (username !== (currentUser.username ?? "")) {
    const now = new Date();
    const shouldResetWindow =
      !currentUser.usernameChangeWindowStart ||
      now.getTime() - currentUser.usernameChangeWindowStart.getTime() >=
        USERNAME_CHANGE_WINDOW_MS;

    if (shouldResetWindow) {
      usernameChangeCount = 1;
      usernameChangeWindowStart = now;
    } else if (currentUser.usernameChangeCount >= 3) {
      const activeWindowStart = currentUser.usernameChangeWindowStart ?? now;
      const resetAt = new Date(
        activeWindowStart.getTime() + USERNAME_CHANGE_WINDOW_MS
      );

      return NextResponse.json(
        {
          error: `Username hanya bisa diubah 3 kali per 30 hari. Coba lagi setelah ${resetAt.toLocaleDateString(
            "id-ID",
            {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }
          )}.`,
        },
        { status: 429 }
      );
    } else {
      usernameChangeCount = currentUser.usernameChangeCount + 1;
    }
  }

  const avatarCrop = normalizeImageCrop({
    x: parsed.data.avatarCropX,
    y: parsed.data.avatarCropY,
    zoom: parsed.data.avatarCropZoom,
  });
  const coverCrop = normalizeImageCrop({
    x: parsed.data.coverCropX,
    y: parsed.data.coverCropY,
    zoom: parsed.data.coverCropZoom,
  });

  const [updated] = await db
    .update(users)
    .set({
      name: parsed.data.fullName.trim(),
      username,
      role: parsed.data.role.trim(),
      image: normalizeAvatarUrl(parsed.data.avatarUrl?.trim() || "") || null,
      coverImageUrl: normalizeAvatarUrl(parsed.data.coverImageUrl?.trim() || ""),
      avatarCropX: avatarCrop.x,
      avatarCropY: avatarCrop.y,
      avatarCropZoom: avatarCrop.zoom,
      coverCropX: coverCrop.x,
      coverCropY: coverCrop.y,
      coverCropZoom: coverCrop.zoom,
      bio: parsed.data.bio.trim(),
      experience: parsed.data.experience.trim(),
      birthDate: parsed.data.birthDate.trim(),
      city: parsed.data.city.trim(),
      address: parsed.data.address.trim(),
      contactEmail: parsed.data.contactEmail.trim().toLowerCase(),
      phoneNumber: parsed.data.phoneNumber.trim(),
      websiteUrl: parsed.data.websiteUrl,
      instagramUrl: parsed.data.instagramUrl,
      youtubeUrl: parsed.data.youtubeUrl,
      facebookUrl: parsed.data.facebookUrl,
      threadsUrl: parsed.data.threadsUrl,
      customLinks: parsed.data.customLinks,
      skills: parsed.data.skills,
      usernameChangeCount,
      usernameChangeWindowStart,
      updatedAt: new Date(),
    })
    .where(eq(users.id, currentUser.id))
    .returning();

  return NextResponse.json({ user: updated });
}

export async function DELETE() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAdminEmail(currentUser.email)) {
    return NextResponse.json(
      { error: "Akun owner tidak menggunakan profil creator." },
      { status: 403 }
    );
  }

  await deleteUserAccount(currentUser.id);

  return NextResponse.json({ ok: true });
}
