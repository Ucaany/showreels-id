import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { emailQueueJobs, users, videos } from "@/db/schema";
import type { AuditFindingInput } from "@/lib/audit-types";

export async function validateDatabaseIntegrity() {
  const findings: AuditFindingInput[] = [];

  try {
    await db.execute(sql`select 1`);
  } catch (error) {
    findings.push({
      category: "database",
      severity: "critical",
      code: "DB_CONNECTION_FAILED",
      title: "Database tidak merespons",
      description: error instanceof Error ? error.message : "Database connection failed",
      recommendation: "Periksa DATABASE_URL, koneksi Neon/Postgres, dan status deployment database.",
    });
    return findings;
  }

  const [userRows, videoRows, failedEmailRows, orphanVideoRows] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(videos),
    db.select({ value: count() }).from(emailQueueJobs).where(eq(emailQueueJobs.status, "failed")),
    db.execute(sql<{ value: number }>`select count(*)::int as value from videos v left join users u on u.id = v.user_id where u.id is null`),
  ]);

  if ((userRows[0]?.value ?? 0) === 0) {
    findings.push({ category: "database", severity: "medium", code: "DB_EMPTY_USERS", title: "Tabel users masih kosong", recommendation: "Pastikan bootstrap owner/admin sudah dijalankan jika ini bukan environment baru." });
  }

  if ((videoRows[0]?.value ?? 0) === 0) {
    findings.push({ category: "database", severity: "low", code: "DB_EMPTY_VIDEOS", title: "Belum ada data video", recommendation: "Tambahkan konten awal atau abaikan jika environment baru." });
  }

  if ((failedEmailRows[0]?.value ?? 0) > 5) {
    findings.push({ category: "monitoring", severity: "medium", code: "EMAIL_QUEUE_FAILURES", title: "Banyak email queue gagal", evidence: { failedCount: failedEmailRows[0]?.value }, recommendation: "Periksa Resend API key, quota, dan last_error pada email_queue_jobs." });
  }

  type QueryRowsResult = { rows?: Array<{ value?: number | string }> } | Array<{ value?: number | string }>;
  const queryRows = (orphanVideoRows as QueryRowsResult);
  const orphanCount = Number((Array.isArray(queryRows) ? queryRows : queryRows.rows)?.[0]?.value ?? 0);
  if (orphanCount > 0) {
    findings.push({ category: "database", severity: "high", code: "DB_ORPHAN_VIDEOS", title: "Ditemukan video tanpa owner valid", evidence: { orphanCount }, recommendation: "Bersihkan data orphan atau pulihkan relasi user yang hilang." });
  }

  return findings;
}
