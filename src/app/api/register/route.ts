import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signUpSchema } from "@/lib/auth-schemas";
import { hashPassword } from "@/lib/password";
import { ensureUniqueUsername, sanitizeUsername } from "@/lib/username";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signUpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existingEmail = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true },
  });

  if (existingEmail) {
    return NextResponse.json(
      { error: "Email sudah digunakan." },
      { status: 409 }
    );
  }

  const desiredUsername = sanitizeUsername(parsed.data.username);
  const uniqueUsername = await ensureUniqueUsername(desiredUsername);

  if (uniqueUsername !== desiredUsername) {
    return NextResponse.json(
      { error: "Username sudah dipakai. Coba username lain." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const [user] = await db
    .insert(users)
    .values({
      name: parsed.data.fullName.trim(),
      email,
      username: uniqueUsername,
      passwordHash,
    })
    .returning({
      id: users.id,
      email: users.email,
      username: users.username,
    });

  return NextResponse.json({ user });
}
