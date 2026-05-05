import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { passwordRecoveryVerifySchema } from "@/lib/auth-schemas";
import {
  createPasswordRecoveryToken,
  PASSWORD_RECOVERY_COOKIE,
} from "@/lib/password-recovery-token";

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = passwordRecoveryVerifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data verifikasi tidak valid." },
      { status: 400 }
    );
  }

  const username = parsed.data.username.trim().toLowerCase();
  const fullName = normalizeName(parsed.data.fullName);
  const birthDate = parsed.data.birthDate.trim();

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
    columns: {
      id: true,
      username: true,
      name: true,
      birthDate: true,
    },
  });

  const isValid =
    Boolean(user?.id) &&
    normalizeName(user?.name || "") === fullName &&
    (user?.birthDate || "").trim() === birthDate;

  if (!isValid || !user?.username) {
    return NextResponse.json(
      { error: "Data verifikasi tidak cocok." },
      { status: 400 }
    );
  }

  try {
    const recovery = createPasswordRecoveryToken({
      userId: user.id,
      username: user.username,
    });

    const response = NextResponse.json({
      ok: true,
      redirectTo: "/auth/forgot-password/new-password",
    });
    response.cookies.set(PASSWORD_RECOVERY_COOKIE, recovery.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: recovery.maxAge,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Password recovery verification failed", error);
    return NextResponse.json(
      { error: "Server belum siap memproses reset password." },
      { status: 503 }
    );
  }
}
