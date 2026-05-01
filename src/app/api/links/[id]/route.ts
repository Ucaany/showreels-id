import { NextResponse } from "next/server";
import {
  countActiveLinks,
  linkCreateSchema,
  normalizeOrder,
} from "@/lib/link-builder";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import { buildLinkLockedJsonResponse, requireBuildLinkAccess } from "@/server/link-builder-access";
import {
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

export async function PUT(
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
  const parsed = linkCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data link tidak valid." },
      { status: 400 }
    );
  }

  const currentLinks = getEditableLinks(currentUser);
  const targetIndex = currentLinks.findIndex((link) => link.id === id);
  if (targetIndex < 0) {
    return NextResponse.json({ error: "Link tidak ditemukan." }, { status: 404 });
  }

  const entitlementState = await getCreatorEntitlementsForUser(currentUser.id);
  const linkBuilderMax = entitlementState.entitlements.linkBuilderMax;
  const currentItem = currentLinks[targetIndex];
  const nextEnabled = parsed.data.enabled !== false;

  if (typeof linkBuilderMax === "number" && nextEnabled && currentItem.enabled === false) {
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

  const nextLinks = normalizeOrder(
    currentLinks.map((link) =>
      link.id === id
        ? {
            ...link,
            type: parsed.data.type || link.type || "link",
            title: parsed.data.title.trim(),
            url: parsed.data.url,
            value: parsed.data.value?.trim() || undefined,
            description: parsed.data.description?.trim() || undefined,
            platform: parsed.data.platform?.trim() || undefined,
            badge: parsed.data.badge?.trim() || undefined,
            thumbnailUrl: parsed.data.thumbnailUrl || undefined,
            style: parsed.data.style?.trim() || undefined,
            iconKey: parsed.data.iconKey?.trim() || undefined,
            iconUrl: parsed.data.iconUrl || undefined,
            enabled: parsed.data.enabled !== false,
          }
        : link
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

export async function DELETE(
  _request: Request,
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
  const currentLinks = getEditableLinks(currentUser);
  const nextLinks = normalizeOrder(currentLinks.filter((link) => link.id !== id));

  if (nextLinks.length === currentLinks.length) {
    return NextResponse.json({ error: "Link tidak ditemukan." }, { status: 404 });
  }

  const result = await publishLinkBuilderDraft(currentUser.id, nextLinks);

  return NextResponse.json({
    links: result.links,
    status: "published",
  });
}
