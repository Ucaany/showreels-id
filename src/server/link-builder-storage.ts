import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type DbCustomLink, type DbUser } from "@/db/schema";
import { normalizeOrder, normalizeStoredLinks, type LinkItem } from "@/lib/link-builder";

export const LINK_LIMIT_REACHED_CODE = "LINK_LIMIT_REACHED";

export function getEditableLinks(user: DbUser): LinkItem[] {
  const draft = normalizeStoredLinks(user.linkBuilderDraft);
  if (draft.length > 0) {
    return draft;
  }
  return normalizeStoredLinks(user.customLinks);
}

export function countActiveLinks(links: LinkItem[]) {
  return links.filter((link) => link.enabled !== false).length;
}

export function isLinkLimitReached(links: LinkItem[], maxLinks: number | null) {
  return typeof maxLinks === "number" && countActiveLinks(links) >= maxLinks;
}

export function validateLinkLimit(links: LinkItem[], maxLinks: number | null) {
  if (typeof maxLinks !== "number") {
    return { ok: true as const };
  }

  const activeCount = countActiveLinks(links);
  if (activeCount <= maxLinks) {
    return { ok: true as const };
  }

  return {
    ok: false as const,
    code: LINK_LIMIT_REACHED_CODE,
    maxLinks,
    activeCount,
    message: `Batas ${maxLinks} link tercapai. Upgrade ke Creator untuk menambahkan lebih banyak link dan fitur desain.`,
  };
}

export async function saveLinkBuilderDraft(userId: string, links: LinkItem[]) {
  const nextLinks = normalizeOrder(links) as DbCustomLink[];
  const [updated] = await db
    .update(users)
    .set({
      linkBuilderDraft: nextLinks,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({
      linkBuilderDraft: users.linkBuilderDraft,
    });

  return normalizeStoredLinks(updated?.linkBuilderDraft ?? nextLinks);
}

export async function publishLinkBuilderDraft(userId: string, links: LinkItem[]) {
  const nextLinks = normalizeOrder(links) as DbCustomLink[];
  const [updated] = await db
    .update(users)
    .set({
      customLinks: nextLinks,
      linkBuilderDraft: nextLinks,
      linkBuilderPublishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({
      customLinks: users.customLinks,
      linkBuilderPublishedAt: users.linkBuilderPublishedAt,
    });

  return {
    links: normalizeStoredLinks(updated?.customLinks ?? nextLinks),
    publishedAt: updated?.linkBuilderPublishedAt ?? new Date(),
  };
}
