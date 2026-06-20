import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { rateLimiters } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(10, "Token tidak valid."),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter.")
      .max(128, "Password terlalu panjang."),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama.",
  });

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured || !db) {
    return NextResponse.json(
      { code: "db_not_configured", error: "Layanan sedang tidak tersedia." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: "invalid_payload", error: "Permintaan tidak valid." },
      { status: 400 }
    );
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { code: "invalid_payload", error: firstIssue?.message || "Data tidak valid." },
      { status: 400 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const rateLimit = rateLimiters.passwordReset(`reset:${ip}`);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        code: "rate_limited",
        error: "Terlalu banyak percobaan. Coba lagi dalam beberapa menit.",
      },
      { status: 429 }
    );
  }

  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);

  const now = new Date();
  const record = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.tokenHash, tokenHash),
      gt(passwordResetTokens.expires, now),
      isNull(passwordResetTokens.usedAt)
    ),
  });

  if (!record) {
    return NextResponse.json(
      {
        code: "invalid_token",
        error: "Link reset tidak valid atau sudah kedaluwarsa.",
      },
      { status: 400 }
    );
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, record.userId),
    columns: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json(
      {
        code: "invalid_token",
        error: "Link reset tidak valid atau sudah kedaluwarsa.",
      },
      { status: 400 }
    );
  }

  const newPasswordHash = await hashPassword(password);

  await db
    .update(users)
    .set({ passwordHash: newPasswordHash })
    .where(eq(users.id, user.id));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, record.id));

  return NextResponse.json({ ok: true });
}
