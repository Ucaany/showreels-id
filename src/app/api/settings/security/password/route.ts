import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { securityPasswordSchema } from "@/lib/settings-schemas";
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

  const currentPasswordCheck = await db.execute<{ is_match: boolean }>(
    sql`
      select crypt(${parsed.data.currentPassword}, encrypted_password) = encrypted_password as is_match
      from auth.users
      where id = ${currentUser.id}::uuid
      limit 1
    `
  );

  if (!currentPasswordCheck.rows[0]?.is_match) {
    return NextResponse.json({ error: "Password lama tidak sesuai." }, { status: 400 });
  }

  await db.execute(
    sql`
      update auth.users
      set encrypted_password = crypt(${parsed.data.newPassword}, gen_salt('bf')),
          updated_at = now()
      where id = ${currentUser.id}::uuid
    `
  );

  if (parsed.data.logoutAll) {
    await db.execute(
      sql`delete from auth.sessions where user_id = ${currentUser.id}::uuid`
    );
  }

  return NextResponse.json({
    ok: true,
    logoutAll: parsed.data.logoutAll,
  });
}
