import { config } from "dotenv";

config({ path: ".env.local" });
config();

type MissingProfileRow = {
  id: string;
  email: string;
  raw_user_meta_data: Record<string, unknown> | null;
};

async function backfillProfiles() {
  const { sql } = await import("drizzle-orm");
  const { db } = await import("@/db");
  const { syncUserProfile } = await import("@/server/auth-profile");
  const result = await db.execute<MissingProfileRow>(sql`
    select
      auth_users.id::text as id,
      auth_users.email,
      auth_users.raw_user_meta_data
    from auth.users as auth_users
    left join public.users as public_users
      on public_users.id = auth_users.id
    where public_users.id is null
    order by auth_users.created_at asc
  `);

  if (!result.rows.length) {
    console.log("No missing auth profiles found.");
    return;
  }

  for (const row of result.rows) {
    const authUser = {
      id: row.id,
      email: row.email,
      user_metadata: row.raw_user_meta_data ?? {},
    };

    await syncUserProfile(authUser);
  }

  console.log(`Backfilled ${result.rows.length} auth profile(s).`);
}

backfillProfiles()
  .catch((error) => {
    console.error("Failed to backfill auth profiles", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { pool } = await import("@/db");
    await pool.end();
  });
