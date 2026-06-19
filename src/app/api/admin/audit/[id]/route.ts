import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditFindings, auditScans } from "@/db/schema";
import { findingStatusSchema } from "@/lib/audit-schemas";
import { requireAdminSession } from "@/server/admin-guard";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const scan = await db.query.auditScans.findFirst({ where: eq(auditScans.id, id) });
  if (!scan) return NextResponse.json({ error: "Scan tidak ditemukan." }, { status: 404 });

  const findings = await db.query.auditFindings.findMany({ where: eq(auditFindings.scanId, id) });
  return NextResponse.json({ scan, findings });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const parsed = findingStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Status finding tidak valid." }, { status: 400 });

  const [updated] = await db
    .update(auditFindings)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(auditFindings.id, id))
    .returning();

  return NextResponse.json({ finding: updated });
}
