import { NextResponse } from "next/server";
import { getSiteSettings } from "@/server/site-settings";

export async function GET() {
  const settings = await getSiteSettings();

  return NextResponse.json({
    maintenanceEnabled: settings.maintenanceEnabled,
    pauseEnabled: settings.pauseEnabled,
    maintenanceMessage: settings.maintenanceMessage,
  });
}
