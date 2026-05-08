import { NextResponse } from "next/server";
import { getSiteSettings } from "@/server/site-settings";

export async function GET() {
  try {
    const settings = await getSiteSettings();

    return NextResponse.json({
      maintenanceEnabled: settings.maintenanceEnabled,
      pauseEnabled: settings.pauseEnabled,
      maintenanceMessage: settings.maintenanceMessage,
      billingEnabled: settings.billingEnabled,
    });
  } catch (error) {
    console.error("api_site_status_error", error);
    return NextResponse.json({
      maintenanceEnabled: false,
      pauseEnabled: false,
      maintenanceMessage: "",
      billingEnabled: false,
    });
  }
}
