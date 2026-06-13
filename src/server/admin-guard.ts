import { getCurrentUser } from "@/server/current-user";
import { isAdminEmail } from "@/server/admin-access";
import { DEMO_MODE, isDemoAdmin } from "@/lib/demo-mode";

export async function requireAdminSession() {
  const user = await getCurrentUser();
  const email = user?.email;

  if (!user?.id) {
    return null;
  }

  // In demo mode, check demo admin status
  if (DEMO_MODE) {
    if (!isDemoAdmin(email)) {
      return null;
    }
    return user;
  }

  if (!isAdminEmail(email)) {
    return null;
  }

  return user;
}
