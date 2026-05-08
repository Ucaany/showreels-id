import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { securityPasswordSchema } from "@/lib/settings-schemas";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAdminEmail(currentUser.email)) {
    return NextResponse.json(
      { error: "Akun owner tidak menggunakan settings creator." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = securityPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload security tidak valid." },
      { status: 400 }
    );
  }

  // Get current password hash from users table
  const user = await db.query.users.findFirst({
    where: eq(users.id, currentUser.id),
    columns: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return NextResponse.json(
      { error: "Akun tidak memiliki password yang tersimpan." },
      { status: 400 }
    );
  }

  // Verify current password
  const isMatch = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!isMatch) {
    return NextResponse.json({ error: "Password lama tidak sesuai." }, { status: 400 });
  }

  // Hash and update new password
  const newHash = await hashPassword(parsed.data.newPassword);
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, currentUser.id));

  // logoutAll is handled client-side via signOut() - no server sessions to clear with JWT strategy

  return NextResponse.json({
    ok: true,
    logoutAll: parsed.data.logoutAll,
  });
}
