import { auth } from "@/auth";
import { isAdminEmail } from "@/server/admin-access";

export async function requireAdminSession() {
  const session = await auth();
  const email = session?.user?.email;

  if (!session?.user?.id || !isAdminEmail(email)) {
    return null;
  }

  return session.user;
}
