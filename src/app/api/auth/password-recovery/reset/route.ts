import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { passwordRecoveryResetSchema } from "@/lib/auth-schemas";
import {
  PASSWORD_RECOVERY_COOKIE,
  verifyPasswordRecoveryToken,
} from "@/lib/password-recovery-token";
import { hashPassword, verifyPassword } from "@/lib/password";

function clearRecoveryCookie(response: NextResponse) {
  response.cookies.set(PASSWORD_RECOVERY_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = passwordRecoveryResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data password tidak valid." },
      { status: 400 }
    );
  }

  const token = request.cookies.get(PASSWORD_RECOVERY_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { error: "Sesi reset password tidak ditemukan. Ulangi verifikasi data." },
      { status: 401 }
    );
  }

  const payload = verifyPasswordRecoveryToken(token);
  if (!payload) {
    const response = NextResponse.json(
      { error: "Sesi reset password tidak valid atau sudah berakhir." },
      { status: 401 }
    );
    clearRecoveryCookie(response);
    return response;
  }

  const user = await db.query.users.findFirst({
    where: and(eq(users.id, payload.userId), eq(users.username, payload.username)),
    columns: { id: true, passwordHash: true },
  });

  if (!user) {
    const response = NextResponse.json(
      { error: "Akun tidak ditemukan. Ulangi proses verifikasi." },
      { status: 404 }
    );
    clearRecoveryCookie(response);
    return response;
  }

  const password = parsed.data.password.trim();

  // Check if new password is same as old password
  if (user.passwordHash) {
    const isSame = await verifyPassword(password, user.passwordHash);
    if (isSame) {
      return NextResponse.json(
        { error: "Password baru harus berbeda dari password lama." },
        { status: 400 }
      );
    }
  }

  // Hash and update password
  const newHash = await hashPassword(password);
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, payload.userId));

  const response = NextResponse.json({ ok: true });
  clearRecoveryCookie(response);
  return response;
}
