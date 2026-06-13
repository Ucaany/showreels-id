import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { requireAdminSession } from "@/server/admin-guard";
import { getDatabaseStorageInfo } from "@/server/database-storage";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const startedAt = performance.now();

  try {
    const [, storage] = await Promise.all([
      db.execute(sql`select 1`),
      getDatabaseStorageInfo(),
    ]);
    return NextResponse.json({
      ok: true,
      latencyMs: Math.round(performance.now() - startedAt),
      storage,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Database tidak merespons.",
        checkedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
