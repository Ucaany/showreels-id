import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const url = new URL(request.url);
  const { nextauth } = await context.params;

  if (
    nextauth[0] === "callback" &&
    nextauth[1] === "google" &&
    url.searchParams.has("error")
  ) {
    const code = url.searchParams.get("error") || "AccessDenied";
    const target = new URL(
      `/auth/login?error=${encodeURIComponent(code)}`,
      url.origin
    );
    return NextResponse.redirect(target);
  }

  return handlers.GET(request);
}

export const POST = handlers.POST;
