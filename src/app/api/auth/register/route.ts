import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/db";
import { users } from "@/db/schema";
import { signUpSchema } from "@/lib/auth-schemas";
import { hashPassword } from "@/lib/password";
import {
  checkRegisterRateLimit,
  getClientIp,
  rateLimitExceededResponse,
} from "@/lib/rate-limit";
import { isReservedUsername, sanitizeUsername } from "@/lib/username-rules";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRegisterRateLimit(ip);

  if (!rateLimit.success) {
    return rateLimitExceededResponse(rateLimit);
  }

  if (!isDatabaseConfigured || !db) {
    return NextResponse.json(
      { error: "Database belum terhubung. Coba lagi setelah konfigurasi selesai." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Data pendaftaran belum valid." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const username = sanitizeUsername(parsed.data.username);

    if (!username || isReservedUsername(username)) {
      return NextResponse.json(
        { error: "Username tidak dapat digunakan. Coba username lain." },
        { status: 400 }
      );
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan masuk ke akunmu." },
        { status: 409 }
      );
    }

    const existingUsername = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: { id: true },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: "Username sudah dipakai. Pilih username lain." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const [createdUser] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        email,
        name: parsed.data.fullName.trim(),
        username,
        passwordHash,
        emailVerified: new Date(),
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
      });

    return NextResponse.json(
      {
        ok: true,
        user: createdUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[auth/register] failed", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat akun. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
