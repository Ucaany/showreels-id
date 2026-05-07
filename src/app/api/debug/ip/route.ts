import { NextResponse } from "next/server";

/**
 * Temporary endpoint to check outbound IP of Vercel serverless functions.
 * Used for Tripay whitelist configuration.
 * DELETE THIS after getting the IP.
 */
export async function GET() {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json() as { ip: string };
    
    return NextResponse.json({
      outboundIp: data.ip,
      region: process.env.VERCEL_REGION || "unknown",
      note: "Gunakan IP ini untuk whitelist Tripay. Jalankan beberapa kali karena IP bisa berubah.",
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get IP" }, { status: 500 });
  }
}
