import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { profileVisibilityUpdateSchema } from "@/lib/auth-schemas";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";

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
  const parsed = profileVisibilityUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(users)
    .set({
      profileVisibility: parsed.data.profileVisibility,
      updatedAt: new Date(),
    })
    .where(eq(users.id, currentUser.id))
    .returning({ id: users.id, profileVisibility: users.profileVisibility });

  return NextResponse.json({ user: updated });
}
