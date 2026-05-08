import { sql } from "drizzle-orm";
import { db } from "@/db";

const BYTES_PER_MB = 1024 * 1024;
const DEFAULT_DATABASE_LIMIT_MB = 500;

export type DatabaseStorageStatus = "ok" | "warning" | "danger";

export type DatabaseStorageInfo = {
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  usedPercent: number;
  status: DatabaseStorageStatus;
};

function getDatabaseLimitBytes() {
  const configuredLimitMb = Number(process.env.DATABASE_SIZE_LIMIT_MB);
  const limitMb =
    Number.isFinite(configuredLimitMb) && configuredLimitMb > 0
      ? configuredLimitMb
      : DEFAULT_DATABASE_LIMIT_MB;

  return Math.round(limitMb * BYTES_PER_MB);
}

function getStorageStatus(usedPercent: number): DatabaseStorageStatus {
  if (usedPercent >= 90) return "danger";
  if (usedPercent >= 75) return "warning";
  return "ok";
}

export async function getDatabaseStorageInfo(): Promise<DatabaseStorageInfo> {
  let usedBytes = 0;

  try {
    const rows = await db.execute(
      sql<{ usedBytes: string | number }>`
        select pg_database_size(current_database())::bigint as "usedBytes"
      `
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstRow = ((rows as any).rows ?? rows)?.[0];
    usedBytes = Number(firstRow?.usedBytes ?? 0);
  } catch (error) {
    // pg_database_size() requires elevated privileges that some hosted
    // PostgreSQL providers don't grant. Fall back to 0 if unavailable.
    console.warn("[database-storage] pg_database_size query failed:", error instanceof Error ? error.message : error);
    usedBytes = 0;
  }

  const limitBytes = getDatabaseLimitBytes();
  const remainingBytes = Math.max(limitBytes - usedBytes, 0);
  const usedPercent = limitBytes > 0 ? Math.min((usedBytes / limitBytes) * 100, 100) : 0;

  return {
    usedBytes,
    limitBytes,
    remainingBytes,
    usedPercent,
    status: getStorageStatus(usedPercent),
  };
}
