import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const password =
    typeof body?.password === "string" ? body.password : "";

  if (!token) {
    return NextResponse.json(
      { error: "Token reset password tidak ditemukan." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password baru minimal 8 karakter." },
      { status: 400 }
    );
  }

  const user = await db.query.users.findFirst({
    where: eq(users.passwordResetToken, token),
  });

  if (
    !user ||
    !user.passwordResetExpires ||
    user.passwordResetExpires.getTime() < Date.now()
  ) {
    return NextResponse.json(
      { error: "Token reset password tidak valid atau sudah kadaluarsa." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  await db
    .update(users)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      loginLockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return NextResponse.json({
    notice: "Password berhasil diperbarui. Silakan login kembali.",
  });
}
