import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/server/admin-guard";
import { getSiteSettings, updateSiteSettings } from "@/server/site-settings";

const settingsSchema = z.object({
  maintenanceEnabled: z.boolean().optional(),
  pauseEnabled: z.boolean().optional(),
  maintenanceMessage: z.string().trim().max(280).optional(),
});

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Pengaturan tidak valid." },
      { status: 400 }
    );
  }

  const settings = await updateSiteSettings(parsed.data);
  return NextResponse.json({ settings });
}
