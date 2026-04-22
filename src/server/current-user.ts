import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  try {
    return db
      .query.users.findFirst({
        where: eq(users.id, session.user.id),
      })
      .then((user) => (user?.isBlocked ? null : user));
  } catch (error) {
    console.error("Failed to load current user", error);
    return null;
  }
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}
