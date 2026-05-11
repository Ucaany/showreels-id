import { NextResponse } from "next/server";
import { CACHE_CONTROL_PUBLIC_SWR, withPublicCacheHeaders } from "@/lib/http-cache";
import { isReservedPublicSlug } from "@/lib/public-route-utils";
import { getPublicPortfolioSlice } from "@/server/public-data";

export const revalidate = 60;

function parsePageSize(value: string | null): number {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed)) {
    return 9;
  }
  return Math.min(24, Math.max(6, parsed));
}

export async function GET(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const safeUsername = decodeURIComponent(username || "").trim();
  if (!safeUsername || isReservedPublicSlug(safeUsername)) {
    return NextResponse.json(
      { error: "Portfolio tidak ditemukan." },
      { status: 404, headers: withPublicCacheHeaders() }
    );
  }

  const { searchParams } = new URL(request.url);
  const cursorCreatedAt = searchParams.get("cursorCreatedAt")?.trim();
  const cursorId = searchParams.get("cursorId")?.trim();
  const cursor =
    cursorCreatedAt && cursorId ? { createdAt: cursorCreatedAt, id: cursorId } : undefined;

  const payload = await getPublicPortfolioSlice(safeUsername, {
    pageSize: parsePageSize(searchParams.get("pageSize")),
    cursor,
  });

  if (!payload) {
    return NextResponse.json(
      { error: "Portfolio tidak ditemukan." },
      { status: 404, headers: withPublicCacheHeaders() }
    );
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": CACHE_CONTROL_PUBLIC_SWR,
    },
  });
}
