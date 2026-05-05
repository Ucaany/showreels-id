import { NextResponse } from "next/server";
import { linkToggleSchema, normalizeOrder } from "@/lib/link-builder";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import { buildLinkLockedJsonResponse, requireBuildLinkAccess } from "@/server/link-builder-access";
import {
  countActiveLinks,
  getEditableLinks,
  publishLinkBuilderDraft,
  validateLinkLimit,
} from "@/server/link-builder-storage";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbiddenOwnerResponse() {
  return NextResponse.json(
    { error: "Akun owner tidak menggunakan dashboard creator." },
    { status: 403 }
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return unauthorizedResponse();
  }
  if (isAdminEmail(currentUser.email)) {
    return forbiddenOwnerResponse();
  }
  const access = await requireBuildLinkAccess(currentUser.id);
  if (!access.allowed) {
    return buildLinkLockedJsonResponse();
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = linkToggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Status link tidak valid." },
      { status: 400 }
    );
  }

  const currentLinks = getEditableLinks(currentUser);
  const target = currentLinks.find((link) => link.id === id);
  const targetExists = Boolean(target);
  if (!targetExists) {
    return NextResponse.json({ error: "Link tidak ditemukan." }, { status: 404 });
  }

  if (parsed.data.enabled && target?.enabled === false) {
    const entitlementState = await getCreatorEntitlementsForUser(currentUser.id);
    const linkBuilderMax = entitlementState.entitlements.linkBuilderMax;
    if (typeof linkBuilderMax === "number") {
      const activeLinks = countActiveLinks(currentLinks);
      if (activeLinks >= linkBuilderMax) {
        return NextResponse.json(
          {
            error:
              linkBuilderMax === 5
                ? "Batas 5 link tercapai. Upgrade ke Creator untuk menambah link."
                : `Batas ${linkBuilderMax} link aktif tercapai.`,
            code: "link_limit_exceeded",
          },
          { status: 403 }
        );
      }
    }
  }

  const nextLinks = normalizeOrder(
    currentLinks.map((link) =>
      link.id === id ? { ...link, enabled: parsed.data.enabled } : link
    )
  );
  const limitState = validateLinkLimit(nextLinks, access.entitlementState.entitlements.linkBuilderMax);
  if (!limitState.ok) {
    return NextResponse.json(limitState, { status: 403 });
  }

  const result = await publishLinkBuilderDraft(currentUser.id, nextLinks);

  return NextResponse.json({
    links: result.links,
    status: "published",
  });
}
