import { NextResponse } from "next/server";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import { requireBuildLinkAccess } from "@/server/link-builder-access";
import {
  getEditableLinks,
  publishLinkBuilderDraft,
  validateLinkLimit,
} from "@/server/link-builder-storage";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbiddenOwnerResponse() {
  return NextResponse.json(
    { error: "Akun owner tidak menggunakan dashboard creator." },
    { status: 403 }
  );
}

export async function POST() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return unauthorizedResponse();
  }
  if (isAdminEmail(currentUser.email)) {
    return forbiddenOwnerResponse();
  }

  const access = await requireBuildLinkAccess(currentUser.id);
  const links = getEditableLinks(currentUser);
  const limitState = validateLinkLimit(links, access.entitlementState.entitlements.linkBuilderMax);
  if (!limitState.ok) {
    return NextResponse.json(limitState, { status: 403 });
  }

  const result = await publishLinkBuilderDraft(currentUser.id, links);
  return NextResponse.json({
    links: result.links,
    publishedAt: result.publishedAt,
    status: "published",
  });
}
