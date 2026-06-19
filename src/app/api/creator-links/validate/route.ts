import { NextResponse } from "next/server";
import { buildFinalLink, validateBuiltLink } from "@/lib/add-link-url";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        platform?: string;
        link_type?: string;
        input_value?: string;
        url?: string;
        label?: string;
        subject?: string;
        body?: string;
        message?: string;
      }
    | null;

  const built = buildFinalLink({
    platform: body?.platform || "custom",
    linkType: body?.link_type || "custom",
    inputValue: body?.input_value || "",
    url: body?.url || "",
    label: body?.label || "Custom Link",
    subject: body?.subject || "",
    body: body?.body || "",
    message: body?.message || "",
  });
  const error = validateBuiltLink(built);

  if (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    normalized_input: built.inputValue,
    final_url: built.finalUrl,
    platform: built.platform,
    icon_key: built.iconKey,
  });
}
