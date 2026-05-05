import { getCurrentUser } from "@/server/current-user";
import { isAdminEmail } from "@/server/admin-access";

export async function requireAdminSession() {
  const user = await getCurrentUser();
  const email = user?.email;

  if (!user?.id || !isAdminEmail(email)) {
    return null;
  }

  return user;
}
