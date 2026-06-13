/**
 * Backfill auth profiles for users that exist in the users table
 * but may not have been synced properly.
 *
 * With Auth.js migration, there is no separate auth.users table.
 * All user data lives in the public.users table directly.
 * This script is kept for reference but is largely a no-op now.
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function backfillProfiles() {
  const { db } = await import("@/db");
  const { users } = await import("@/db/schema");
  const { isNull } = await import("drizzle-orm");

  // Find users that have no username set (incomplete profile)
  const incompleteUsers = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(isNull(users.username));

  if (!incompleteUsers.length) {
    console.log("No incomplete user profiles found. All good!");
    return;
  }

  const { syncUserProfile } = await import("@/server/auth-profile");

  for (const row of incompleteUsers) {
    const authUser = {
      id: row.id,
      email: row.email,
      user_metadata: { full_name: row.name },
    };

    await syncUserProfile(authUser);
  }

  console.log(`Backfilled ${incompleteUsers.length} user profile(s).`);
}

backfillProfiles()
  .catch((error) => {
    console.error("Failed to backfill auth profiles", error);
    process.exitCode = 1;
  });
