import { NextResponse } from "next/server";
import {
  linkReorderSchema,
  normalizeOrder,
} from "@/lib/link-builder";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import { buildLinkLockedJsonResponse, requireBuildLinkAccess } from "@/server/link-builder-access";
import { getEditableLinks, saveLinkBuilderDraft } from "@/server/link-builder-storage";

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
  if (!access.allowed) {
    return buildLinkLockedJsonResponse();
  }

  const body = await request.json().catch(() => null);
  const parsed = linkReorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Urutan link tidak valid." },
      { status: 400 }
    );
  }

  const currentLinks = getEditableLinks(currentUser);
  const idSet = new Set(currentLinks.map((link) => link.id));
  const incomingSet = new Set(parsed.data.ids);

  if (currentLinks.length !== parsed.data.ids.length || idSet.size !== incomingSet.size) {
    return NextResponse.json({ error: "Daftar urutan link tidak lengkap." }, { status: 400 });
  }

  for (const id of parsed.data.ids) {
    if (!idSet.has(id)) {
      return NextResponse.json({ error: "Link tidak ditemukan." }, { status: 400 });
    }
  }

  const mapById = new Map(currentLinks.map((item) => [item.id, item]));
  const nextLinks = normalizeOrder(
    parsed.data.ids
      .map((id) => mapById.get(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  );

  const savedLinks = await saveLinkBuilderDraft(currentUser.id, nextLinks);

  return NextResponse.json({
    links: savedLinks,
    status: "draft_saved",
  });
}

export const POST = PATCH;
