import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = (searchParams.get("data") || "").trim();

  if (!data) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  if (data.length > 1200) {
    return NextResponse.json({ error: "Data too long" }, { status: 400 });
  }

  const upstreamUrl = `https://api.qrserver.com/v1/create-qr-code/?size=640x640&margin=12&data=${encodeURIComponent(
    data
  )}`;
  const upstreamResponse = await fetch(upstreamUrl, {
    method: "GET",
    cache: "force-cache",
  });

  if (!upstreamResponse.ok) {
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 502 }
    );
  }

  const imageBuffer = await upstreamResponse.arrayBuffer();
  return new NextResponse(imageBuffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
