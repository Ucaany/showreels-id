import { NextResponse } from "next/server";
import {
  createLinkItem,
  linkCreateSchema,
  normalizeOrder,
} from "@/lib/link-builder";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import { buildLinkLockedJsonResponse, requireBuildLinkAccess } from "@/server/link-builder-access";
import {
  getEditableLinks,
  isLinkLimitReached,
  saveLinkBuilderDraft,
  validateLinkLimit,
} from "@/server/link-builder-storage";
import { markFirstLinkCreated } from "@/server/onboarding";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbiddenOwnerResponse() {
  return NextResponse.json(
    { error: "Akun owner tidak menggunakan dashboard creator." },
    { status: 403 }
  );
}

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return unauthorizedResponse();
  }
  if (isAdminEmail(currentUser.email)) {
    return forbiddenOwnerResponse();
  }

  const links = getEditableLinks(currentUser);
  const { entitlementState, allowed } = await requireBuildLinkAccess(currentUser.id);

  return NextResponse.json({
    links,
    locked: !allowed,
    maxLinks: entitlementState.entitlements.linkBuilderMax,
    planName: entitlementState.effectivePlan.planName,
  });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return unauthorizedResponse();
  }
  if (isAdminEmail(currentUser.email)) {
    return forbiddenOwnerResponse();
  }

  const body = await request.json().catch(() => null);
  const parsed = linkCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data link tidak valid." },
      { status: 400 }
    );
  }

  const { entitlementState, allowed } = await requireBuildLinkAccess(currentUser.id);
  if (!allowed) {
    return buildLinkLockedJsonResponse();
  }
  const linkBuilderMax = entitlementState.entitlements.linkBuilderMax;
  const existing = getEditableLinks(currentUser);
  if (parsed.data.enabled !== false && isLinkLimitReached(existing, linkBuilderMax)) {
    return NextResponse.json(
      {
        error: `Batas ${linkBuilderMax} link tercapai. Upgrade ke Creator untuk menambahkan lebih banyak link dan fitur desain.`,
        code: "LINK_LIMIT_REACHED",
        maxLinks: linkBuilderMax,
      },
      { status: 403 }
    );
  }

  const nextLinks = normalizeOrder([...existing, createLinkItem(parsed.data, existing)]);
  const limitState = validateLinkLimit(nextLinks, linkBuilderMax);
  if (!limitState.ok) {
    return NextResponse.json(limitState, { status: 403 });
  }

  const savedLinks = await saveLinkBuilderDraft(currentUser.id, nextLinks);

  await markFirstLinkCreated(currentUser.id).catch(() => null);

  return NextResponse.json({
    links: savedLinks,
    status: "draft_saved",
  });
}
