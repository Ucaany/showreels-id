import { NextResponse } from "next/server";
import { linkDraftSchema, normalizeOrder } from "@/lib/link-builder";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import { requireBuildLinkAccess } from "@/server/link-builder-access";
import { saveLinkBuilderDraft, validateLinkLimit } from "@/server/link-builder-storage";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbiddenOwnerResponse() {
  return NextResponse.json(
    { error: "Akun owner tidak menggunakan dashboard creator." },
    { status: 403 }
  );
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return unauthorizedResponse();
  }
  if (isAdminEmail(currentUser.email)) {
    return forbiddenOwnerResponse();
  }

  const access = await requireBuildLinkAccess(currentUser.id);
  const body = await request.json().catch(() => null);
  const parsed = linkDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Draft link tidak valid." },
      { status: 400 }
    );
  }

  const nextLinks = normalizeOrder(parsed.data.links);
  const limitState = validateLinkLimit(nextLinks, access.entitlementState.entitlements.linkBuilderMax);
  if (!limitState.ok) {
    return NextResponse.json(limitState, { status: 403 });
  }

  const links = await saveLinkBuilderDraft(currentUser.id, nextLinks);
  return NextResponse.json({ links, status: "draft_saved" });
}
