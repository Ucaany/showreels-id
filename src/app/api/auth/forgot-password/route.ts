import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createPasswordResetExpiry, createPasswordResetToken } from "@/server/auth-security";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Masukkan email yang valid." },
      { status: 400 }
    );
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: {
      id: true,
      passwordHash: true,
    },
  });

  const genericNotice =
    "Jika email terdaftar, link reset password sudah disiapkan.";

  if (!user?.passwordHash) {
    return NextResponse.json({ notice: genericNotice });
  }

  const token = createPasswordResetToken();
  const expires = createPasswordResetExpiry();

  await db
    .update(users)
    .set({
      passwordResetToken: token,
      passwordResetExpires: expires,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return NextResponse.json({
    notice: genericNotice,
    resetPath: `/auth/reset-password?token=${encodeURIComponent(token)}`,
  });
}
